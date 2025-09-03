// Servicio para obtener evaluaciones reales del backend
import axios from 'axios';

// Cambiado para compatibilidad con Vite
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : 'http://localhost:8000/api';

export const EvaluationService = {
  async getEvaluationsForUser(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/evaluations/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }
};
