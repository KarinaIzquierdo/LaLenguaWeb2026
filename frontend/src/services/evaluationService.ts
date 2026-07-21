// Servicio para obtener evaluaciones reales del backend
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Usar directamente la URL base configurada
// En producción ya incluye /index.php, en desarrollo apunta al backend que corresponda
const API_URL = API_BASE_URL;

export interface EvaluationResultPayload {
  evaluation_type: string;
  score: number;
  total_questions: number;
  correct_answers: number;
}

export const EvaluationService = {
  async getEvaluationsForUser(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/evaluaciones/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async submitEvaluationResult(data: EvaluationResultPayload): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/student/evaluacion/result/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error enviando resultado de evaluación:', error);
      throw error;
    }
  }
};
