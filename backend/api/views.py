from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, Profesor, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion, Evaluacion, Notificacion, RespuestaEvaluacion
from .serializers import (
    UserSerializer, LoginSerializer, ChangePasswordSerializer, ClaseSerializer,
    UserRegisterSerializer, EvaluationSerializer, MediaItemSerializer,
    ClubSerializer, ClubMaterialSerializer, EvaluacionSerializer, NotificacionSerializer,
)
from .especializacion_serializer import EspecializacionSerializer

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
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """
        Endpoint para cambiar el estado de una clase (programada -> activa -> completada)
        """
        clase = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in ['programada', 'activa', 'completada']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        clase.estado = nuevo_estado
        clase.save()
        
        serializer = self.get_serializer(clase)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint para registrar un nuevo usuario (estudiante, profesor o admin)
    """
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Si se proporciona bloque_asignado, asignarlo al usuario
        if 'bloque_asignado' in request.data and request.data['bloque_asignado']:
            user.bloque_asignado = request.data['bloque_asignado']
            user.save()
        
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


# ==================== ENDPOINTS PARA GALERÍA ====================

class MediaItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de elementos multimedia
    """
    queryset = MediaItem.objects.filter(is_active=True)
    serializer_class = MediaItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Solo lectura para todos, escritura solo para admin
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Guardar el elemento multimedia
        """
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Soft delete - marcar como inactivo en lugar de eliminar
        """
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([AllowAny])
def gallery_list_view(request):
    """
    Endpoint público para obtener todos los elementos de la galería
    """
    media_items = MediaItem.objects.filter(is_active=True).order_by('-created_at')
    serializer = MediaItemSerializer(media_items, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


# ==================== ENDPOINTS PARA CLUBS (CLB) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clubs_list_view(request):
    """
    Listar clubs visibles para el usuario actual.
    - Si es profesor: clubs donde es profesor.
    - Si es estudiante: clubs a los que pertenece.
    - Si es admin: todos.
    """
    user = request.user
    if getattr(user, 'role', None) == 'admin':
        qs = Club.objects.all()
    elif getattr(user, 'is_profesor', False) or getattr(user, 'role', None) == 'profesor':
        qs = Club.objects.filter(profesor=user)
    else:
        qs = Club.objects.filter(students=user)

    serializer = ClubSerializer(qs.order_by('-updated_at'), many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_create_view(request):
    """Crear club (solo admin o profesor)."""
    user = request.user
    data = request.data.copy()
    # Si es profesor, fijar profesor = user
    if getattr(user, 'role', None) != 'admin':
        data['profesor'] = str(user.id)

    serializer = ClubSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        club = serializer.save()
        return Response({'success': True, 'data': ClubSerializer(club, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_students_list_view(request, club_id):
    """Listar estudiantes asignados a un club (profesor del club, admin o el propio estudiante podrá verse)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin' or user in club.students.all()):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    students = club.students.all()
    # Limitar campos en respuesta
    data = UserSerializer(students, many=True).data
    return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_add_student_view(request, club_id):
    """Agregar estudiante por email al club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    email = request.data.get('email')
    student = None
    if user_id:
        try:
            student = CustomUser.objects.get(pk=int(user_id))
        except (ValueError, CustomUser.DoesNotExist):
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    elif email:
        try:
            student = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'success': False, 'message': 'Debe proporcionar user_id o email'}, status=status.HTTP_400_BAD_REQUEST)

    club.students.add(student)
    return Response({'success': True, 'message': 'Estudiante agregado'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def club_remove_student_view(request, club_id, user_id):
    """Remover estudiante del club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    try:
        student = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    club.students.remove(student)
    return Response({'success': True, 'message': 'Estudiante removido'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_materials_list_view(request, club_id):
    """Listar materiales activos de un club visible para el usuario."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    # Permisos básicos de lectura
    if not (user == club.profesor or user in club.students.all() or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    mats = club.materials.filter(is_active=True)
    serializer = ClubMaterialSerializer(mats, many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def club_material_create_view(request, club_id):
    """Crear material en un club (profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    data['club'] = str(club.id)
    serializer = ClubMaterialSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        mat = serializer.save(created_by=user, is_active=True)
        return Response({'success': True, 'data': ClubMaterialSerializer(mat, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_create_view(request):
    """
    Endpoint para crear un nuevo elemento multimedia
    """
    serializer = MediaItemSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        # Asegurar que los nuevos elementos queden activos por defecto
        serializer.save(is_active=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Elemento creado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_update_view(request, pk):
    """
    Endpoint para actualizar un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = MediaItemSerializer(media_item, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Elemento actualizado exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def gallery_delete_view(request, pk):
    """
    Endpoint para eliminar (soft delete) un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
        media_item.is_active = False
        media_item.save()
        return Response({
            'success': True,
            'message': 'Elemento eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
