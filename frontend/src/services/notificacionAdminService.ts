import { API_BASE_URL } from '../config/api';

export interface NotificacionAdmin {
  id: number;
  tipo: 'nuevo_estudiante' | 'estudiante_eliminado' | 'nueva_venta' | 'venta_pendiente' |
        'plan_por_vencer' | 'plan_vencido' | 'nueva_clase' | 'evaluacion_enviada' |
        'evaluacion_pendiente' | 'sistema';
  titulo: string;
  mensaje: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  leida: boolean;
  admin_nombre: string;
  datos_adicionales?: Record<string, any>;
  tiempo_transcurrido: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionesAdminResponse {
  success: boolean;
  notificaciones: NotificacionAdmin[];
  total: number;
  no_leidas: number;
  message?: string;
}

class NotificacionAdminService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async obtenerNotificaciones(): Promise<NotificacionesAdminResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/admin/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener notificaciones de admin:', error);
      throw error;
    }
  }

  async marcarComoLeida(notificacionId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/admin/${notificacionId}/marcar-leida/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al marcar notificación de admin como leída:', error);
      throw error;
    }
  }

  async marcarTodasComoLeidas(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/notificaciones/admin/marcar-todas-leidas/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones de admin como leídas:', error);
      throw error;
    }
  }

  getIconoTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      'nuevo_estudiante': '👤',
      'estudiante_eliminado': '🗑️',
      'nueva_venta': '💰',
      'venta_pendiente': '⏳',
      'plan_por_vencer': '⏰',
      'plan_vencido': '🔴',
      'nueva_clase': '📚',
      'evaluacion_enviada': '📤',
      'evaluacion_pendiente': '📝',
      'sistema': '⚙️'
    };
    return iconos[tipo] || '📢';
  }

  getColorPrioridad(prioridad: string): string {
    const colores: Record<string, string> = {
      'baja': '#10b981',
      'media': '#f59e0b',
      'alta': '#f97316',
      'urgente': '#ef4444'
    };
    return colores[prioridad] || '#6b7280';
  }

  formatearMensaje(notificacion: NotificacionAdmin): string {
    return notificacion.mensaje.length > 120
      ? notificacion.mensaje.substring(0, 120) + '...'
      : notificacion.mensaje;
  }
}

export const notificacionAdminService = new NotificacionAdminService();
