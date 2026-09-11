import { useState, useEffect } from 'react';
import './HistorialDocente.css';
import { historialDocenteService } from '../../services/historialDocenteService';
import { asistenciaService } from '../../services/asistenciaService';
import { userService } from '../../services/userService';
import { FaUserTie, FaChalkboardTeacher } from 'react-icons/fa';

const ITEMS_PER_PAGE = 20;

export default function HistorialDocente() {
  const [clasesDictadas, setClasesDictadas] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({ total_clases: 0, total_horas: 0 });
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProfesor, setFiltroProfesor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [materia, setMateria] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [claseAsistenciaSeleccionada, setClaseAsistenciaSeleccionada] = useState<number | null>(null);
  const [asistenciasClase, setAsistenciasClase] = useState<any[]>([]);
  const [errorAsistencia, setErrorAsistencia] = useState<string | null>(null);
  const [cargandoAsistencia, setCargandoAsistencia] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarProfesores();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await historialDocenteService.getHistorial(
        filtroProfesor ? parseInt(filtroProfesor) : undefined,
        fechaDesde || undefined,
        fechaHasta || undefined,
        materia || undefined
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

  const verAsistencia = async (claseId: number) => {
    if (claseAsistenciaSeleccionada === claseId) {
      setClaseAsistenciaSeleccionada(null);
      setAsistenciasClase([]);
      setErrorAsistencia(null);
      return;
    }
    try {
      setCargandoAsistencia(true);
      setErrorAsistencia(null);
      setClaseAsistenciaSeleccionada(claseId);
      const data = await asistenciaService.getAsistenciasPorClase(claseId);
      setAsistenciasClase(Array.isArray(data) ? data : (data?.data || []));
    } catch (error: any) {
      console.error('Error cargando asistencias:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Error cargando asistencias';
      setErrorAsistencia(msg);
      setAsistenciasClase([]);
    } finally {
      setCargandoAsistencia(false);
    }
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
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
          <label><FaUserTie /> Profesor</label>
          <select value={filtroProfesor} onChange={(e) => setFiltroProfesor(e.target.value)}>
            <option value="">Todos los profesores</option>
            {profesores.map(p => (
              <option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</option>
            ))}
          </select>
        </div>
        <div className="filtro-group">
          <label>Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="filtro-group">
          <label>Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="filtro-group">
          <label>Materia / Clase</label>
          <input
            type="text"
            placeholder="Buscar..."
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
          />
        </div>
        <div className="filtro-group" style={{ alignSelf: 'flex-end' }}>
          <label>&nbsp;</label>
          <button
            className="btn-buscar"
            onClick={() => { setPaginaActual(1); cargarDatos(); }}
          >
            Buscar
          </button>
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
                  <th>Materia</th>
                  <th>Duración</th>
                  <th>Modalidad</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {registrosPagina.map((item) => {
                  const resumen = item.resumen_asistencia || {};
                  const resumenTexto = [
                    resumen.presentes ? `P:${resumen.presentes}` : '',
                    resumen.ausentes ? `A:${resumen.ausentes}` : '',
                    resumen.tardanzas ? `T:${resumen.tardanzas}` : '',
                    resumen.justificados ? `J:${resumen.justificados}` : '',
                  ].filter(Boolean).join(' ') || '—';
                  return (
                    <tr key={item.id}>
                      <td>{formatearFecha(item.fecha)}</td>
                      <td className="font-bold">{item.profesor?.nombre || '—'}</td>
                      <td>{item.titulo}</td>
                      <td>{item.materia || '—'}</td>
                      <td>{item.duracion ? `${item.duracion} min` : '—'}</td>
                      <td>{item.modalidad || '—'}</td>
                      <td>
                        <button
                          className="btn-ver-asistencia"
                          onClick={() => verAsistencia(item.clase_id)}
                          title={resumenTexto}
                        >
                          {claseAsistenciaSeleccionada === item.clase_id ? 'Ocultar' : 'Ver asistencia'}
                          {resumenTexto !== '—' && <small style={{ display: 'block', fontSize: '0.75em' }}>{resumenTexto}</small>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {claseAsistenciaSeleccionada && (
        <div className="modal-overlay" onClick={() => setClaseAsistenciaSeleccionada(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asistencia de la clase</h3>
              <button className="close-btn" onClick={() => setClaseAsistenciaSeleccionada(null)}>✕</button>
            </div>
            {cargandoAsistencia ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando asistencias...</p></div>
            ) : errorAsistencia ? (
              <div className="empty-state"><p>⚠️ {errorAsistencia}</p></div>
            ) : (
              (() => {
                if (asistenciasClase.length === 0) {
                  return <div className="empty-state"><p>No hay asistencias registradas para esta clase.</p></div>;
                }
                const asistenciasOrdenadas = [...asistenciasClase].sort((a: any, b: any) => {
                  const orden = { presente: 0, justificado: 1, tardanza: 2, ausente: 3, pendiente: 4 };
                  return (orden[a.estado as keyof typeof orden] ?? 5) - (orden[b.estado as keyof typeof orden] ?? 5);
                });
                return (
                  <table className="asistencia-table">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasOrdenadas.map((a: any) => {
                        console.log('A_RENDER:', a, a.estudiante_nombre);
                        return (
                        <tr key={a.id}>
                          <td style={{ color: '#000' }}>{a.estudiante_nombre || `ID: ${a.estudiante_id}` || 'Sin nombre'}</td>
                          <td>
                            <span className={`estado-asistencia ${a.estado}`}>{a.estado_display || a.estado}</span>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
