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
  const [mostrarQuiz, setMostrarQuiz] = useState(false);
  const [evaluacionQuiz, setEvaluacionQuiz] = useState<any>(null);

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

  const iniciarQuiz = (evaluacion: EvaluacionEstudiante) => {
    setEvaluacionQuiz(evaluacion);
    setMostrarQuiz(true);
  };

  const isOverdue = (fechaLimite?: string) => {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  };

  const downloadEvaluacion = (evaluacion: EvaluacionEstudiante) => {
    if (evaluacion.archivo_url) {
      window.open(evaluacion.archivo_url, '_blank');
    } else {
      alert('Archivo no disponible');
    }
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
                    {evaluacion.tipo === 'quiz' ? (
                      <button 
                        className="btn-iniciar-quiz"
                        onClick={() => iniciarQuiz(evaluacion)}
                      >
                        🎯 Iniciar Quiz
                      </button>
                    ) : (
                      <a 
                        href={evaluacion.archivo_url} 
                        download 
                        className="btn-descargar"
                      >
                        📄 Descargar
                      </a>
                    )}
                    <button className="btn-ver-detalles">
                      👁️ Ver detalles
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
                  <tr key={evaluacion.id} className={overdue ? 'fila-vencida' : ''}>
                    <td>
                      <div className="evaluacion-info">
                        <h4>{evaluacion.titulo}</h4>
                        {evaluacion.descripcion && (
                          <p className="descripcion-corta">{evaluacion.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`tipo-badge ${evaluacion.tipo}`}>
                        {evaluacion.tipo === 'quiz' && '🎯 Quiz'}
                        {evaluacion.tipo === 'examen' && '📋 Examen'}
                        {evaluacion.tipo === 'tarea' && '📚 Tarea'}
                      </span>
                    </td>
                    <td>{evaluacion.profesor_nombre || 'No especificado'}</td>
                    <td>
                      <span className={overdue ? 'fecha-vencida' : ''}>
                        {evaluacion.fecha_limite ? formatDate(evaluacion.fecha_limite) : 'Sin límite'}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${overdue ? 'vencida' : 'disponible'}`}>
                        {overdue ? '⚠️ Vencida' : '✅ Disponible'}
                      </span>
                    </td>
                    <td>
                      {evaluacion.tipo === 'quiz' ? (
                        <button 
                          className="btn-accion btn-quiz"
                          onClick={() => iniciarQuiz(evaluacion)}
                          disabled={overdue}
                        >
                          🎯 Iniciar Quiz
                        </button>
                      ) : (
                        <a 
                          href={evaluacion.archivo_url} 
                          download 
                          className="btn-accion btn-descargar"
                        >
                          📄 Descargar
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quiz Taker Modal */}
      {mostrarQuiz && evaluacionQuiz && (
        <QuizTaker
          evaluacion={evaluacionQuiz}
          onClose={() => {
            setMostrarQuiz(false);
            setEvaluacionQuiz(null);
          }}
          onComplete={(score) => {
            alert(`Quiz completado! Tu puntuación: ${score}%`);
            setMostrarQuiz(false);
            setEvaluacionQuiz(null);
            // Aquí se podría enviar el resultado al backend
          }}
        />
      )}
    </div>
  );
}
