from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, Clase, Evaluacion, RespuestaEvaluacion, Notificacion
from .serializers import NotificacionSerializer

# Tipos que el profesor puede ver en sus notificaciones. El resto de tipos
# pueden seguir existiendo en la base de datos pero no se muestran ni cuentan.
TIPOS_VISIBLES_PROFESOR = [
    'evaluacion_subida',
]


def generar_notificaciones_automaticas(profesor_id):
    """
    Genera notificaciones automáticas para un profesor basadas en datos reales
    """
    profesor = CustomUser.objects.get(id=profesor_id, role='profesor')
    notificaciones_creadas = []

    # TRABAJOS / TAREAS ENTREGADAS POR ESTUDIANTES (últimas 24 horas)
    hace_24h = timezone.now() - timedelta(hours=24)
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=profesor)

    respuestas_recientes = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        fecha_envio__gte=hace_24h,
        completado=True
    )

    for respuesta in respuestas_recientes:
        if not Notificacion.objects.filter(
            profesor=profesor,
            tipo='evaluacion_subida',
            evaluacion_relacionada=respuesta.evaluacion,
            estudiante_relacionado=respuesta.estudiante,
            created_at__gte=hace_24h
        ).exists():
            nombre = respuesta.estudiante.get_full_name() or respuesta.estudiante.username
            notif = Notificacion.objects.create(
                profesor=profesor,
                tipo='evaluacion_subida',
                titulo=f"Tarea entregada: {respuesta.evaluacion.titulo}",
                mensaje=f"{nombre} ha enviado su tarea para revisión: '{respuesta.evaluacion.titulo}'.",
                prioridad='media',
                evaluacion_relacionada=respuesta.evaluacion,
                estudiante_relacionado=respuesta.estudiante
            )
            notificaciones_creadas.append(notif)

    return notificaciones_creadas


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_notificaciones(request):
    """
    Obtiene las notificaciones del profesor autenticado y genera nuevas automáticamente
    """
    # Verificar si el usuario es profesor, admin o tiene permisos
    if not (request.user.role in ['profesor', 'admin'] or request.user.is_profesor):
        return Response({
            'success': False,
            'message': 'Solo profesores y administradores pueden acceder a las notificaciones'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Generar notificaciones automáticas solo si es profesor
        if request.user.role == 'profesor' or request.user.is_profesor:
            generar_notificaciones_automaticas(request.user.id)
        
        # Obtener todas las notificaciones del usuario (últimos 30 días)
        hace_30_dias = timezone.now() - timedelta(days=30)
        
        notificaciones = Notificacion.objects.filter(
            profesor=request.user,
            tipo__in=TIPOS_VISIBLES_PROFESOR,
            created_at__gte=hace_30_dias
        ).order_by('-created_at')
        
        serializer = NotificacionSerializer(notificaciones, many=True)
        
        # Contar no leídas
        no_leidas = notificaciones.filter(leida=False).count()
        
        return Response({
            'success': True,
            'notificaciones': serializer.data,
            'total': notificaciones.count(),
            'no_leidas': no_leidas
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_notificacion_leida(request, notificacion_id):
    """
    Marca una notificación como leída
    """
    try:
        notificacion = Notificacion.objects.get(
            id=notificacion_id,
            profesor=request.user
        )
        notificacion.leida = True
        notificacion.save()
        
        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        }, status=status.HTTP_200_OK)
        
    except Notificacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_leidas(request):
    """
    Marca todas las notificaciones del profesor como leídas
    """
    try:
        count = Notificacion.objects.filter(
            profesor=request.user,
            leida=False
        ).update(leida=True)
        
        return Response({
            'success': True,
            'message': f'{count} notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_notificacion(request, notificacion_id):
    """
    Elimina una notificación del profesor
    """
    try:
        notificacion = Notificacion.objects.get(
            id=notificacion_id,
            profesor=request.user
        )
        notificacion.delete()

        return Response({
            'success': True,
            'message': 'Notificación eliminada'
        }, status=status.HTTP_200_OK)

    except Notificacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def crear_notificacion(request):
    """
    Crea una nueva notificación para un profesor específico
    """
    try:
        data = request.data
        profesor_id = data.get('profesor_id')
        titulo = data.get('titulo')
        mensaje = data.get('mensaje')
        tipo = data.get('tipo', 'asignacion_bloque')
        prioridad = data.get('prioridad', 'media')
        
        # Validar que el profesor existe
        try:
            profesor = CustomUser.objects.get(id=profesor_id, role='profesor')
        except CustomUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Profesor no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Crear la notificación
        notificacion = Notificacion.objects.create(
            profesor=profesor,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            prioridad=prioridad
        )
        
        serializer = NotificacionSerializer(notificacion)
        
        return Response({
            'success': True,
            'message': 'Notificación creada exitosamente',
            'notificacion': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al crear notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
