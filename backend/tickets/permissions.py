"""
Tickets app custom permissions.
"""

from rest_framework import permissions


class CanCreateTicket(permissions.BasePermission):
    """CLIENT, RESOLVER, and SYSADMIN roles can create tickets."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile'):
            return False
        return request.user.profile.role in ('CLIENT', 'RESOLVER', 'SYSADMIN')


class CanUpdateTicket(permissions.BasePermission):
    """
    SYSADMIN: full update access.
    RESOLVER: can update tickets assigned to them, tickets created by them, or unassigned pool tickets.
    CLIENT: can update tickets created by them.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not hasattr(request.user, 'profile'):
            return False

        role = request.user.profile.role

        if role == 'SYSADMIN':
            return True

        if obj.created_by == request.user:
            return True

        if role == 'RESOLVER':
            return obj.assigned_to == request.user or obj.assigned_to is None

        return False


