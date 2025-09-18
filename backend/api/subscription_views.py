from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from .models import CustomUser, Plan, Venta, Notificacion
from .serializers import VentaSerializer, UserSerializer
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asignar_plan_usuario_view(request):
    """
    Asigna un plan a un usuario específico
    """
    try:
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')
        especializacion_id = request.data.get('especializacion_id', None)
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        descuento = request.data.get('descuento', 0)
        notas = request.data.get('notas', '')
        
        # Validar datos requeridos
        if not user_id or not plan_id:
            return Response({
                'success': False,
                'message': 'user_id y plan_id son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener usuario y plan
        usuario = get_object_or_404(CustomUser, id=user_id)
        plan = get_object_or_404(Plan, id=plan_id)
        
        # Calcular fechas
        fecha_inicio = timezone.now().date()
        fecha_fin = fecha_inicio + timedelta(days=plan.duracion_meses * 30)
        
        # Calcular precios
        precio_plan = plan.precio_base
        precio_especializacion = 0
        
        if especializacion_id:
            # Aquí puedes agregar lógica para especializaciones si las tienes
            precio_especializacion = 50000  # Precio base de especialización
        
        precio_total = precio_plan + precio_especializacion - float(descuento)
        
        # Crear la venta/asignación
        venta = Venta.objects.create(
            estudiante=usuario,
            plan=plan,
            especializacion_id=especializacion_id if especializacion_id else None,
            precio_plan=precio_plan,
            precio_especializacion=precio_especializacion,
            descuento=descuento,
            precio_total=precio_total,
            metodo_pago=metodo_pago,
            estado='pagado',  # Asumimos que está pagado cuando admin lo asigna
            notas=notas,
            vendido_por=request.user,
            fecha_venta=timezone.now(),
            fecha_pago=timezone.now(),
            fecha_inicio_plan=fecha_inicio,
            fecha_fin_plan=fecha_fin
        )
        
        # Crear notificación para el usuario
        Notificacion.objects.create(
            usuario=usuario,
            titulo=f'Plan {plan.nombre} Asignado',
            mensaje=f'Te hemos asignado el plan {plan.nombre}. Válido desde {fecha_inicio} hasta {fecha_fin}. ¡Comienza tu aprendizaje!',
            tipo='plan_asignado',
            leida=False
        )
        
        return Response({
            'success': True,
            'message': f'Plan {plan.nombre} asignado exitosamente a {usuario.first_name} {usuario.last_name}',
            'venta_id': venta.id,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'precio_total': precio_total
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al asignar plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuarios_sin_plan_view(request):
    """
    Lista usuarios que no tienen un plan activo
    """
    try:
        # Usuarios que no tienen ventas activas o cuyo plan ya venció
        usuarios_sin_plan = CustomUser.objects.filter(
            role='estudiante'
        ).exclude(
            ventas__fecha_fin_plan__gte=timezone.now().date(),
            ventas__estado='pagado'
        ).distinct()
        
        serializer = UserSerializer(usuarios_sin_plan, many=True)
        return Response({
            'success': True,
            'usuarios': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener usuarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def planes_por_vencer_view(request):
    """
    Lista planes que están por vencer en los próximos días
    """
    try:
        dias_aviso = int(request.GET.get('dias', 7))  # Por defecto 7 días
        fecha_limite = timezone.now().date() + timedelta(days=dias_aviso)
        
        planes_por_vencer = Venta.objects.filter(
            estado='pagado',
            fecha_fin_plan__lte=fecha_limite,
            fecha_fin_plan__gte=timezone.now().date()
        ).select_related('estudiante', 'plan')
        
        serializer = VentaSerializer(planes_por_vencer, many=True)
        return Response({
            'success': True,
            'planes_por_vencer': serializer.data,
            'total': planes_por_vencer.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener planes por vencer: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suscripciones_activas_view(request):
    """
    Lista todas las suscripciones activas con información detallada
    """
    try:
        suscripciones_activas = Venta.objects.filter(
            estado='pagado',
            fecha_fin_plan__gte=timezone.now().date()
        ).select_related('estudiante', 'plan').order_by('fecha_fin_plan')
        
        serializer = VentaSerializer(suscripciones_activas, many=True)
        return Response({
            'success': True,
            'suscripciones': serializer.data,
            'total': suscripciones_activas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener suscripciones activas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_recordatorio_pago_view(request):
    """
    Envía recordatorio de pago a usuarios con planes por vencer
    """
    try:
        venta_id = request.data.get('venta_id')
        mensaje_personalizado = request.data.get('mensaje', '')
        
        venta = get_object_or_404(Venta, id=venta_id)
        
        # Calcular días restantes
        dias_restantes = (venta.fecha_fin_plan - timezone.now().date()).days
        
        # Crear notificación
        mensaje_default = f'Tu plan {venta.plan.nombre} vence en {dias_restantes} días ({venta.fecha_fin_plan}). ¡Renueva para continuar aprendiendo!'
        mensaje_final = mensaje_personalizado if mensaje_personalizado else mensaje_default
        
        Notificacion.objects.create(
            usuario=venta.estudiante,
            titulo='Recordatorio de Renovación',
            mensaje=mensaje_final,
            tipo='recordatorio_pago',
            leida=False
        )
        
        return Response({
            'success': True,
            'message': f'Recordatorio enviado a {venta.estudiante.first_name} {venta.estudiante.last_name}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al enviar recordatorio: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renovar_plan_view(request):
    """
    Renueva un plan existente
    """
    try:
        venta_id = request.data.get('venta_id')
        nuevo_plan_id = request.data.get('nuevo_plan_id', None)
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        descuento = request.data.get('descuento', 0)
        
        venta_anterior = get_object_or_404(Venta, id=venta_id)
        
        # Usar el mismo plan o uno nuevo
        plan = get_object_or_404(Plan, id=nuevo_plan_id) if nuevo_plan_id else venta_anterior.plan
        
        # Calcular nuevas fechas (desde el fin del plan anterior)
        fecha_inicio = venta_anterior.fecha_fin_plan
        if fecha_inicio < timezone.now().date():
            fecha_inicio = timezone.now().date()
        
        fecha_fin = fecha_inicio + timedelta(days=plan.duracion_meses * 30)
        
        # Crear nueva venta/renovación
        nueva_venta = Venta.objects.create(
            estudiante=venta_anterior.estudiante,
            plan=plan,
            especializacion=venta_anterior.especializacion,
            precio_plan=plan.precio_base,
            precio_especializacion=venta_anterior.precio_especializacion,
            descuento=descuento,
            precio_total=plan.precio_base + venta_anterior.precio_especializacion - float(descuento),
            metodo_pago=metodo_pago,
            estado='pagado',
            notas=f'Renovación del plan anterior (ID: {venta_anterior.id})',
            vendido_por=request.user,
            fecha_venta=timezone.now(),
            fecha_pago=timezone.now(),
            fecha_inicio_plan=fecha_inicio,
            fecha_fin_plan=fecha_fin
        )
        
        # Notificar al usuario
        Notificacion.objects.create(
            usuario=venta_anterior.estudiante,
            titulo='Plan Renovado',
            mensaje=f'Tu plan {plan.nombre} ha sido renovado. Válido hasta {fecha_fin}. ¡Continúa aprendiendo!',
            tipo='plan_renovado',
            leida=False
        )
        
        return Response({
            'success': True,
            'message': 'Plan renovado exitosamente',
            'nueva_venta_id': nueva_venta.id,
            'fecha_fin': fecha_fin
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al renovar plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
