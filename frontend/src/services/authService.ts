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

const API_BASE_URL = 'http://127.0.0.1:8000';

export const authService = {
  // Login del usuario
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('token', data.token);
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

  // Solicitar restablecimiento de contraseña (backend opcional)
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; reset_link?: string; token?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Se han enviado instrucciones a tu correo.',
          reset_link: data.reset_link,
          token: data.token,
        };
      }
      return { success: false, message: data.message || 'No se pudo iniciar el restablecimiento.' };
    } catch (error) {
      console.error('requestPasswordReset error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Confirmar restablecimiento (token + nueva contraseña)
  async resetPassword(token: string, new_password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'Contraseña actualizada correctamente.' };
      }
      return { success: false, message: data.message || 'No se pudo actualizar la contraseña.' };
    } catch (error) {
      console.error('resetPassword error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Logout del usuario
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
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

  // Cambiar contraseña (usuario autenticado)
  async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No estás autenticado' };
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token/`, {
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

  // Perfil del usuario autenticado
  async getUserProfile(): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    const data = await response.json();
    const profile = data.user || data;
    
    // Si el usuario tiene bloque_asignado pero no está en localStorage, sincronizar
    if (profile.bloque_asignado && profile.id) {
      const { bloqueService } = await import('./bloqueService');
      const userBloqueInfo = bloqueService.getUserBloqueInfo(profile.id.toString());
      
      // Si no hay bloque asignado en localStorage, asignarlo
      if (!userBloqueInfo.bloque) {
        console.log(`Sincronizando bloque ${profile.bloque_asignado} para usuario ${profile.id}`);
        bloqueService.assignBloqueToUser(profile.id.toString(), profile.bloque_asignado);
      }
    }
    
    return profile;
  },

  // Actualizar información adicional del usuario
  updateUserProfile: async (profileData: any): Promise<{ success: boolean; message: string }> => {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No estás autenticado' };
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile/`, {
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
