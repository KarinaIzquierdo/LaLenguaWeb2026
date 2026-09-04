// Configuración de API para diferentes entornos
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 
           import.meta.env.VITE_API_BASE_URL || 
           (isDevelopment ? 'http://127.0.0.1:8000/api' : 'http://179.199.144.149:8000/api'),
  
  // Timeout para requests
  TIMEOUT: 10000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Función para obtener headers de autenticación
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// URL base para uso en servicios
export const API_BASE_URL = API_CONFIG.BASE_URL;

console.log('🌍 Entorno:', import.meta.env.MODE);
console.log('🔗 API URL:', API_BASE_URL);
