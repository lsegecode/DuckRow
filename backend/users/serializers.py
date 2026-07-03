"""
Users app serializers.

Handles serialization for Area, UserProfile, user registration,
and the authenticated user's own profile.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Area, UserProfile


class AreaSerializer(serializers.ModelSerializer):
    """Full serializer for Area CRUD operations."""

    class Meta:
        model = Area
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserMinimalSerializer(serializers.ModelSerializer):
    """Lightweight user representation for nested contexts."""

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class UserProfileSerializer(serializers.ModelSerializer):
    """Full profile serializer with nested user and area data."""

    user = UserMinimalSerializer(read_only=True)
    areas = AreaSerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'areas', 'created_at']
        read_only_fields = ['id', 'created_at']


class CurrentUserSerializer(serializers.ModelSerializer):
    """
    Serializer for the /users/me/ endpoint.

    Returns the authenticated user's full profile inline, including
    role and area memberships.
    """

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles user + profile creation in a single request.

    Accepts: username, email, password, first_name, last_name, role, area_ids.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        default='CLIENT',
        write_only=True,
    )
    area_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role', 'area_ids',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        role = validated_data.pop('role', 'CLIENT')
        area_ids = validated_data.pop('area_ids', [])
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)

        # Profile is auto-created by signal; update role and areas
        profile = user.profile
        profile.role = role
        profile.save()

        if area_ids:
            areas = Area.objects.filter(id__in=area_ids)
            profile.areas.set(areas)

        return user

    def to_representation(self, instance):
        return CurrentUserSerializer(instance).data
