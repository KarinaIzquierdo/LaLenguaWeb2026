from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/verify-token/', views.verify_token_view, name='verify_token'),
    path('auth/change-password/', views.change_password_view, name='change_password'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/update-profile/', views.update_profile_view, name='update_profile'),
]
