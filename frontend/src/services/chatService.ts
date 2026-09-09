import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lalenguacolombia.co/api';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws').replace('/api', '');

export interface ChatMessage {
  id: number;
  room: number;
  sender: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  estudiante: number;
  estudiante_name: string;
  profesor: number;
  profesor_name: string;
  last_message: ChatMessage | null;
  updated_at: string;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const chatService = {
  // Obtener lista de chats del usuario
  getRooms: async (): Promise<ChatRoom[]> => {
    const response = await axios.get(`${API_BASE_URL}/chat/rooms/`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Crear o recuperar una sala con un usuario específico
  getOrCreateRoom: async (userId: number): Promise<ChatRoom> => {
    const response = await axios.post(`${API_BASE_URL}/chat/rooms/`, { user_id: userId }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Obtener lista de contactos disponibles (profesores o estudiantes)
  getContacts: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/chat/contacts/`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Obtener historial de mensajes de una sala
  getMessages: async (roomId: number): Promise<ChatMessage[]> => {
    const response = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages/`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Obtener la URL del WebSocket para una sala
  getWebSocketUrl: (roomId: number): string => {
    const token = localStorage.getItem('token');
    // En Django Channels, el token se puede pasar como parámetro de consulta
    return `${WS_BASE_URL}/ws/chat/${roomId}/?token=${token}`;
  }
};
