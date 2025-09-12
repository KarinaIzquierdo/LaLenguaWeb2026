from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import RespuestaEvaluacion, Evaluacion
from .serializers import RespuestaEvaluacionSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_respuestas_por_calificar(request):
    """
    Obtiene todas las respuestas de evaluaciones que necesitan calificación
    para las evaluaciones creadas por el profesor autenticado
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Obtener evaluaciones del profesor
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=request.user)
    
    # Obtener respuestas sin calificar
    respuestas_sin_calificar = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        completado=True,
        calificacion__isnull=True
    ).select_related('evaluacion', 'estudiante').order_by('-fecha_envio')
    
    serializer = RespuestaEvaluacionSerializer(respuestas_sin_calificar, many=True)
    
    return Response({
        'success': True,
        'respuestas': serializer.data,
        'total': respuestas_sin_calificar.count()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_respuestas_calificadas(request):
    """
    Obtiene todas las respuestas ya calificadas por el profesor
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Obtener evaluaciones del profesor
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=request.user)
    
    # Obtener respuestas calificadas
    respuestas_calificadas = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        completado=True,
        calificacion__isnull=False
    ).select_related('evaluacion', 'estudiante', 'calificado_por').order_by('-fecha_calificacion')
    
    serializer = RespuestaEvaluacionSerializer(respuestas_calificadas, many=True)
    
    return Response({
        'success': True,
        'respuestas': serializer.data,
        'total': respuestas_calificadas.count()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calificar_respuesta(request, respuesta_id):
    """
    Califica una respuesta específica de evaluación
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden calificar evaluaciones'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para calificar esta evaluación'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Obtener datos de calificación
        calificacion = request.data.get('calificacion')
        comentarios = request.data.get('comentarios_profesor', '')
        
        # Validar calificación
        if calificacion is None:
            return Response({'error': 'La calificación es requerida'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            calificacion = float(calificacion)
            if calificacion < 0 or calificacion > 100:
                return Response({'error': 'La calificación debe estar entre 0 y 100'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'La calificación debe ser un número válido'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar la respuesta con la calificación
        respuesta.calificacion = calificacion
        respuesta.comentarios_profesor = comentarios
        respuesta.fecha_calificacion = timezone.now()
        respuesta.calificado_por = request.user
        respuesta.save()
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'message': 'Evaluación calificada exitosamente',
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al calificar: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_calificacion(request, respuesta_id):
    """
    Actualiza una calificación existente
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden actualizar calificaciones'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para actualizar esta calificación'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que ya está calificada
        if respuesta.calificacion is None:
            return Response({'error': 'Esta respuesta no ha sido calificada aún'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener nuevos datos
        nueva_calificacion = request.data.get('calificacion')
        nuevos_comentarios = request.data.get('comentarios_profesor', respuesta.comentarios_profesor)
        
        # Validar nueva calificación
        if nueva_calificacion is not None:
            try:
                nueva_calificacion = float(nueva_calificacion)
                if nueva_calificacion < 0 or nueva_calificacion > 100:
                    return Response({'error': 'La calificación debe estar entre 0 y 100'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                respuesta.calificacion = nueva_calificacion
            except (ValueError, TypeError):
                return Response({'error': 'La calificación debe ser un número válido'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar comentarios
        respuesta.comentarios_profesor = nuevos_comentarios
        respuesta.fecha_calificacion = timezone.now()  # Actualizar fecha de modificación
        respuesta.save()
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'message': 'Calificación actualizada exitosamente',
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al actualizar calificación: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_detalle_respuesta(request, respuesta_id):
    """
    Obtiene el detalle completo de una respuesta para calificar
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para ver esta respuesta'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al obtener respuesta: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
