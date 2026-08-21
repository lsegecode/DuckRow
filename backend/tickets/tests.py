from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from users.models import Area
from tickets.models import Ticket

class TicketPermissionAndScopeTests(APITestCase):
    def setUp(self):
        # Create Areas
        self.area_it = Area.objects.create(name='IT')
        self.area_hr = Area.objects.create(name='Human Resources')

        # Create Users
        self.admin = User.objects.create_user(username='admin', password='adminpassword')
        self.admin.profile.role = 'SYSADMIN'
        self.admin.profile.save()

        self.resolver = User.objects.create_user(username='resolver', password='resolverpassword')
        self.resolver.profile.role = 'RESOLVER'
        self.resolver.profile.save()

        self.client_hr = User.objects.create_user(username='client_hr', password='clientpassword')
        self.client_hr.profile.role = 'CLIENT'
        self.client_hr.profile.areas.add(self.area_hr)
        self.client_hr.profile.save()

        # Create Tickets
        self.ticket_it = Ticket.objects.create(
            title='IT Network Issue',
            description='Wifi is down in the lounge.',
            created_by=self.admin,
            source_area=self.area_it,
            assigned_to=self.resolver,
            urgency='MEDIUM',
            internal_priority='HIGH'
        )

        self.ticket_hr = Ticket.objects.create(
            title='HR Payroll Question',
            description='Need to update tax forms.',
            created_by=self.client_hr,
            source_area=self.area_hr,
            urgency='LOW',
            internal_priority='LOW'
        )

    def login_jwt(self, user):
        token = AccessToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_client_scope_isolation(self):
        """Test that a CLIENT can only see tickets inside their department and fields are hidden."""
        self.login_jwt(self.client_hr)
        response = self.client.get('/api/v1/tickets/tickets/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see HR ticket (1 ticket), not the IT ticket
        self.assertEqual(response.data['count'], 1)
        
        ticket_data = response.data['results'][0]
        self.assertEqual(ticket_data['title'], 'HR Payroll Question')
        
        # Verify hidden fields for CLIENT
        self.assertNotIn('internal_priority', ticket_data)
        self.assertNotIn('assigned_to', ticket_data)

    def test_resolver_scope_isolation(self):
        """Test that a RESOLVER sees tickets assigned to them and unassigned tickets, but not tickets assigned to another staff member."""
        # Create a ticket assigned to another user
        other_resolver = User.objects.create_user(username='resolver2', password='resolver2password')
        other_resolver.profile.role = 'RESOLVER'
        other_resolver.profile.save()

        Ticket.objects.create(
            title='Secret Finance Issue',
            description='Private ticket.',
            created_by=self.admin,
            source_area=self.area_it,
            assigned_to=other_resolver,
            urgency='HIGH',
            internal_priority='HIGH'
        )

        self.login_jwt(self.resolver)
        response = self.client.get('/api/v1/tickets/tickets/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see IT ticket (assigned to self) and unassigned HR ticket (pool), but NOT the ticket assigned to resolver2
        self.assertEqual(response.data['count'], 2)
        titles = [t['title'] for t in response.data['results']]
        self.assertIn('IT Network Issue', titles)
        self.assertIn('HR Payroll Question', titles)
        self.assertNotIn('Secret Finance Issue', titles)

    def test_sysadmin_scope(self):
        """Test that a SYSADMIN has global visibility over all tickets."""
        self.login_jwt(self.admin)
        response = self.client.get('/api/v1/tickets/tickets/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see both IT and HR tickets (2 tickets)
        self.assertEqual(response.data['count'], 2)

    def test_resolver_limited_update_permissions(self):
        """Test that a RESOLVER can update status, internal_priority, and resolution_documentation, but not general description."""
        self.login_jwt(self.resolver)
        
        # Try updating status and description (description is forbidden)
        payload = {
            'status': 'IN_PROGRESS',
            'description': 'Attempting to edit this description.'
        }
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_it.id}/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Try updating status, internal_priority, and resolution_documentation (valid)
        valid_payload = {
            'status': 'RESOLVED',
            'internal_priority': 'CRITICAL',
            'resolution_documentation': 'Reset router and it started working again.'
        }
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_it.id}/', valid_payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.ticket_it.refresh_from_db()
        self.assertEqual(self.ticket_it.status, 'RESOLVED')
        self.assertEqual(self.ticket_it.internal_priority, 'CRITICAL')
        self.assertEqual(self.ticket_it.resolution_documentation, 'Reset router and it started working again.')

    def test_client_cannot_update_tickets(self):
        """Test that a CLIENT cannot update tickets through patch/put."""
        self.login_jwt(self.client_hr)
        payload = {'status': 'IN_PROGRESS'}
        
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_hr.id}/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_resolver_past_date_resolution(self):
        """Test that a RESOLVER can set a past resolved_at timestamp when resolving a ticket."""
        self.login_jwt(self.resolver)
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        created_time = now - datetime.timedelta(hours=5)
        past_time = (now - datetime.timedelta(hours=2)).isoformat()
        
        # Move creation date to 5 hours ago so resolved_at (2 hours ago) is valid
        Ticket.objects.filter(id=self.ticket_it.id).update(created_at=created_time)
        self.ticket_it.refresh_from_db()
        
        payload = {
            'status': 'RESOLVED',
            'resolved_at': past_time,
            'resolution_documentation': 'Resolved 2 hours ago.'
        }
        
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_it.id}/', payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.ticket_it.refresh_from_db()
        self.assertEqual(self.ticket_it.status, 'RESOLVED')
        self.assertIsNotNone(self.ticket_it.resolved_at)

    def test_resolver_past_date_before_created_at_fails(self):
        """Test that setting a resolved_at timestamp before ticket created_at returns 400 validation error."""
        self.login_jwt(self.resolver)
        from django.utils import timezone
        import datetime
        
        # 1 day before creation
        invalid_past_time = (self.ticket_it.created_at - datetime.timedelta(days=1)).isoformat()
        
        payload = {
            'status': 'RESOLVED',
            'resolved_at': invalid_past_time,
            'resolution_documentation': 'Invalid past resolution.'
        }
        
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_it.id}/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resolved_at', response.data)

    def test_status_multi_value_filter(self):
        """Test that filtering tickets with comma-separated status values (e.g. status=RESOLVED,CLOSED) works properly."""
        self.ticket_it.status = 'RESOLVED'
        self.ticket_it.save()

        self.ticket_hr.status = 'CLOSED'
        self.ticket_hr.save()

        self.login_jwt(self.admin)
        response = self.client.get('/api/v1/tickets/tickets/?status=RESOLVED,CLOSED')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_resolver_update_unassigned_ticket(self):
        """Test that a RESOLVER can update an unassigned ticket (pool ticket) without 403 Forbidden."""
        self.login_jwt(self.resolver)
        payload = {'status': 'IN_PROGRESS'}
        
        response = self.client.patch(f'/api/v1/tickets/tickets/{self.ticket_hr.id}/', payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.ticket_hr.refresh_from_db()
        self.assertEqual(self.ticket_hr.status, 'IN_PROGRESS')
        self.assertEqual(self.ticket_hr.assigned_to, self.resolver)





