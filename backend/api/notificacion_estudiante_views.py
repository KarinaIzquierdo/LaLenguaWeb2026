from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db import models
from .models import NotificacionEstudiante, Clase, MissionExternalLink, DailyChallengeQuestion
from .serializers import NotificacionEstudianteSerializer


def _get_estudiante_role(estudiante):
    role = getattr(estudiante, 'role', None)
    if role:
        return role
    return 'student' if getattr(estudiante, 'is_student', False) else None


def generar_notificaciones_estudiante(estudiante):
    if not estudiante or not estudiante.id:
        return 0

    role = _get_estudiante_role(estudiante)
    if role and role != 'student':
        return 0

    hoy = timezone.now().date()
    notificaciones_creadas = []

    # Clases
    clases = Clase.objects.filter(
        estudiantes=estudiante,
        fecha__gte=hoy,
        estado__in=['programada', 'activa']
    ).distinct()

    for clase in clases:
        if clase.fecha == hoy:
            if not NotificacionEstudiante.objects.filter(
                estudiante=estudiante,
                tipo='clase_hoy',
                datos_adicionales__contains={'clase_id': clase.id},
                fecha_creacion__date=hoy
            ).exists():
                notificaciones_creadas.append(NotificacionEstudiante.objects.create(
                    estudiante=estudiante,
                    tipo='clase_hoy',
                    mensaje=f'Tienes clase hoy: {clase.tema or clase.nombre} a las {clase.hora} con {clase.profesor}.',
                    datos_adicionales={
                        'clase_id': clase.id,
                        'tema': clase.tema,
                        'fecha': str(clase.fecha),
                        'hora': clase.hora,
                        'profesor': clase.profesor,
                        'meet_link': clase.meet_link
                    }
                ))
        elif clase.fecha == hoy + timedelta(days=1):
            if not NotificacionEstudiante.objects.filter(
                estudiante=estudiante,
                tipo='clase_proxima',
                datos_adicionales__contains={'clase_id': clase.id},
                fecha_creacion__date=hoy
            ).exists():
                notificaciones_creadas.append(NotificacionEstudiante.objects.create(
                    estudiante=estudiante,
                    tipo='clase_proxima',
                    mensaje=f'Recordatorio: mañana tienes clase {clase.tema or clase.nombre} a las {clase.hora} con {clase.profesor}.',
                    datos_adicionales={
                        'clase_id': clase.id,
                        'tema': clase.tema,
                        'fecha': str(clase.fecha),
                        'hora': clase.hora,
                        'profesor': clase.profesor,
                        'meet_link': clase.meet_link
                    }
                ))

    # Misiones
    now = timezone.now()
    mission_base = MissionExternalLink.objects.filter(
        is_active=True
    ).filter(
        models.Q(start_at__isnull=True) | models.Q(start_at__lte=now)
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=now)
    )

    misiones = mission_base.filter(
        models.Q(audience_type='global') |
        models.Q(audience_type='student', user=estudiante)
    ).distinct()

    for mision in misiones:
        mission_key = mision.mission_key
        if not NotificacionEstudiante.objects.filter(
            estudiante=estudiante,
            tipo='mision_disponible',
            datos_adicionales__contains={'mission_key': mission_key}
        ).exists():
            notificaciones_creadas.append(NotificacionEstudiante.objects.create(
                estudiante=estudiante,
                tipo='mision_disponible',
                mensaje=f'Nueva misión disponible: {mission_key.replace("_", " ").title()}.',
                datos_adicionales={
                    'mission_key': mission_key,
                    'platform': mision.platform,
                    'url': mision.url,
                    'notes': mision.notes
                }
            ))

    # Retos diarios
    retos_activos = DailyChallengeQuestion.objects.filter(activo=True)
    if retos_activos.exists():
        if not NotificacionEstudiante.objects.filter(
            estudiante=estudiante,
            tipo='reto_diario_disponible',
            fecha_creacion__date=hoy
        ).exists():
            reto = retos_activos.first()
            total_retos = retos_activos.count()
            notificaciones_creadas.append(NotificacionEstudiante.objects.create(
                estudiante=estudiante,
                tipo='reto_diario_disponible',
                mensaje=f'El reto diario te espera. Tienes {total_retos} reto{"s" if total_retos > 1 else ""} disponible{"s" if total_retos > 1 else ""} para hoy.',
                datos_adicionales={
                    'total_retos': total_retos,
                    'reto_id': reto.id,
                    'categoria': reto.categoria,
                    'nivel': reto.nivel
                }
            ))

    return len(notificaciones_creadas)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notificaciones_estudiante_view(request):
    """
    Obtiene todas las notificaciones del estudiante autenticado
    """
    try:
        estudiante = request.user
        generar_notificaciones_estudiante(estudiante)

        notificaciones = NotificacionEstudiante.objects.filter(
            estudiante=estudiante
        ).order_by('-fecha_creacion')[:50]
        
        serializer = NotificacionEstudianteSerializer(notificaciones, many=True)
        return Response({
            'success': True,
            'notificaciones': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_notificacion_leida_view(request, notificacion_id):
    """
    Marca una notificación como leída
    """
    try:
        notificacion = NotificacionEstudiante.objects.get(
            id=notificacion_id,
            estudiante=request.user
        )
        notificacion.leida = True
        notificacion.save()
        
        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        }, status=status.HTTP_200_OK)
        
    except NotificacionEstudiante.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al marcar notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_leidas_view(request):
    """
    Marca todas las notificaciones del estudiante como leídas
    """
    try:
        NotificacionEstudiante.objects.filter(
            estudiante=request.user,
            leida=False
        ).update(leida=True)
        
        return Response({
            'success': True,
            'message': 'Todas las notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al marcar notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contador_no_leidas_view(request):
    """
    Obtiene el contador de notificaciones no leídas
    """
    try:
        count = NotificacionEstudiante.objects.filter(
            estudiante=request.user,
            leida=False
        ).count()
        
        return Response({
            'success': True,
            'count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener contador: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
