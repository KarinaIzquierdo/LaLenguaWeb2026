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

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await chatService.getContacts();
        setContacts(data);
      } catch (error) {
        console.error("Error cargando contactos:", error);
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
    <div className="chat-list-container bg-white border rounded-lg shadow-xl overflow-hidden flex flex-col w-[300px] h-[400px] fixed bottom-20 right-20 z-[1000]">
      <div className="p-4 bg-purple-600 text-white flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <FiMessageSquare /> Mis Mensajes
        </h3>
      </div>
      
      <div className="p-2 border-b">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Cargando...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No se encontraron contactos</div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => handleStartChat(contact.id, `${contact.first_name} ${contact.last_name}`)}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <FiUser size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm text-gray-800 truncate">
                  {contact.first_name} {contact.last_name}
                </p>
                <p className="text-[10px] text-gray-500 truncate capitalize">
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
