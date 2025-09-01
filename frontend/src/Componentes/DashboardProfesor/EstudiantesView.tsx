import { useState } from 'react';
import './EstudiantesView.css';

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  nivel: string;
  fechaRegistro: string;
  clasesCompletadas: number;
  evaluacionesRealizadas: number;
  promedioGeneral: number;
  ultimaActividad: string;
  estado: 'activo' | 'inactivo';
}

interface ResultadoEvaluacion {
  evaluacionId: string;
  titulo: string;
  fecha: string;
  puntuacion: number;
  puntosTotales: number;
  porcentaje: number;
  respuestasCorrectas: number;
  totalPreguntas: number;
  tiempoEmpleado: string;
}

export default function EstudiantesView() {
  const [estudiantes] = useState<Estudiante[]>([
    {
      id: '1',
      nombre: 'Ana García',
      email: 'ana@email.com',
      nivel: 'Intermedio',
      fechaRegistro: '2025-07-15',
      clasesCompletadas: 12,
      evaluacionesRealizadas: 8,
      promedioGeneral: 87,
      ultimaActividad: '2025-09-01',
      estado: 'activo'
    },
    {
      id: '2',
      nombre: 'Carlos López',
      email: 'carlos@email.com',
      nivel: 'Básico',
      fechaRegistro: '2025-08-01',
      clasesCompletadas: 6,
      evaluacionesRealizadas: 4,
      promedioGeneral: 75,
      ultimaActividad: '2025-08-30',
      estado: 'activo'
    },
    {
      id: '3',
      nombre: 'María Rodríguez',
      email: 'maria@email.com',
      nivel: 'Avanzado',
      fechaRegistro: '2025-06-20',
      clasesCompletadas: 18,
      evaluacionesRealizadas: 12,
      promedioGeneral: 94,
      ultimaActividad: '2025-09-01',
      estado: 'activo'
    },
    {
      id: '4',
      nombre: 'Pedro Martín',
      email: 'pedro@email.com',
      nivel: 'Intermedio',
      fechaRegistro: '2025-07-28',
      clasesCompletadas: 8,
      evaluacionesRealizadas: 5,
      promedioGeneral: 82,
      ultimaActividad: '2025-08-28',
      estado: 'inactivo'
    }
  ]);

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Datos mock de evaluaciones del estudiante seleccionado
  const [resultadosEvaluaciones] = useState<ResultadoEvaluacion[]>([
    {
      evaluacionId: '1',
      titulo: 'Quiz de Vocabulario - Unidad 3',
      fecha: '2025-08-30',
      puntuacion: 17,
      puntosTotales: 20,
      porcentaje: 85,
      respuestasCorrectas: 8,
      totalPreguntas: 10,
      tiempoEmpleado: '12:34'
    },
    {
      evaluacionId: '2',
      titulo: 'Examen de Gramática Intermedia',
      fecha: '2025-08-25',
      puntuacion: 19,
      puntosTotales: 25,
      porcentaje: 76,
      respuestasCorrectas: 19,
      totalPreguntas: 25,
      tiempoEmpleado: '28:45'
    },
    {
      evaluacionId: '3',
      titulo: 'Quiz Rápido - Present Perfect',
      fecha: '2025-08-20',
      puntuacion: 15,
      puntosTotales: 16,
      porcentaje: 94,
      respuestasCorrectas: 7,
      totalPreguntas: 8,
      tiempoEmpleado: '8:12'
    }
  ]);

  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const cumpleFiltroNivel = filtroNivel === 'todos' || estudiante.nivel.toLowerCase() === filtroNivel.toLowerCase();
    const cumpleFiltroEstado = filtroEstado === 'todos' || estudiante.estado === filtroEstado;
    return cumpleFiltroNivel && cumpleFiltroEstado;
  });

  const verDetallesEstudiante = (estudiante: Estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setMostrarDetalles(true);
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setEstudianteSeleccionado(null);
  };

  const getPromedioColor = (promedio: number) => {
    if (promedio >= 90) return '#10b981';
    if (promedio >= 80) return '#f59e0b';
    if (promedio >= 70) return '#ef4444';
    return '#6b7280';
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'básico': return '#3b82f6';
      case 'intermedio': return '#f59e0b';
      case 'avanzado': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="estudiantes-view">
      <div className="estudiantes-header">
        <div className="header-info">
          <h2>Mis Estudiantes</h2>
          <p>Gestiona y revisa el progreso de tus estudiantes</p>
        </div>
        
        <div className="header-filters">
          <select 
            value={filtroNivel} 
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los niveles</option>
            <option value="básico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
          
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="estudiantes-grid">
        {estudiantesFiltrados.map((estudiante) => (
          <div key={estudiante.id} className={`estudiante-card ${estudiante.estado}`}>
            <div className="estudiante-header">
              <div className="estudiante-avatar">
                {estudiante.nombre.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="estudiante-info">
                <h3 className="nombre">{estudiante.nombre}</h3>
                <p className="email">{estudiante.email}</p>
                <div 
                  className="nivel-badge"
                  style={{ backgroundColor: getNivelColor(estudiante.nivel) }}
                >
                  {estudiante.nivel}
                </div>
              </div>
              <div className={`estado-indicator ${estudiante.estado}`}>
                {estudiante.estado === 'activo' ? '🟢' : '🔴'}
              </div>
            </div>

            <div className="estudiante-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Clases</span>
                  <span className="stat-value">{estudiante.clasesCompletadas}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Evaluaciones</span>
                  <span className="stat-value">{estudiante.evaluacionesRealizadas}</span>
                </div>
              </div>
              
              <div className="promedio-section">
                <span className="promedio-label">Promedio General</span>
                <span 
                  className="promedio-valor"
                  style={{ color: getPromedioColor(estudiante.promedioGeneral) }}
                >
                  {estudiante.promedioGeneral}%
                </span>
              </div>
              
              <div className="ultima-actividad">
                <span className="actividad-label">Última actividad:</span>
                <span className="actividad-fecha">{formatFecha(estudiante.ultimaActividad)}</span>
              </div>
            </div>

            <div className="estudiante-actions">
              <button 
                className="action-btn details"
                onClick={() => verDetallesEstudiante(estudiante)}
              >
                👁️ Ver Detalles
              </button>
              <button className="action-btn message">
                💬 Mensaje
              </button>
            </div>
          </div>
        ))}
      </div>

      {estudiantesFiltrados.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay estudiantes</h3>
          <p>No tienes estudiantes que coincidan con los filtros seleccionados.</p>
        </div>
      )}

      {/* Modal de detalles del estudiante */}
      {mostrarDetalles && estudianteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalles}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="estudiante-modal-info">
                <div className="modal-avatar">
                  {estudianteSeleccionado.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2>{estudianteSeleccionado.nombre}</h2>
                  <p>{estudianteSeleccionado.email}</p>
                </div>
              </div>
              <button className="close-btn" onClick={cerrarDetalles}>✕</button>
            </div>

            <div className="modal-body">
              <div className="resumen-estudiante">
                <div className="resumen-stats">
                  <div className="resumen-stat">
                    <span className="resumen-numero">{estudianteSeleccionado.clasesCompletadas}</span>
                    <span className="resumen-label">Clases Completadas</span>
                  </div>
                  <div className="resumen-stat">
                    <span className="resumen-numero">{estudianteSeleccionado.evaluacionesRealizadas}</span>
                    <span className="resumen-label">Evaluaciones</span>
                  </div>
                  <div className="resumen-stat">
                    <span 
                      className="resumen-numero"
                      style={{ color: getPromedioColor(estudianteSeleccionado.promedioGeneral) }}
                    >
                      {estudianteSeleccionado.promedioGeneral}%
                    </span>
                    <span className="resumen-label">Promedio</span>
                  </div>
                </div>
              </div>

              <div className="evaluaciones-detalle">
                <h3>Historial de Evaluaciones</h3>
                <div className="evaluaciones-lista">
                  {resultadosEvaluaciones.map((resultado) => (
                    <div key={resultado.evaluacionId} className="evaluacion-resultado">
                      <div className="resultado-header">
                        <h4>{resultado.titulo}</h4>
                        <span className="resultado-fecha">{formatFecha(resultado.fecha)}</span>
                      </div>
                      
                      <div className="resultado-stats">
                        <div className="resultado-puntuacion">
                          <span className="puntuacion-label">Puntuación:</span>
                          <span className="puntuacion-valor">
                            {resultado.puntuacion}/{resultado.puntosTotales} pts ({resultado.porcentaje}%)
                          </span>
                        </div>
                        
                        <div className="resultado-respuestas">
                          <span className="respuestas-label">Respuestas:</span>
                          <span className="respuestas-valor">
                            {resultado.respuestasCorrectas}/{resultado.totalPreguntas} correctas
                          </span>
                        </div>
                        
                        <div className="resultado-tiempo">
                          <span className="tiempo-label">Tiempo:</span>
                          <span className="tiempo-valor">{resultado.tiempoEmpleado}</span>
                        </div>
                      </div>
                      
                      <div className="resultado-barra">
                        <div 
                          className="barra-progreso"
                          style={{ width: `${resultado.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
