import { useState, useEffect } from 'react';
import './ReportesProgreso.css';
import DetalleEstudianteModal from './DetalleEstudianteModal';
import { evaluacionService } from '../../services/evaluacionService';
import { userService } from '../../services/userService';
import { ClaseService } from '../../services/claseService';

interface EstudianteProgreso {
  id: number;
  nombre: string;
  nivel: string;
  progreso: number;
  clasesCompletadas: number;
  clasesTotales: number;
  ultimaClase: string;
  fortalezas: string[];
  areasAMejorar: string[];
  calificacionPromedio: number;
}

interface EstadisticasGenerales {
  total_estudiantes: number;
  progreso_promedio: number;
  calificacion_promedio: number;
}

export default function ReportesProgreso() {
  const [estudiantes, setEstudiantes] = useState<EstudianteProgreso[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [ordenPor, setOrdenPor] = useState<'nombre' | 'progreso' | 'calificacion'>('progreso');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [estudianteModal, setEstudianteModal] = useState<EstudianteProgreso | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportesProgreso();
  }, []);

  const loadReportesProgreso = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener el usuario actual (profesor) desde localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('No se pudo obtener el usuario actual');
        setLoading(false);
        return;
      }
      const currentUser = JSON.parse(userStr);
      if (!currentUser || !currentUser.id) {
        setError('Usuario inválido');
        setLoading(false);
        return;
      }
      
      // Obtener las clases del profesor
      const clasesDelProfesor = await ClaseService.getClasesPorProfesor(currentUser.id);
      
      // Obtener IDs únicos de estudiantes de todas las clases
      const estudiantesIds = new Set<number>();
      clasesDelProfesor.forEach((clase: any) => {
        if (clase.estudiantes && Array.isArray(clase.estudiantes)) {
          clase.estudiantes.forEach((estudianteId: number) => {
            estudiantesIds.add(estudianteId);
          });
        }
      });
      
      // Si no hay estudiantes, mostrar lista vacía
      if (estudiantesIds.size === 0) {
        setEstudiantes([]);
        const stats: EstadisticasGenerales = {
          total_estudiantes: 0,
          progreso_promedio: 0,
          calificacion_promedio: 0
        };
        setEstadisticas(stats);
        setLoading(false);
        return;
      }
      
      // Cargar todos los usuarios
      const usuarios = await userService.getAll();
      
      // Filtrar solo los estudiantes que están en las clases del profesor
      const estudiantesData: EstudianteProgreso[] = usuarios
        .filter(u => u.rol === 'student' && estudiantesIds.has(u.id))
        .map(u => ({
          id: u.id,
          nombre: `${u.nombres} ${u.apellidos}`,
          nivel: u.nivel || 'Sin nivel',
          progreso: 0, // TODO: Calcular progreso real
          clasesCompletadas: 0, // TODO: Calcular desde asistencias
          clasesTotales: 10, // TODO: Obtener total de clases
          ultimaClase: new Date().toISOString(),
          fortalezas: [],
          areasAMejorar: [],
          calificacionPromedio: 0 // TODO: Calcular desde evaluaciones
        }));
      
      setEstudiantes(estudiantesData);
      
      // Calcular estadísticas
      const stats: EstadisticasGenerales = {
        total_estudiantes: estudiantesData.length,
        progreso_promedio: 0,
        calificacion_promedio: 0
      };
      setEstadisticas(stats);
      
    } catch (err) {
      setError('Error al cargar reportes de progreso');
      console.error('Error loading reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  const estudiantesFiltrados = estudiantes
    .filter(estudiante => filtroNivel === 'todos' || estudiante.nivel === filtroNivel)
    .sort((a, b) => {
      switch (ordenPor) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'progreso':
          return b.progreso - a.progreso;
        case 'calificacion':
          return b.calificacionPromedio - a.calificacionPromedio;
        default:
          return 0;
      }
    });

  // Usar estadísticas del backend si están disponibles
  const progresoPromedio = estadisticas?.progreso_promedio || 0;
  const calificacionPromedio = estadisticas?.calificacion_promedio || 0;
  const totalEstudiantes = estadisticas?.total_estudiantes || estudiantes.length;

  const mostrarDetalles = (estudiante: EstudianteProgreso) => {
    setEstudianteModal(estudiante);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEstudianteModal(null);
  };

  const generarReporte = (estudiante: EstudianteProgreso) => {
    const reporteTexto = `
REPORTE DE PROGRESO - ${estudiante.nombre}
===============================================

INFORMACIÓN GENERAL:
- Nivel: ${estudiante.nivel}
- Progreso general: ${estudiante.progreso}%
- Clases completadas: ${estudiante.clasesCompletadas} de ${estudiante.clasesTotales}
- Calificación promedio: ${estudiante.calificacionPromedio}/10
- Última clase: ${new Date(estudiante.ultimaClase).toLocaleDateString('es-ES')}

FORTALEZAS:
${estudiante.fortalezas.map(f => `- ${f}`).join('\n')}

ÁREAS A MEJORAR:
${estudiante.areasAMejorar.map(a => `- ${a}`).join('\n')}

RECOMENDACIONES:
- Continuar reforzando las fortalezas identificadas
- Enfocar las próximas clases en las áreas de mejora
- Mantener la motivación y el ritmo de aprendizaje

Generado el: ${new Date().toLocaleDateString('es-ES')}
    `.trim();

    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${estudiante.nombre.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reportes-progreso">
      <div className="reportes-header">
        <h2>📊 Reportes de Progreso</h2>
        <div className="reportes-controles">
          <select 
            value={filtroNivel} 
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los niveles</option>
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
          
          <select 
            value={ordenPor} 
            onChange={(e) => setOrdenPor(e.target.value as any)}
            className="orden-select"
          >
            <option value="progreso">Ordenar por progreso</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="calificacion">Ordenar por calificación</option>
          </select>
        </div>
      </div>

      {/* Resumen general */}
      <div className="resumen-general">
        <div className="resumen-card">
          <div className="resumen-icon">👥</div>
          <div className="resumen-info">
            <h3>Total Estudiantes</h3>
            <span className="resumen-valor">{totalEstudiantes}</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon">📈</div>
          <div className="resumen-info">
            <h3>Progreso Promedio</h3>
            <span className="resumen-valor">{progresoPromedio.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon">⭐</div>
          <div className="resumen-info">
            <h3>Calificación Promedio</h3>
            <span className="resumen-valor">{calificacionPromedio.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <p>Cargando reportes de progreso...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={loadReportesProgreso} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de estudiantes */}
      {!loading && !error && (
        <div className="reportes-table-container">
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nivel</th>
                  <th>Progreso</th>
                  <th>Clases Completadas</th>
                  <th>Calificación Promedio</th>
                  <th>Última Clase</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map(estudiante => (
                  <tr key={estudiante.id}>
                    <td>{estudiante.nombre}</td>
                    <td>
                      <span className={`nivel-badge-table ${estudiante.nivel.toLowerCase()}`}>
                        {estudiante.nivel}
                      </span>
                    </td>
                    <td>
                      <div className="progreso-cell">
                        <div className="progreso-barra-table">
                          <div 
                            className="progreso-relleno-table"
                            style={{ width: `${estudiante.progreso}%` }}
                          ></div>
                        </div>
                        <span className="progreso-porcentaje">{estudiante.progreso}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      {estudiante.clasesCompletadas} / {estudiante.clasesTotales}
                    </td>
                    <td className="text-center">
                      <span className="calificacion-badge">
                        {estudiante.calificacionPromedio.toFixed(1)}
                      </span>
                    </td>
                    <td>{new Date(estudiante.ultimaClase).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div className="acciones-table">
                        <button 
                          className="btn-accion-table btn-ver"
                          onClick={() => mostrarDetalles(estudiante)}
                          title="Ver Detalles"
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-accion-table btn-generar"
                          onClick={() => generarReporte(estudiante)}
                          title="Generar Reporte"
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {estudianteModal && (
        <DetalleEstudianteModal
          estudiante={estudianteModal}
          isOpen={modalAbierto}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}
