import React, { useState, useEffect } from 'react';
import { type Plan } from '../../services/financialService';
import './EditPlanModal.css';

interface EditPlanModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlan: Plan) => void;
}

interface PlanFormData {
  id?: number;
  nombre?: string;
  tipo?: 'basico' | 'especializado' | 'premium';
  descripcion?: string;
  precio_base?: number | '';
  duracion_meses?: number;
  caracteristicas?: string[];
  activo?: boolean;
  color_tema?: string;
  created_at?: string;
  updated_at?: string;
}

const formatPrecioInput = (value: number | '') => {
  if (value === '' || value === 0) return '';
  return value.toLocaleString('es-CO');
};

const parsePrecioInput = (value: string): number | '' => {
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return isNaN(parsed) || cleaned === '' ? '' : parsed;
};

const EditPlanModal: React.FC<EditPlanModalProps> = ({ plan, isOpen, onClose, onSave }) => {
  const isCreating = !plan;
  const [formData, setFormData] = useState<PlanFormData>({
    nombre: '',
    tipo: 'basico',
    descripcion: '',
    precio_base: '',
    duracion_meses: 1,
    caracteristicas: [],
    activo: true,
    color_tema: '#2563eb'
  });
  const [precioInput, setPrecioInput] = useState('');
  const [newCaracteristica, setNewCaracteristica] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        nombre: plan.nombre,
        tipo: plan.tipo,
        descripcion: plan.descripcion,
        precio_base: plan.precio_base,
        duracion_meses: plan.duracion_meses,
        caracteristicas: [...plan.caracteristicas],
        activo: plan.activo,
        color_tema: plan.color_tema
      });
      setPrecioInput(formatPrecioInput(plan.precio_base));
    } else {
      setFormData({
        nombre: '',
        tipo: 'basico',
        descripcion: '',
        precio_base: '',
        duracion_meses: 1,
        caracteristicas: [],
        activo: true,
        color_tema: '#2563eb'
      });
      setPrecioInput('');
    }
  }, [plan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrecioInput(value);
    setFormData(prev => ({
      ...prev,
      precio_base: parsePrecioInput(value)
    }));
  };

  const handlePrecioBlur = () => {
    setPrecioInput(formatPrecioInput(formData.precio_base || ''));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const addCaracteristica = () => {
    if (newCaracteristica.trim()) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...(prev.caracteristicas || []), newCaracteristica.trim()]
      }));
      setNewCaracteristica('');
    }
  };

  const removeCaracteristica = (index: number) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precioFinal = formData.precio_base === '' ? 0 : Number(formData.precio_base);
    if (formData.nombre && precioFinal > 0) {
      onSave({
        ...(plan || {}),
        ...formData,
        precio_base: precioFinal
      } as Plan);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isCreating ? '➕ Crear Nuevo Plan' : '✏️ Editar Plan'}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-plan-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre del Plan *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Plan Premium"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tipo">Tipo de Plan</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
              >
                <option value="basico">Básico</option>
                <option value="especializado">Especializado</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="precio_base">Precio Base (COP) *</label>
              <input
                type="text"
                id="precio_base"
                name="precio_base"
                value={precioInput}
                onChange={handlePrecioChange}
                onBlur={handlePrecioBlur}
                required
                inputMode="numeric"
                placeholder="180000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duracion_meses">Duración (meses)</label>
              <input
                type="number"
                id="duracion_meses"
                name="duracion_meses"
                value={formData.duracion_meses}
                onChange={handleInputChange}
                min="1"
                max="12"
              />
            </div>

            <div className="form-group">
              <label htmlFor="color_tema">Color del Tema</label>
              <input
                type="color"
                id="color_tema"
                name="color_tema"
                value={formData.color_tema}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleCheckboxChange}
                />
                Plan activo (visible para usuarios)
              </label>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe las ventajas y beneficios de este plan..."
            />
          </div>

          <div className="form-group full-width">
            <label>Características del Plan</label>
            <div className="caracteristicas-input">
              <input
                type="text"
                value={newCaracteristica}
                onChange={(e) => setNewCaracteristica(e.target.value)}
                placeholder="Agregar nueva característica..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCaracteristica())}
              />
              <button type="button" onClick={addCaracteristica} className="add-btn">
                ➕ Agregar
              </button>
            </div>
            
            <div className="caracteristicas-list">
              {formData.caracteristicas?.map((caracteristica, index) => (
                <div key={index} className="caracteristica-item">
                  <span>✓ {caracteristica}</span>
                  <button
                    type="button"
                    onClick={() => removeCaracteristica(index)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn">
              💾 {isCreating ? 'Crear Plan' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;
