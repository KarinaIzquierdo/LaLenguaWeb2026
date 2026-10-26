from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import NotificacionAdmin, Venta, Suscripcion
from .serializers import NotificacionAdminSerializer


# Tipos que el administrador puede ver. El resto puede seguir existiendo
# en la base de datos pero no se muestra ni cuenta como no leída.
TIPOS_VISIBLES_ADMIN = [
    'venta_pendiente',
    'plan_vencido',
]

# Solo se notifican eventos de los últimos 30 días para no inundar con cosas viejas
DIAS_MAX_NOTIFICAR_ADMIN = 30


def generar_notificaciones_admin(admin):
    """
    Genera notificaciones automáticas para un administrador
    """
    hoy = timezone.localdate()
    hace_30_dias = timezone.now() - timedelta(days=DIAS_MAX_NOTIFICAR_ADMIN)
    notificaciones_creadas = []

    # 1. FALLO EN PAGO (ventas que quedaron pendientes)
    ventas_pendientes = Venta.objects.filter(
        estado='pendiente',
        fecha_venta__gte=hace_30_dias
    )
    for venta in ventas_pendientes:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='venta_pendiente',
            datos_adicionales__contains={'venta_id': venta.id}
        ).exists():
            nombre = venta.estudiante.get_full_name() or venta.estudiante.username
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='venta_pendiente',
                titulo=f"Fallo en pago: {nombre}",
                mensaje=f"Error en el pago del estudiante {nombre}. Requiere gestión.",
                prioridad='alta',
                datos_adicionales={'venta_id': venta.id, 'estudiante_id': venta.estudiante.id}
            )
            notificaciones_creadas.append(notif)

    # 2. SUSCRIPCIÓN VENCIDA DE USUARIO (vencidas recientemente)
    # Se detecta por fecha_fin, no por el campo estado: nadie lo marca 'vencida'
    # automáticamente, así que se sincroniza aquí al generar notificaciones.
    suscripciones_vencidas = Suscripcion.objects.filter(
        fecha_fin__lt=hoy,
        fecha_fin__gte=hoy - timedelta(days=DIAS_MAX_NOTIFICAR_ADMIN),
    ).exclude(estado='cancelada')
    for suscripcion in suscripciones_vencidas:
        if suscripcion.estado != 'vencida':
            suscripcion.actualizar_estado()
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='plan_vencido',
            datos_adicionales__contains={'suscripcion_id': suscripcion.id},
        ).exists():
            nombre = suscripcion.estudiante.get_full_name() or suscripcion.estudiante.username
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='plan_vencido',
                titulo=f"Suscripción vencida: {nombre}",
                mensaje=f"La suscripción de {nombre} venció el {suscripcion.fecha_fin.strftime('%d/%m/%Y')}. Requiere gestión.",
                prioridad='urgente',
                datos_adicionales={'suscripcion_id': suscripcion.id, 'estudiante_id': suscripcion.estudiante.id}
            )
            notificaciones_creadas.append(notif)

    return notificaciones_creadas


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_notificaciones_admin(request):
    """
    Obtiene las notificaciones del administrador autenticado y genera nuevas automáticamente
    """
    user = request.user
    if not (getattr(user, 'role', None) == 'admin' or user.is_staff or user.is_superuser):
        return Response({
            'success': False,
            'message': 'Solo administradores pueden acceder a estas notificaciones'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        generar_notificaciones_admin(request.user)

        hace_30_dias = timezone.now() - timedelta(days=30)
        notificaciones = NotificacionAdmin.objects.filter(
            admin=request.user,
            tipo__in=TIPOS_VISIBLES_ADMIN,
            created_at__gte=hace_30_dias
        ).order_by('-created_at')

        serializer = NotificacionAdminSerializer(notificaciones, many=True)
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
def marcar_notificacion_admin_leida(request, notificacion_id):
    """
    Marca una notificación de admin como leída
    """
    try:
        notificacion = NotificacionAdmin.objects.get(
            id=notificacion_id,
            admin=request.user
        )
        notificacion.leida = True
        notificacion.save()

        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        }, status=status.HTTP_200_OK)

    except NotificacionAdmin.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_admin_leidas(request):
    """
    Marca todas las notificaciones del administrador como leídas
    """
    try:
        count = NotificacionAdmin.objects.filter(
            admin=request.user,
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
def eliminar_notificacion_admin(request, notificacion_id):
    """
    Elimina una notificación de administrador
    """
    try:
        notificacion = NotificacionAdmin.objects.get(
            id=notificacion_id,
            admin=request.user
        )
        notificacion.delete()

        return Response({
            'success': True,
            'message': 'Notificación eliminada'
        }, status=status.HTTP_200_OK)

    except NotificacionAdmin.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
