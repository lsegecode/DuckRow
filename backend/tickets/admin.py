"""
Tickets app admin configuration.
"""

from django.contrib import admin
from .models import Ticket, TicketAttachment


class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0
    readonly_fields = ['id', 'created_at', 'file_size']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'ticket_type', 'status', 'urgency', 'internal_priority',
        'source_area', 'created_by', 'assigned_to', 'created_at',
    ]
    list_filter = ['ticket_type', 'status', 'urgency', 'internal_priority', 'source_area']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['created_by', 'assigned_to']
    inlines = [TicketAttachmentInline]
