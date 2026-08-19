"""
Tickets app views.

Implements the Dynamic Scope Enforcement Pipeline:
- SYSADMIN → all tickets
- RESOLVER → assigned tickets, created tickets, and unassigned pool (to claim)
- CLIENT   → tickets from their assigned areas
"""

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
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
    ordering_fields = ['created_at', 'updated_at', 'urgency', 'status', 'assigned_at', 'resolved_at']

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
            ).prefetch_related('attachments')

        if profile.role == 'RESOLVER':
            return Ticket.objects.filter(
                models.Q(assigned_to=user) | models.Q(created_by=user) | models.Q(assigned_to__isnull=True)
            ).select_related(
                'created_by', 'source_area', 'assigned_to',
            ).prefetch_related('attachments').distinct()

        if profile.role == 'CLIENT':
            user_authorized_areas = profile.areas.all()
            return Ticket.objects.filter(
                source_area__in=user_authorized_areas,
            ).select_related(
                'created_by', 'source_area',
            ).prefetch_related('attachments')

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

    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """
        POST /api/v1/tickets/tickets/{id}/claim/

        Allows a Resolver (or Sysadmin) to self-assign an unassigned ticket.
        """
        ticket = self.get_object()
        if ticket.assigned_to and ticket.assigned_to != request.user:
            return Response(
                {'detail': _('Ticket is already assigned to another staff member.')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.profile.role not in ('RESOLVER', 'SYSADMIN'):
            return Response(
                {'detail': _('Only staff resolvers and administrators can claim tickets.')},
                status=status.HTTP_403_FORBIDDEN,
            )

        ticket.assigned_to = request.user
        if not ticket.assigned_at:
            ticket.assigned_at = timezone.now()
        if ticket.status == 'OPEN':
            ticket.status = 'IN_PROGRESS'
        ticket.save()

        return Response(TicketDetailSerializer(ticket, context={'request': request}).data)
