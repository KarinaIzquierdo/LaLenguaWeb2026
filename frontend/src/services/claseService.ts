// Servicio para manejar clases (crear, listar, etc.)
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token'); // Usar la clave correcta del sistema
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ClaseService = {
  // Obtener todas las clases
  getClases: async () => {
    const res = await axios.get(`${API_URL}/clases/`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Crear una nueva clase
  createClase: async (claseData: any) => {
    const res = await axios.post(`${API_URL}/clases/`, claseData, { headers: getAuthHeaders() });
    return res.data;
  },

  // Editar una clase
  updateClase: async (id: number, claseData: any) => {
    const res = await axios.put(`${API_URL}/clases/${id}/`, claseData, { headers: getAuthHeaders() });
    return res.data;
  },

  // Eliminar una clase
  deleteClase: async (id: number) => {
    const res = await axios.delete(`${API_URL}/clases/${id}/`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Obtener clases por profesor
  getClasesPorProfesor: async (profesorId: number) => {
    const res = await axios.get(`${API_URL}/clases/?profesor=${profesorId}`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Obtener clases por usuario
  getClasesPorUsuario: async (usuarioId: number) => {
    const res = await axios.get(`${API_URL}/clases/?usuario=${usuarioId}`, { headers: getAuthHeaders() });
    return res.data;
  },
};
