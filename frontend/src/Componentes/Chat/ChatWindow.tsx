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
  
  // Obtener usuario del localStorage ya que no hay AuthContext global
  const user = JSON.parse(localStorage.getItem('userData') || '{}');
  
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
      // Añadir el nuevo mensaje a la lista (si no es nuestro, ya que el backend lo retransmite)
      // O simplemente actualizar la lista
      setMessages((prev) => [...prev, {
        id: Date.now(), // ID temporal
        room: roomId,
        sender: data.sender_id,
        sender_name: "", // Se podría obtener del contexto
        content: data.message,
        is_read: false,
        created_at: new Date().toISOString()
      }]);
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !isConnected) return;

    const messageData = {
      message: newMessage,
      sender_id: user?.id
    };

    socketRef.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages area */}
      <div className="messages-list">
        {messages.map((msg, index) => {
          const isMe = msg.sender === user?.id;
          return (
            <div 
              key={index} 
              className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
            >
              <p>{msg.content}</p>
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
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
            disabled={!newMessage.trim() || !isConnected}
            className="send-btn"
          >
            <FiSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
