import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { FiMessageCircle, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { chatService } from '../../services/chatService';
import './Chat.css';

const ChatContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{id: number, name: string} | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Polling optimizado para mensajes no leídos (reduce sobrecarga de peticiones al servidor)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      // Si la pestaña está en segundo plano o el usuario no está autenticado, no consumir peticiones
      if (document.hidden || !localStorage.getItem('token')) return;
      try {
        const count = await chatService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Error al obtener mensajes no leídos:", error);
      }
    };

    fetchUnreadCount();
    // Consulta cada 25 segundos en lugar de 5s (reduce el tráfico en un 80%)
    const interval = setInterval(fetchUnreadCount, 25000);

    // Al regresar a la pestaña activa, actualizar inmediatamente
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, selectedRoom]); // Recargar si se abre o se cambia de sala

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
      return;
    }
    setIsOpen(!isOpen);
    if (selectedRoom) setSelectedRoom(null);
  };

  const handleSelectRoom = (roomId: number, otherUserName: string) => {
    setSelectedRoom({ id: roomId, name: otherUserName });
    // Al seleccionar sala, asumimos que se leerán los mensajes, pero el backend lo confirma
    setUnreadCount(prev => Math.max(0, prev - 1)); 
  };

  const handleCloseChat = () => {
    setSelectedRoom(null);
  };

  return (
    <>
      {/* Botón Flotante Principal */}
      <button 
        onClick={toggleChat}
        className="chat-float bg-pink-500 text-white shadow-2xl hover:bg-pink-600 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white relative"
        title="Mensajes"
      >
        {isOpen && !isMinimized ? <FiX size={28} /> : <FiMessageCircle size={28} />}
        
        {/* Badge de Notificación */}
        {unreadCount > 0 && !isOpen && (
          <div className="chat-notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Widget de Chat Flotante */}
      {isOpen && !isMinimized && (
        <div className="chat-widget-container">
          <div className="chat-header">
            <div className="chat-header-info">
              {selectedRoom ? (
                <>
                  <div className="chat-header-avatar">
                    {selectedRoom.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="chat-header-title">{selectedRoom.name}</span>
                </>
              ) : (
                <>
                  <FiMessageCircle size={20} />
                  <span className="chat-header-title">Mis Mensajes</span>
                </>
              )}
            </div>
            
            <div className="chat-header-actions">
              <button 
                className="chat-header-btn" 
                onClick={() => setIsMinimized(true)}
                title="Minimizar"
              >
                <FiMinimize2 size={18} />
              </button>
              <button 
                className="chat-header-btn" 
                onClick={() => setIsOpen(false)}
                title="Cerrar"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="chat-body">
            {!selectedRoom ? (
              <ChatList onSelectRoom={handleSelectRoom} />
            ) : (
              <ChatWindow 
                roomId={selectedRoom.id} 
                otherUserName={selectedRoom.name} 
                onClose={handleCloseChat} 
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatContainer;
