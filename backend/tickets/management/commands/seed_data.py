"""
Management command to seed the database with demo data.

Creates:
- 4 Areas (IT, Human Resources, Finance, Marketing)
- 1 SYSADMIN user (admin / admin1234)
- 2 RESOLVER users (resolver1, resolver2)
- 3 CLIENT users (client_it, client_hr, client_finance)
- 8 sample tickets across areas and statuses
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from users.models import Area, UserProfile
from tickets.models import Ticket


class Command(BaseCommand):
    help = 'Seed the database with demo areas, users, and tickets.'

    def handle(self, *args, **options):
        self.stdout.write('[DuckRow] Seeding Agile Ducks Service Desk...\n')

        # ---------------------------------------------------------------
        # Areas
        # ---------------------------------------------------------------
        areas_data = ['IT', 'Human Resources', 'Finance', 'Marketing']
        areas = {}
        for name in areas_data:
            area, created = Area.objects.get_or_create(name=name)
            areas[name] = area
            status = 'created' if created else 'exists'
            self.stdout.write(f'  Area "{name}" — {status}')

        # ---------------------------------------------------------------
        # Users
        # ---------------------------------------------------------------
        users_config = [
            {
                'username': 'admin',
                'password': 'admin1234',
                'email': 'admin@duckrow.local',
                'first_name': 'Admin',
                'last_name': 'DuckRow',
                'role': 'SYSADMIN',
                'areas': ['IT'],
            },
            {
                'username': 'resolver1',
                'password': 'resolver1234',
                'email': 'resolver1@duckrow.local',
                'first_name': 'Ana',
                'last_name': 'Resolver',
                'role': 'RESOLVER',
                'areas': ['IT'],
            },
            {
                'username': 'resolver2',
                'password': 'resolver1234',
                'email': 'resolver2@duckrow.local',
                'first_name': 'Carlos',
                'last_name': 'TechSupport',
                'role': 'RESOLVER',
                'areas': ['IT'],
            },
            {
                'username': 'client_it',
                'password': 'client1234',
                'email': 'client_it@duckrow.local',
                'first_name': 'Maria',
                'last_name': 'ITStaff',
                'role': 'CLIENT',
                'areas': ['IT'],
            },
            {
                'username': 'client_hr',
                'password': 'client1234',
                'email': 'client_hr@duckrow.local',
                'first_name': 'Luis',
                'last_name': 'HRManager',
                'role': 'CLIENT',
                'areas': ['Human Resources'],
            },
            {
                'username': 'client_finance',
                'password': 'client1234',
                'email': 'client_finance@duckrow.local',
                'first_name': 'Sofia',
                'last_name': 'FinanceAnalyst',
                'role': 'CLIENT',
                'areas': ['Finance', 'Marketing'],
            },
        ]

        created_users = {}
        for config in users_config:
            user, created = User.objects.get_or_create(
                username=config['username'],
                defaults={
                    'email': config['email'],
                    'first_name': config['first_name'],
                    'last_name': config['last_name'],
                },
            )
            if created:
                user.set_password(config['password'])
                user.save()

            # Update profile
            profile = user.profile
            profile.role = config['role']
            profile.save()
            profile.areas.set([areas[a] for a in config['areas']])

            created_users[config['username']] = user
            status = 'created' if created else 'exists'
            self.stdout.write(
                f'  User "{config["username"]}" ({config["role"]}) — {status}'
            )

        # ---------------------------------------------------------------
        # Tickets
        # ---------------------------------------------------------------
        now = timezone.now()
        tickets_data = [
            {
                'title': 'Laptop not turning on',
                'description': (
                    'My laptop does not power on when I press the power button. '
                    'I tried holding it down for 10 seconds. The charging LED is off. '
                    'The charger works with another laptop.'
                ),
                'created_by': created_users['client_hr'],
                'source_area': areas['Human Resources'],
                'assigned_to': created_users['resolver1'],
                'urgency': 'HIGH',
                'internal_priority': 'HIGH',
                'status': 'IN_PROGRESS',
                'estimated_resolution_time': now + timedelta(hours=4),
            },
            {
                'title': 'Cannot access shared drive',
                'description': (
                    'I am unable to access the \\\\server\\shared drive from my workstation. '
                    'I get "Access Denied" error. Other colleagues in my area can access it fine. '
                    'This started after the password reset last Friday.'
                ),
                'created_by': created_users['client_finance'],
                'source_area': areas['Finance'],
                'assigned_to': created_users['resolver1'],
                'urgency': 'MEDIUM',
                'internal_priority': 'MEDIUM',
                'status': 'OPEN',
                'estimated_resolution_time': now + timedelta(hours=8),
            },
            {
                'title': 'Email server down for Marketing',
                'description': (
                    'The entire Marketing team cannot send or receive emails. '
                    'Outlook shows "Disconnected" status. This has been ongoing for 2 hours.'
                ),
                'created_by': created_users['client_finance'],
                'source_area': areas['Marketing'],
                'assigned_to': created_users['resolver2'],
                'urgency': 'HIGH',
                'internal_priority': 'CRITICAL',
                'status': 'IN_PROGRESS',
                'estimated_resolution_time': now + timedelta(hours=1),
            },
            {
                'title': 'New employee onboarding — workstation setup',
                'description': (
                    'New employee joining next Monday. Need a workstation set up with '
                    'standard software suite: Office 365, Slack, Zoom, and department-specific '
                    'tools for HR.'
                ),
                'created_by': created_users['client_hr'],
                'source_area': areas['Human Resources'],
                'assigned_to': None,
                'urgency': 'LOW',
                'internal_priority': 'LOW',
                'status': 'OPEN',
                'estimated_resolution_time': now + timedelta(days=3),
            },
            {
                'title': 'Printer jam on 3rd floor',
                'description': (
                    'The printer on the 3rd floor near the break room has a paper jam. '
                    'I tried clearing it but the tray mechanism seems stuck.'
                ),
                'created_by': created_users['client_it'],
                'source_area': areas['IT'],
                'assigned_to': created_users['resolver2'],
                'urgency': 'LOW',
                'internal_priority': 'LOW',
                'status': 'RESOLVED',
                'resolution_documentation': (
                    'Cleared the paper jam by removing the rear panel. '
                    'Found a crumpled sheet deep inside the feed roller. '
                    'Cleaned the rollers with isopropyl alcohol. Printer tested OK.'
                ),
            },
            {
                'title': 'VPN connection dropping frequently',
                'description': (
                    'When working from home, my VPN connection drops every 15-20 minutes. '
                    'I have to manually reconnect each time. Using FortiClient on Windows 11. '
                    'My internet connection is stable (tested with speed tests).'
                ),
                'created_by': created_users['client_it'],
                'source_area': areas['IT'],
                'assigned_to': created_users['resolver1'],
                'urgency': 'MEDIUM',
                'internal_priority': 'HIGH',
                'status': 'IN_PROGRESS',
                'estimated_resolution_time': now + timedelta(hours=6),
            },
            {
                'title': 'Request for budget tracking software license',
                'description': (
                    'The Finance team needs 5 additional licenses for QuickBooks Enterprise. '
                    'Please process the software purchase request and install on the designated machines.'
                ),
                'created_by': created_users['client_finance'],
                'source_area': areas['Finance'],
                'assigned_to': None,
                'urgency': 'LOW',
                'internal_priority': 'MEDIUM',
                'status': 'OPEN',
                'estimated_resolution_time': now + timedelta(days=5),
            },
            {
                'title': 'Security audit — outdated antivirus signatures',
                'description': (
                    'During routine check, found that 12 workstations have antivirus '
                    'definitions older than 30 days. Need to push updates and verify compliance.'
                ),
                'created_by': created_users['admin'],
                'source_area': areas['IT'],
                'assigned_to': created_users['resolver2'],
                'urgency': 'HIGH',
                'internal_priority': 'CRITICAL',
                'status': 'OPEN',
                'estimated_resolution_time': now + timedelta(hours=12),
            },
        ]

        for ticket_data in tickets_data:
            ticket, created = Ticket.objects.get_or_create(
                title=ticket_data['title'],
                defaults=ticket_data,
            )
            status_text = 'created' if created else 'exists'
            self.stdout.write(f'  Ticket "{ticket.title[:50]}" — {status_text}')

        self.stdout.write(
            self.style.SUCCESS(
                '\n[OK] Seed complete! Demo credentials:\n'
                '   admin / admin1234       (SYSADMIN)\n'
                '   resolver1 / resolver1234 (RESOLVER)\n'
                '   resolver2 / resolver1234 (RESOLVER)\n'
                '   client_it / client1234   (CLIENT — IT)\n'
                '   client_hr / client1234   (CLIENT — HR)\n'
                '   client_finance / client1234 (CLIENT — Finance, Marketing)\n'
            )
        )
