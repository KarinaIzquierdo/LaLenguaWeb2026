import { useState, useEffect } from 'react';
import './HistorialDocente.css';
import { historialDocenteService } from '../../services/historialDocenteService';
import { userService } from '../../services/userService';
import { FaUserTie, FaChalkboardTeacher } from 'react-icons/fa';

const ITEMS_PER_PAGE = 20;

export default function HistorialDocente() {
  const [clasesDictadas, setClasesDictadas] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({ total_clases: 0, total_horas: 0 });
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProfesor, setFiltroProfesor] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarDatos();
    cargarProfesores();
  }, [filtroProfesor]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await historialDocenteService.getHistorial(
        filtroProfesor ? parseInt(filtroProfesor) : undefined
      );
      if (data.success) {
        setClasesDictadas(data.clases_dictadas || []);
        setEstadisticas(data.estadisticas || { total_clases: 0, total_horas: 0 });
        setPaginaActual(1);
      }
    } catch (error) {
      console.error('Error al cargar clases:', error);
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

  const totalRegistros = clasesDictadas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / ITEMS_PER_PAGE));
  const indiceInicio = (paginaActual - 1) * ITEMS_PER_PAGE;
  const registrosPagina = clasesDictadas.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="historial-docente-container">
      <div className="historial-header-centered">
        <div className="header-text-main">
          <h1>Historial de Clases</h1>
          <p>Total de clases dictadas por los profesores</p>
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
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando clases...</p>
          </div>
        ) : clasesDictadas.length === 0 ? (
          <div className="empty-state">
            <FaChalkboardTeacher size={50} opacity={0.2} />
            <p>No se encontraron clases dictadas</p>
          </div>
        ) : (
          <>
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Docente</th>
                  <th>Clase</th>
                  <th>Duración</th>
                  <th>Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {registrosPagina.map((item) => (
                  <tr key={item.id}>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td className="font-bold">{item.profesor.nombre}</td>
                    <td>{item.titulo}</td>
                    <td>{item.duracion ? `${item.duracion} min` : '—'}</td>
                    <td>{item.descripcion?.includes('Modalidad:') 
                      ? item.descripcion.split('Modalidad:')[1]?.trim() 
                      : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPaginas > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  Anterior
                </button>
                <span>Página {paginaActual} de {totalPaginas}</span>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
