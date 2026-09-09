import { API_BASE_URL } from '../config/api';

export interface HistorialDocente {
  id: number;
  profesor: {
    id: number;
    username: string;
    nombre: string;
  };
  fecha: string;
  tipo_evento: string;
  tipo_evento_display: string;
  titulo: string;
  descripcion: string;
  archivo_adjunto: string | null;
  registrado_por: {
    id: number;
    username: string;
    nombre: string;
  } | null;
  created_at: string;
  updated_at: string;
}

const getToken = () => localStorage.getItem('token') || '';

export const historialDocenteService = {
  async getHistorial(profesorId?: number, tipoEvento?: string): Promise<{
    success: boolean;
    historial: HistorialDocente[];
    clases_dictadas?: any[];
    estadisticas?: {
      total_clases: number;
      total_horas: number;
    };
    message?: string;
  }> {
    const params = new URLSearchParams();
    if (profesorId) params.append('profesor', profesorId.toString());
    if (tipoEvento) params.append('tipo_evento', tipoEvento);

    const url = `${API_BASE_URL}/historial-docente/${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  },

  async createHistorial(data: any): Promise<{
    success: boolean;
    historial?: HistorialDocente;
    message?: string;
    errors?: any;
  }> {
    const response = await fetch(`${API_BASE_URL}/historial-docente/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  }
};

export default historialDocenteService;
