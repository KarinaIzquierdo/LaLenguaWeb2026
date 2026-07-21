import { useState, useEffect } from 'react';
import './NotificacionesAdmin.css';
import { notificacionAdminService, type NotificacionAdmin } from '../../services/notificacionAdminService';

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [mostrarSoloNoLeidas, setMostrarSoloNoLeidas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noLeidasCount, setNoLeidasCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarNotificaciones = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await notificacionAdminService.obtenerNotificaciones();

      if (response.success) {
        setNotificaciones(response.notificaciones);
        setNoLeidasCount(response.no_leidas);
      } else {
        setError(response.message || 'Error al cargar notificaciones');
      }
    } catch (err) {
      console.error('Error al cargar notificaciones de admin:', err);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      const response = await notificacionAdminService.marcarComoLeida(id);
      if (response.success) {
        setNotificaciones(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, leida: true } : notif
          )
        );
        setNoLeidasCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error al marcar notificación de admin como leída:', err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const response = await notificacionAdminService.marcarTodasComoLeidas();
      if (response.success) {
        setNotificaciones(prev =>
          prev.map(notif => ({ ...notif, leida: true }))
        );
        setNoLeidasCount(0);
      }
    } catch (err) {
      console.error('Error al marcar todas las notificaciones de admin como leídas:', err);
    }
  };

  const eliminarNotificacion = (id: number) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  const notificacionesFiltradas = notificaciones
    .filter(notif => filtroTipo === 'todas' || notif.tipo === filtroTipo)
    .filter(notif => !mostrarSoloNoLeidas || !notif.leida)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const obtenerIconoTipo = (tipo: string) => {
    return notificacionAdminService.getIconoTipo(tipo);
  };

  return (
    <div className="notificaciones-admin">
      <div className="notificaciones-admin-header">
        <h2>🔔 Notificaciones Admin {noLeidasCount > 0 && <span className="badge-count">{noLeidasCount}</span>}</h2>
        <div className="notificaciones-admin-controles">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="todas">Todas</option>
            <option value="nuevo_estudiante">Nuevos Estudiantes</option>
            <option value="estudiante_eliminado">Estudiantes Eliminados</option>
            <option value="nueva_venta">Nuevas Ventas</option>
            <option value="venta_pendiente">Ventas Pendientes</option>
            <option value="plan_por_vencer">Planes por Vencer</option>
            <option value="plan_vencido">Planes Vencidos</option>
            <option value="nueva_clase">Clases Programadas</option>
            <option value="evaluacion_enviada">Evaluaciones Enviadas</option>
            <option value="evaluacion_pendiente">Evaluaciones Pendientes</option>
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

      {loading && (
        <div className="loading-notificaciones">
          <div className="spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      )}

      {error && (
        <div className="error-notificaciones">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={cargarNotificaciones} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="notificaciones-admin-lista">
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
                className={`notificacion-admin-item ${notificacion.leida ? 'leida' : 'no-leida'} prioridad-${notificacion.prioridad}`}
                onClick={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
                style={{
                  borderLeftColor: notificacionAdminService.getColorPrioridad(notificacion.prioridad)
                }}
              >
                <div className="notificacion-admin-icono">
                  {obtenerIconoTipo(notificacion.tipo)}
                </div>

                <div className="notificacion-admin-contenido">
                  <div className="notificacion-admin-header-item">
                    <h4>{notificacion.titulo}</h4>
                    <span className="notificacion-admin-tiempo">
                      {notificacion.tiempo_transcurrido}
                    </span>
                  </div>

                  <p className="notificacion-admin-mensaje">
                    {notificacionAdminService.formatearMensaje(notificacion)}
                  </p>

                  {notificacion.datos_adicionales && Object.keys(notificacion.datos_adicionales).length > 0 && (
                    <span className="notificacion-admin-detalles">
                      📎 Ver detalles
                    </span>
                  )}
                </div>

                <div className="notificacion-admin-acciones">
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
      )}
    </div>
  );
}
