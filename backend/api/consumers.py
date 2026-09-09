import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage, CustomUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Unirse al grupo de la sala
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo de la sala
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibir mensaje desde el WebSocket del frontend
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        sender_id = data.get('sender_id')

        # Guardar el mensaje en la base de datos
        if message and sender_id:
            await self.save_message(sender_id, message)

            # Enviar mensaje al grupo de la sala (a todos los conectados)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': sender_id
                }
            )

    # Recibir mensaje del grupo de la sala
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']

        # Enviar mensaje al WebSocket del usuario
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))

    @database_sync_to_async
    def save_message(self, sender_id, message):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            sender = CustomUser.objects.get(id=sender_id)
            return ChatMessage.objects.create(room=room, sender=sender, content=message)
        except Exception as e:
            print(f"Error guardando mensaje: {e}")
            return None
