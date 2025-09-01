interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: 'student' | 'profesor' | 'admin';
  };
  message?: string;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const authService = {
  // Login del usuario
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token en localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return { success: true, ...data };
      } else {
        return { success: false, message: data.message || 'Error de autenticación' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Logout del usuario
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Obtener token de autenticación
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Obtener datos del usuario
  getUser(): any | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  // Cambiar contraseña
  async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No estás autenticado' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Contraseña cambiada exitosamente' };
      } else {
        return { success: false, message: data.message || 'Error al cambiar contraseña' };
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Verificar token con el servidor
  verifyToken: async (): Promise<boolean> => {
    const token = authService.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        authService.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      authService.logout();
      return false;
    }
  },

  getUserProfile: async (): Promise<any> => {
    const token = authService.getToken();
    if (!token) throw new Error('No token available');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      // El backend devuelve { success: true, user: {...} }
      return data.user || data;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  },

  // Actualizar información adicional del usuario
  updateUserProfile: async (profileData: any): Promise<{ success: boolean; message: string }> => {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No estás autenticado' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Perfil actualizado exitosamente' };
      } else {
        return { success: false, message: data.message || 'Error al actualizar perfil' };
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }
};
