// Servicio para registrar usuarios desde el frontend
const API_BASE_URL = 'http://localhost:8000/api';

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  password: string;
  bloque_asignado?: string;
  especializacion?: number | null;
}

export interface RegisterResponse {
  success: boolean;
  user?: any;
  message?: string;
  errors?: any;
}

export const userService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // Ajustar el email según el rol
      let email = data.email.split('@')[0];
      if (data.role === 'student') {
        email = email + '@thelanguage.co';
      } else if (data.role === 'profesor') {
        email = email + '@soy.thelanguage.co';
      }
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, email }),
      });
      const result = await response.json();
      
      // Si el registro fue exitoso y hay un bloque asignado, guardarlo en localStorage
      if (result.success && data.bloque_asignado && result.user) {
        const { bloqueService } = await import('./bloqueService');
        bloqueService.assignBloqueToUser(result.user.id.toString(), data.bloque_asignado);
        console.log(`Bloque ${data.bloque_asignado} asignado al usuario ${result.user.id}`);
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async getAll(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      // Mapear campos del backend a los nombres esperados por el frontend
      return data.map((user: any) => ({
        id: user.id,
        nombres: user.first_name,
        apellidos: user.last_name,
        correo: user.email,
        rol: user.role,
        activo: user.is_active,
        bloque_asignado: user.bloque_asignado,
      }));
    } catch (error) {
      return [];
    }
  },

  async toggleActive(userId: number): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-active/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async deleteUser(userId: number): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  },

  async getCurrentUser(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to fetch user profile' };
      }

      const userData = await response.json();
      return {
        success: true,
        user: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role: userData.role,
          full_name: `${userData.first_name} ${userData.last_name}`.trim(),
          initials: `${userData.first_name?.charAt(0) || ''}${userData.last_name?.charAt(0) || ''}`.toUpperCase()
        }
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },
};
