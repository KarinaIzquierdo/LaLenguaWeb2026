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
        try:
            other_user_id = request.data.get('user_id')
            print(f"DEBUG CHAT - Intentando crear sala con user_id: {other_user_id} desde usuario: {user.username} (Rol: {user.role})")
            
            if not other_user_id:
                return Response({'error': 'user_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
                
            other_user = CustomUser.objects.get(id=other_user_id)
            print(f"DEBUG CHAT - Otro usuario encontrado: {other_user.username} (Rol: {other_user.role})")
            
            # Lógica ultra-robusta: No importa el rol, si son dos usuarios diferentes, pueden chatear
            # Intentamos buscar si ya existe la sala en cualquier combinación
            room = ChatRoom.objects.filter(
                (Q(estudiante=user) & Q(profesor=other_user)) | 
                (Q(estudiante=other_user) & Q(profesor=user))
            ).first()

            if not room:
                print("DEBUG CHAT - Creando nueva sala...")
                # Por consistencia, si uno es estudiante y otro profesor, los asignamos bien
                if user.role == 'student' or other_user.role == 'profesor':
                    room = ChatRoom.objects.create(estudiante=user, profesor=other_user)
                else:
                    room = ChatRoom.objects.create(estudiante=other_user, profesor=user)
                created = True
            else:
                print(f"DEBUG CHAT - Sala existente encontrada: ID {room.id}")
                created = False
            
            serializer = ChatRoomSerializer(room)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            print("DEBUG CHAT - Error: Usuario no encontrado")
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ ERROR CRÍTICO EN chat_rooms_view: {str(e)}")
            return Response({'error': f'Error interno: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        profesores = CustomUser.objects.filter(role='profesor', is_active=True).distinct().order_by('first_name')
        contacts = profesores
    elif user.role == 'profesor':
        # Profesores ven a todos los estudiantes activos para poder iniciar chat con cualquiera
        estudiantes = CustomUser.objects.filter(role='student', is_active=True).distinct().order_by('first_name')
        contacts = estudiantes

    from .serializers import UserSerializer
    data = []
    for contact in contacts:
        # Buscar si existe una sala entre el usuario actual y este contacto
        room = ChatRoom.objects.filter(
            (Q(estudiante=user) & Q(profesor=contact)) | 
            (Q(estudiante=contact) & Q(profesor=user))
        ).first()
        
        unread_count = 0
        if room:
            # Contar mensajes no leídos donde el remitente NO sea el usuario actual
            unread_count = ChatMessage.objects.filter(
                room=room,
                is_read=False
            ).exclude(sender=user).count()
            
        contact_data = UserSerializer(contact).data
        contact_data['unread_count'] = unread_count
        data.append(contact_data)

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_messages_count_view(request):
    """
    Retorna el número total de mensajes no leídos para el usuario actual.
    """
    user = request.user
    count = ChatMessage.objects.filter(
        room__in=ChatRoom.objects.filter(Q(estudiante=user) | Q(profesor=user)),
        is_read=False
    ).exclude(sender=user).count()
    return Response({'unread_count': count})

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def chat_messages_view(request, room_id):
    """
    GET: Carga el historial de mensajes de una sala específica y los marca como leídos.
    POST: Guarda un mensaje en la sala (usado como respaldo si falla el WebSocket).
    """
    try:
        room = ChatRoom.objects.get(id=room_id)
        
        # Verificar que el usuario pertenece a la sala
        if request.user != room.estudiante and request.user != room.profesor and not request.user.is_staff:
            return Response({'error': 'No tienes permiso para ver este chat'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            messages = room.messages.all().order_by('created_at')
            
            # Marcar como leídos los mensajes que no son del usuario actual
            unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
            if unread_messages.exists():
                unread_messages.update(is_read=True)
            
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({'error': 'Contenido vacío'}, status=status.HTTP_400_BAD_REQUEST)
                
            message = ChatMessage.objects.create(
                room=room,
                sender=request.user,
                content=content
            )
            # Actualizar la fecha de la sala para que aparezca arriba en la lista
            room.save() 
            
            serializer = ChatMessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Sala de chat no encontrada'}, status=status.HTTP_404_NOT_FOUND)
