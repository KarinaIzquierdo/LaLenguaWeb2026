from django.urls import path
from rest_framework import routers
from . import views
from .views import ClaseViewSet

router = routers.DefaultRouter()
router.register(r'clases', ClaseViewSet)

urlpatterns = [
    # Endpoints para estudiantes
    path('auth/login/', views.login_view, name='login'),
    path('auth/verify-token/', views.verify_token_view, name='verify_token'),
    path('auth/change-password/', views.change_password_view, name='change_password'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/update-profile/', views.update_profile_view, name='update_profile'),
    path('auth/register/', views.register_view, name='register'),
    path('evaluations/', views.user_evaluations_view, name='user_evaluations'),
    
    # Endpoints para profesores
    path('auth/profesor/login/', views.profesor_login_view, name='profesor_login'),
    path('auth/profesor/verify-token/', views.profesor_verify_token_view, name='profesor_verify_token'),
    path('auth/profesor/profile/', views.profesor_profile_view, name='profesor_profile'),
    path('auth/profesor/change-password/', views.profesor_change_password_view, name='profesor_change_password'),
    path('users/<int:user_id>/toggle-active/', views.toggle_user_active_view, name='toggle_user_active'),
    path('users/', views.list_users_view, name='list_users'),
]

urlpatterns += router.urls
