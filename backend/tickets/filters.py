"""
Tickets app filters.

Provides filterable fields for the ticket list endpoint.
"""

import django_filters

from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    """
    Filterset for Ticket list views.

    Supports filtering by status (single or comma-separated list like RESOLVED,CLOSED),
    urgency, priority, area, assignment, and date ranges.
    """

    ticket_type = django_filters.ChoiceFilter(choices=Ticket.TICKET_TYPE_CHOICES)
    status = django_filters.CharFilter(method='filter_status')
    urgency = django_filters.ChoiceFilter(choices=Ticket.URGENCY_CHOICES)
    internal_priority = django_filters.ChoiceFilter(choices=Ticket.PRIORITY_CHOICES)
    source_area = django_filters.UUIDFilter(field_name='source_area__id')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')

    date_from = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='date__gte',
    )
    date_to = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='date__lte',
    )

    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
    )

    def filter_status(self, queryset, name, value):
        if not value:
            return queryset
        statuses = [s.strip() for s in value.split(',') if s.strip()]
        valid_statuses = [s for s in statuses if s in dict(Ticket.STATUS_CHOICES)]
        if not valid_statuses:
            return queryset
        if len(valid_statuses) == 1:
            return queryset.filter(status=valid_statuses[0])
        return queryset.filter(status__in=valid_statuses)

    class Meta:
        model = Ticket
        fields = [
            'ticket_type', 'status', 'urgency', 'internal_priority',
            'source_area', 'assigned_to',
            'date_from', 'date_to', 'created_after', 'created_before',
        ]

