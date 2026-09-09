import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../services/chatService';
import { chatService } from '../../services/chatService';
import { FiSend, FiUser, FiX } from 'react-icons/fi';
import './Chat.css';

interface ChatWindowProps {
  roomId: number;
  onClose: () => void;
  otherUserName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, onClose, otherUserName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Obtener usuario del localStorage usando la clave correcta 'user'
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id || user?.user_id; // Soportar ambas variantes de ID
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 1. Cargar historial
    const loadHistory = async () => {
      try {
        const history = await chatService.getMessages(roomId);
        setMessages(history);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error cargando historial de chat:", error);
      }
    };

    loadHistory();

    // 2. Conectar WebSocket
    const wsUrl = chatService.getWebSocketUrl(roomId);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Conectado al chat");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📥 Mensaje recibido:", data);
      
      const newMsg: ChatMessage = {
        id: Date.now(),
        room: roomId,
        sender: data.sender_id,
        sender_name: "",
        content: data.message || data.content,
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);
    };

    socket.onclose = () => {
      console.log("Chat desconectado");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent) return;

    const messageData = {
      message: messageContent,
      sender_id: userId,
      content: messageContent, // Para el fallback de API
      room: roomId
    };

    try {
      if (socketRef.current && isConnected) {
        console.log("📤 Enviando vía WebSocket...");
        socketRef.current.send(JSON.stringify(messageData));
        setNewMessage('');
      } else {
        console.log("⚠️ WebSocket no conectado, usando respaldo API...");
        // Fallback: Enviar por API normal si el socket falla
        const response = await chatService.sendMessage(roomId, messageContent);
        setMessages((prev) => [...prev, response]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      alert("No se pudo enviar el mensaje. Reintenta en un momento.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages area */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-gray-500">
            <FiSend size={40} className="mb-2" />
            <p className="text-sm">Escribe un mensaje para iniciar la conversación</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const senderId = typeof msg.sender === 'object' ? (msg.sender as any).id : msg.sender;
            const isMe = Number(senderId) === Number(userId);
            return (
              <div 
                key={index} 
                className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
                style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  marginLeft: isMe ? 'auto' : '0',
                  marginRight: isMe ? '0' : 'auto'
                }}
              >
                <p>{msg.content}</p>
                <div className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-footer">
        <form onSubmit={handleSendMessage} className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()} // Ahora solo depende de si hay texto
            className={`send-btn ${!newMessage.trim() ? 'opacity-30' : 'opacity-100 hover:scale-110'}`}
          >
            <FiSend size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
