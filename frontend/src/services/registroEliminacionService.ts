import { API_BASE_URL } from '../config/api';

export interface RegistroEliminacion {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  phone: string;
  cedula: string;
  nivel: string;
  bloque_asignado: string;
  especializacion: string;
  fecha_registro: string;
  fecha_eliminacion: string;
  dias_registrado: number;
  tiempo_registrado_str: string;
  razon: string;
  razon_display: string;
  descripcion_adicional: string;
  plan_activo: string;
  deuda_pendiente: string;
  eliminado_por: {
    id: number;
    username: string;
    nombre: string;
  };
  notas: string;
}

export interface EstadisticasEliminacion {
  total_eliminaciones: number;
  por_razon: Record<string, { count: number; display: string }>;
  promedio_dias_registrado: number;
  total_deuda_pendiente: number;
}

const getToken = () => localStorage.getItem('token') || '';

export const registroEliminacionService = {
  async getRegistros(razon?: string, search?: string): Promise<{
    success: boolean;
    registros: RegistroEliminacion[];
    total: number;
    message?: string;
  }> {
    const params = new URLSearchParams();
    if (razon) params.append('razon', razon);
    if (search) params.append('search', search);

    const url = `${API_BASE_URL}/registros-eliminacion/${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  },

  async getEstadisticas(): Promise<{
    success: boolean;
    estadisticas: EstadisticasEliminacion;
    message?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/registros-eliminacion/estadisticas/`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  },
};

export default registroEliminacionService;
