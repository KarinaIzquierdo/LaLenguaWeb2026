import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AsistenciaData {
  estudiante_id: number;
  clase_id?: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado' | 'pendiente';
}

export interface AprobarAsistenciaData {
  estudiante_id: number;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
}

export const asistenciaService = {
  // Registrar asistencia de un estudiante
  registrarAsistencia: async (data: AsistenciaData) => {
    try {
      const response = await axios.post(
        `${API_URL}/asistencias/`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      throw error;
    }
  },

  // Registrar asistencia por código (estudiante)
  registrarAsistenciaPorCodigo: async (codigo: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/clases/registrar-asistencia/`,
        { codigo },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando asistencia por código:', error);
      throw error;
    }
  },

  // Obtener asistencias de un estudiante
  getAsistenciasPorEstudiante: async (estudianteId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencias/?estudiante=${estudianteId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      throw error;
    }
  },

  // Obtener asistencias de una clase (usa endpoint seguro del profesor)
  getAsistenciasPorClase: async (claseId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/clases/${claseId}/asistencias/`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asistencias de clase:', error);
      throw error;
    }
  },

  // Obtener asistencias por fecha
  getAsistenciasPorFecha: async (fecha: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencias/?fecha=${fecha}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asistencias por fecha:', error);
      throw error;
    }
  },

  // Obtener estadísticas de asistencia de un estudiante
  getEstadisticasAsistencia: async (estudianteId: number) => {
    try {
      const asistencias = await asistenciaService.getAsistenciasPorEstudiante(estudianteId);
      
      const total = asistencias.length;
      const presentes = asistencias.filter((a: any) => a.estado === 'presente').length;
      const ausentes = asistencias.filter((a: any) => a.estado === 'ausente').length;
      const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

      return {
        total,
        presentes,
        ausentes,
        porcentaje
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return {
        total: 0,
        presentes: 0,
        ausentes: 0,
        porcentaje: 0
      };
    }
  },

  // Aprobar/rechazar asistencia de un estudiante en una clase (profesor)
  aprobarAsistenciaClase: async (claseId: number, data: AprobarAsistenciaData) => {
    try {
      const response = await axios.patch(
        `${API_URL}/clases/${claseId}/aprobar-asistencia/`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error aprobando asistencia:', error);
      throw error;
    }
  },

  // Guardar asistencias de una clase de forma masiva (profesor/admin)
  guardarAsistenciaClase: async (claseId: number, asistencias: AprobarAsistenciaData[]) => {
    try {
      const response = await axios.post(
        `${API_URL}/clases/${claseId}/guardar-asistencia/`,
        { asistencias },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error guardando asistencias:', error);
      throw error;
    }
  }
};
