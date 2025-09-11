import { useEffect, useState } from 'react';
import { ClaseService } from '../../services/claseService';
import './MisClases.css';

interface Clase {
  id: number;
  nombre: string;
  profesorId: number;
  fecha: string;
  hora: string;
  duracion: number;
  tema: string;
  descripcion: string;
  estudiantes: string[];
  meetLink: string;
  meet_link: string; // Campo del backend
  estado: 'programada' | 'activa' | 'completada';
  tipoClase: 'individual' | 'grupal';
}

export default function MisClases({ profesorId }: { profesorId: number }) {
  const [clases, setClases] = useState<Clase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchClases = async () => {
      setIsLoading(true);
      try {
        const data = await ClaseService.getClasesPorProfesor(profesorId);
        console.log('Clases recibidas del backend:', data);
        data.forEach((clase: any) => {
          console.log(`Clase ID ${clase.id}: meet_link = ${clase.meet_link}`);
        });
        setClases(data);
      } catch (err) {
        console.error('Error al cargar clases:', err);
      }
      setIsLoading(false);
    };
    fetchClases();
  }, [profesorId]);

  const iniciarClase = async (claseId: number) => {
    const clase = clases.find(c => c.id === claseId);
    if (!clase) return;

    try {
      // Cambiar estado en el backend
      const { ClaseService } = await import('../../services/claseService');
      await ClaseService.cambiarEstadoClase(claseId, 'activa');

      // Actualizar estado local
      setClases(prev => prev.map(c => 
        c.id === claseId ? { ...c, estado: 'activa' } : c
      ));

      // Abrir Google Meet - usar el campo correcto del backend
      const meetLink = clase.meet_link || clase.meetLink;
      console.log('Enlace Meet a abrir:', meetLink);
      console.log('Campo meet_link del backend:', clase.meet_link);
      console.log('Campo meetLink local:', clase.meetLink);
      
      if (!meetLink || meetLink.trim() === '' || meetLink === 'undefined') {
        alert('No hay enlace de Meet configurado para esta clase. Por favor, edita la clase y agrega un enlace.');
        return;
      }
      
      // Asegurar que el enlace tenga protocolo
      let enlaceCompleto = meetLink;
      if (!enlaceCompleto.startsWith('http://') && !enlaceCompleto.startsWith('https://')) {
        enlaceCompleto = 'https://' + enlaceCompleto;
      }
      
      console.log('Enlace completo a abrir:', enlaceCompleto);
      window.open(enlaceCompleto, '_blank');
      
      // Mostrar notificación
      alert(`¡Clase "${clase.tema}" iniciada! Los estudiantes pueden acceder ahora.`);
    } catch (error) {
      console.error('Error al iniciar clase:', error);
      alert('Error al iniciar la clase. Intenta nuevamente.');
    }
  };

  const finalizarClase = async (claseId: number) => {
    try {
      // Cambiar estado en el backend
      const { ClaseService } = await import('../../services/claseService');
      await ClaseService.cambiarEstadoClase(claseId, 'completada');

      // Actualizar estado local
      setClases(prev => prev.map(c => 
        c.id === claseId ? { ...c, estado: 'completada' } : c
      ));
      
      alert('Clase finalizada exitosamente.');
    } catch (error) {
      console.error('Error al finalizar clase:', error);
      alert('Error al finalizar la clase. Intenta nuevamente.');
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', opciones);
  };

  const esHoy = (fecha: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fecha === hoy;
  };

  const clasesHoy = clases.filter(clase => esHoy(clase.fecha));
  const clasesProximas = clases.filter(clase => !esHoy(clase.fecha) && clase.estado !== 'completada');
  const clasesCompletadas = clases.filter(clase => clase.estado === 'completada');

  return (
    <div className="mis-clases-container">
      <div className="mis-clases-header">
        <h2>Mis Clases Programadas</h2>
        <p>Gestiona y controla tus clases programadas</p>
      </div>

      {isLoading && <div className="loading-spinner">Cargando clases...</div>}

      {/* Clases de Hoy */}
      {clasesHoy.length > 0 && (
        <div className="clases-section">
          <h3 className="section-title">📅 Clases de Hoy</h3>
          <div className="clases-grid">
            {clasesHoy.map(clase => (
              <div key={clase.id} className={`clase-card hoy ${clase.estado}`}>
                <div className="clase-header">
                  <div className="clase-info">
                    <h4>{clase.tema}</h4>
                    <span className="clase-tipo">{clase.tipoClase === 'individual' ? '👤 Individual' : '👥 Grupal'}</span>
                  </div>
                  <div className={`estado-badge ${clase.estado}`}>
                    {clase.estado === 'programada' && '⏳ Programada'}
                    {clase.estado === 'activa' && '🔴 En Vivo'}
                    {clase.estado === 'completada' && '✅ Completada'}
                  </div>
                </div>

                <div className="clase-detalles">
                  <div className="detalle-item">
                    <span className="detalle-icon">🕐</span>
                    <span>{clase.hora} - {clase.duracion} min</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-icon">👥</span>
                    <span>{(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-icon">📝</span>
                    <span>{clase.descripcion}</span>
                  </div>
                </div>

                <div className="estudiantes-lista">
                  <strong>Estudiantes:</strong>
                  <div className="estudiantes-tags">
                    {(clase.estudiantes || []).map((estudiante, index) => (
                      <span key={index} className="estudiante-tag">{estudiante}</span>
                    ))}
                  </div>
                </div>

                <div className="clase-acciones">
                  {clase.estado === 'programada' && (
                    <button 
                      className="btn-iniciar-clase"
                      onClick={() => iniciarClase(clase.id)}
                    >
                      📹 Iniciar Clase
                    </button>
                  )}
                  {clase.estado === 'activa' && (
                    <>
                      <button 
                        className="btn-unirse-clase"
                        onClick={() => {
                          const meetLink = clase.meet_link || clase.meetLink;
                          console.log('Unirse a Meet - Enlace:', meetLink);
                          if (meetLink && meetLink.trim() !== '') {
                            window.open(meetLink, '_blank');
                          } else {
                            alert('No hay enlace de Meet disponible para esta clase.');
                          }
                        }}
                      >
                        🔗 Unirse a Meet
                      </button>
                      <button 
                        className="btn-finalizar-clase"
                        onClick={() => finalizarClase(clase.id)}
                      >
                        ⏹️ Finalizar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas Clases */}
      {clasesProximas.length > 0 && (
        <div className="clases-section">
          <h3 className="section-title">📋 Próximas Clases</h3>
          <div className="clases-lista">
            {clasesProximas.map(clase => (
              <div key={clase.id} className="clase-row">
                <div className="clase-fecha">
                  <div className="fecha-principal">{formatearFecha(clase.fecha)}</div>
                  <div className="hora-clase">{clase.hora}</div>
                </div>
                
                <div className="clase-contenido">
                  <h4>{clase.tema}</h4>
                  <p>{clase.descripcion}</p>
                  <div className="clase-meta">
                    <span className="meta-item">
                      {clase.tipoClase === 'individual' ? '👤' : '👥'} {clase.tipoClase}
                    </span>
                    <span className="meta-item">
                      ⏱️ {clase.duracion} min
                    </span>
                    <span className="meta-item">
                      👥 {(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)
                    </span>
                  </div>
                </div>

                <div className="clase-acciones-row">
                  <button className="btn-ver-detalles">👁️ Ver</button>
                  <button className="btn-editar">✏️ Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Clases */}
      {clasesCompletadas.length > 0 && (
        <div className="clases-section">
          <h3 className="section-title">📚 Historial de Clases</h3>
          <div className="clases-historial">
            {clasesCompletadas.map(clase => (
              <div key={clase.id} className="clase-historial-item">
                <div className="historial-fecha">{formatearFecha(clase.fecha)}</div>
                <div className="historial-info">
                  <span className="historial-tema">{clase.tema}</span>
                  <span className="historial-estudiantes">{(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)</span>
                </div>
                <div className="historial-estado">✅ Completada</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {clases.length === 0 && (
        <div className="estado-vacio">
          <div className="vacio-icon">📅</div>
          <h3>No tienes clases programadas</h3>
          <p>Programa tu primera clase para comenzar</p>
          <button className="btn-programar-primera">➕ Programar Clase</button>
        </div>
      )}
    </div>
  );
}
