from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Evaluacion, CustomUser
from .serializers import EvaluacionSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evaluaciones_list_view(request):
    """
    Listar evaluaciones del profesor autenticado
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    evaluaciones = Evaluacion.objects.filter(profesor=request.user).order_by('-created_at')
    serializer = EvaluacionSerializer(evaluaciones, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def evaluacion_create_view(request):
    """
    Crear nueva evaluación (subir archivo)
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data.copy()
    data['profesor'] = request.user.id
    
    serializer = EvaluacionSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        evaluacion = serializer.save()
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación creada exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    print(f"Validation errors: {serializer.errors}")  # Debug
    print(f"Request data: {request.data}")  # Debug
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def evaluacion_update_view(request, pk):
    """
    Actualizar evaluación existente
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EvaluacionSerializer(evaluacion, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        evaluacion = serializer.save()
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación actualizada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def evaluacion_delete_view(request, pk):
    """
    Eliminar evaluación
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
        evaluacion.delete()
        return Response({
            'success': True,
            'message': 'Evaluación eliminada exitosamente'
        }, status=status.HTTP_200_OK)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluacion_publish_view(request, pk):
    """
    Publicar evaluación (cambiar estado a 'published')
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
        evaluacion.estado = 'published'
        evaluacion.save()
        
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación publicada exitosamente'
        }, status=status.HTTP_200_OK)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_evaluaciones_view(request):
    """
    Listar evaluaciones asignadas al estudiante autenticado
    """
    evaluaciones = Evaluacion.objects.filter(
        estudiantes_asignados=request.user,
        estado='published'
    ).order_by('-created_at')
    
    serializer = EvaluacionSerializer(evaluaciones, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def students_list_view(request):
    """
    Listar todos los estudiantes para asignar evaluaciones
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    students = CustomUser.objects.filter(role='student', is_active=True)
    serializer = UserSerializer(students, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)
