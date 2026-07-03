"""
Tickets app serializers.

Role-aware serialization: CLIENT users never see `internal_priority`
or `assigned_to` details. SYSADMIN and RESOLVER get full visibility.
"""

from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Ticket
from users.models import Area
from users.serializers import UserMinimalSerializer, AreaSerializer


class TicketListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views.

    Conditionally hides `internal_priority` based on the requesting
    user's role (injected via serializer context).
    """

    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    source_area = AreaSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'status', 'urgency', 'internal_priority',
            'source_area', 'created_by', 'assigned_to',
            'estimated_resolution_time', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request.user, 'profile'):
            if request.user.profile.role == 'CLIENT':
                data.pop('internal_priority', None)
                data.pop('assigned_to', None)
        return data


class TicketDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer including resolution documentation.

    Also conditionally hides internal fields from CLIENT users.
    """

    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    source_area = AreaSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'status', 'urgency',
            'internal_priority', 'source_area', 'created_by',
            'assigned_to', 'estimated_resolution_time',
            'resolution_documentation', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request.user, 'profile'):
            if request.user.profile.role == 'CLIENT':
                data.pop('internal_priority', None)
                data.pop('assigned_to', None)
        return data


class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for ticket creation.

    Validates that the source_area belongs to the creator's areas.
    Sets `created_by` automatically from the request user.
    """

    source_area_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'urgency',
            'source_area_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_source_area_id(self, value):
        try:
            area = Area.objects.get(id=value)
        except Area.DoesNotExist:
            raise serializers.ValidationError('Area not found.')

        request = self.context['request']
        user_areas = request.user.profile.areas.all()

        # SYSADMIN can create tickets for any area
        if request.user.profile.role == 'SYSADMIN':
            return value

        if area not in user_areas:
            raise serializers.ValidationError(
                'You can only create tickets within your assigned areas.'
            )
        return value

    def create(self, validated_data):
        area_id = validated_data.pop('source_area_id')
        area = Area.objects.get(id=area_id)
        user = self.context['request'].user

        return Ticket.objects.create(
            created_by=user,
            source_area=area,
            **validated_data,
        )

    def to_representation(self, instance):
        return TicketDetailSerializer(instance, context=self.context).data


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Role-aware update serializer.

    - SYSADMIN: can update all fields including internal_priority and assigned_to.
    - RESOLVER: can update status and resolution_documentation only.
    - CLIENT: cannot update tickets (enforced at permission level).
    """

    assigned_to_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'status', 'urgency',
            'internal_priority', 'assigned_to_id',
            'estimated_resolution_time', 'resolution_documentation',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        role = request.user.profile.role

        if role == 'RESOLVER':
            # Resolvers can only update status and resolution_documentation
            allowed_fields = {'status', 'resolution_documentation'}
            incoming_fields = set(attrs.keys())
            forbidden = incoming_fields - allowed_fields
            if forbidden:
                raise serializers.ValidationError(
                    f'Resolvers can only update: {", ".join(allowed_fields)}. '
                    f'Forbidden fields: {", ".join(forbidden)}'
                )

        return attrs

    def update(self, instance, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)

        if assigned_to_id is not None:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                instance.assigned_to = assigned_user
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {'assigned_to_id': 'User not found.'}
                )
        elif 'assigned_to_id' in self.initial_data and self.initial_data['assigned_to_id'] is None:
            instance.assigned_to = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    def to_representation(self, instance):
        return TicketDetailSerializer(instance, context=self.context).data
