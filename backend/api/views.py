from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser
from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint para autenticar usuarios y generar tokens JWT
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Serializar datos del usuario
        user_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'token': str(access_token),
            'refresh': str(refresh),
            'user': user_serializer.data,
            'message': 'Login exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Credenciales inválidas'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token_view(request):
    """
    Endpoint para verificar si el token JWT es válido
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Endpoint para cambiar la contraseña del usuario autenticado
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al cambiar contraseña',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Endpoint para obtener el perfil del usuario autenticado
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Endpoint para actualizar la información adicional del usuario
    """
    user = request.user
    data = request.data
    
    try:
        # Actualizar campos del usuario
        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']
        if 'birthDate' in data:
            user.birth_date = data['birthDate']
        if 'cedula' in data:
            user.cedula = data['cedula']
        if 'phone' in data:
            user.phone = data['phone']
        if 'address' in data:
            user.address = data['address']
        if 'city' in data:
            user.city = data['city']
        if 'country' in data:
            user.country = data['country']
        if 'emergencyContact' in data:
            user.emergency_contact = data['emergencyContact']
        if 'emergencyPhone' in data:
            user.emergency_phone = data['emergencyPhone']
        if 'englishLevel' in data:
            user.english_level = data['englishLevel']
        if 'learningGoals' in data:
            user.learning_goals = data['learningGoals']
        
        # Marcar perfil como completado
        user.profile_completed = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
