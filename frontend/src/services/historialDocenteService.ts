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
  async getHistorial(
    profesorId?: number,
    fechaDesde?: string,
    fechaHasta?: string,
    materia?: string
  ): Promise<{
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
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    if (materia) params.append('materia', materia);

    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_BASE_URL}/historial-docente/${query}`;

    const response = await fetch(url, {
      cache: 'no-store',
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
