from django.urls import path
from . import views

urlpatterns = [
    # Endpoints para estudiantes
    path('auth/login/', views.login_view, name='login'),
    path('auth/verify-token/', views.verify_token_view, name='verify_token'),
    path('auth/change-password/', views.change_password_view, name='change_password'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/update-profile/', views.update_profile_view, name='update_profile'),
    
    # Endpoints para profesores
    path('auth/profesor/login/', views.profesor_login_view, name='profesor_login'),
    path('auth/profesor/verify-token/', views.profesor_verify_token_view, name='profesor_verify_token'),
    path('auth/profesor/profile/', views.profesor_profile_view, name='profesor_profile'),
    path('auth/profesor/change-password/', views.profesor_change_password_view, name='profesor_change_password'),
]
