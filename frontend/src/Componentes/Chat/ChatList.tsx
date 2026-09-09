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
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setError(null);
        console.log("📥 Actualizando lista de contactos...");
        const data = await chatService.getContacts();
        console.log("📊 Datos de contactos recibidos:", data);
        setContacts(data);
      } catch (error: any) {
        console.error("❌ Error cargando contactos:", error);
        setError(error.message || "Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };
    
    loadContacts();
    const interval = setInterval(loadContacts, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const handleStartChat = async (userId: number, userName: string) => {
    try {
      console.log(`🚀 Iniciando chat con ${userName} (ID: ${userId})...`);
      setSelectingId(userId);
      const room = await chatService.getOrCreateRoom(userId);
      console.log("✅ Sala obtenida/creada:", room);
      onSelectRoom(room.id, userName);
    } catch (error: any) {
      console.error("❌ Error iniciando chat:", error);
      const errorMsg = error.response?.data?.error || error.message || "Error desconocido";
      alert(`No se pudo iniciar el chat: ${errorMsg}. Por favor, intenta de nuevo.`);
    } finally {
      setSelectingId(null);
    }
  };

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name} ${c.username}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="chat-search-container">
        <div className="chat-search-wrapper">
          <FiSearch className="chat-search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            className="chat-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-2"></div>
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
              className={`contact-item ${selectingId === contact.id ? 'opacity-50 pointer-events-none bg-gray-100' : ''}`}
            >
              <div className="contact-avatar">
                {selectingId === contact.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                ) : (
                  contact.first_name?.charAt(0) || contact.username?.charAt(0)
                )}
              </div>
              <div className="contact-info">
                <p className="contact-name truncate text-slate-900">
                  {contact.first_name} {contact.last_name}
                </p>
                <p className="contact-role text-slate-600">
                  {contact.role === 'profesor' ? 'Profesor' : 'Estudiante'}
                </p>
              </div>
              
              {/* Indicador de Mensajes No Leídos (Estilo WhatsApp simplificado) */}
              {contact.unread_count > 0 && (
                <div className="flex flex-col items-end justify-center ml-2">
                  <div className="bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {contact.unread_count}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
