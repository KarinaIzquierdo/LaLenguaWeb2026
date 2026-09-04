import React, { useState, useEffect } from 'react';
import { financialService, type Plan } from '../../services/financialService';
import { especializacionService, type Especializacion as EspecializacionBackend } from '../../services/especializacionService';
import EditPlanModal from './EditPlanModal';
import './PlanesPrecios.css';

interface Especializacion {
  id: number;
  nombre: string;
  precio: number;
  duracion: string;
}

const PlanesPrecios: React.FC = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [especializaciones, setEspecializaciones] = useState<Especializacion[]>([]);
  const [selectedEspecializacion, setSelectedEspecializacion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planesData, especializacionesData] = await Promise.all([
        financialService.getPlanes(),
        especializacionService.getEspecializacionesActivas()
      ]);
      setPlanes(planesData);
      // Mapear especializaciones del backend al formato esperado por el componente
      setEspecializaciones(especializacionesData.map((esp: EspecializacionBackend) => ({
        id: esp.id,
        nombre: esp.nombre,
        precio: Number(esp.precio),
        duracion: esp.duracion
      })));
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar planes y especializaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowEditModal(true);
  };

  const handleTogglePlan = async (planId: number) => {
    try {
      await financialService.togglePlan(planId);
      await loadData(); // Recargar datos después del toggle
    } catch (err) {
      console.error('Error toggling plan:', err);
      setError('Error al cambiar estado del plan');
    }
  };

  const handleSavePlan = async (updatedPlan: Plan) => {
    try {
      if (editingPlan) {
        await financialService.updatePlan(editingPlan.id, updatedPlan);
      } else {
        await financialService.createPlan(updatedPlan);
      }
      await loadData();
      setShowEditModal(false);
      setEditingPlan(null);
    } catch (err) {
      console.error('Error saving plan:', err);
      setError('Error al guardar el plan');
    }
  };

  const calcularPrecioConEspecializacion = (precioBase: number | string, precioEspecializacion: number | string) => {
    return Number(precioBase || 0) + Number(precioEspecializacion || 0);
  };

  const getIconoPlan = (tipo: string) => {
    switch (tipo) {
      case 'basico': return '●';
      case 'especializado': return '🎯';
      case 'premium': return '';
      default: return '📚';
    }
  };

  const planBasico = planes.find(p => p.tipo === 'basico');
  const planPremium = planes.find(p => p.tipo === 'premium');
  const promedioEspecializacion = especializaciones.length > 0
    ? especializaciones.reduce((sum, e) => sum + e.precio, 0) / especializaciones.length
    : 0;
  const precioPromedio = planes.length > 0
    ? planes.reduce((sum, p) => sum + Number(p.precio_base), 0) / planes.length
    : 0;

  if (loading) {
    return (
      <div className="planes-precios-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="planes-precios-container">
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
    <div className="planes-precios-container">
      <header className="page-header">
        <div>
          <h2>Gestión de Planes y Precios</h2>
          <p>Administra los planes disponibles y sus precios para los estudiantes</p>
        </div>
        <button className="btn-primary" onClick={handleCreatePlan}>
          + Crear Nuevo Plan
        </button>
      </header>

      {/* Sección de Planes Base */}
      <section className="planes-section">
        <h3>Planes Base</h3>
        <div className="planes-grid">
          {planes.map((plan) => (
            <div 
              key={plan.id} 
              className={`plan-card ${!plan.activo ? 'inactive' : ''}`}
              style={{ '--plan-color': plan.color_tema } as React.CSSProperties}
            >
              <div className="plan-header">
                <div className="plan-info">
                  <h4>{plan.nombre}</h4>
                  <span className={`plan-badge ${plan.tipo}`}>{plan.tipo.toUpperCase()}</span>
                </div>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{Number(plan.precio_base).toLocaleString('es-CO')}</span>
                  <span className="period">/mes</span>
                </div>
              </div>

              <div className="plan-content compact">
                <div className="plan-stats compact">
                  <div className="stat">
                    <span className="stat-label">Duración:</span>
                    <span className="stat-value">{plan.duracion_meses} mes{plan.duracion_meses > 1 ? 'es' : ''}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Estado:</span>
                    <span className={`stat-badge ${plan.activo ? 'active' : 'inactive'}`}>
                      {plan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="plan-actions">
                <button 
                  className="btn-edit-plan"
                  onClick={() => handleEditPlan(plan)}
                >
                  Editar Plan
                </button>
                <button 
                  className={`btn-toggle-plan ${plan.activo ? 'deactivate' : 'activate'}`}
                  onClick={() => handleTogglePlan(plan.id)}
                >
                  {plan.activo ? '❌ Desactivar' : '✅ Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Especializaciones */}
      <section className="especializaciones-section">
        <h3>Especializaciones Disponibles</h3>
        <div className="especializaciones-grid">
          {especializaciones.map((esp) => (
            <div key={esp.id} className="especializacion-card">
              <div className="esp-header">
                <h4>{esp.nombre}</h4>
                <div className="esp-price">
                  <span>+${Number(esp.precio).toLocaleString('es-CO')}</span>
                </div>
              </div>
              <div className="esp-content">
                <div className="esp-duration">
                  <span>📅 {esp.duracion}</span>
                </div>
                <div className="esp-calculation">
                  <h5>Precio con Plan Básico:</h5>
                  <div className="calculation">
                    <span>${Number(planes[0]?.precio_base || 0).toLocaleString('es-CO')}</span>
                    <span className="plus">+</span>
                    <span>${Number(esp.precio).toLocaleString('es-CO')}</span>
                    <span className="equals">=</span>
                    <span className="total">${Number(calcularPrecioConEspecializacion(planes[0]?.precio_base || 0, esp.precio)).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Resumen Financiero */}
      <section className="resumen-section">
        <h3>Resumen de Precios</h3>
        <div className="resumen-grid">
          <div className="resumen-card">
            <h4>💰 Ingresos Potenciales</h4>
            <div className="resumen-content">
              <div className="resumen-item">
                <span>Plan Básico (mensual):</span>
                <span className="price">${planBasico ? Number(planBasico.precio_base).toLocaleString('es-CO') : 0}</span>
              </div>
              <div className="resumen-item">
                <span>Plan + Especialización (promedio):</span>
                <span className="price">${(planBasico && promedioEspecializacion > 0) ? (Number(planBasico.precio_base) + promedioEspecializacion).toLocaleString('es-CO') : 0}</span>
              </div>
              <div className="resumen-item">
                <span>Plan Premium:</span>
                <span className="price">${planPremium ? Number(planPremium.precio_base).toLocaleString('es-CO') : 0}</span>
              </div>
            </div>
          </div>

          <div className="resumen-card">
            <h4>📊 Estadísticas</h4>
            <div className="resumen-content">
              <div className="resumen-item">
                <span>Planes activos:</span>
                <span className="count">{planes.filter(p => p.activo).length}</span>
              </div>
              <div className="resumen-item">
                <span>Especializaciones:</span>
                <span className="count">{especializaciones.length}</span>
              </div>
              <div className="resumen-item">
                <span>Precio promedio:</span>
                <span className="price">${precioPromedio.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Edición */}
      <EditPlanModal
        plan={editingPlan}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
      />
    </div>
  );
};

export default PlanesPrecios;
