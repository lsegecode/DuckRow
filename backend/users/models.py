"""
Users app models.

Defines Area (organizational departments) and UserProfile (role-based
extension of Django's built-in User model).
"""

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _


class Area(models.Model):
    """
    Organizational department / area.

    Uses UUIDv4 primary keys to prevent enumeration attacks and support
    future multi-tenant migrations.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """
    Extends Django User with a role and area memberships.

    Roles control what data a user can see and modify:
    - CLIENT:   Can create tickets; sees only tickets within their areas.
    - RESOLVER: Cannot create tickets; sees only tickets assigned to them.
    - SYSADMIN: Full visibility and management of all tickets.
    """

    ROLE_CHOICES = [
        ('CLIENT', _('Client / Submitter')),
        ('RESOLVER', _('Staff / Resolver')),
        ('SYSADMIN', _('System Administrator')),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CLIENT',
    )

    areas = models.ManyToManyField(
        Area,
        related_name='users',
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} ({self.get_role_display()})'


# ---------------------------------------------------------------------------
# Signals — auto-create UserProfile when a User is created
# ---------------------------------------------------------------------------

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile automatically when a new User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Ensure the UserProfile is saved when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
