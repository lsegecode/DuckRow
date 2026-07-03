"""
Tickets app models.

Core ticketing engine with UUIDv4 primary keys, urgency/priority levels,
status tracking, and resolution documentation.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User

from users.models import Area


class Ticket(models.Model):
    """
    Service desk ticket entity.

    Key design decisions:
    - `urgency` is user-facing (set by the ticket creator).
    - `internal_priority` is staff-facing (set by SYSADMIN, hidden from CLIENT).
    - `source_area` links the ticket to the creator's department.
    - `assigned_to` is the RESOLVER responsible for resolution.
    """

    URGENCY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
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

    resolution_documentation = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.status}] {self.title}'
