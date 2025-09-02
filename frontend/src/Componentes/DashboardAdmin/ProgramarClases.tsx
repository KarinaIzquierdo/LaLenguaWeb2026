/**
 * @file ProgramarClases.jsx
 * @brief Componente para la gestión de clases (crear, leer, actualizar, eliminar).
 * @author [Tu Nombre]
 * @version 1.0
 * @date [Fecha]
 */
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSpinner } from 'react-icons/fa';
import { ClaseService } from '../../services/claseService';

/**
 * @component ProgramarClases
 * @brief Componente principal que renderiza la interfaz de gestión de clases.
 * 
 * Maneja el estado de las clases, la visualización del formulario y las
 * operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para las clases.
 * 
 * @returns {JSX.Element} El componente de gestión de clases.
 */

interface Clase {
  id: number;
  nombre: string;
  profesor: string;
  fecha: string;
  estudiantes?: string[];
}

interface FormData {
  nombre: string;
  profesor: string;
  fecha: string;
  estudiantes: string[];
}

interface FormErrors {
  nombre?: string;
  profesor?: string;
  fecha?: string;
  estudiantes?: string;
}

const usuariosSimulados = [
  { id: '1', nombre: 'Ana García', nivel: 'Intermedio' },
  { id: '2', nombre: 'Carlos López', nivel: 'Básico' },
  { id: '3', nombre: 'María Rodríguez', nivel: 'Avanzado' },
  { id: '4', nombre: 'Pedro Martín', nivel: 'Intermedio' },
  { id: '5', nombre: 'Laura Silva', nivel: 'Básico' }
];

export default function ProgramarClases() {
  /**
   * @state {Array<Object>} clases - Lista de todas las clases.
   */
  const [clases, setClases] = useState<Clase[]>([]);

  /**
   * @state {boolean} showForm - Controla la visibilidad del formulario de creación/edición.
   */
  const [showForm, setShowForm] = useState<boolean>(false);

  /**
   * @state {Object|null} editingClass - Almacena la clase que se está editando. Null si se crea una nueva.
   */
  const [editingClass, setEditingClass] = useState<Clase | null>(null);

  /**
   * @state {boolean} isLoading - Indica si una operación asíncrona está en curso.
   */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * @state {Object} formData - Almacena los datos del formulario para una clase.
   */
  const [formData, setFormData] = useState<FormData>({ nombre: '', profesor: '', fecha: '', estudiantes: [] });

  /**
   * @state {Object} formErrors - Almacena los errores de validación del formulario.
   */
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /**
   * @function validateForm
   * @brief Valida los datos del formulario antes de enviarlo.
   * @returns {Object} Un objeto que contiene los mensajes de error.
   */
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre de la clase es obligatorio';
    if (!formData.profesor.trim()) errors.profesor = 'El nombre del profesor es obligatorio';
    if (!formData.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!formData.estudiantes || formData.estudiantes.length === 0) errors.estudiantes = 'Debes seleccionar al menos un estudiante';
    return errors;
  };

  /**
   * @function handleChange
   * @brief Maneja los cambios en los campos del formulario y actualiza el estado.
   * @param {React.ChangeEvent<HTMLInputElement>} e - El evento del cambio.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * @function handleEstudiantesChange
   * @brief Maneja los cambios en la selección de estudiantes.
   * @param {string} id - El ID del estudiante.
   */
  const handleEstudiantesChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      estudiantes: prev.estudiantes.includes(id)
        ? prev.estudiantes.filter(eid => eid !== id)
        : [...prev.estudiantes, id]
    }));
    if (formErrors.estudiantes) {
      setFormErrors((prev) => ({ ...prev, estudiantes: '' }));
    }
  };

  /**
   * @function handleAddClassClick
   * @brief Muestra el formulario para agregar una nueva clase.
   */
  const handleAddClassClick = () => {
    setShowForm(true);
    setEditingClass(null);
    setFormData({ nombre: '', profesor: '', fecha: '', estudiantes: [] });
    setFormErrors({});
  };

  /**
   * @function handleEditClass
   * @brief Carga los datos de una clase en el formulario para su edición.
   * @param {Object} clase - La clase a editar.
   */
  const handleEditClass = (clase: Clase) => {
    setShowForm(true);
    setEditingClass(clase);
    setFormData({
      nombre: clase.nombre,
      profesor: clase.profesor,
      fecha: clase.fecha,
      estudiantes: clase.estudiantes || []
    });
    setFormErrors({});
  };

  /**
   * @function handleDeleteClass
   * @brief Elimina una clase de la lista.
   * @param {number} classId - El ID de la clase a eliminar.
   */
  const handleDeleteClass = async (classId: number) => {
    setIsLoading(true);
    try {
      await ClaseService.deleteClase(classId);
      const data = await ClaseService.getClases();
      setClases(data);
    } catch (err) {
      // Puedes mostrar un error aquí si lo deseas
    }
    setIsLoading(false);
  };

  /**
   * @function handleSubmit
   * @brief Maneja el envío del formulario para crear o actualizar una clase.
   * @param {React.FormEvent<HTMLFormElement>} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      if (editingClass) {
        await ClaseService.updateClase(editingClass.id, formData);
      } else {
        await ClaseService.createClase(formData);
      }
      const data = await ClaseService.getClases();
      setClases(data);
      setShowForm(false);
      setEditingClass(null);
      setFormErrors({});
    } catch (err) {
      // Puedes mostrar un error aquí si lo deseas
    }
    setIsLoading(false);
  };

  /**
   * @function handleCancel
   * @brief Cancela la operación de edición o creación y oculta el formulario.
   */
  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormErrors({});
  };

  // Cargar clases desde el backend al montar el componente
  useEffect(() => {
    const fetchClases = async () => {
      setIsLoading(true);
      try {
        const data = await ClaseService.getClases();
        setClases(data);
      } catch (err) {
        // Puedes mostrar un error aquí si lo deseas
      }
      setIsLoading(false);
    };
    fetchClases();
  }, []);

  return (
    <div className="gestion-container">
      <div className="dashboard-header">
        <h2>Gestión de Clases</h2>
        <p>Crea, edita y administra las clases programadas.</p>
      </div>

      {!showForm && (
        <button 
          onClick={handleAddClassClick} 
          className="add-user-btn"
          disabled={isLoading}
        >
          <FaPlus />
          Agregar Clase
        </button>
      )}

      {showForm ? (
        <div className="form-container">
          <h3>{editingClass ? 'Editar Clase' : 'Agregar Nueva Clase'}</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className={`form-group ${formErrors.nombre ? 'error' : ''}`}>
              <label htmlFor="nombre">Nombre de la Clase *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Introduccion C1"
                required
              />
              {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
            </div>

            <div className={`form-group ${formErrors.profesor ? 'error' : ''}`}>
              <label htmlFor="profesor">Nombre del Profesor *</label>
              <input
                type="text"
                id="profesor"
                name="profesor"
                value={formData.profesor}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                required
              />
              {formErrors.profesor && <span className="error-message">{formErrors.profesor}</span>}
            </div>

            <div className={`form-group ${formErrors.fecha ? 'error' : ''}`}>
              <label htmlFor="fecha">Fecha de la Clase *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
              {formErrors.fecha && <span className="error-message">{formErrors.fecha}</span>}
            </div>

            <div className={`form-group ${formErrors.estudiantes ? 'error' : ''}`}>
              <label>Selecciona Estudiantes *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {usuariosSimulados.map((usuario) => (
                  <label key={usuario.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={formData.estudiantes.includes(usuario.id)}
                      onChange={() => handleEstudiantesChange(usuario.id)}
                    />
                    {usuario.nombre} <span style={{ fontSize: '12px', color: '#888' }}>({usuario.nivel})</span>
                  </label>
                ))}
              </div>
              {formErrors.estudiantes && <span className="error-message">{formErrors.estudiantes}</span>}
            </div>

            <div className="button-group">
              <button type="submit" className="form-submit-btn" disabled={isLoading}>
                {isLoading ? <FaSpinner className="loading-spinner" /> : (editingClass ? 'Guardar Cambios' : 'Agregar Clase')}
              </button>
              <button type="button" className="form-cancel-btn" onClick={handleCancel} disabled={isLoading}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="list-container">
          <h3>Lista de Clases</h3>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre de la Clase</th>
                <th>Profesor</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clases.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.id}</td>
                  <td>{clase.nombre}</td>
                  <td>{clase.profesor}</td>
                  <td>{clase.fecha}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEditClass(clase)} className="action-btn edit-btn" disabled={isLoading}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteClass(clase.id)} className="action-btn delete-btn" disabled={isLoading}>
                      {isLoading ? <FaSpinner className="loading-spinner" /> : <FaTrash />}
                    </button>
                  </td>
                </tr>
              ))}
              {clases.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay clases registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
