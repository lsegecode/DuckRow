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


import json
from pathlib import Path
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


def sync_users_from_role_overrides():
    """
    Reads role_overrides.json and ensures all listed SYSADMIN and RESOLVER
    usernames exist in DuckRow as User/UserProfile objects with assigned roles.
    Also removes dummy seed resolvers if any exist.
    """
    try:
        base_dir = Path(settings.BASE_DIR)
        json_paths = [
            base_dir / 'role_overrides.json',
            base_dir.parent / 'role_overrides.json',
        ]
        
        # Clean up old seed dummy resolvers
        User.objects.filter(username__in=['resolver1', 'resolver2']).delete()

        general_area, _ = Area.objects.get_or_create(name='General')

        for path in json_paths:
            if path.exists():
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                for role_name, usernames in data.items():
                    if isinstance(usernames, list):
                        for uname in usernames:
                            clean_uname = uname.strip()
                            if clean_uname and clean_uname.lower() not in ['username1', 'username2', 'username3']:
                                u, created = User.objects.get_or_create(
                                    username=clean_uname,
                                    defaults={'first_name': clean_uname, 'is_active': True}
                                )
                                if hasattr(u, 'profile'):
                                    p = u.profile
                                    p.role = role_name.upper()
                                    p.save()
                                    if p.areas.count() == 0:
                                        p.areas.add(general_area)
    except Exception as e:
        print(f"[ROLE OVERRIDES SYNC ERROR] {e}")


class ResolverListView(generics.ListAPIView):
    """
    List all users with RESOLVER or SYSADMIN role available to be assigned to tickets.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        sync_users_from_role_overrides()
        return (
            UserProfile.objects
            .filter(role__in=['RESOLVER', 'SYSADMIN'])
            .select_related('user')
            .prefetch_related('areas')
            .order_by('user__username')
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
