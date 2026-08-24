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

    - Authenticated users can list or retrieve user profiles.
    """

    queryset = UserProfile.objects.all().select_related('user').prefetch_related('areas')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path=r'user/(?P<user_id>\d+)')
    def get_by_user_id(self, request, user_id=None):
        try:
            profile = UserProfile.objects.select_related('user').prefetch_related('areas').get(user_id=user_id)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Perfil de usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)


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
