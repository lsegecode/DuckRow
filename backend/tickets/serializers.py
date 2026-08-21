"""
Tickets app serializers.

Role-aware serialization: CLIENT users never see `internal_priority`
or `assigned_to` details. SYSADMIN and RESOLVER get full visibility.
Supports ticket_type (BUG/FEATURE), screenshot attachments, and lifecycle timestamps.
"""

import base64
from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import Ticket, TicketAttachment
from users.models import Area
from users.serializers import UserMinimalSerializer, AreaSerializer


class TicketAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for ticket image/screenshot attachments."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = ['id', 'file_name', 'file_size', 'url', 'created_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


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
            'id', 'title', 'ticket_type', 'status', 'urgency', 'internal_priority',
            'source_area', 'created_by', 'assigned_to',
            'assigned_at', 'resolved_at', 'estimated_resolution_time',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'assigned_at', 'resolved_at']

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
    Full detail serializer including resolution documentation, attachments, and lifecycle timestamps.

    Also conditionally hides internal fields from CLIENT users.
    """

    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    source_area = AreaSerializer(read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'ticket_type', 'description', 'status', 'urgency',
            'internal_priority', 'source_area', 'created_by',
            'assigned_to', 'attachments', 'assigned_at', 'resolved_at',
            'estimated_resolution_time', 'estimated_work_hours', 'resolution_documentation',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'assigned_at', 'resolved_at']

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

    Validates that the source_area belongs to the creator's areas (unless SYSADMIN/RESOLVER).
    Supports ticket_type and optional image/screenshot attachments.
    """

    source_area_id = serializers.UUIDField(write_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'ticket_type', 'description', 'urgency',
            'source_area_id', 'uploaded_images', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_source_area_id(self, value):
        try:
            area = Area.objects.get(id=value)
        except Area.DoesNotExist:
            raise serializers.ValidationError(_('Area not found.'))

        request = self.context['request']
        user_areas = request.user.profile.areas.all()

        # SYSADMIN and RESOLVER can create tickets for any area
        if request.user.profile.role in ('SYSADMIN', 'RESOLVER'):
            return value

        if area not in user_areas:
            raise serializers.ValidationError(
                _('You can only create tickets within your assigned areas.')
            )
        return value

    def create(self, validated_data):
        area_id = validated_data.pop('source_area_id')
        uploaded_images = validated_data.pop('uploaded_images', [])
        area = Area.objects.get(id=area_id)
        user = self.context['request'].user

        ticket = Ticket.objects.create(
            created_by=user,
            source_area=area,
            **validated_data,
        )

        # Process Base64 images from JSON payload
        for idx, img_str in enumerate(uploaded_images):
            if isinstance(img_str, str) and img_str.startswith('data:image'):
                try:
                    header, base64_str = img_str.split(';base64,')
                    ext = header.split('/')[-1].split('+')[0]
                    if ext == 'jpeg':
                        ext = 'jpg'
                    data = base64.b64decode(base64_str)
                    file_name = f'screenshot_{idx + 1}.{ext}'
                    content_file = ContentFile(data, name=file_name)
                    TicketAttachment.objects.create(
                        ticket=ticket,
                        file=content_file,
                        file_name=file_name,
                        file_size=len(data),
                    )
                except Exception:
                    pass

        # Process multipart/form-data files if provided
        request = self.context.get('request')
        if request and hasattr(request, 'FILES'):
            for f in request.FILES.getlist('images'):
                TicketAttachment.objects.create(
                    ticket=ticket,
                    file=f,
                    file_name=f.name,
                    file_size=f.size,
                )

        return ticket

    def to_representation(self, instance):
        return TicketDetailSerializer(instance, context=self.context).data


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Role-aware update serializer.

    - SYSADMIN: can update all fields including internal_priority and assigned_to.
    - RESOLVER: can update status, resolution_documentation, estimated_resolution_time,
                and resolved_at (to backdate a resolution).
    - CLIENT: cannot update tickets (enforced at permission level).
    """

    assigned_to_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    resolved_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'ticket_type', 'description', 'status', 'urgency',
            'internal_priority', 'assigned_to_id',
            'estimated_resolution_time', 'estimated_work_hours', 'resolution_documentation',
            'resolved_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        role = request.user.profile.role

        if role == 'RESOLVER':
            # Resolvers can update status, internal_priority, resolution_documentation,
            # estimated_resolution_time, estimated_work_hours, and resolved_at.
            allowed_fields = {
                'status', 'internal_priority', 'resolution_documentation',
                'estimated_resolution_time', 'estimated_work_hours', 'resolved_at',
            }
            incoming_fields = set(attrs.keys())
            forbidden = incoming_fields - allowed_fields
            if forbidden:
                raise serializers.ValidationError(
                    f'Resolvers can only update: {", ".join(allowed_fields)}. '
                    f'Forbidden fields: {", ".join(forbidden)}'
                )

        # resolved_at must not be before the ticket's creation date
        resolved_at = attrs.get('resolved_at')
        if resolved_at and self.instance and resolved_at < self.instance.created_at:
            raise serializers.ValidationError(
                {'resolved_at': _('Resolution date cannot be before the ticket creation date.')}
            )

        return attrs

    def update(self, instance, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)

        if assigned_to_id is not None:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                if instance.assigned_to != assigned_user:
                    instance.assigned_to = assigned_user
                    if not instance.assigned_at:
                        instance.assigned_at = timezone.now()
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {'assigned_to_id': _('User not found.')}
                )
        elif 'assigned_to_id' in self.initial_data and self.initial_data['assigned_to_id'] is None:
            instance.assigned_to = None
            instance.assigned_at = None
        else:
            # Auto-assign unassigned tickets to a resolver when they perform an update
            request = self.context.get('request')
            if request and hasattr(request.user, 'profile') and request.user.profile.role == 'RESOLVER':
                if instance.assigned_to is None:
                    instance.assigned_to = request.user
                    if not instance.assigned_at:
                        instance.assigned_at = timezone.now()

        # Determine the new resolved_at value.
        # Priority: explicit payload value > auto-set from status change > preserve existing.
        explicit_resolved_at = validated_data.pop('resolved_at', ...)
        new_status = validated_data.get('status', instance.status)

        if explicit_resolved_at is not ...:
            # Caller explicitly provided a value (including None to clear it)
            instance.resolved_at = explicit_resolved_at
        elif new_status in ('RESOLVED', 'CLOSED') and instance.status not in ('RESOLVED', 'CLOSED'):
            # Status flip to resolved/closed without an explicit date → use now()
            instance.resolved_at = timezone.now()
        elif new_status in ('OPEN', 'IN_PROGRESS') and instance.status in ('RESOLVED', 'CLOSED'):
            # Status reverted to open/in-progress → clear resolved_at
            instance.resolved_at = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    def to_representation(self, instance):
        return TicketDetailSerializer(instance, context=self.context).data
