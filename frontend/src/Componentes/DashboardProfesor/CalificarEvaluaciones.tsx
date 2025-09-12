import React, { useState, useEffect } from 'react';
import { calificacionService, type RespuestaEvaluacion } from '../../services/calificacionService';
import './CalificarEvaluaciones.css';

interface CalificarEvaluacionesProps {}

export default function CalificarEvaluaciones({}: CalificarEvaluacionesProps) {
  const [activeTab, setActiveTab] = useState<'por-calificar' | 'calificadas'>('por-calificar');
  const [respuestasPorCalificar, setRespuestasPorCalificar] = useState<RespuestaEvaluacion[]>([]);
  const [respuestasCalificadas, setRespuestasCalificadas] = useState<RespuestaEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<RespuestaEvaluacion | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [calificacion, setCalificacion] = useState<string>('');
  const [comentarios, setComentarios] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [archivoPrevia, setArchivoPrevia] = useState<string | null>(null);

  useEffect(() => {
    cargarRespuestas();
  }, [activeTab]);

  const cargarRespuestas = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'por-calificar') {
        console.log('🔍 Cargando respuestas por calificar...');
        const response = await calificacionService.obtenerRespuestasPorCalificar();
        console.log('📊 Respuesta del servidor:', response);
        
        if (response.success) {
          console.log(`✅ ${response.respuestas.length} respuestas cargadas`);
          console.log('📋 Respuestas con archivos:', response.respuestas.filter(r => r.archivo_respuesta).length);
          response.respuestas.forEach((r, i) => {
            console.log(`${i+1}. ${r.estudiante_nombre} - ${r.evaluacion_titulo}`);
            console.log(`   Archivo: ${r.archivo_respuesta || 'Sin archivo'}`);
          });
          setRespuestasPorCalificar(response.respuestas);
        } else {
          console.error('❌ Error en respuesta:', response.error);
          setError(response.error || 'Error al cargar respuestas');
        }
      } else {
        const response = await calificacionService.obtenerRespuestasCalificadas();
        if (response.success) {
          setRespuestasCalificadas(response.respuestas);
        } else {
          setError(response.error || 'Error al cargar respuestas');
        }
      }
    } catch (err) {
      console.error('💥 Error de conexión:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCalificacion = (respuesta: RespuestaEvaluacion) => {
    setRespuestaSeleccionada(respuesta);
    setCalificacion(respuesta.calificacion?.toString() || '');
    setComentarios(respuesta.comentarios_profesor || '');
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setRespuestaSeleccionada(null);
    setCalificacion('');
    setComentarios('');
  };

  const guardarCalificacion = async () => {
    if (!respuestaSeleccionada || !calificacion) {
      alert('Por favor ingresa una calificación');
      return;
    }

    const calificacionNum = parseFloat(calificacion);
    if (isNaN(calificacionNum) || calificacionNum < 0 || calificacionNum > 100) {
      alert('La calificación debe ser un número entre 0 y 100');
      return;
    }

    setGuardando(true);

    try {
      const calificacionData = {
        calificacion: calificacionNum,
        comentarios_profesor: comentarios
      };

      let response;
      if (respuestaSeleccionada.calificacion !== null && respuestaSeleccionada.calificacion !== undefined) {
        // Actualizar calificación existente
        response = await calificacionService.actualizarCalificacion(respuestaSeleccionada.id, calificacionData);
      } else {
        // Nueva calificación
        response = await calificacionService.calificarRespuesta(respuestaSeleccionada.id, calificacionData);
      }

      if (response.success) {
        alert(response.message || 'Calificación guardada exitosamente');
        cerrarModal();
        cargarRespuestas();
      } else {
        alert(response.error || 'Error al guardar calificación');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const obtenerTipoArchivo = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word';
      case 'txt': return 'Texto';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'Imagen';
      default: return 'Archivo';
    }
  };

  const obtenerIconoArchivo = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  const abrirVistaPrevia = (url: string) => {
    setArchivoPrevia(url);
    setMostrarVistaPrevia(true);
  };

  const descargarArchivo = (url: string, nombreEstudiante: string, tituloEvaluacion: string) => {
    const extension = url.split('.').pop();
    const nombreArchivo = `${nombreEstudiante}_${tituloEvaluacion}.${extension}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRespuesta = (respuesta: RespuestaEvaluacion) => (
    <div key={respuesta.id} className="respuesta-card">
      <div className="respuesta-header">
        <div className="respuesta-info">
          <h4>{respuesta.evaluacion_titulo}</h4>
          <p className="estudiante-nombre">👤 {respuesta.estudiante_nombre}</p>
          <p className="fecha-envio">📅 {calificacionService.formatearFecha(respuesta.fecha_envio)}</p>
          <p className="tiempo-gastado">⏱️ {calificacionService.formatearTiempo(respuesta.tiempo_gastado)}</p>
        </div>
        
        {respuesta.calificacion !== null && respuesta.calificacion !== undefined && (
          <div className="calificacion-badge" style={{ 
            backgroundColor: calificacionService.obtenerColorCalificacion(respuesta.calificacion) 
          }}>
            <span className="calificacion-numero">{calificacionService.formatearCalificacion(respuesta.calificacion)}</span>
            <span className="calificacion-etiqueta">{calificacionService.obtenerEtiquetaCalificacion(respuesta.calificacion)}</span>
          </div>
        )}
      </div>

      <div className="respuesta-content">
        {respuesta.archivo_respuesta && (
          <div className="archivo-respuesta">
            <div className="archivo-info">
              <span className="archivo-icono">{obtenerIconoArchivo(respuesta.archivo_respuesta)}</span>
              <div className="archivo-detalles">
                <span className="archivo-nombre">Archivo de respuesta ({obtenerTipoArchivo(respuesta.archivo_respuesta)})</span>
                <span className="archivo-url">{respuesta.archivo_respuesta.split('/').pop()}</span>
              </div>
            </div>
            <div className="archivo-acciones">
              <button 
                className="btn-vista-previa"
                onClick={() => abrirVistaPrevia(respuesta.archivo_respuesta!)}
                title="Ver archivo"
              >
                👁️ Ver
              </button>
              <button 
                className="btn-descargar"
                onClick={() => descargarArchivo(respuesta.archivo_respuesta!, respuesta.estudiante_nombre, respuesta.evaluacion_titulo)}
                title="Descargar archivo"
              >
                💾 Descargar
              </button>
            </div>
          </div>
        )}
        
        {Object.keys(respuesta.respuestas_json).length > 0 && (
          <div className="respuestas-json">
            <h5>Respuestas:</h5>
            <div className="respuestas-content">
              {Object.entries(respuesta.respuestas_json).map(([key, value]) => (
                <div key={key} className="respuesta-item">
                  <strong>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}

        {respuesta.comentarios_profesor && (
          <div className="comentarios-profesor">
            <h5>Comentarios del profesor:</h5>
            <p>{respuesta.comentarios_profesor}</p>
            {respuesta.fecha_calificacion && (
              <small>Calificado el: {calificacionService.formatearFecha(respuesta.fecha_calificacion)}</small>
            )}
          </div>
        )}
      </div>

      <div className="respuesta-actions">
        <button 
          className="btn-calificar"
          onClick={() => abrirModalCalificacion(respuesta)}
        >
          {respuesta.calificacion !== null && respuesta.calificacion !== undefined ? '✏️ Editar Calificación' : '📝 Calificar'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="calificar-evaluaciones">
      <div className="header">
        <h2>📊 Calificar Evaluaciones</h2>
        <p>Revisa y califica las evaluaciones enviadas por tus estudiantes</p>
      </div>

      <div className="tabs-container">
        <div className="tabs-left">
          <button 
            className={`tab ${activeTab === 'por-calificar' ? 'active' : ''}`}
            onClick={() => setActiveTab('por-calificar')}
          >
            📋 Por Calificar ({respuestasPorCalificar.length})
          </button>
          <button 
            className={`tab ${activeTab === 'calificadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('calificadas')}
          >
            ✅ Calificadas ({respuestasCalificadas.length})
          </button>
        </div>
        <button 
          className="btn-actualizar"
          onClick={cargarRespuestas}
          disabled={loading}
          title="Actualizar datos"
        >
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando respuestas...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>❌ {error}</p>
            <button onClick={cargarRespuestas} className="btn-retry">🔄 Reintentar</button>
          </div>
        ) : (
          <div className="respuestas-list">
            {activeTab === 'por-calificar' ? (
              respuestasPorCalificar.length > 0 ? (
                respuestasPorCalificar.map(renderRespuesta)
              ) : (
                <div className="empty-state">
                  <p>🎉 ¡No hay evaluaciones pendientes por calificar!</p>
                </div>
              )
            ) : (
              respuestasCalificadas.length > 0 ? (
                respuestasCalificadas.map(renderRespuesta)
              ) : (
                <div className="empty-state">
                  <p>📝 Aún no has calificado ninguna evaluación</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Modal de Calificación */}
      {mostrarModal && respuestaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {respuestaSeleccionada.calificacion !== null && respuestaSeleccionada.calificacion !== undefined 
                  ? '✏️ Editar Calificación' 
                  : '📝 Calificar Evaluación'
                }
              </h3>
              <button className="btn-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="evaluacion-info">
                <h4>{respuestaSeleccionada.evaluacion_titulo}</h4>
                <p><strong>Estudiante:</strong> {respuestaSeleccionada.estudiante_nombre}</p>
                <p><strong>Fecha de envío:</strong> {calificacionService.formatearFecha(respuestaSeleccionada.fecha_envio)}</p>
              </div>

              <div className="form-group">
                <label htmlFor="calificacion">Calificación (0-100):</label>
                <input
                  type="number"
                  id="calificacion"
                  min="0"
                  max="100"
                  step="0.1"
                  value={calificacion}
                  onChange={(e) => setCalificacion(e.target.value)}
                  placeholder="Ej: 85.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="comentarios">Comentarios (opcional):</label>
                <textarea
                  id="comentarios"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Escribe comentarios sobre la evaluación..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={cerrarModal}>
                Cancelar
              </button>
              <button 
                className="btn-save" 
                onClick={guardarCalificacion}
                disabled={guardando || !calificacion}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar Calificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa de Archivos */}
      {mostrarVistaPrevia && archivoPrevia && (
        <div className="modal-overlay" onClick={() => setMostrarVistaPrevia(false)}>
          <div className="modal-content modal-previa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Vista Previa del Archivo</h3>
              <div className="modal-header-actions">
                <button 
                  className="btn-descargar-modal"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = archivoPrevia;
                    link.download = archivoPrevia.split('/').pop() || 'archivo';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  💾 Descargar
                </button>
                <button className="btn-close" onClick={() => setMostrarVistaPrevia(false)}>✕</button>
              </div>
            </div>

            <div className="modal-body modal-previa-body">
              {archivoPrevia.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={archivoPrevia}
                  width="100%"
                  height="600px"
                  style={{ border: 'none', borderRadius: '8px' }}
                  title="Vista previa PDF"
                />
              ) : archivoPrevia.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <div className="imagen-previa">
                  <img 
                    src={archivoPrevia} 
                    alt="Vista previa" 
                    style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="archivo-no-previsualizable">
                  <div className="archivo-info-grande">
                    <span className="archivo-icono-grande">{obtenerIconoArchivo(archivoPrevia)}</span>
                    <h4>Archivo {obtenerTipoArchivo(archivoPrevia)}</h4>
                    <p>Este tipo de archivo no se puede previsualizar directamente.</p>
                    <p><strong>Nombre:</strong> {archivoPrevia.split('/').pop()}</p>
                    <div className="acciones-archivo">
                      <button 
                        className="btn-abrir-nueva-ventana"
                        onClick={() => window.open(archivoPrevia, '_blank')}
                      >
                        🔗 Abrir en nueva ventana
                      </button>
                      <button 
                        className="btn-descargar-grande"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = archivoPrevia;
                          link.download = archivoPrevia.split('/').pop() || 'archivo';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        💾 Descargar archivo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
