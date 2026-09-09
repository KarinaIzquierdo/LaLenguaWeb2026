import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { FiMessageCircle, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import './Chat.css';

const ChatContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{id: number, name: string} | null>(null);

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
  };

  const handleCloseChat = () => {
    setSelectedRoom(null);
  };

  return (
    <>
      {/* Botón Flotante Principal */}
      <button 
        onClick={toggleChat}
        className="chat-float bg-purple-600 text-white shadow-2xl hover:bg-purple-700 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
        title="Mensajes"
      >
        {isOpen && !isMinimized ? <FiX size={28} /> : <FiMessageCircle size={28} />}
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
