"""
Users app admin configuration.
"""

from django.contrib import admin
from .models import Area, UserProfile


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'id', 'created_at']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'id', 'created_at']
    list_filter = ['role']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['id', 'created_at']
    filter_horizontal = ['areas']
