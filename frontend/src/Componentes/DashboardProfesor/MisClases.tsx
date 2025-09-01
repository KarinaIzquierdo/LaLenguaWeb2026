import { useState } from 'react';
import './MisClases.css';

interface Clase {
  id: string;
  fecha: string;
  hora: string;
  duracion: number;
  tema: string;
  descripcion: string;
  estudiantes: string[];
  meetLink: string;
  estado: 'programada' | 'activa' | 'completada';
  tipoClase: 'individual' | 'grupal';
}

export default function MisClases() {
  const [clases, setClases] = useState<Clase[]>([
    {
      id: '1',
      fecha: '2024-09-01',
      hora: '10:00',
      duracion: 60,
      tema: 'Conversación Básica',
      descripcion: 'Práctica de conversación para nivel intermedio',
      estudiantes: ['Ana García', 'Carlos López'],
      meetLink: 'https://meet.google.com/abc-defg-hij',
      estado: 'programada',
      tipoClase: 'grupal'
    },
    {
      id: '2',
      fecha: '2024-09-01',
      hora: '14:00',
      duracion: 45,
      tema: 'Gramática Avanzada',
      descripcion: 'Tiempos verbales complejos',
      estudiantes: ['María Rodríguez'],
      meetLink: 'https://meet.google.com/xyz-mnop-qrs',
      estado: 'programada',
      tipoClase: 'individual'
    },
    {
      id: '3',
      fecha: '2024-08-30',
      hora: '16:00',
      duracion: 60,
      tema: 'Vocabulario de Negocios',
      descripcion: 'Terminología empresarial en inglés',
      estudiantes: ['Pedro Martín', 'Laura Silva', 'José Hernández'],
      meetLink: 'https://meet.google.com/def-uvw-xyz',
      estado: 'completada',
      tipoClase: 'grupal'
    }
  ]);

  const iniciarClase = (claseId: string) => {
    const clase = clases.find(c => c.id === claseId);
    if (!clase) return;

    // Actualizar estado de la clase a 'activa'
    setClases(prev => prev.map(c => 
      c.id === claseId ? { ...c, estado: 'activa' } : c
    ));

    // Abrir Google Meet
    window.open(clase.meetLink, '_blank');
    
    // Mostrar notificación
    alert(`¡Clase "${clase.tema}" iniciada! Los estudiantes pueden acceder ahora.`);
  };

  const finalizarClase = (claseId: string) => {
    setClases(prev => prev.map(c => 
      c.id === claseId ? { ...c, estado: 'completada' } : c
    ));
    alert('Clase finalizada exitosamente.');
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
                    <span>{clase.estudiantes.length} estudiante(s)</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-icon">📝</span>
                    <span>{clase.descripcion}</span>
                  </div>
                </div>

                <div className="estudiantes-lista">
                  <strong>Estudiantes:</strong>
                  <div className="estudiantes-tags">
                    {clase.estudiantes.map((estudiante, index) => (
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
                        onClick={() => window.open(clase.meetLink, '_blank')}
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
                      👥 {clase.estudiantes.length} estudiante(s)
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
                  <span className="historial-estudiantes">{clase.estudiantes.length} estudiante(s)</span>
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
