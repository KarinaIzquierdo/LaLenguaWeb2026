import React, { useState, useEffect } from 'react';
import { subscriptionService, type Usuario, type Plan, type Suscripcion } from '../../services/subscriptionService';
import './GestionSuscripciones.css';

const GestionSuscripciones: React.FC = () => {
  const [usuariosSinPlan, setUsuariosSinPlan] = useState<Usuario[]>([]);
  const [planesPorVencer, setPlanesPorVencer] = useState<Suscripcion[]>([]);
  const [suscripcionesActivas, setSuscripcionesActivas] = useState<Suscripcion[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para asignar plan
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, planesVencerData, suscripcionesData, planesData] = await Promise.all([
        subscriptionService.getUsuariosSinPlan(),
        subscriptionService.getPlanesPorVencer(7), // 7 días de aviso
        subscriptionService.getSuscripcionesActivas(),
        subscriptionService.getPlanes()
      ]);
      
      setUsuariosSinPlan(usuariosData);
      setPlanesPorVencer(planesVencerData);
      setSuscripcionesActivas(suscripcionesData);
      setPlanes(planesData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarPlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    
    try {
      await subscriptionService.asignarPlan({
        user_id: selectedUser.id,
        plan_id: selectedPlan,
        metodo_pago: metodoPago,
        descuento: descuento,
        notas: notas
      });
      
      // Resetear formulario
      setShowAsignarModal(false);
      setSelectedUser(null);
      setSelectedPlan(null);
      setMetodoPago('efectivo');
      setDescuento(0);
      setNotas('');
      
      // Recargar datos
      await loadData();
      
      alert('Plan asignado exitosamente');
    } catch (err) {
      console.error('Error assigning plan:', err);
      alert('Error al asignar el plan');
    }
  };

  const handleEnviarRecordatorio = async (suscripcion: Suscripcion) => {
    try {
      await subscriptionService.enviarRecordatorio(suscripcion.id);
      alert(`Recordatorio enviado a ${suscripcion.estudiante_nombre}`);
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Error al enviar recordatorio');
    }
  };

  const handleRenovarPlan = async (suscripcion: Suscripcion) => {
    try {
      await subscriptionService.renovarPlan(suscripcion.id);
      await loadData();
      alert(`Plan renovado para ${suscripcion.estudiante_nombre}`);
    } catch (err) {
      console.error('Error renewing plan:', err);
      alert('Error al renovar plan');
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularDiasRestantes = (fechaFin: string) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  if (loading) {
    return (
      <div className="gestion-suscripciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando gestión de suscripciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-suscripciones-container">
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
    <div className="gestion-suscripciones-container">
      <header className="page-header">
        <h2>👥 Gestión de Suscripciones</h2>
        <p>Asigna planes, controla vencimientos y gestiona renovaciones</p>
      </header>

      {/* Estadísticas Rápidas */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{usuariosSinPlan.length}</h3>
              <p>Usuarios sin Plan</p>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{planesPorVencer.length}</h3>
              <p>Planes por Vencer</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{suscripcionesActivas.length}</h3>
              <p>Suscripciones Activas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Usuarios sin Plan */}
      <section className="usuarios-sin-plan-section">
        <div className="section-header">
          <h3>👤 Usuarios sin Plan Activo</h3>
          <span className="count">{usuariosSinPlan.length} usuarios</span>
        </div>
        
        {usuariosSinPlan.length === 0 ? (
          <div className="empty-state">
            <p>🎉 ¡Todos los usuarios tienen planes activos!</p>
          </div>
        ) : (
          <div className="usuarios-grid">
            {usuariosSinPlan.map((usuario) => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-info">
                  <h4>{usuario.first_name} {usuario.last_name}</h4>
                  <p>{usuario.email}</p>
                  <span className="fecha-registro">
                    Registrado: {formatearFecha(usuario.date_joined)}
                  </span>
                </div>
                <button 
                  className="btn-asignar"
                  onClick={() => {
                    setSelectedUser(usuario);
                    setShowAsignarModal(true);
                  }}
                >
                  📋 Asignar Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Planes por Vencer */}
      <section className="planes-vencer-section">
        <div className="section-header">
          <h3>⏰ Planes por Vencer (próximos 7 días)</h3>
          <span className="count">{planesPorVencer.length} planes</span>
        </div>
        
        {planesPorVencer.length === 0 ? (
          <div className="empty-state">
            <p>✅ No hay planes por vencer en los próximos 7 días</p>
          </div>
        ) : (
          <div className="planes-vencer-table">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Plan</th>
                  <th>Vence</th>
                  <th>Días Restantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planesPorVencer.map((suscripcion) => {
                  const diasRestantes = calcularDiasRestantes(suscripcion.fecha_fin_plan);
                  return (
                    <tr key={suscripcion.id} className={diasRestantes <= 3 ? 'urgente' : 'warning'}>
                      <td>
                        <div className="usuario-cell">
                          <strong>{suscripcion.estudiante_nombre}</strong>
                        </div>
                      </td>
                      <td>{suscripcion.plan_nombre}</td>
                      <td>{formatearFecha(suscripcion.fecha_fin_plan)}</td>
                      <td>
                        <span className={`dias-badge ${diasRestantes <= 3 ? 'critico' : 'warning'}`}>
                          {diasRestantes} días
                        </span>
                      </td>
                      <td>
                        <div className="acciones-cell">
                          <button 
                            className="btn-recordatorio"
                            onClick={() => handleEnviarRecordatorio(suscripcion)}
                          >
                            📧 Recordatorio
                          </button>
                          <button 
                            className="btn-renovar"
                            onClick={() => handleRenovarPlan(suscripcion)}
                          >
                            🔄 Renovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Suscripciones Activas */}
      <section className="suscripciones-activas-section">
        <div className="section-header">
          <h3>✅ Suscripciones Activas</h3>
          <span className="count">{suscripcionesActivas.length} activas</span>
        </div>
        
        <div className="suscripciones-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Plan</th>
                <th>Inicio</th>
                <th>Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {suscripcionesActivas.slice(0, 10).map((suscripcion) => (
                <tr key={suscripcion.id}>
                  <td>{suscripcion.estudiante_nombre}</td>
                  <td>{suscripcion.plan_nombre}</td>
                  <td>{formatearFecha(suscripcion.fecha_inicio_plan)}</td>
                  <td>{formatearFecha(suscripcion.fecha_fin_plan)}</td>
                  <td>
                    <span className="estado-activo">Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Asignar Plan */}
      {showAsignarModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📋 Asignar Plan a {selectedUser.first_name} {selectedUser.last_name}</h3>
              <button 
                className="close-button"
                onClick={() => setShowAsignarModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Plan:</label>
                <select 
                  value={selectedPlan || ''} 
                  onChange={(e) => setSelectedPlan(Number(e.target.value))}
                >
                  <option value="">Seleccionar plan...</option>
                  {planes.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio_base.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Método de Pago:</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Descuento (COP):</label>
                <input 
                  type="number" 
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label>Notas:</label>
                <textarea 
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowAsignarModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirm"
                onClick={handleAsignarPlan}
                disabled={!selectedPlan}
              >
                💾 Asignar Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSuscripciones;
