import { useState, useEffect } from 'react';
import './NotificacionesProfesor.css';

interface Notificacion {
  id: number;
  tipo: 'clase' | 'evaluacion' | 'mensaje' | 'sistema';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  prioridad: 'alta' | 'media' | 'baja';
  estudiante?: string;
}

export default function NotificacionesProfesor() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [mostrarSoloNoLeidas, setMostrarSoloNoLeidas] = useState(false);

  useEffect(() => {
    const notificacionesEjemplo: Notificacion[] = [
      {
        id: 1,
        tipo: 'clase',
        titulo: 'Clase próxima en 30 minutos',
        mensaje: 'Clase con Ana García programada para las 10:00 AM',
        fecha: new Date(Date.now() + 30 * 60 * 1000),
        leida: false,
        prioridad: 'alta',
        estudiante: 'Ana García'
      },
      {
        id: 2,
        tipo: 'evaluacion',
        titulo: 'Evaluación pendiente de calificar',
        mensaje: 'Carlos López ha completado su evaluación oral',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
        leida: false,
        prioridad: 'media',
        estudiante: 'Carlos López'
      },
      {
        id: 3,
        tipo: 'mensaje',
        titulo: 'Nuevo mensaje de estudiante',
        mensaje: 'María Rodríguez ha enviado una consulta sobre la tarea',
        fecha: new Date(Date.now() - 4 * 60 * 60 * 1000),
        leida: true,
        prioridad: 'baja',
        estudiante: 'María Rodríguez'
      },
      {
        id: 4,
        tipo: 'sistema',
        titulo: 'Recordatorio de planificación',
        mensaje: 'No olvides planificar las clases de la próxima semana',
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
        leida: false,
        prioridad: 'media'
      },
      {
        id: 5,
        tipo: 'clase',
        titulo: 'Clase cancelada',
        mensaje: 'Pedro Martín ha cancelado la clase del viernes',
        fecha: new Date(Date.now() - 6 * 60 * 60 * 1000),
        leida: true,
        prioridad: 'media',
        estudiante: 'Pedro Martín'
      }
    ];
    setNotificaciones(notificacionesEjemplo);
  }, []);

  const marcarComoLeida = (id: number) => {
    setNotificaciones(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => 
      prev.map(notif => ({ ...notif, leida: true }))
    );
  };

  const eliminarNotificacion = (id: number) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  const notificacionesFiltradas = notificaciones
    .filter(notif => filtroTipo === 'todas' || notif.tipo === filtroTipo)
    .filter(notif => !mostrarSoloNoLeidas || !notif.leida)
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'clase': return '📚';
      case 'evaluacion': return '📝';
      case 'mensaje': return '💬';
      case 'sistema': return '⚙️';
      default: return '🔔';
    }
  };

  const formatearTiempo = (fecha: Date) => {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (diferencia < 0) {
      const minutosRestantes = Math.abs(minutos);
      return `En ${minutosRestantes} minutos`;
    } else if (minutos < 60) {
      return `Hace ${minutos} minutos`;
    } else if (horas < 24) {
      return `Hace ${horas} horas`;
    } else {
      return `Hace ${dias} días`;
    }
  };

  return (
    <div className="notificaciones-profesor">
      <div className="notificaciones-header">
        <h2>🔔 Notificaciones {noLeidasCount > 0 && <span className="badge-count">{noLeidasCount}</span>}</h2>
        <div className="notificaciones-controles">
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="todas">Todas</option>
            <option value="clase">Clases</option>
            <option value="evaluacion">Evaluaciones</option>
            <option value="mensaje">Mensajes</option>
            <option value="sistema">Sistema</option>
          </select>
          
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={mostrarSoloNoLeidas}
              onChange={(e) => setMostrarSoloNoLeidas(e.target.checked)}
            />
            Solo no leídas
          </label>
          
          <button 
            onClick={marcarTodasComoLeidas}
            className="btn-marcar-todas"
            disabled={noLeidasCount === 0}
          >
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="notificaciones-lista">
        {notificacionesFiltradas.length === 0 ? (
          <div className="sin-notificaciones">
            <div className="sin-notificaciones-icon">🔕</div>
            <h3>No hay notificaciones</h3>
            <p>Todas las notificaciones están al día</p>
          </div>
        ) : (
          notificacionesFiltradas.map(notificacion => (
            <div 
              key={notificacion.id} 
              className={`notificacion-item ${notificacion.leida ? 'leida' : 'no-leida'} prioridad-${notificacion.prioridad}`}
              onClick={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
            >
              <div className="notificacion-icono">
                {obtenerIconoTipo(notificacion.tipo)}
              </div>
              
              <div className="notificacion-contenido">
                <div className="notificacion-header-item">
                  <h4>{notificacion.titulo}</h4>
                  <span className="notificacion-tiempo">
                    {formatearTiempo(notificacion.fecha)}
                  </span>
                </div>
                
                <p className="notificacion-mensaje">{notificacion.mensaje}</p>
                
                {notificacion.estudiante && (
                  <span className="notificacion-estudiante">
                    👤 {notificacion.estudiante}
                  </span>
                )}
              </div>
              
              <div className="notificacion-acciones">
                {!notificacion.leida && (
                  <button 
                    className="btn-marcar-leida"
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarComoLeida(notificacion.id);
                    }}
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
                
                <button 
                  className="btn-eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarNotificacion(notificacion.id);
                  }}
                  title="Eliminar notificación"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
