"""
Root URL configuration for Agile Ducks Service Desk.

All API endpoints are versioned under /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from users.sso_views import sso_exchange_view

urlpatterns = [
    path('admin/', admin.site.urls),

    # SSO Integration from home-web EME Portal
    path('sso/exchange/', sso_exchange_view, name='sso_exchange'),

    # JWT Authentication
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App routes
    path('api/v1/users/', include('users.urls')),
    path('api/v1/tickets/', include('tickets.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
