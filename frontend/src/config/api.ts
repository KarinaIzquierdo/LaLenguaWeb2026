// Configuración de API para diferentes entornos
const isDevelopment = import.meta.env.MODE === 'development';

// Detectar la URL del servidor actual dinámicamente
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  
  if (isDevelopment) return 'http://127.0.0.1:8000/api';
  
  // En producción, si no hay variable de entorno, usar el mismo host del navegador
  const { protocol, hostname } = window.location;
  
  // Si estamos accediendo por IP, el backend suele estar en el puerto 8000
  if (hostname.match(/\d+\.\d+\.\d+\.\d+/)) {
    return `${protocol}//${hostname}:8000/api`;
  }
  
  return 'https://api.lalenguacolombia.co/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  
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
