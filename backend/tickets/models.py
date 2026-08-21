"""
Tickets app models.

Core ticketing engine with UUIDv4 primary keys, urgency/priority levels,
ticket types (Bugs vs Features), status tracking, resolution documentation,
and image/screenshot attachments.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

from users.models import Area


class Ticket(models.Model):
    """
    Service desk ticket entity.

    Key design decisions:
    - `ticket_type` classifies the ticket as BUG or FEATURE.
    - `urgency` is user-facing (set by the ticket creator).
    - `internal_priority` is staff-facing (set by SYSADMIN, hidden from CLIENT).
    - `source_area` links the ticket to the creator's department.
    - `assigned_to` is the RESOLVER responsible for resolution.
    """

    TICKET_TYPE_CHOICES = [
        ('BUG', _('Bug')),
        ('FEATURE', _('Feature')),
    ]

    URGENCY_CHOICES = [
        ('LOW', _('Low')),
        ('MEDIUM', _('Medium')),
        ('HIGH', _('High')),
    ]

    PRIORITY_CHOICES = [
        ('LOW', _('Low')),
        ('MEDIUM', _('Medium')),
        ('HIGH', _('High')),
        ('CRITICAL', _('Critical')),
    ]

    STATUS_CHOICES = [
        ('OPEN', _('Open')),
        ('IN_PROGRESS', _('In Progress')),
        ('RESOLVED', _('Resolved')),
        ('CLOSED', _('Closed')),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    ticket_type = models.CharField(
        max_length=10,
        choices=TICKET_TYPE_CHOICES,
        default='BUG',
    )

    title = models.CharField(max_length=200)

    description = models.TextField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='created_tickets',
    )

    source_area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='area_tickets',
    )

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
    )

    urgency = models.CharField(
        max_length=10,
        choices=URGENCY_CHOICES,
        default='MEDIUM',
    )

    internal_priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
    )

    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='OPEN',
    )

    estimated_resolution_time = models.DateTimeField(
        null=True,
        blank=True,
    )

    estimated_work_hours = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )

    resolution_documentation = models.TextField(
        null=True,
        blank=True,
    )

    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.ticket_type}][{self.status}] {self.title}'


class TicketAttachment(models.Model):
    """
    Image / screenshot attachment associated with a Ticket.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='attachments',
    )

    file = models.FileField(
        upload_to='ticket_attachments/%Y/%m/',
    )

    file_name = models.CharField(
        max_length=255,
        blank=True,
    )

    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.file_name or str(self.file.name)
