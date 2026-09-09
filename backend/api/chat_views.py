from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatRoom, ChatMessage, CustomUser
from .serializers import ChatRoomSerializer, ChatMessageSerializer
from django.db.models import Q

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def chat_rooms_view(request):
    """
    GET: Lista las salas de chat del usuario actual.
    POST: Crea o recupera una sala de chat con otro usuario.
    """
    user = request.user
    if request.method == 'GET':
        if user.role == 'profesor':
            rooms = ChatRoom.objects.filter(profesor=user).order_by('-updated_at')
        elif user.role == 'student':
            rooms = ChatRoom.objects.filter(estudiante=user).order_by('-updated_at')
        else:
            # Admins pueden ver todos si se requiere, por ahora solo sus propios
            rooms = ChatRoom.objects.filter(Q(estudiante=user) | Q(profesor=user)).order_by('-updated_at')
            
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({'error': 'user_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            other_user = CustomUser.objects.get(id=other_user_id)
            
            # Lógica para determinar quién es el estudiante y quién el profesor
            if user.role == 'student' and other_user.role == 'profesor':
                room, created = ChatRoom.objects.get_or_create(estudiante=user, profesor=other_user)
            elif user.role == 'profesor' and other_user.role == 'student':
                room, created = ChatRoom.objects.get_or_create(estudiante=other_user, profesor=user)
            else:
                # Si ambos son iguales o roles raros, permitir creación simple para evitar bloqueos
                # pero idealmente el chat es entre Student-Profesor
                if user.id < other_user.id:
                    u1, u2 = user, other_user
                else:
                    u1, u2 = other_user, user
                room, created = ChatRoom.objects.get_or_create(estudiante=u1, profesor=u2)
            
            serializer = ChatRoomSerializer(room)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_contacts_view(request):
    """
    Lista los contactos con los que el usuario puede chatear.
    Estudiantes ven a sus profesores.
    Profesores ven a sus estudiantes.
    """
    user = request.user
    contacts = []

    if user.role == 'student':
        # Estudiantes ven a todos los profesores activos por defecto
        # para asegurar que siempre tengan a alguien con quien hablar
        profesores = CustomUser.objects.filter(role='profesor', is_active=True).distinct()
        contacts = profesores
    elif user.role == 'profesor':
        # Profesores ven a los estudiantes de sus clubes
        from .models import Club
        estudiantes_ids = CustomUser.objects.filter(clubs__profesor=user).values_list('id', flat=True)
        # Si no tiene clubes, quizás mostrar todos los estudiantes para facilitar soporte
        if not estudiantes_ids:
            estudiantes = CustomUser.objects.filter(role='student', is_active=True).distinct()
        else:
            estudiantes = CustomUser.objects.filter(id__in=estudiantes_ids, role='student', is_active=True).distinct()
        contacts = estudiantes

    from .serializers import UserSerializer
    serializer = UserSerializer(contacts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_messages_view(request, room_id):
    """
    Carga el historial de mensajes de una sala específica.
    """
    try:
        room = ChatRoom.objects.get(id=room_id)
        
        # Verificar que el usuario pertenece a la sala
        if request.user != room.estudiante and request.user != room.profesor and not request.user.is_staff:
            return Response({'error': 'No tienes permiso para ver este chat'}, status=status.HTTP_403_FORBIDDEN)
        
        messages = room.messages.all().order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
        
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Sala de chat no encontrada'}, status=status.HTTP_404_NOT_FOUND)
