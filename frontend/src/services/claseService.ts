// Servicio para manejar clases (crear, listar, etc.)
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token'); // Usar la clave correcta del sistema
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ClaseService = {
  // Obtener todas las clases
  getClases: async () => {
    const res = await axios.get(`${API_URL}/clases/`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Crear una nueva clase
  createClase: async (claseData: any) => {
    const res = await axios.post(`${API_URL}/clases/`, claseData, { headers: getAuthHeaders() });
    return res.data;
  },

  // Editar una clase
  updateClase: async (id: number, claseData: any) => {
    const res = await axios.put(`${API_URL}/clases/${id}/`, claseData, { headers: getAuthHeaders() });
    return res.data;
  },

  // Eliminar una clase
  deleteClase: async (id: number) => {
    const res = await axios.delete(`${API_URL}/clases/${id}/`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Obtener clases por profesor
  getClasesPorProfesor: async (profesorId: number) => {
    const res = await axios.get(`${API_URL}/clases/?profesor=${profesorId}`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Obtener clases por usuario
  getClasesPorUsuario: async (usuarioId: number) => {
    const res = await axios.get(`${API_URL}/clases/?usuario=${usuarioId}`, { headers: getAuthHeaders() });
    return res.data;
  },

  // Cambiar estado de una clase
  cambiarEstadoClase: async (claseId: number, estado: string) => {
    const res = await axios.patch(`${API_URL}/clases/${claseId}/cambiar_estado/`, 
      { estado }, 
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Generar clases desde bloques asignados al profesor
  generarClasesDesdeBloque: async (profesorNombre: string) => {
    try {
      // Importar bloqueService dinámicamente para evitar dependencias circulares
      const { bloqueService } = await import('./bloqueService');
      const bloques = bloqueService.getBloques();
      
      // Encontrar bloques donde el profesor está asignado
      const bloquesDelProfesor = bloques.filter(bloque => 
        bloque.profesores.some(prof => prof.includes(profesorNombre))
      );
      
      const clasesGeneradas = [];
      let claseId = Date.now(); // ID único basado en timestamp
      
      for (const bloque of bloquesDelProfesor) {
        // Generar clases para cada clase del bloque
        for (let i = 0; i < bloque.clases.length; i++) {
          const clase = bloque.clases[i];
          const horario = bloque.horarios[i] || '08:00';
          const meetLink = (bloque.meetLinks && bloque.meetLinks[i]) || '';
          
          // Generar fechas para las próximas 2 semanas
          const fechasClases = [];
          const hoy = new Date();
          
          // Generar 6 clases (3 por semana durante 2 semanas)
          for (let semana = 0; semana < 2; semana++) {
            for (let dia = 0; dia < 3; dia++) {
              const fecha = new Date(hoy);
              fecha.setDate(hoy.getDate() + (semana * 7) + dia + 1);
              fechasClases.push(fecha.toISOString().split('T')[0]);
            }
          }
          
          // Crear clases para cada fecha
          fechasClases.forEach((fecha, index) => {
            clasesGeneradas.push({
              id: claseId++,
              nombre: `${clase} - ${bloque.nivel} ${bloque.turno}`,
              profesorId: 1, // ID por defecto
              fecha: fecha,
              hora: horario,
              duracion: 60,
              tema: clase,
              descripcion: `Clase de ${clase} para el bloque ${bloque.nivel} ${bloque.turno}`,
              estudiantes: [`Estudiante ${index + 1}`, `Estudiante ${index + 2}`],
              meetLink: meetLink,
              meet_link: meetLink,
              estado: 'programada',
              tipoClase: 'grupal'
            });
          });
        }
      }
      
      console.log(`Clases generadas para ${profesorNombre}:`, clasesGeneradas.length);
      console.log('Bloques encontrados:', bloquesDelProfesor.map(b => `${b.nivel} ${b.turno}`));
      return clasesGeneradas;
    } catch (error) {
      console.error('Error generando clases desde bloques:', error);
      return [];
    }
  }
};
