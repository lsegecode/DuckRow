"""
Users app views.

Provides API endpoints for Area management, UserProfile listing,
current user retrieval, and user registration.
"""

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Area, UserProfile
from .serializers import (
    AreaSerializer,
    UserProfileSerializer,
    CurrentUserSerializer,
    UserRegistrationSerializer,
    UserMinimalSerializer,
)
from .permissions import IsSysAdmin, IsOwnerOrSysAdmin


class AreaViewSet(viewsets.ModelViewSet):
    """
    CRUD for organizational areas.

    - List/Retrieve: Any authenticated user.
    - Create/Update/Delete: SYSADMIN only.
    """

    queryset = Area.objects.all()
    serializer_class = AreaSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSysAdmin()]
        return [permissions.IsAuthenticated()]


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to user profiles.

    - SYSADMIN: can list all profiles.
    - Others: can only retrieve their own profile.
    """

    serializer_class = UserProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role == 'SYSADMIN':
            return UserProfile.objects.all().select_related('user').prefetch_related('areas')
        return UserProfile.objects.filter(user=user).select_related('user').prefetch_related('areas')


class ResolverListView(generics.ListAPIView):
    """
    List all users with the RESOLVER role.

    Used by SYSADMIN when assigning tickets.
    Only accessible by SYSADMIN users.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsSysAdmin]

    def get_queryset(self):
        return (
            UserProfile.objects
            .filter(role='RESOLVER')
            .select_related('user')
            .prefetch_related('areas')
        )


class CurrentUserView(generics.RetrieveAPIView):
    """
    GET /api/v1/users/me/

    Returns the authenticated user's full profile including role
    and area memberships.
    """

    serializer_class = CurrentUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserRegistrationView(generics.CreateAPIView):
    """
    POST /api/v1/users/register/

    Creates a new user with associated profile.
    Open endpoint (no authentication required).
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
