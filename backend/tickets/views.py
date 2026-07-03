"""
Tickets app views.

Implements the Dynamic Scope Enforcement Pipeline from the blueprint:
- SYSADMIN → all tickets
- RESOLVER → only assigned tickets
- CLIENT   → only tickets from their areas
"""

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Ticket
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateSerializer,
)
from .permissions import CanCreateTicket, CanUpdateTicket
from .filters import TicketFilter


class TicketViewSet(viewsets.ModelViewSet):
    """
    Main ticket CRUD ViewSet with dynamic queryset scoping.

    The queryset returned depends entirely on the authenticated user's
    role, enforcing data isolation at the ORM level.
    """

    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TicketFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'urgency', 'status']

    def get_queryset(self):
        """
        Dynamic Scope Enforcement Pipeline.

        Returns only the tickets the authenticated user is authorized
        to see based on their role.
        """
        user = self.request.user
        profile = user.profile

        if profile.role == 'SYSADMIN':
            return Ticket.objects.all().select_related(
                'created_by', 'source_area', 'assigned_to',
            )

        if profile.role == 'RESOLVER':
            return Ticket.objects.filter(
                assigned_to=user,
            ).select_related(
                'created_by', 'source_area',
            )

        if profile.role == 'CLIENT':
            user_authorized_areas = profile.areas.all()
            return Ticket.objects.filter(
                source_area__in=user_authorized_areas,
            ).select_related(
                'created_by', 'source_area',
            )

        return Ticket.objects.none()

    def get_serializer_class(self):
        """Select the appropriate serializer based on the action."""
        if self.action == 'create':
            return TicketCreateSerializer
        if self.action in ('update', 'partial_update'):
            return TicketUpdateSerializer
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketListSerializer

    def get_permissions(self):
        """Apply role-specific permissions per action."""
        if self.action == 'create':
            return [permissions.IsAuthenticated(), CanCreateTicket()]
        if self.action in ('update', 'partial_update'):
            return [permissions.IsAuthenticated(), CanUpdateTicket()]
        if self.action == 'destroy':
            # Only SYSADMIN can delete tickets
            from users.permissions import IsSysAdmin
            return [permissions.IsAuthenticated(), IsSysAdmin()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/v1/tickets/tickets/stats/

        Returns aggregated ticket counts by status for dashboard widgets.
        Respects the same scope enforcement as the list endpoint.
        """
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'open': queryset.filter(status='OPEN').count(),
            'in_progress': queryset.filter(status='IN_PROGRESS').count(),
            'resolved': queryset.filter(status='RESOLVED').count(),
            'closed': queryset.filter(status='CLOSED').count(),
        }
        return Response(stats)
