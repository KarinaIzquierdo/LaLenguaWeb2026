import React, { useState, useEffect } from 'react';
import { evaluacionService } from '../../services/evaluacionService';
import QuizTaker from './QuizTaker';
import './EvaluacionesEstudiante.css';

interface EvaluacionEstudiante {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  fecha_limite?: string;
  created_at: string;
  profesor_nombre?: string;
  archivo_url?: string;
}

export default function EvaluacionesEstudiante() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subiendoRespuesta, setSubiendoRespuesta] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluaciones();
  }, []);

  const loadEvaluaciones = async () => {
    try {
      setLoading(true);
      const response = await evaluacionService.getStudentEvaluaciones();
      if (response.success) {
        setEvaluaciones(response.data);
      }
    } catch (err) {
      setError('Error al cargar evaluaciones');
      console.error('Error loading student evaluaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      'quiz': { class: 'badge-quiz', text: 'Quiz', icon: '📝' },
      'examen': { class: 'badge-exam', text: 'Examen', icon: '📋' },
      'tarea': { class: 'badge-task', text: 'Tarea', icon: '📚' }
    };
    return badges[tipo as keyof typeof badges] || badges.quiz;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const descargarEvaluacion = async (evaluacion: EvaluacionEstudiante) => {
    try {
      const response = await evaluacionService.downloadEvaluacion(evaluacion.id);
      if (response.success) {
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.filename || `${evaluacion.titulo}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al descargar: ' + response.message);
      }
    } catch (error) {
      console.error('Error al descargar evaluación:', error);
      alert('Error al descargar evaluación');
    }
  };

  const subirRespuesta = async (evaluacion: EvaluacionEstudiante) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setSubiendoRespuesta(evaluacion.id);
          const response = await evaluacionService.uploadRespuesta(evaluacion.id, {
            archivo: file,
            comentarios: ''
          });
          if (response.success) {
            alert('Respuesta subida exitosamente');
            loadEvaluaciones(); // Recargar evaluaciones
          } else {
            alert('Error al subir respuesta: ' + response.message);
          }
        } catch (error) {
          console.error('Error al subir respuesta:', error);
          alert('Error al subir respuesta');
        } finally {
          setSubiendoRespuesta(null);
        }
      }
    };
    input.click();
  };

  const isOverdue = (fechaLimite?: string) => {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  };

  if (loading) {
    return (
      <div className="evaluaciones-estudiante-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluaciones-estudiante-container">
        <div className="evaluaciones-header">
          <h2>📋 Mis Evaluaciones</h2>
          <p>Evaluaciones asignadas por tus profesores</p>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando evaluaciones...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error al cargar evaluaciones</h3>
            <p>{error}</p>
            <button onClick={loadEvaluaciones} className="retry-btn">
              🔄 Reintentar
            </button>
          </div>
        )}

        {!loading && !error && evaluaciones.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No tienes evaluaciones asignadas</h3>
            <p>Cuando tus profesores publiquen evaluaciones, aparecerán aquí</p>
          </div>
        )}

        {!loading && !error && evaluaciones.length > 0 && (
          <div className="evaluaciones-grid">
            {evaluaciones.map((evaluacion) => {
              const overdue = isOverdue(evaluacion.fecha_limite);
              
              return (
                <div key={evaluacion.id} className={`evaluacion-card ${overdue ? 'overdue' : ''}`}>
                  <div className="evaluacion-header">
                    <h3>{evaluacion.titulo}</h3>
                    <span className={`tipo-badge ${evaluacion.tipo}`}>
                      {evaluacion.tipo === 'quiz' && '🎯 Quiz'}
                      {evaluacion.tipo === 'examen' && '📋 Examen'}
                      {evaluacion.tipo === 'tarea' && '📚 Tarea'}
                    </span>
                  </div>

                  {evaluacion.descripcion && (
                    <div className="evaluacion-descripcion">
                      <p>{evaluacion.descripcion}</p>
                    </div>
                  )}

                  <div className="evaluacion-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Profesor:</span>
                        <span className="value">{evaluacion.profesor_nombre || 'No especificado'}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="label">Asignada:</span>
                        <span className="value">{formatDate(evaluacion.created_at)}</span>
                      </div>
                      
                      {evaluacion.fecha_limite && (
                        <div className="info-item">
                          <span className="label">Fecha límite:</span>
                          <span className={`value ${overdue ? 'overdue-text' : ''}`}>
                            {formatDate(evaluacion.fecha_limite)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="evaluacion-actions">
                    <button 
                      className="btn-descargar"
                      onClick={() => descargarEvaluacion(evaluacion)}
                      disabled={overdue}
                    >
                      📄 Descargar
                    </button>
                    <button 
                      className="btn-subir-respuesta"
                      onClick={() => subirRespuesta(evaluacion)}
                      disabled={overdue || subiendoRespuesta === evaluacion.id}
                    >
                      {subiendoRespuesta === evaluacion.id ? '⏳ Subiendo...' : '📤 Subir Respuesta'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="evaluaciones-estudiante-container">
      <div className="evaluaciones-header">
        <h2>📋 Mis Evaluaciones</h2>
        <p>Evaluaciones asignadas por tus profesores</p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando evaluaciones...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar evaluaciones</h3>
          <p>{error}</p>
          <button onClick={loadEvaluaciones} className="retry-btn">
            🔄 Reintentar
          </button>
        </div>
      )}

      {!loading && !error && evaluaciones.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No tienes evaluaciones asignadas</h3>
          <p>Cuando tus profesores publiquen evaluaciones, aparecerán aquí</p>
        </div>
      )}

      {!loading && !error && evaluaciones.length > 0 && (
        <div className="evaluaciones-tabla">
          <table className="tabla-evaluaciones">
            <thead>
              <tr>
                <th>Evaluación</th>
                <th>Tipo</th>
                <th>Profesor</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((evaluacion) => {
                const overdue = isOverdue(evaluacion.fecha_limite);
                
                return (
                  <React.Fragment key={evaluacion.id}>
                    <tr className={overdue ? 'evaluacion-vencida' : ''}>
                      <td>{evaluacion.titulo}</td>
                      <td>
                        <span className={`tipo-badge tipo-${evaluacion.tipo}`}>
                          {evaluacion.tipo === 'quiz' && '🎯 Quiz'}
                          {evaluacion.tipo === 'examen' && '📋 Examen'}
                          {evaluacion.tipo === 'tarea' && '📚 Tarea'}
                        </span>
                      </td>
                      <td>{evaluacion.descripcion || 'Sin descripción'}</td>
                      <td>
                        {evaluacion.fecha_limite ? (
                          <span className={overdue ? 'fecha-vencida' : 'fecha-limite'}>
                            {new Date(evaluacion.fecha_limite).toLocaleDateString()}
                          </span>
                        ) : (
                          'Sin fecha límite'
                        )}
                      </td>
                      <td>
                        <div className="acciones-evaluacion">
                          <button 
                            className="btn-accion btn-descargar"
                            onClick={() => descargarEvaluacion(evaluacion)}
                            disabled={overdue}
                          >
                            📄 Descargar
                          </button>
                          <button 
                            className="btn-accion btn-subir"
                            onClick={() => subirRespuesta(evaluacion)}
                            disabled={overdue || subiendoRespuesta === evaluacion.id}
                          >
                            {subiendoRespuesta === evaluacion.id ? '⏳ Subiendo...' : '📤 Subir Respuesta'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
