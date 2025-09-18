from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CustomUser

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_view(request, user_id):
    """
    Eliminar usuario por ID
    """
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        user.delete()
        return Response({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al eliminar usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
