import { useState, useEffect } from 'react';
import './HistorialDocente.css';
import { historialDocenteService } from '../../services/historialDocenteService';
import type { HistorialDocente as HistorialDocenteType } from '../../services/historialDocenteService';
import { userService } from '../../services/userService';
import { FaHistory, FaPlus, FaFilter, FaFileAlt, FaCalendarAlt, FaUserTie } from 'react-icons/fa';

const ITEMS_PER_PAGE = 20;

export default function HistorialDocente() {
  const [historial, setHistorial] = useState<HistorialDocenteType[]>([]);
  const [clasesDictadas, setClasesDictadas] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({ total_clases: 0, total_horas: 0 });
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroProfesor, setFiltroProfesor] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    profesor: '',
    tipo_evento: 'otro',
    titulo: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarDatos();
    cargarProfesores();
  }, [filtroTipo, filtroProfesor]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await historialDocenteService.getHistorial(
        filtroProfesor ? parseInt(filtroProfesor) : undefined,
        filtroTipo || undefined
      );
      if (data.success) {
        setHistorial(data.historial || []);
        setClasesDictadas(data.clases_dictadas || []);
        setEstadisticas(data.estadisticas || { total_clases: 0, total_horas: 0 });
        setPaginaActual(1);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarProfesores = async () => {
    try {
      const users = await userService.getAll();
      setProfesores(users.filter((u: any) => u.rol === 'profesor' || u.rol === 'Profesor'));
    } catch (error) {
      console.error('Error al cargar profesores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profesor || !formData.titulo) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      const result = await historialDocenteService.createHistorial({
        ...formData,
        profesor: parseInt(formData.profesor)
      });
      
      if (result.success) {
        setShowModal(false);
        setFormData({
          profesor: '',
          tipo_evento: 'otro',
          titulo: '',
          descripcion: ''
        });
        cargarDatos();
      } else {
        alert(result.message || 'Error al crear el registro');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Combinar ambos orígenes de datos
  const todosLosEventos = [
    ...historial,
    ...clasesDictadas.map(c => ({
      ...c,
      profesor: { ...c.profesor, id: 0, username: 'clase_automatica' } // Ajuste de tipo
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalRegistros = todosLosEventos.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / ITEMS_PER_PAGE));
  const indiceInicio = (paginaActual - 1) * ITEMS_PER_PAGE;
  const registrosPagina = todosLosEventos.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);

  const getBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      clase: '#3b82f6',
      evaluacion: '#10b981',
      observacion: '#f59e0b',
      capacitacion: '#8b5cf6',
      reunion: '#6b7280',
      otro: '#ec4899'
    };
    return colors[tipo] || '#6b7280';
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="historial-docente-container">
      <div className="historial-header-centered">
        <div className="header-text-main">
          <h1>Historial de Clase</h1>
          <p>Seguimiento de eventos y actividades de los profesores</p>
        </div>
        
        <div className="header-stats-wrapper">
          <div className="header-stats">
            <div className="stat-mini">
              <span className="stat-label">Clases Totales</span>
              <span className="stat-value">{estadisticas.total_clases}</span>
            </div>
            <div className="stat-mini">
              <span className="stat-label">Horas Dictadas</span>
              <span className="stat-value">{estadisticas.total_horas}h</span>
            </div>
          </div>
        </div>

        <button className="btn-add-historial-centered" onClick={() => setShowModal(true)}>
          <FaPlus /> Nuevo Registro
        </button>
      </div>

      <div className="filtros-container">
        <div className="filtro-group">
          <label><FaUserTie /> Filtrar por Profesor</label>
          <select value={filtroProfesor} onChange={(e) => setFiltroProfesor(e.target.value)}>
            <option value="">Todos los profesores</option>
            {profesores.map(p => (
              <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
            ))}
          </select>
        </div>
        <div className="filtro-group">
          <label><FaFilter /> Tipo de Evento</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="clase">Clase Dictada</option>
            <option value="evaluacion">Evaluación Calificada</option>
            <option value="observacion">Observación de Desempeño</option>
            <option value="capacitacion">Capacitación Recibida</option>
            <option value="reunion">Reunión de Facultad</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando historial...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="empty-state">
            <FaHistory size={50} opacity={0.2} />
            <p>No se encontraron registros de historial</p>
          </div>
        ) : (
          <table className="historial-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Docente</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Duración</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {registrosPagina.map((item) => (
                <tr key={item.id}>
                  <td>{formatearFecha(item.fecha)}</td>
                  <td className="font-bold">{item.profesor.nombre}</td>
                  <td>
                    <span 
                      className="tipo-badge"
                      style={{ backgroundColor: getBadgeColor(item.tipo_evento) }}
                    >
                      {item.tipo_evento_display}
                    </span>
                  </td>
                  <td>{item.titulo}</td>
                  <td>{item.duracion ? `${item.duracion} min` : '—'}</td>
                  <td className="text-sm opacity-70">{item.registrado_por?.nombre || (item.es_clase_automatica ? 'Sistema (Auto)' : 'Sistema')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para nuevo registro */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Registro de Historial</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="historial-form">
              <div className="form-group">
                <label>Docente *</label>
                <select 
                  required
                  value={formData.profesor}
                  onChange={(e) => setFormData({...formData, profesor: e.target.value})}
                >
                  <option value="">Seleccione un profesor</option>
                  {profesores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Evento</label>
                  <select 
                    value={formData.tipo_evento}
                    onChange={(e) => setFormData({...formData, tipo_evento: e.target.value})}
                  >
                    <option value="clase">Clase Dictada</option>
                    <option value="evaluacion">Evaluación Calificada</option>
                    <option value="observacion">Observación de Desempeño</option>
                    <option value="capacitacion">Capacitación Recibida</option>
                    <option value="reunion">Reunión de Facultad</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Título / Tarea *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ej: Clase magistral B2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción / Observaciones</label>
                <textarea 
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Detalles adicionales del evento..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
