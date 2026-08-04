
/**
 * @file FormularioUsuarios.jsx
 * @brief Componente para la gestión de usuarios (crear, leer, actualizar, activar/desactivar).
 */

import "./formulario-usuarios.css";
import React, { useState, useEffect } from 'react';
import { FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import { userService } from '../../services/userService';
import type { RegisterData } from '../../services/userService';
import { rolMapFrontendToBackend } from '../../services/rolMap';
import { especializacionService, type Especializacion } from '../../services/especializacionService';

const ITEMS_PER_PAGE = 20;

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
  correo_personal?: string;
  rol: string;
  activo: boolean;
  especializacion_id?: number;
  especializacion?: string;
  nivel?: string;
  english_level?: string;
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
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * @state {Object} formData - Estado para los datos del formulario.
   */
  const [formData, setFormData] = useState<Omit<Usuario, 'id' | 'activo'> & { contrasena: string }>({
    nombres: '',
    apellidos: '',
    correo: '',
    correo_personal: '',  // Ahora es el campo principal
    rol: 'Estudiante',
    contrasena: '',
    especializacion_id: undefined,
    english_level: 'A1',
  });

  /**
   * @state {Array<Especializacion>} especializaciones - Lista de especializaciones disponibles.
   */
  const [especializaciones, setEspecializaciones] = useState<Especializacion[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);

  // Cargar especializaciones al montar el componente
  useEffect(() => {
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

  const totalUsers = users.length;
  const totalPaginas = Math.max(1, Math.ceil(totalUsers / ITEMS_PER_PAGE));
  const paginaActualSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaActualSegura - 1) * ITEMS_PER_PAGE;
  const usersPagina = users.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const irAPagina = (pagina: number) => {
    const nuevaPagina = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaActual(nuevaPagina);
  };

  const irPrimera = () => irAPagina(1);
  const irUltima = () => irAPagina(totalPaginas);
  const irAnterior = () => irAPagina(paginaActualSegura - 1);
  const irSiguiente = () => irAPagina(paginaActualSegura + 1);

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
    
    // Validar correo_personal (ahora es obligatorio)
    if (!formData.correo_personal?.trim()) {
      errors.correo_personal = 'El correo personal es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_personal)) {
      errors.correo_personal = 'El formato del correo no es válido';
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
    // Ya no necesitamos lógica especial para cambiar dominios
    setFormData(prev => ({
      ...prev,
      [name]: name === 'especializacion_id' ? (value === '' ? undefined : parseInt(value)) : value,
    }));
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
      correo_personal: '',
      rol: 'Estudiante',
      contrasena: '',
      especializacion_id: undefined,
      english_level: 'A1',
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
      correo_personal: user.correo_personal || '',
      rol: user.rol,
      contrasena: '', // Contraseña no se edita directamente aquí por seguridad
      especializacion_id: user.especializacion_id,
      english_level: user.nivel || 'A1',
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
    setPaginaActual(1);
    setIsLoading(false);
  };

  // Cancelar formulario de creación/edición
  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormErrors({});
  };

  /**
   * @function handleDeleteUser
   * @brief Elimina permanentemente un usuario del sistema.
   * @param {number} userId - El ID del usuario a eliminar.
   * @param {string} userName - El nombre del usuario para confirmación.
   */
  const handleDeleteUser = async (userId: number, userName: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente al usuario "${userName}"?\n\nEsta acción no se puede deshacer y eliminará:\n- Toda la información del usuario\n- Sus evaluaciones y respuestas\n- Su historial de clases\n- Cualquier dato asociado`
    );
    
    if (!confirmDelete) return;
    
    const doubleConfirm = window.confirm(
      `ÚLTIMA CONFIRMACIÓN:\n\n¿Realmente deseas ELIMINAR PERMANENTEMENTE a "${userName}"?\n\nEscribe "ELIMINAR" en tu mente y presiona OK para continuar.`
    );
    
    if (!doubleConfirm) return;
    
    try {
      setIsLoading(true);
      const result = await userService.deleteUser(userId);

      if (result && result.success) {
        // Refrescar usuarios desde backend
        const data = await userService.getAll();
        setUsers(data);
        setPaginaActual(1);
        alert(`Usuario "${userName}" eliminado exitosamente.`);
      } else {
        console.error('Error en deleteUser:', result);
        const message = (result && (result.message || result.error)) || 'La operación de eliminación no se completó en el servidor.';
        alert(`Error al eliminar el usuario: ${message}`);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
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

    try {
      if (!editingUser) {
        // Crear nuevo usuario
        const backendRole =
          rolMapFrontendToBackend[formData.rol] ||
          (formData.rol === 'Financiero' ? 'financiero' : 'student');

        const registerData: RegisterData = {
          first_name: formData.nombres.trim(),
          last_name: formData.apellidos.trim(),
          correo_personal: formData.correo_personal.trim(),
          role: backendRole,
          password: formData.contrasena,
          email: formData.correo?.trim() || undefined,
          especializacion: formData.especializacion_id ?? null,
          english_level: formData.rol === 'Estudiante' ? (formData.english_level || 'A1') : undefined,
        };

        const result = await userService.register(registerData);

        if (result.success) {
          const data = await userService.getAll();
          setUsers(data);
          setShowForm(false);
          setEditingUser(null);
          setFormErrors({});
        } else {
          setFormErrors(result.errors || { correo_personal: result.message || 'Error al registrar usuario' });
        }
      } else {
        // Editar usuario existente
        const updateData: any = {
          first_name: formData.nombres.trim(),
          last_name: formData.apellidos.trim(),
          correo_personal: formData.correo_personal.trim(),
        };

        await userService.update(editingUser.id, updateData);

        const data = await userService.getAll();
        setUsers(data);
        setPaginaActual(1);

        setShowForm(false);
        setEditingUser(null);
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('Error al guardar el usuario. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar lista de usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data: any = await userService.getAll();
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.warn('Formato inesperado al cargar usuarios:', data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setLoadError('No se pudieron cargar los usuarios. Revisa tu conexión o cierra sesión y vuelve a ingresar.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="gestion-usuarios-container">
      <div className="gestion-usuarios-header">
        <div className="gestion-usuarios-title">
          <h2>Gestión de Usuarios</h2>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button 
          onClick={handleAddUserClick} 
          className="add-user-button"
          disabled={isLoading}
          aria-label="Agregar nuevo usuario"
        >
          {isLoading ? <FaSpinner className="loading-spinner" /> : <FaPlus />}
          Agregar Usuario
        </button>
      </div>

      {!showForm && (
        <div className="users-table-container">
          <div className="users-table-header">
            <h3>Lista de Usuarios</h3>
            <span className="users-count">{users.length} usuarios</span>
          </div>
          <div className="users-table-wrapper">
            <table className="users-table" role="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Correo Personal</th>
                  <th>Rol</th>
                  <th>Especialización</th>
                  <th>Nivel de Inglés</th>
                </tr>
              </thead>
              <tbody>
                {usersPagina.map((user) => {
                  return (
                    <tr key={user.id}>
                      <td data-label="ID">{user.id}</td>
                      <td data-label="Nombre Completo">{`${user.nombres} ${user.apellidos}`}</td>
                      <td data-label="Correo Personal">{user.correo_personal || 'Sin correo personal'}</td>
                      <td data-label="Rol">{user.rol}</td>
                      <td data-label="Especialización">
                        <span className="especializacion-badge">
                          {user.especializacion || 'Sin asignar'}
                        </span>
                      </td>
                      <td data-label="Nivel de Inglés">
                        <span className="nivel-badge">
                          {user.nivel || 'N/A'}
                        </span>
                      </td>
                  </tr>
                  );
                })}
                {users.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      {loadError ? (
                        <div className="users-error-message">
                          <p>{loadError}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="retry-button"
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : (
                        'No hay usuarios registrados'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalUsers > 0 && (
              <div className="paginacion-registros">
                <span className="paginacion-info">
                  Mostrando {indiceInicio + 1}
                  –{Math.min(indiceInicio + ITEMS_PER_PAGE, totalUsers)} de {totalUsers}
                </span>
                <div className="paginacion-botones">
                  <button onClick={irPrimera} disabled={paginaActualSegura === 1}>
                    « Primero
                  </button>
                  <button onClick={irAnterior} disabled={paginaActualSegura === 1}>
                    ‹ Anterior
                  </button>
                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => irAPagina(num)}
                      className={num === paginaActualSegura ? 'pagina-activa' : ''}
                    >
                      {num}
                    </button>
                  ))}
                  <button onClick={irSiguiente} disabled={paginaActualSegura === totalPaginas}>
                    Siguiente ›
                  </button>
                  <button onClick={irUltima} disabled={paginaActualSegura === totalPaginas}>
                    Último »
                  </button>
                </div>
              </div>
            )}
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

          <div className={`form-field ${formErrors.correo_personal ? 'error' : ''}`}>
            <label htmlFor="correo_personal">Correo Personal (Login) *</label>
            <input
              type="email"
              id="correo_personal"
              name="correo_personal"
              value={formData.correo_personal}
              onChange={handleChange}
              placeholder="usuario@gmail.com o usuario@outlook.com"
              required
              aria-describedby={formErrors.correo_personal ? "correo-personal-error" : undefined}
              aria-invalid={!!formErrors.correo_personal}
            />
            {formErrors.correo_personal && (
              <span id="correo-personal-error" className="error-message" role="alert">
                {formErrors.correo_personal}
              </span>
            )}
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
              Este será el correo que el usuario usará para iniciar sesión
            </small>
          </div>

          <div className={`form-field ${formErrors.correo ? 'error' : ''}`}>
            <label htmlFor="correo">Correo Institucional (Opcional)</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="Se genera automáticamente si se deja vacío"
              aria-describedby={formErrors.correo ? "correo-error" : undefined}
              aria-invalid={!!formErrors.correo}
            />
            {formErrors.correo && (
              <span id="correo-error" className="error-message" role="alert">
                {formErrors.correo}
              </span>
            )}
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
              Si se deja vacío, se generará automáticamente como: usuario@thelanguage.co
            </small>
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
              <option value="Financiero">Financiero</option>
            </select>
          </div>

          {formData.rol === 'Estudiante' && (
            <div className="form-field">
              <label htmlFor="english_level">Nivel de Inglés</label>
              <select
                id="english_level"
                name="english_level"
                value={formData.english_level || 'A1'}
                onChange={handleChange}
              >
                <option value="A1">A1 - Principiante</option>
                <option value="A2">A2 - Básico</option>
                <option value="B1">B1 - Intermedio</option>
                <option value="B2">B2 - Intermedio-Alto</option>
                <option value="C1">C1 - Avanzado</option>
                <option value="C2">C2 - Competente/Nativo</option>
              </select>
            </div>
          )}

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

          <div className={`form-field ${formErrors.contrasena ? 'error' : ''}`}>
            <label htmlFor="contrasena">{editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}</label>
            <input
              type="password"
              id="contrasena"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              placeholder={editingUser ? "Dejar vacío para mantener actual" : "Mínimo 8 caracteres"}
              required={!editingUser}
              aria-describedby={formErrors.contrasena ? "contrasena-error" : undefined}
                aria-invalid={!!formErrors.contrasena}
              />
              {formErrors.contrasena && (
                <span id="contrasena-error" className="error-message" role="alert">
                  {formErrors.contrasena}
                </span>
              )}
            </div>

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