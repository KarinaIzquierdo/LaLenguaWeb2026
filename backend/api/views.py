from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Profesor, Clase, Evaluation
from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer, ClaseSerializer, UserRegisterSerializer, EvaluationSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint unificado para autenticar usuarios de todos los roles y generar tokens JWT
    """
    print(f"Login request data: {request.data}")  # Debug
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Serializar datos del usuario con rol incluido
        user_serializer = UserSerializer(user)
        user_data = user_serializer.data
        
        # Asegurar que el rol esté correctamente asignado
        if user.is_profesor and user.role == 'student':
            user.role = 'profesor'
            user.save()
        
        return Response({
            'success': True,
            'token': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'message': 'Login exitoso'
        }, status=status.HTTP_200_OK)
    
    print(f"Login validation errors: {serializer.errors}")  # Debug
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
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


# ==================== ENDPOINTS PARA PROFESORES ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def profesor_login_view(request):
    """
    Endpoint para autenticar profesores y generar tokens JWT
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Verificar que el usuario sea profesor
        if not user.is_profesor:
            return Response({
                'success': False,
                'message': 'Este usuario no tiene permisos de profesor'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Obtener información del profesor
        try:
            profesor_profile = user.profesor_profile
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': profesor_profile.especialidad,
                'is_profesor': True,
                'telefono': profesor_profile.telefono,
                'biografia': profesor_profile.biografia,
                'experiencia': profesor_profile.experiencia_anos,
                'certificaciones': profesor_profile.certificaciones
            }
        except Profesor.DoesNotExist:
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': 'No especificada',
                'is_profesor': True
            }
        
        return Response({
            'success': True,
            'access': str(access_token),
            'refresh': str(refresh),
            'user': profesor_data,
            'message': 'Login de profesor exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_verify_token_view(request):
    """
    Endpoint para verificar si el token JWT de profesor es válido
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Token no válido para profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'success': True,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'is_profesor': True
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profesor_profile_view(request):
    """
    Endpoint para obtener el perfil del profesor autenticado
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        profesor_profile = user.profesor_profile
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': profesor_profile.especialidad,
            'biografia': profesor_profile.biografia,
            'experiencia_anos': profesor_profile.experiencia_anos,
            'certificaciones': profesor_profile.certificaciones,
            'telefono': profesor_profile.telefono,
            'disponibilidad': profesor_profile.disponibilidad,
            'tarifa_por_hora': str(profesor_profile.tarifa_por_hora),
            'is_profesor': True
        }
    except Profesor.DoesNotExist:
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': 'No especificada',
            'is_profesor': True
        }
    
    return Response({
        'success': True,
        'user': profesor_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_change_password_view(request):
    """
    Endpoint para cambiar la contraseña del profesor autenticado
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
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


# ==================== ENDPOINTS PARA CLASES ====================

class ClaseViewSet(viewsets.ModelViewSet):
    queryset = Clase.objects.all()
    serializer_class = ClaseSerializer

    def get_queryset(self):
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            return Clase.objects.filter(estudiantes__id=usuario_id)
        return super().get_queryset().order_by('-created_at')


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint para registrar un nuevo usuario (estudiante, profesor o admin)
    """
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return Response({
            'success': True,
            'user': user_serializer.data,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_evaluations_view(request):
    """
    List evaluations/quizzes for the current user
    """
    evaluations = Evaluation.objects.filter(usuario=request.user)
    serializer = EvaluationSerializer(evaluations, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_active_view(request, user_id):
    """
    Endpoint para activar o desactivar un usuario por su id
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'success': True,
            'is_active': user.is_active,
            'message': f'Usuario {"activado" if user.is_active else "desactivado"} correctamente.'
        }, status=status.HTTP_200_OK)
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Usuario no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    Endpoint para listar todos los usuarios
    """
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
