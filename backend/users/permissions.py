"""
Users app custom permissions.
"""

from rest_framework import permissions


class IsSysAdmin(permissions.BasePermission):
    """Allow access only to users with the SYSADMIN role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'SYSADMIN'
        )


class IsOwnerOrSysAdmin(permissions.BasePermission):
    """
    Object-level permission: allow access if the user owns the
    profile or is a SYSADMIN.
    """

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'profile') and request.user.profile.role == 'SYSADMIN':
            return True
        # obj is a UserProfile
        return obj.user == request.user
