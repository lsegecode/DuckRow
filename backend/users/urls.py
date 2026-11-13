"""
Users app URL configuration.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AreaViewSet,
    UserProfileViewSet,
    CurrentUserView,
    UserRegistrationView,
    ResolverListView,
)

router = DefaultRouter()
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'profiles', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('resolvers/', ResolverListView.as_view(), name='resolver-list'),
    path('', include(router.urls)),
]
