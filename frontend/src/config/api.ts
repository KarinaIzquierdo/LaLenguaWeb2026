// Configuración de API para diferentes entornos
const isDevelopment = import.meta.env.MODE === 'development';

// Detectar la URL del servidor actual dinámicamente
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  
  if (isDevelopment) return 'http://127.0.0.1:8000/api';
  
  // En producción
  const { protocol, hostname } = window.location;
  
  console.log('🌐 DOMINIO ACTUAL:', hostname);
  console.log('🔒 PROTOCOLO:', protocol);

  // 1. Si estamos en el dominio de producción, usar la ruta oficial
  if (hostname.includes('lalenguacolombia.co')) {
    const apiUrl = `https://api.lalenguacolombia.co/api`;
    console.log('🚀 CONFIGURANDO API PRODUCCIÓN:', apiUrl);
    return apiUrl;
  }

  // 2. Plan B: Si estamos por IP o local
  const fallbackUrl = `${protocol}//${hostname}:8000/api`;
  console.log('⚠️ USANDO API FALLBACK:', fallbackUrl);
  return fallbackUrl;
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
