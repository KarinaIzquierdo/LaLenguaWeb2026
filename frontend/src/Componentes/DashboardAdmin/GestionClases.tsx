import { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSpinner, FaBars } from 'react-icons/fa';
import { ClaseService } from '../../services/claseService';
import './GestionClases.css';

interface Clase {
  id: number;
  nombre: string;
  profesor: string;
  fecha: string;
  hora?: string;
  meet_link?: string;
  estudiantes?: string[];
}

interface Profesor {
  id: number;
  nombre: string;
}

const ITEMS_PER_PAGE = 10;

export default function GestionClases() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Clase | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
  });

  const cargarClases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClaseService.getClases();
      setClases(data);
    } catch (err: any) {
      setError(err?.message || 'Error cargando clases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarClases();
  }, []);

  const resetForm = () => {
    setFormData({ nombre: '' });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (clase: Clase) => {
    setEditingClass(clase);
    setFormData({
      nombre: clase.nombre,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta clase?')) return;
    setIsLoading(true);
    try {
      await ClaseService.deleteClase(id);
      await cargarClases();
    } catch (err: any) {
      setError(err?.message || 'Error eliminando clase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = { ...formData, profesor: '', hora: '', meet_link: '', estudiantes: [] };
      if (editingClass) {
        await ClaseService.updateClase(editingClass.id, payload);
      } else {
        await ClaseService.createClase({ ...payload, estado: 'programada' });
      }
      await cargarClases();
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error guardando clase');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(clases.length / ITEMS_PER_PAGE));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaSegura - 1) * ITEMS_PER_PAGE;
  const clasesPagina = clases.slice(inicio, inicio + ITEMS_PER_PAGE);

  return (
    <div className="gestion-clases-container">
      <h2>Gestión de Clases</h2>

      {!showForm && (
        <button onClick={handleAdd} className="gestion-clases-add-btn" disabled={isLoading}>
          <FaPlus /> Agregar clase
        </button>
      )}

      {showForm && (
        <div className="gestion-clases-form-card">
          <h3>{editingClass ? 'Editar Clase' : 'Agregar Nueva Clase'}</h3>
          {error && <div className="gestion-clases-error">{error}</div>}
          <form onSubmit={handleSubmit} className="gestion-clases-form">
            <div className="gestion-clases-form-group">
              <label>Nombre de la clase</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Escritura académica"
                required
              />
            </div>
            <div className="gestion-clases-form-actions">
              <button type="submit" className="gestion-clases-save-btn" disabled={isLoading}>
                {isLoading ? <FaSpinner className="fa-spin" /> : 'Guardar'}
              </button>
              <button type="button" className="gestion-clases-cancel-btn" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="gestion-clases-card">
        <h2>Lista de clases</h2>

        {isLoading && !showForm ? (
          <div className="gestion-clases-loading">Cargando clases...</div>
        ) : (
          <table className="gestion-clases-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre clase</th>
                <th>Profesor</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clasesPagina.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.id}</td>
                  <td>{clase.nombre}</td>
                  <td>{clase.profesor}</td>
                  <td>{clase.fecha}</td>
                  <td>
                    <div className="gestion-clases-actions">
                      <button
                        className="gestion-clases-edit-btn"
                        onClick={() => handleEdit(clase)}
                        disabled={isLoading}
                        aria-label="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="gestion-clases-delete-btn"
                        onClick={() => handleDelete(clase.id)}
                        disabled={isLoading}
                        aria-label="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clasesPagina.length === 0 && (
                <tr>
                  <td colSpan={5} className="gestion-clases-empty">
                    No hay clases registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
