from django.urls import path
from rest_framework import routers
from . import views
from .views import ClaseViewSet, MediaItemViewSet

router = routers.DefaultRouter()
router.register(r'clases', ClaseViewSet)
router.register(r'media', MediaItemViewSet)

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
    
    # Endpoints para galería
    path('gallery/', views.gallery_list_view, name='gallery_list'),
    path('gallery/create/', views.gallery_create_view, name='gallery_create'),
    path('gallery/<int:pk>/update/', views.gallery_update_view, name='gallery_update'),
    path('gallery/<int:pk>/delete/', views.gallery_delete_view, name='gallery_delete'),

    # Endpoints para Clubs (CLB)
    path('clubs/', views.clubs_list_view, name='clubs_list'),
    path('clubs/create/', views.club_create_view, name='club_create'),
    path('clubs/<int:club_id>/materials/', views.club_materials_list_view, name='club_materials_list'),
    path('clubs/<int:club_id>/materials/create/', views.club_material_create_view, name='club_material_create'),
    # Students management in clubs
    path('clubs/<int:club_id>/students/', views.club_students_list_view, name='club_students_list'),
    path('clubs/<int:club_id>/students/add/', views.club_add_student_view, name='club_student_add'),
    path('clubs/<int:club_id>/students/<int:user_id>/remove/', views.club_remove_student_view, name='club_student_remove'),
]

urlpatterns += router.urls
