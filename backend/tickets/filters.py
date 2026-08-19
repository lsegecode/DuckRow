"""
Tickets app filters.

Provides filterable fields for the ticket list endpoint.
"""

import django_filters

from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    """
    Filterset for Ticket list views.

    Supports filtering by status, urgency, priority, area, assignment,
    and date ranges.
    """

    ticket_type = django_filters.ChoiceFilter(choices=Ticket.TICKET_TYPE_CHOICES)
    status = django_filters.ChoiceFilter(choices=Ticket.STATUS_CHOICES)
    urgency = django_filters.ChoiceFilter(choices=Ticket.URGENCY_CHOICES)
    internal_priority = django_filters.ChoiceFilter(choices=Ticket.PRIORITY_CHOICES)
    source_area = django_filters.UUIDFilter(field_name='source_area__id')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')

    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
    )

    class Meta:
        model = Ticket
        fields = [
            'ticket_type', 'status', 'urgency', 'internal_priority',
            'source_area', 'assigned_to',
            'created_after', 'created_before',
        ]
