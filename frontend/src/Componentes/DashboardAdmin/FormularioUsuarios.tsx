/**
 * @file FormularioUsuarios.jsx
 * @brief Componente para la gestión de usuarios (crear, leer, actualizar, activar/desactivar).
 */

import "./formulario-usuarios.css";
import React, { useState, useEffect } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSpinner } from 'react-icons/fa';
import { userService } from '../../services/userService';
import type { RegisterData } from '../../services/userService';
import { rolMapFrontendToBackend } from '../../services/rolMap';
import { bloqueService, type Bloque } from '../../services/bloqueService';
import { especializacionService, type Especializacion } from '../../services/especializacionService';

/**
 * @component FormularioUsuarios
 * @brief Componente principal que renderiza la interfaz de gestión de usuarios.
 * 
 * Maneja el estado de los usuarios, la visualización del formulario y las
 * operaciones CRUD (Crear, Leer, Actualizar) para los usuarios.
 * 
 * @returns {JSX.Element} El componente de gestión de usuarios.
 */

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  activo: boolean;
  bloque_asignado?: string;
  especializacion_id?: number;
}

interface FormErrors {
  [key: string]: string;
}

export default function FormularioUsuarios() {
  /**
   * @state {Array<Object>} users - Lista de usuarios.
   */
  const [users, setUsers] = useState<Usuario[]>([]);

  /**
   * @state {boolean} showForm - Controla la visibilidad del formulario de creación/edición.
   */
  const [showForm, setShowForm] = useState<boolean>(false);

  /**
   * @state {Object|null} editingUser - Almacena el usuario que se está editando. Null si se crea un nuevo usuario.
   */
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  /**
   * @state {boolean} isLoading - Estado de carga para operaciones asíncronas.
   */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * @state {Object} formData - Estado para los datos del formulario.
   */
  const [formData, setFormData] = useState<Omit<Usuario, 'id' | 'activo'> & { contrasena: string }>({
    nombres: '',
    apellidos: '',
    correo: '',
    rol: 'Estudiante',
    contrasena: '',
    bloque_asignado: '',
    especializacion_id: undefined,
  });

  /**
   * @state {Array<Bloque>} bloques - Lista de bloques disponibles.
   */
  const [bloques, setBloques] = useState<Bloque[]>([]);

  /**
   * @state {Array<Especializacion>} especializaciones - Lista de especializaciones disponibles.
   */
  const [especializaciones, setEspecializaciones] = useState<Especializacion[]>([]);

  // Cargar bloques y especializaciones al montar el componente
  useEffect(() => {
    const bloquesDisponibles = bloqueService.getBloques();
    setBloques(bloquesDisponibles);
    
    const cargarEspecializaciones = async () => {
      try {
        const especializacionesDisponibles = await especializacionService.getEspecializacionesActivas();
        setEspecializaciones(especializacionesDisponibles);
      } catch (error) {
        console.error('Error al cargar especializaciones:', error);
        setEspecializaciones([]);
      }
    };
    
    cargarEspecializaciones();
  }, []);

  /**
   * @state {Object} formErrors - Estado para los errores de validación del formulario.
   */
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /**
   * @function validateForm
   * @brief Valida los campos del formulario.
   * @returns {Object} Objeto con los errores encontrados.
   */
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!formData.nombres.trim()) {
      errors.nombres = 'El nombre es obligatorio';
    }
    
    if (!formData.apellidos.trim()) {
      errors.apellidos = 'Los apellidos son obligatorios';
    }
    
    if (!formData.correo.trim()) {
      errors.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      errors.correo = 'El formato del correo no es válido';
    }
    
    if (!editingUser && !formData.contrasena.trim()) {
      errors.contrasena = 'La contraseña es obligatoria';
    } else if (!editingUser && formData.contrasena.length < 8) {
      errors.contrasena = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    return errors;
  };

  /**
   * @function handleChange
   * @brief Maneja los cambios en los campos del formulario.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - El evento de cambio.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'rol') {
      let dominio = '@thelanguage.co';
      if (value === 'Profesor') {
        dominio = '@soy.thelanguage.co';
      } else if (value === 'Admin') {
        dominio = '@thelanguage.co';
      }
      // Solo deja la parte antes de la arroba
      let correoBase = formData.correo.split('@')[0];
      setFormData(prev => ({
        ...prev,
        rol: value,
        correo: correoBase ? correoBase + dominio : '',
      }));
    } else if (name === 'correo') {
      // Solo deja la parte antes de la arroba
      let correoBase = value.split('@')[0];
      let dominio = '@thelanguage.co';
      if (formData.rol === 'Profesor') {
        dominio = '@soy.thelanguage.co';
      } else if (formData.rol === 'Admin') {
        dominio = '@thelanguage.co';
      }
      setFormData(prev => ({
        ...prev,
        correo: correoBase ? correoBase + dominio : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * @function handleAddUserClick
   * @brief Muestra el formulario para agregar un nuevo usuario y resetea los campos.
   */
  const handleAddUserClick = () => {
    setShowForm(true);
    setEditingUser(null);
    setFormData({
      nombres: '',
      apellidos: '',
      correo: '',
      rol: 'Estudiante',
      contrasena: '',
      bloque_asignado: '',
      especializacion_id: undefined,
    });
    setFormErrors({});
  };

  /**
   * @function handleEditUser
   * @brief Muestra el formulario para editar un usuario existente y carga sus datos.
   * @param {Object} user - El objeto del usuario a editar.
   */
  const handleEditUser = (user: Usuario) => {
    setShowForm(true);
    setEditingUser(user);
    setFormData({
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      rol: user.rol,
      contrasena: '', // Contraseña no se edita directamente aquí por seguridad
      bloque_asignado: user.bloque_asignado || '',
      especializacion_id: user.especializacion_id,
    });
    setFormErrors({});
  };

  /**
   * @function handleToggleActive
   * @brief Cambia el estado (activo/inactivo) de un usuario.
   * @param {number} userId - El ID del usuario a modificar.
   */
  const handleToggleActive = async (userId: number) => {
    setIsLoading(true);
    await userService.toggleActive(userId);
    // Refrescar usuarios desde backend
    const data = await userService.getAll();
    setUsers(data);
    setIsLoading(false);
  };

  /**
   * @function handleSubmit
   * @brief Maneja el envío del formulario para crear o actualizar un usuario.
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
    if (!editingUser) {
      // Registro en backend
      const registerData: RegisterData = {
        first_name: formData.nombres,
        last_name: formData.apellidos,
        email: formData.correo,
        role: rolMapFrontendToBackend[formData.rol],
        password: formData.contrasena,
        bloque_asignado: formData.bloque_asignado,
        especializacion: formData.especializacion_id || null,
      };
      const result = await userService.register(registerData);
      if (result.success) {
        // El bloque ya se guarda en el backend, no necesitamos localStorage
        // Refrescar usuarios desde backend
        try {
          const data = await userService.getAll();
          setUsers(data);
        } catch (error) {
          console.log('Usuario creado exitosamente, pero no se pudo refrescar la lista');
        }
        setShowForm(false);
        setEditingUser(null);
        setFormErrors({});
        
        // Resetear formulario
        setFormData({
          nombres: '',
          apellidos: '',
          correo: '',
          rol: 'Estudiante',
          contrasena: '',
          bloque_asignado: '',
          especializacion_id: undefined,
        });
      } else {
        setFormErrors(result.errors || { correo: result.message || 'Error al registrar usuario' });
      }
      setIsLoading(false);
      return;
    }
    // Simular una operación asíncrona para editar (debería ser llamada real al backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Refrescar usuarios desde backend
    const data = await userService.getAll();
    setUsers(data);
    setShowForm(false);
    setEditingUser(null);
    setFormErrors({});
    setIsLoading(false);
  };

  /**
   * @function handleCancel
   * @brief Cancela la operación de creación/edición y oculta el formulario.
   */
  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormErrors({});
  };

  // Cargar usuarios reales al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAll();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
        // Si hay error de autorización, mostrar mensaje
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="gestion-usuarios-container">
      <h2>Gestión de Usuarios</h2>

      <button 
        onClick={handleAddUserClick} 
        className="add-user-button"
        disabled={isLoading}
        aria-label="Agregar nuevo usuario"
      >
        {isLoading ? <FaSpinner className="loading-spinner" /> : <FaPlus />}
        Agregar Usuario
      </button>

      {!showForm && (
        <div className="users-table-container">
          <h3>Lista de Usuarios</h3>
          <div className="users-table-wrapper">
            <table className="users-table" role="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Bloque</th>
                  <th>Especialización</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{`${user.nombres} ${user.apellidos}`}</td>
                      <td>{user.correo}</td>
                      <td>{user.rol}</td>
                      <td>
                        <span className="bloque-badge">
                          {user.bloque_asignado || 'Sin asignar'}
                        </span>
                      </td>
                      <td>
                        <span className="especializacion-badge">
                          {user.especializacion_id 
                            ? especializaciones.find(esp => esp.id === user.especializacion_id)?.nombre || 'Sin asignar'
                            : 'Sin asignar'
                          }
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${user.activo ? 'status-active' : 'status-inactive'}`}
                          aria-label={user.activo ? 'Usuario activo' : 'Usuario inactivo'}
                        >
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleEditUser(user)} 
                        className="action-button edit-button"
                        disabled={isLoading}
                        aria-label={`Editar usuario ${user.nombres} ${user.apellidos}`}
                        title="Editar usuario"
                      >
                        <FaEdit />
                        <span>Editar</span>
                      </button>
                      <button 
                        onClick={() => handleToggleActive(user.id)} 
                        className={`action-button ${user.activo ? 'deactivate-button' : 'activate-button'}`}
                        disabled={isLoading}
                        aria-label={user.activo ? `Desactivar usuario ${user.nombres}` : `Activar usuario ${user.nombres}`}
                        title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {isLoading ? (
                          <FaSpinner className="loading-spinner" />
                        ) : user.activo ? (
                          <FaToggleOn />
                        ) : (
                          <FaToggleOff />
                        )}
                        <span>{user.activo ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulario para agregar o editar usuarios */}
      {showForm && (
        <form className="form-usuarios" onSubmit={handleSubmit} noValidate>
          <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          
          <div className={`form-field ${formErrors.nombres ? 'error' : ''}`}>
            <label htmlFor="nombres">Nombres *</label>
            <input
              type="text"
              id="nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Ingrese los nombres"
              required
              aria-describedby={formErrors.nombres ? "nombres-error" : undefined}
              aria-invalid={!!formErrors.nombres}
            />
            {formErrors.nombres && (
              <span id="nombres-error" className="error-message" role="alert">
                {formErrors.nombres}
              </span>
            )}
          </div>

          <div className={`form-field ${formErrors.apellidos ? 'error' : ''}`}>
            <label htmlFor="apellidos">Apellidos *</label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Ingrese los apellidos"
              required
              aria-describedby={formErrors.apellidos ? "apellidos-error" : undefined}
              aria-invalid={!!formErrors.apellidos}
            />
            {formErrors.apellidos && (
              <span id="apellidos-error" className="error-message" role="alert">
                {formErrors.apellidos}
              </span>
            )}
          </div>

          <div className={`form-field ${formErrors.correo ? 'error' : ''}`}>
            <label htmlFor="correo">Correo electrónico *</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@colegio.com"
              required
              aria-describedby={formErrors.correo ? "correo-error" : undefined}
              aria-invalid={!!formErrors.correo}
            />
            {formErrors.correo && (
              <span id="correo-error" className="error-message" role="alert">
                {formErrors.correo}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="rol">Rol *</label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="Estudiante">Estudiante</option>
              <option value="Profesor">Profesor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {formData.rol === 'Estudiante' && (
            <>
              <div className="form-field">
                <label htmlFor="bloque_asignado">Bloque Asignado</label>
                <select
                  id="bloque_asignado"
                  name="bloque_asignado"
                  value={formData.bloque_asignado}
                  onChange={handleChange}
                >
                  <option value="">Sin asignar</option>
                  {bloques.map((bloque) => (
                    <option key={bloque.id} value={bloque.id}>
                      {bloque.nivel} {bloque.turno}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-field">
                <label htmlFor="especializacion_id">Especialización</label>
                <select
                  id="especializacion_id"
                  name="especializacion_id"
                  value={formData.especializacion_id || ''}
                  onChange={handleChange}
                >
                  <option value="">Sin especialización</option>
                  {especializaciones.map((especializacion) => (
                    <option key={especializacion.id} value={especializacion.id}>
                      {especializacion.nombre} - {especializacion.duracion}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!editingUser && (
            <div className={`form-field ${formErrors.contrasena ? 'error' : ''}`}>
              <label htmlFor="contrasena">Contraseña *</label>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                aria-describedby={formErrors.contrasena ? "contrasena-error" : undefined}
                aria-invalid={!!formErrors.contrasena}
              />
              {formErrors.contrasena && (
                <span id="contrasena-error" className="error-message" role="alert">
                  {formErrors.contrasena}
                </span>
              )}
            </div>
          )}

          <div className="button-group">
            <button 
              type="submit" 
              disabled={isLoading}
              aria-label={editingUser ? 'Guardar cambios del usuario' : 'Crear nuevo usuario'}
            >
              {isLoading && <FaSpinner className="loading-spinner" />}
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={isLoading}
              aria-label="Cancelar operación"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}