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
    <div className="chat-window shadow-lg border rounded-lg flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="chat-header p-3 bg-purple-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-purple-400 p-1.5 rounded-full">
            <FiUser size={18} />
          </div>
          <span className="font-medium text-sm">{otherUserName}</span>
          {isConnected ? (
            <span className="w-2 h-2 bg-green-400 rounded-full" title="Conectado"></span>
          ) : (
            <span className="w-2 h-2 bg-red-400 rounded-full" title="Desconectado"></span>
          )}
        </div>
        <button onClick={onClose} className="hover:bg-purple-700 p-1 rounded">
          <FiX size={20} />
        </button>
      </div>

      {/* Messages area */}
      <div className="chat-messages flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        {messages.map((msg, index) => {
          const isMe = msg.sender === user?.id;
          return (
            <div 
              key={index} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                isMe 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : 'bg-white border text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <span className={`text-[10px] mt-1 block ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || !isConnected}
          className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
