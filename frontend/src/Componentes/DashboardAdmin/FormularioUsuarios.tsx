/**
 * @file FormularioUsuarios.jsx
 * @brief Componente para la gestión de usuarios (crear, leer, actualizar, activar/desactivar).
 */

import "./formulario-usuarios.css";
import React, { useState } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSpinner } from 'react-icons/fa';

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
}

interface FormErrors {
  [key: string]: string;
}

export default function FormularioUsuarios() {
  /**
   * @state {Array<Object>} users - Lista de usuarios.
   */
  const [users, setUsers] = useState<Usuario[]>([
    {
      id: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan.perez@colegio.com',
      rol: 'Profesor',
      activo: true,
    },
    {
      id: 2,
      nombres: 'María',
      apellidos: 'Gómez',
      correo: 'maria.gomez@colegio.com',
      rol: 'Estudiante',
      activo: true,
    },
    {
      id: 3,
      nombres: 'Carlos',
      apellidos: 'Ruiz',
      correo: 'carlos.ruiz@colegio.com',
      rol: 'Admin',
      activo: true,
    },
    {
      id: 4,
      nombres: 'Ana',
      apellidos: 'Díaz',
      correo: 'ana.diaz@colegio.com',
      rol: 'Estudiante',
      activo: false,
    },
  ]);

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
  });

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
    } else if (!editingUser && formData.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
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
    
    // Simular una operación asíncrona
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(users.map(user =>
      user.id === userId ? { ...user, activo: !user.activo } : user
    ));
    
    setIsLoading(false);
  };

  /**
   * @function handleSubmit
   * @brief Maneja el envío del formulario para crear o actualizar un usuario.
   * @param {React.FormEvent<HTMLFormElement>} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    
    // Simular una operación asíncrona
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Excluir la contraseña del objeto que se guardará en el estado
    const { contrasena, ...userData } = formData;
    
    if (editingUser) {
      // Actualizar usuario existente
      setUsers(users.map(user =>
        user.id === editingUser.id ? { ...user, ...userData } : user
      ));
    } else {
      // Crear nuevo usuario
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        ...userData,
        activo: true,
      };
      setUsers([...users, newUser]);
    }
    
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
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{`${user.nombres} ${user.apellidos}`}</td>
                    <td>{user.correo}</td>
                    <td>{user.rol}</td>
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
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
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

          {!editingUser && (
            <div className={`form-field ${formErrors.contrasena ? 'error' : ''}`}>
              <label htmlFor="contrasena">Contraseña *</label>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
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