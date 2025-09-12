from django.urls import path
from rest_framework import routers
from . import views
from .views import ClaseViewSet, MediaItemViewSet
from . import especializacion_views
from . import evaluacion_views
from . import notificacion_views
from . import calificacion_views

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
    
    # Endpoints para especializaciones
    path('especializaciones/', especializacion_views.especializaciones_list_view, name='especializaciones_list'),
    path('especializaciones/activas/', especializacion_views.especializaciones_activas_view, name='especializaciones_activas'),
    path('especializaciones/create/', especializacion_views.especializaciones_create_view, name='especializaciones_create'),
    path('especializaciones/<int:pk>/update/', especializacion_views.especializaciones_update_view, name='especializaciones_update'),
    path('especializaciones/<int:pk>/delete/', especializacion_views.especializaciones_delete_view, name='especializaciones_delete'),
    path('especializaciones/<int:pk>/toggle/', especializacion_views.especializaciones_toggle_view, name='especializaciones_toggle'),
    
    # Endpoints para evaluaciones
    path('evaluaciones/', evaluacion_views.evaluaciones_list_view, name='evaluaciones_list'),
    path('evaluaciones/create/', evaluacion_views.evaluacion_create_view, name='evaluacion_create'),
    path('evaluaciones/<int:pk>/update/', evaluacion_views.evaluacion_update_view, name='evaluacion_update'),
    path('evaluaciones/<int:pk>/delete/', evaluacion_views.evaluacion_delete_view, name='evaluacion_delete'),
    path('evaluaciones/<int:pk>/publish/', evaluacion_views.evaluacion_publish_view, name='evaluacion_publish'),
    path('evaluaciones/students/', evaluacion_views.students_list_view, name='students_list'),
    path('student/evaluaciones/', evaluacion_views.student_evaluaciones_view, name='student_evaluaciones'),
    
    # Endpoints para descarga y subida de respuestas
    path('evaluaciones/<int:pk>/download/', evaluacion_views.download_evaluacion_view, name='download_evaluacion'),
    path('evaluaciones/<int:pk>/upload-respuesta/', evaluacion_views.upload_respuesta_view, name='upload_respuesta'),
    # Evaluaciones - Exámenes seguros
    path('evaluaciones/<int:pk>/examen-data/', evaluacion_views.examen_data_view, name='examen_data'),
    path('evaluaciones/<int:pk>/enviar-respuestas/', evaluacion_views.enviar_respuestas_view, name='enviar_respuestas'),
    path('student/respuestas/', evaluacion_views.student_respuestas_view, name='student_respuestas'),
    path('evaluaciones/<int:pk>/respuestas/', evaluacion_views.profesor_respuestas_view, name='profesor_respuestas'),
    path('reportes/progreso/', evaluacion_views.reportes_progreso_view, name='reportes_progreso'),
    
    # Endpoints para notificaciones
    path('notificaciones/', notificacion_views.obtener_notificaciones, name='obtener_notificaciones'),
    path('notificaciones/<int:notificacion_id>/marcar-leida/', notificacion_views.marcar_notificacion_leida, name='marcar_notificacion_leida'),
    path('notificaciones/marcar-todas-leidas/', notificacion_views.marcar_todas_leidas, name='marcar_todas_leidas'),
    
    # Endpoints para calificación
    path('calificaciones/por-calificar/', calificacion_views.obtener_respuestas_por_calificar, name='respuestas_por_calificar'),
    path('calificaciones/calificadas/', calificacion_views.obtener_respuestas_calificadas, name='respuestas_calificadas'),
    path('calificaciones/<int:respuesta_id>/', calificacion_views.obtener_detalle_respuesta, name='detalle_respuesta'),
    path('calificaciones/<int:respuesta_id>/calificar/', calificacion_views.calificar_respuesta, name='calificar_respuesta'),
    path('calificaciones/<int:respuesta_id>/actualizar/', calificacion_views.actualizar_calificacion, name='actualizar_calificacion'),
]

urlpatterns += router.urls
