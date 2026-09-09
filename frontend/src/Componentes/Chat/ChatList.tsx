import React, { useState, useEffect } from 'react';
import type { ChatRoom } from '../../services/chatService';
import { chatService } from '../../services/chatService';
import { FiMessageSquare, FiUser, FiSearch } from 'react-icons/fi';

interface ChatListProps {
  onSelectRoom: (roomId: number, otherUserName: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectRoom }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await chatService.getContacts();
        setContacts(data);
      } catch (error: any) {
        console.error("Error cargando contactos:", error);
        setError(error.message || "Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  const handleStartChat = async (userId: number, userName: string) => {
    try {
      const room = await chatService.getOrCreateRoom(userId);
      onSelectRoom(room.id, userName);
    } catch (error) {
      console.error("Error iniciando chat:", error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name} ${c.username}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-white">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
            <p className="text-sm">Cargando contactos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="text-sm font-medium">Hubo un problema</p>
            <p className="text-xs opacity-70">{error}</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiUser size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No se encontraron contactos</p>
            <p className="text-xs opacity-60">Intenta con otro nombre</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => handleStartChat(contact.id, `${contact.first_name} ${contact.last_name}`)}
              className="contact-item"
            >
              <div className="contact-avatar">
                {contact.first_name?.charAt(0) || contact.username?.charAt(0)}
              </div>
              <div className="contact-info">
                <p className="contact-name truncate">
                  {contact.first_name} {contact.last_name}
                </p>
                <p className="contact-role">
                  {contact.role === 'profesor' ? 'Profesor' : 'Estudiante'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
