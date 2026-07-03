"""
Tickets app custom permissions.
"""

from rest_framework import permissions


class CanCreateTicket(permissions.BasePermission):
    """Only CLIENT and SYSADMIN roles can create tickets."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile'):
            return False
        return request.user.profile.role in ('CLIENT', 'SYSADMIN')


class CanUpdateTicket(permissions.BasePermission):
    """
    SYSADMIN: full update access.
    RESOLVER: can only update tickets assigned to them.
    CLIENT: no update access.
    """

    def has_object_permission(self, request, view, obj):
        role = request.user.profile.role

        if role == 'SYSADMIN':
            return True

        if role == 'RESOLVER':
            return obj.assigned_to == request.user

        return False
