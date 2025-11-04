from django.contrib import admin
from .models import MissionExternalLink


@admin.register(MissionExternalLink)
class MissionExternalLinkAdmin(admin.ModelAdmin):
    list_display = (
        'mission_key', 'platform', 'short_url', 'is_active', 'start_at', 'expires_at', 'status', 'created_at'
    )
    list_filter = ('platform', 'is_active')
    search_fields = ('mission_key', 'url', 'notes')
    ordering = ('mission_key', '-created_at')

    def short_url(self, obj):
        return (obj.url[:60] + '…') if len(obj.url) > 60 else obj.url
    short_url.short_description = 'URL'

