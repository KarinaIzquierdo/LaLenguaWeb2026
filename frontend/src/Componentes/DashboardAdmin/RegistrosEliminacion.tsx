import { useState, useEffect } from 'react';
import './RegistrosEliminacion.css';

interface RegistroEliminacion {
  id: number;
  nombre_completo: string;
  email: string;
  username: string;
  cedula: string;
  nivel: string;
  bloque_asignado: string;
  fecha_registro: string;
  fecha_eliminacion: string;
  tiempo_registrado_str: string;
  razon: string;
  razon_display: string;
  descripcion_adicional: string;
  plan_activo: string;
  deuda_pendiente: string;
  eliminado_por: {
    id: number;
    username: string;
    nombre: string;
  } | null;
  notas: string;
}

interface Estadisticas {
  total_eliminaciones: number;
  por_razon: Record<string, { count: number; display: string }>;
  promedio_dias_registrado: number;
  total_deuda_pendiente: number;
}

export default function RegistrosEliminacion() {
  const [registros, setRegistros] = useState<RegistroEliminacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroRazon, setFiltroRazon] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroEliminacion | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [filtroRazon, busqueda]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir URL con filtros
      let url = 'http://127.0.0.1:8000/api/registros-eliminacion/';
      const params = new URLSearchParams();
      if (filtroRazon) params.append('razon', filtroRazon);
      if (busqueda) params.append('search', busqueda);
      if (params.toString()) url += `?${params.toString()}`;

      const [registrosRes, estadisticasRes] = await Promise.all([
        fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/api/registros-eliminacion/estadisticas/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const registrosData = await registrosRes.json();
      const estadisticasData = await estadisticasRes.json();

      if (registrosData.success) {
        setRegistros(registrosData.registros);
      }

      if (estadisticasData.success) {
        setEstadisticas(estadisticasData.estadisticas);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="registros-eliminacion-container">
        <div className="loading-registros">
          <div className="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registros-eliminacion-container">
      <div className="registros-header">
        <h1>📋 Registros de Eliminación</h1>
        <p>Historial de estudiantes eliminados del sistema</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{estadisticas.total_eliminaciones}</h3>
              <p>Total Eliminaciones</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{estadisticas.promedio_dias_registrado}</h3>
              <p>Promedio Días Registrado</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${estadisticas.total_deuda_pendiente.toFixed(2)}</h3>
              <p>Deuda Total Pendiente</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-registros">
        <div className="filtro-group">
          <label>🔍 Buscar</label>
          <input
            type="text"
            placeholder="Nombre, email, cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-group">
          <label>📊 Filtrar por razón</label>
          <select value={filtroRazon} onChange={(e) => setFiltroRazon(e.target.value)}>
            <option value="">Todas las razones</option>
            <option value="termino_clases">Terminó sus clases</option>
            <option value="no_pago">No realizó el pago</option>
            <option value="abandono">Abandonó el curso</option>
            <option value="solicitud_propia">Solicitud del estudiante</option>
            <option value="comportamiento">Problemas de comportamiento</option>
            <option value="cambio_horario">No se adaptó al horario</option>
            <option value="otro">Otra razón</option>
          </select>
        </div>
      </div>

      {/* Lista de registros */}
      <div className="registros-lista">
        {registros.length === 0 ? (
          <div className="no-registros">
            <p>📭 No hay registros de eliminación</p>
          </div>
        ) : (
          registros.map(registro => (
            <div key={registro.id} className="registro-card" onClick={() => setRegistroSeleccionado(registro)}>
              <div className="registro-header-card">
                <div className="registro-info">
                  <h3>{registro.nombre_completo}</h3>
                  <p className="registro-email">{registro.email}</p>
                </div>
                <div className={`razon-badge razon-${registro.razon}`}>
                  {registro.razon_display}
                </div>
              </div>

              <div className="registro-detalles">
                <div className="detalle-item">
                  <span className="detalle-label">Nivel:</span>
                  <span className="detalle-value">{registro.nivel || 'N/A'}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Tiempo registrado:</span>
                  <span className="detalle-value">{registro.tiempo_registrado_str}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Fecha eliminación:</span>
                  <span className="detalle-value">{formatearFecha(registro.fecha_eliminacion)}</span>
                </div>
                {registro.deuda_pendiente !== '0.00' && (
                  <div className="detalle-item">
                    <span className="detalle-label">Deuda:</span>
                    <span className="detalle-value deuda">${registro.deuda_pendiente}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalles */}
      {registroSeleccionado && (
        <div className="modal-overlay-detalle" onClick={() => setRegistroSeleccionado(null)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalle">
              <h2>Detalles del Registro</h2>
              <button className="btn-close-detalle" onClick={() => setRegistroSeleccionado(null)}>✕</button>
            </div>

            <div className="modal-body-detalle">
              <div className="seccion-detalle">
                <h3>👤 Información del Estudiante</h3>
                <div className="info-grid">
                  <div><strong>Nombre:</strong> {registroSeleccionado.nombre_completo}</div>
                  <div><strong>Email:</strong> {registroSeleccionado.email}</div>
                  <div><strong>Username:</strong> {registroSeleccionado.username}</div>
                  <div><strong>Cédula:</strong> {registroSeleccionado.cedula || 'N/A'}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>📚 Información Académica</h3>
                <div className="info-grid">
                  <div><strong>Nivel:</strong> {registroSeleccionado.nivel || 'N/A'}</div>
                  <div><strong>Bloque:</strong> {registroSeleccionado.bloque_asignado || 'N/A'}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>📅 Fechas</h3>
                <div className="info-grid">
                  <div><strong>Registro:</strong> {formatearFecha(registroSeleccionado.fecha_registro)}</div>
                  <div><strong>Eliminación:</strong> {formatearFecha(registroSeleccionado.fecha_eliminacion)}</div>
                  <div><strong>Duración:</strong> {registroSeleccionado.tiempo_registrado_str}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>⚠️ Razón de Eliminación</h3>
                <div className={`razon-badge-large razon-${registroSeleccionado.razon}`}>
                  {registroSeleccionado.razon_display}
                </div>
                {registroSeleccionado.descripcion_adicional && (
                  <p className="descripcion-adicional">{registroSeleccionado.descripcion_adicional}</p>
                )}
              </div>

              {(registroSeleccionado.plan_activo || registroSeleccionado.deuda_pendiente !== '0.00') && (
                <div className="seccion-detalle">
                  <h3>💰 Información Financiera</h3>
                  <div className="info-grid">
                    {registroSeleccionado.plan_activo && (
                      <div><strong>Plan:</strong> {registroSeleccionado.plan_activo}</div>
                    )}
                    {registroSeleccionado.deuda_pendiente !== '0.00' && (
                      <div><strong>Deuda:</strong> <span className="deuda">${registroSeleccionado.deuda_pendiente}</span></div>
                    )}
                  </div>
                </div>
              )}

              {registroSeleccionado.eliminado_por && (
                <div className="seccion-detalle">
                  <h3>👨‍💼 Eliminado por</h3>
                  <p>{registroSeleccionado.eliminado_por.nombre}</p>
                </div>
              )}

              {registroSeleccionado.notas && (
                <div className="seccion-detalle">
                  <h3>📝 Notas del Administrador</h3>
                  <p className="notas-admin">{registroSeleccionado.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
