from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, NotificacionAdmin, Venta, Suscripcion, Clase
from .serializers import NotificacionAdminSerializer


def generar_notificaciones_admin(admin):
    """
    Genera notificaciones automáticas para un administrador
    """
    hoy = timezone.now().date()
    hace_24h = timezone.now() - timedelta(hours=24)
    notificaciones_creadas = []

    # 1. NUEVOS ESTUDIANTES HOY
    nuevos_estudiantes = CustomUser.objects.filter(
        role='student',
        date_joined__date=hoy
    )
    for estudiante in nuevos_estudiantes:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='nuevo_estudiante',
            datos_adicionales__contains={'estudiante_id': estudiante.id},
            created_at__date=hoy
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='nuevo_estudiante',
                titulo=f"Nuevo estudiante: {estudiante.get_full_name() or estudiante.username}",
                mensaje=f"El estudiante {estudiante.get_full_name() or estudiante.username} se registró hoy.",
                prioridad='media',
                datos_adicionales={'estudiante_id': estudiante.id, 'email': estudiante.email}
            )
            notificaciones_creadas.append(notif)

    # 2. NUEVAS VENTAS HOY
    ventas_hoy = Venta.objects.filter(fecha_venta__date=hoy)
    for venta in ventas_hoy:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='nueva_venta',
            datos_adicionales__contains={'venta_id': venta.id},
            created_at__date=hoy
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='nueva_venta',
                titulo=f"Nueva venta #{venta.id}",
                mensaje=f"Se registró una venta de ${venta.precio_total} para {venta.estudiante.get_full_name() or venta.estudiante.username}. Plan: {venta.plan.nombre}.",
                prioridad='media',
                datos_adicionales={'venta_id': venta.id, 'estudiante_id': venta.estudiante.id}
            )
            notificaciones_creadas.append(notif)

    # 3. VENTAS PENDIENTES
    ventas_pendientes = Venta.objects.filter(estado='pendiente')
    for venta in ventas_pendientes:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='venta_pendiente',
            datos_adicionales__contains={'venta_id': venta.id}
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='venta_pendiente',
                titulo=f"Venta pendiente #{venta.id}",
                mensaje=f"La venta de {venta.estudiante.get_full_name() or venta.estudiante.username} por ${venta.precio_total} está pendiente de pago.",
                prioridad='alta',
                datos_adicionales={'venta_id': venta.id, 'estudiante_id': venta.estudiante.id}
            )
            notificaciones_creadas.append(notif)

    # 4. SUSCRIPCIONES POR VENCER (próximos 7 días)
    fecha_limite = hoy + timedelta(days=7)
    suscripciones_por_vencer = Suscripcion.objects.filter(
        fecha_fin__lte=fecha_limite,
        fecha_fin__gte=hoy,
        estado__in=['activa', 'por_vencer']
    )
    for suscripcion in suscripciones_por_vencer:
        dias = (suscripcion.fecha_fin - hoy).days
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='plan_por_vencer',
            datos_adicionales__contains={'suscripcion_id': suscripcion.id},
            created_at__date=hoy
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='plan_por_vencer',
                titulo=f"Plan por vencer: {suscripcion.estudiante.get_full_name() or suscripcion.estudiante.username}",
                mensaje=f"La suscripción de {suscripcion.estudiante.get_full_name() or suscripcion.estudiante.username} vence en {dias} días ({suscripcion.fecha_fin.strftime('%d/%m/%Y')}).",
                prioridad='alta' if dias <= 3 else 'media',
                datos_adicionales={'suscripcion_id': suscripcion.id, 'estudiante_id': suscripcion.estudiante.id, 'dias_restantes': dias}
            )
            notificaciones_creadas.append(notif)

    # 5. SUSCRIPCIONES VENCIDAS
    suscripciones_vencidas = Suscripcion.objects.filter(
        fecha_fin__lt=hoy,
        estado='vencida'
    )
    for suscripcion in suscripciones_vencidas:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='plan_vencido',
            datos_adicionales__contains={'suscripcion_id': suscripcion.id},
            created_at__date=hoy
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='plan_vencido',
                titulo=f"Plan vencido: {suscripcion.estudiante.get_full_name() or suscripcion.estudiante.username}",
                mensaje=f"La suscripción de {suscripcion.estudiante.get_full_name() or suscripcion.estudiante.username} venció el {suscripcion.fecha_fin.strftime('%d/%m/%Y')}.",
                prioridad='urgente',
                datos_adicionales={'suscripcion_id': suscripcion.id, 'estudiante_id': suscripcion.estudiante.id}
            )
            notificaciones_creadas.append(notif)

    # 6. CLASES PROGRAMADAS PARA HOY
    clases_hoy = Clase.objects.filter(fecha=hoy, estado='programada')
    for clase in clases_hoy:
        if not NotificacionAdmin.objects.filter(
            admin=admin,
            tipo='nueva_clase',
            datos_adicionales__contains={'clase_id': clase.id},
            created_at__date=hoy
        ).exists():
            notif = NotificacionAdmin.objects.create(
                admin=admin,
                tipo='nueva_clase',
                titulo=f"Clase programada hoy: {clase.tema}",
                mensaje=f"Hay una clase programada hoy a las {clase.hora}. Profesor: {clase.profesor}. Estudiantes: {clase.estudiantes.count()}.",
                prioridad='media',
                datos_adicionales={'clase_id': clase.id, 'profesor': clase.profesor}
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
