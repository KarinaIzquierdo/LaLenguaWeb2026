import React, { useState, useEffect } from 'react';
import { financialService, type Venta, type EstadisticasFinancieras } from '../../services/financialService';
import './RegistroVentas.css';

const RegistroVentas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasFinancieras | null>(null);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    metodo_pago: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filtros.estado !== 'todos' || filtros.metodo_pago !== 'todos' || filtros.fecha_desde || filtros.fecha_hasta) {
      loadData();
    }
  }, [filtros]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ventasData, estadisticasData] = await Promise.all([
        financialService.getVentas(filtros.estado !== 'todos' || filtros.metodo_pago !== 'todos' || filtros.fecha_desde || filtros.fecha_hasta ? filtros : undefined),
        financialService.getEstadisticasFinancieras()
      ]);
      setVentas(ventasData);
      setEstadisticas(estadisticasData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (key: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(precio);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'pendiente': { class: 'warning', icon: '⏳', text: 'Pendiente' },
      'pagado': { class: 'success', icon: '✅', text: 'Pagado' },
      'cancelado': { class: 'danger', icon: '❌', text: 'Cancelado' },
      'reembolsado': { class: 'info', icon: '↩️', text: 'Reembolsado' }
    };
    const badge = badges[estado as keyof typeof badges] || badges.pendiente;
    return (
      <span className={`badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getMetodoPagoIcon = (metodo: string) => {
    const iconos = {
      'efectivo': '💵',
      'tarjeta_credito': '💳',
      'tarjeta_debito': '💳',
      'transferencia': '🏦',
      'paypal': '🅿️',
      'otro': '💰'
    };
    return iconos[metodo as keyof typeof iconos] || iconos.otro;
  };

  if (loading) {
    return (
      <div className="registro-ventas-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando registro de ventas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="registro-ventas-container">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadData} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registro-ventas-container">
      <header className="page-header">
        <h2>Registro de Ventas</h2>
        <p>Gestiona y visualiza todas las transacciones del sistema</p>
      </header>

      {/* Estadísticas */}
      {estadisticas && (
        <section className="estadisticas-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{estadisticas.total_ventas}</h3>
                <p>Total Ventas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{formatearPrecio(estadisticas.ingresos_totales)}</h3>
                <p>Ingresos Totales</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{formatearPrecio(estadisticas.ingresos_mes)}</h3>
                <p>Ingresos del Mes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{estadisticas.ventas_pendientes}</h3>
                <p>Ventas Pendientes</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filtros */}
      <section className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Estado:</label>
            <select 
              value={filtros.estado} 
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="cancelado">Cancelado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Método de Pago:</label>
            <select 
              value={filtros.metodo_pago} 
              onChange={(e) => handleFiltroChange('metodo_pago', e.target.value)}
            >
              <option value="todos">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="tarjeta_debito">Tarjeta de Débito</option>
              <option value="transferencia">Transferencia</option>
              <option value="paypal">PayPal</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Fecha Desde:</label>
            <input 
              type="date" 
              value={filtros.fecha_desde}
              onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
            />
          </div>
          
          <div className="filtro-group">
            <label>Fecha Hasta:</label>
            <input 
              type="date" 
              value={filtros.fecha_hasta}
              onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Tabla de Ventas */}
      <section className="ventas-section">
        <div className="section-header">
          <h3>Registro de Transacciones</h3>
          <div className="ventas-count">
            {ventas.length} venta{ventas.length !== 1 ? 's' : ''} encontrada{ventas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {ventas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h4>No hay ventas registradas</h4>
            <p>No se encontraron ventas con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="ventas-table-container">
            <table className="ventas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estudiante</th>
                  <th>Plan</th>
                  <th>Especialización</th>
                  <th>Total</th>
                  <th>Método Pago</th>
                  <th>Estado</th>
                  <th>Fecha Venta</th>
                  <th>Vendido Por</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td>#{venta.id}</td>
                    <td>
                      <div className="estudiante-info">
                        <div className="nombre">{venta.estudiante_nombre}</div>
                      </div>
                    </td>
                    <td>
                      <div className="plan-info">
                        <div className="nombre">{venta.plan_nombre}</div>
                      </div>
                    </td>
                    <td>
                      {venta.especializacion_nombre ? (
                        <span className="especializacion-badge">
                          {venta.especializacion_nombre}
                        </span>
                      ) : (
                        <span className="no-especializacion">Sin especialización</span>
                      )}
                    </td>
                    <td>
                      <div className="precio-info">
                        <div className="total">{formatearPrecio(venta.precio_total)}</div>
                        {venta.descuento > 0 && (
                          <div className="descuento">-{formatearPrecio(venta.descuento)}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="metodo-pago">
                        {getMetodoPagoIcon(venta.metodo_pago)} {venta.metodo_pago.replace('_', ' ')}
                      </div>
                    </td>
                    <td>{getEstadoBadge(venta.estado)}</td>
                    <td>
                      <div className="fecha-info">
                        <div className="fecha">{formatearFecha(venta.fecha_venta)}</div>
                        {venta.fecha_pago && venta.fecha_pago !== venta.fecha_venta && (
                          <div className="fecha-pago">Pagado: {formatearFecha(venta.fecha_pago)}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {venta.vendido_por_nombre ? (
                        <span className="vendedor">{venta.vendido_por_nombre}</span>
                      ) : (
                        <span className="no-vendedor">Sistema</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RegistroVentas;
