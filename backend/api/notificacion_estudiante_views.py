from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
from .models import NotificacionEstudiante, Clase, Evaluacion, RespuestaEvaluacion
from .serializers import NotificacionEstudianteSerializer

# Tipos que el estudiante puede ver en su campanita. El resto (planes,
# misiones, retos, etc.) se siguen pudiendo crear internamente pero no
# se muestran ni cuentan como no leídas.
TIPOS_VISIBLES = [
    'clase_proxima',
    'clase_pronto',
    'evaluacion_asignada',
    'calificacion_disponible',
]

# Antigüedad máxima del evento para notificarlo (evita avisar de cosas viejas)
DIAS_MAX_NOTIFICAR = 7


def _get_estudiante_role(estudiante):
    role = getattr(estudiante, 'role', None)
    if role:
        return role
    return 'student' if getattr(estudiante, 'is_student', False) else None


def _clase_inicio_dt(clase):
    """Combina fecha + hora de la clase en un datetime con zona horaria.
    Retorna None si la clase no tiene hora válida."""
    if not clase.fecha or not clase.hora:
        return None
    try:
        hora = datetime.strptime(str(clase.hora).strip(), '%H:%M').time()
    except ValueError:
        return None
    return timezone.make_aware(datetime.combine(clase.fecha, hora))


def generar_notificaciones_estudiante(estudiante):
    if not estudiante or not estudiante.id:
        return 0

    role = _get_estudiante_role(estudiante)
    if role and role != 'student':
        return 0

    hoy = timezone.localdate()
    ahora = timezone.now()
    notificaciones_creadas = []

    # 1. Recordatorio de clase
    clases = Clase.objects.filter(
        estudiantes=estudiante,
        fecha__gte=hoy,
        estado__in=['programada', 'activa']
    ).distinct()

    for clase in clases:
        if clase.fecha == hoy:
            # Aviso "empieza en X minutos": desde 30 min antes hasta 10 min después del inicio
            inicio = _clase_inicio_dt(clase)
            if not inicio:
                continue
            minutos = int((inicio - ahora).total_seconds() // 60)
            if not (-10 <= minutos <= 30):
                continue
            if NotificacionEstudiante.objects.filter(
                estudiante=estudiante,
                tipo='clase_pronto',
                datos_adicionales__contains={'clase_id': clase.id}
            ).exists():
                continue
            if minutos > 0:
                mensaje = f'Tu clase de {clase.tema or clase.nombre} empieza en {minutos} minutos.'
            else:
                mensaje = f'Tu clase de {clase.tema or clase.nombre} acaba de empezar.'
            notificaciones_creadas.append(NotificacionEstudiante.objects.create(
                estudiante=estudiante,
                tipo='clase_pronto',
                mensaje=mensaje,
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

    # 2. Tarea / evaluación asignada (solo evaluaciones publicadas recientes)
    evaluaciones = Evaluacion.objects.filter(
        estudiantes_asignados=estudiante,
        estado='publicada',
        updated_at__gte=ahora - timedelta(days=DIAS_MAX_NOTIFICAR)
    ).distinct()

    for evaluacion in evaluaciones:
        if NotificacionEstudiante.objects.filter(
            estudiante=estudiante,
            tipo='evaluacion_asignada',
            datos_adicionales__contains={'evaluacion_id': evaluacion.id}
        ).exists():
            continue
        if evaluacion.fecha_limite:
            fecha_str = timezone.localtime(evaluacion.fecha_limite).strftime('%d/%m/%Y')
            mensaje = f'Tu profesor ha subido una nueva tarea: "{evaluacion.titulo}", con fecha límite para el {fecha_str}.'
        else:
            mensaje = f'Tu profesor ha subido una nueva tarea: "{evaluacion.titulo}".'
        notificaciones_creadas.append(NotificacionEstudiante.objects.create(
            estudiante=estudiante,
            tipo='evaluacion_asignada',
            mensaje=mensaje,
            datos_adicionales={
                'evaluacion_id': evaluacion.id,
                'titulo': evaluacion.titulo,
                'tipo_evaluacion': evaluacion.tipo,
                'fecha_limite': evaluacion.fecha_limite.isoformat() if evaluacion.fecha_limite else None
            }
        ))

    # 3. Calificación disponible (solo calificaciones recientes)
    respuestas_calificadas = RespuestaEvaluacion.objects.filter(
        estudiante=estudiante,
        calificacion__isnull=False,
        fecha_calificacion__gte=ahora - timedelta(days=DIAS_MAX_NOTIFICAR)
    ).select_related('evaluacion')

    for respuesta in respuestas_calificadas:
        if NotificacionEstudiante.objects.filter(
            estudiante=estudiante,
            tipo='calificacion_disponible',
            datos_adicionales__contains={'respuesta_id': respuesta.id}
        ).exists():
            continue
        notificaciones_creadas.append(NotificacionEstudiante.objects.create(
            estudiante=estudiante,
            tipo='calificacion_disponible',
            mensaje=f'Tu profesor calificó tu entrega de "{respuesta.evaluacion.titulo}". Obtuviste {float(respuesta.calificacion):g}/100.',
            datos_adicionales={
                'respuesta_id': respuesta.id,
                'evaluacion_id': respuesta.evaluacion_id,
                'titulo': respuesta.evaluacion.titulo,
                'calificacion': float(respuesta.calificacion)
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
            estudiante=estudiante,
            tipo__in=TIPOS_VISIBLES
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
            leida=False,
            tipo__in=TIPOS_VISIBLES
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
