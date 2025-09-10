const API_BASE_URL = 'http://localhost:8000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const evaluacionService = {
  // Listar todas las evaluaciones del profesor
  async getEvaluaciones() {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/`);
  },

  // Crear nueva evaluación
  async createEvaluacion(evaluacionData) {
    const formData = new FormData();
    
    // Agregar campos básicos
    formData.append('titulo', evaluacionData.titulo);
    formData.append('descripcion', evaluacionData.descripcion);
    formData.append('tipo', evaluacionData.tipo);
    formData.append('estado', evaluacionData.estado || 'draft');
    
    // Agregar archivo si existe
    if (evaluacionData.archivo) {
      formData.append('archivo', evaluacionData.archivo);
    }
    
    // Agregar fecha límite si existe
    if (evaluacionData.fecha_limite) {
      formData.append('fecha_limite', evaluacionData.fecha_limite);
    }
    
    // Agregar estudiantes asignados
    if (evaluacionData.estudiantes_asignados && evaluacionData.estudiantes_asignados.length > 0) {
      evaluacionData.estudiantes_asignados.forEach(studentId => {
        formData.append('estudiantes_asignados', studentId);
      });
    }
    
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/create/`, {
      method: 'POST',
      body: formData,
    });
  },

  // Actualizar evaluación existente
  async updateEvaluacion(id, evaluacionData) {
    const formData = new FormData();
    
    // Agregar campos básicos
    if (evaluacionData.titulo) formData.append('titulo', evaluacionData.titulo);
    if (evaluacionData.descripcion) formData.append('descripcion', evaluacionData.descripcion);
    if (evaluacionData.tipo) formData.append('tipo', evaluacionData.tipo);
    if (evaluacionData.estado) formData.append('estado', evaluacionData.estado);
    
    // Agregar archivo si existe
    if (evaluacionData.archivo) {
      formData.append('archivo', evaluacionData.archivo);
    }
    
    // Agregar fecha límite si existe
    if (evaluacionData.fecha_limite) {
      formData.append('fecha_limite', evaluacionData.fecha_limite);
    }
    
    // Agregar estudiantes asignados
    if (evaluacionData.estudiantes_asignados && evaluacionData.estudiantes_asignados.length > 0) {
      evaluacionData.estudiantes_asignados.forEach(studentId => {
        formData.append('estudiantes_asignados', studentId);
      });
    }
    
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/update/`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Eliminar evaluación
  async deleteEvaluacion(id) {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/delete/`, {
      method: 'DELETE',
    });
  },

  // Publicar evaluación
  async publishEvaluacion(id) {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/${id}/publish/`, {
      method: 'POST',
    });
  },

  // Obtener lista de estudiantes para asignar
  async getStudents() {
    return makeAuthenticatedRequest(`${API_BASE_URL}/evaluaciones/students/`);
  },

  // Obtener evaluaciones asignadas al estudiante (para dashboard de estudiante)
  async getStudentEvaluaciones() {
    return makeAuthenticatedRequest(`${API_BASE_URL}/student/evaluaciones/`);
  },
};

export default evaluacionService;
