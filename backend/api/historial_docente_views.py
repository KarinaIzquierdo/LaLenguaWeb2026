from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import HistorialDocente, CustomUser
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def historial_docente_list_create_view(request):
    """
    Lista el historial docente o crea un nuevo registro.
    """
    if request.method == 'GET':
        profesor_id = request.query_params.get('profesor')
        tipo_evento = request.query_params.get('tipo_evento')
        
        queryset = HistorialDocente.objects.all()
        
        if profesor_id:
            queryset = queryset.filter(profesor_id=profesor_id)
        
        if tipo_evento:
            queryset = queryset.filter(tipo_evento=tipo_evento)
            
        historial = []
        for item in queryset:
            historial.append({
                'id': item.id,
                'profesor': {
                    'id': item.profesor.id,
                    'username': item.profesor.username,
                    'nombre': f"{item.profesor.first_name} {item.profesor.last_name}".strip() or item.profesor.username,
                },
                'fecha': item.fecha.isoformat(),
                'tipo_evento': item.tipo_evento,
                'tipo_evento_display': item.get_tipo_evento_display(),
                'titulo': item.titulo,
                'descripcion': item.descripcion,
                'archivo_adjunto': item.archivo_adjunto.url if item.archivo_adjunto else None,
                'registrado_por': {
                    'id': item.registrado_por.id,
                    'username': item.registrado_por.username,
                    'nombre': f"{item.registrado_por.first_name} {item.registrado_por.last_name}".strip() or item.registrado_por.username,
                } if item.registrado_por else None,
                'created_at': item.created_at.isoformat(),
                'updated_at': item.updated_at.isoformat(),
            })
            
        return Response({
            'success': True,
            'historial': historial
        })

    elif request.method == 'POST':
        data = request.data
        profesor_id = data.get('profesor')
        
        if not profesor_id:
            return Response({'success': False, 'message': 'El profesor es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)
            
        profesor = get_object_or_404(CustomUser, id=profesor_id, role='profesor')
        
        try:
            nuevo_registro = HistorialDocente.objects.create(
                profesor=profesor,
                tipo_evento=data.get('tipo_evento', 'otro'),
                titulo=data.get('titulo'),
                descripcion=data.get('descripcion', ''),
                registrado_por=request.user
            )
            
            # Si hay archivo se manejaría aparte o con MultiPartParser
            
            return Response({
                'success': True,
                'message': 'Registro de historial creado exitosamente',
                'historial': {
                    'id': nuevo_registro.id,
                    'titulo': nuevo_registro.titulo
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creando historial docente: {str(e)}")
            return Response({'success': False, 'message': f'Error al crear el registro: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def historial_docente_detail_view(request, pk):
    """
    Obtiene, actualiza o elimina un registro de historial docente.
    """
    registro = get_object_or_404(HistorialDocente, pk=pk)
    
    if request.method == 'GET':
        return Response({
            'success': True,
            'historial': {
                'id': registro.id,
                'profesor_nombre': f"{registro.profesor.first_name} {registro.profesor.last_name}",
                'titulo': registro.titulo,
                'descripcion': registro.descripcion,
                'fecha': registro.fecha.isoformat(),
                'tipo_evento': registro.tipo_evento,
                'tipo_evento_display': registro.get_tipo_evento_display(),
            }
        })
        
    elif request.method == 'DELETE':
        registro.delete()
        return Response({'success': True, 'message': 'Registro eliminado correctamente'})
