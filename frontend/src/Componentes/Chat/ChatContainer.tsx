import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { FiMessageCircle, FiX } from 'react-icons/fi';
import './Chat.css';

const ChatContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{id: number, name: string} | null>(null);

  const toggleChat = () => {
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
        className="chat-float bg-purple-600 text-white p-4 shadow-2xl hover:bg-purple-700 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
        title="Mensajes"
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>

      {/* Vistas de Chat */}
      {isOpen && !selectedRoom && (
        <ChatList onSelectRoom={handleSelectRoom} />
      )}

      {isOpen && selectedRoom && (
        <ChatWindow 
          roomId={selectedRoom.id} 
          otherUserName={selectedRoom.name} 
          onClose={handleCloseChat} 
        />
      )}
    </>
  );
};

export default ChatContainer;
