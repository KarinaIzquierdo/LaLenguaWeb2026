import { useState, useEffect } from 'react';
import { ClaseService } from '../../services/claseService';
import { asistenciaService } from '../../services/asistenciaService';
import { userService } from '../../services/userService';
import './HistorialAsistencias.css';

interface AsistenciaHistorial {
  id: number;
  estudiante_id: number;
  estudiante_nombre: string;
  fecha: string;
  estado: string;
  clase_id: number;
}

export default function HistorialAsistencias() {
  const [clases, setClases] = useState<any[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<AsistenciaHistorial[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const currentUser = JSON.parse(userStr);
      const todasLasClases = await ClaseService.getClasesPorProfesor(currentUser.id);
      
      // Ordenar por fecha (más recientes primero)
      todasLasClases.sort((a: any, b: any) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      setClases(todasLasClases);
    } catch (error) {
      console.error('Error cargando clases:', error);
    }
  };

  const cargarAsistenciasClase = async (clase: any) => {
    try {
      setCargando(true);
      setClaseSeleccionada(clase);
      
      // Obtener asistencias guardadas desde el backend
      const asistenciasData = await asistenciaService.getAsistenciasPorClase(clase.id);
      
      // Obtener todos los estudiantes asignados a esta clase
      const estudiantesAsignados: number[] = clase.estudiantes || [];
      
      let todosLosUsuarios: any[] = [];
      try {
        todosLosUsuarios = await userService.getAll();
      } catch (e) {
        console.error('Error cargando usuarios:', e);
      }
      
      const estudiantesInfo = todosLosUsuarios.filter((u: any) => 
        estudiantesAsignados.includes(u.id)
      );
      
      // Construir lista completa: todos los estudiantes asignados + su estado de asistencia
      const asistenciasCompletas: AsistenciaHistorial[] = estudiantesInfo.map((estudiante: any) => {
        const asistenciaGuardada = asistenciasData.find((a: any) => a.estudiante_id === estudiante.id);
        return {
          id: asistenciaGuardada?.id || 0,
          estudiante_id: estudiante.id,
          estudiante_nombre: `${estudiante.nombres || estudiante.first_name || ''} ${estudiante.apellidos || estudiante.last_name || ''}`.trim(),
          fecha: asistenciaGuardada?.fecha || clase.fecha,
          estado: asistenciaGuardada?.estado || 'sin_marcar',
          clase_id: clase.id
        };
      });
      
      setAsistencias(asistenciasCompletas);
    } catch (error) {
      console.error('Error cargando asistencias:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'presente':
        return <span className="estado-badge presente">✓ Presente</span>;
      case 'ausente':
        return <span className="estado-badge ausente">✗ Ausente</span>;
      case 'tardanza':
        return <span className="estado-badge tardanza">⏰ Tardanza</span>;
      case 'justificado':
        return <span className="estado-badge justificado">📝 Justificado</span>;
      case 'sin_marcar':
        return <span className="estado-badge sin-marcar">⏳ Sin marcar</span>;
      default:
        return <span className="estado-badge">{estado}</span>;
    }
  };

  const calcularEstadisticas = () => {
    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

    return { total, presentes, ausentes, porcentaje };
  };

  const stats = calcularEstadisticas();

  return (
    <div className="historial-asistencias">
      <div className="historial-header">
        <div className="header-info">
          <h2>📋 Historial de Asistencias</h2>
          <p>Consulta las asistencias guardadas por clase</p>
        </div>
      </div>

      <div className="historial-content">
        {/* Lista de Clases */}
        <div className="clases-sidebar">
          <h3>Clases</h3>
          <div className="clases-list">
            {clases.length === 0 ? (
              <p className="no-clases">No hay clases disponibles</p>
            ) : (
              clases.map((clase) => (
                <div
                  key={clase.id}
                  className={`clase-item ${claseSeleccionada?.id === clase.id ? 'active' : ''}`}
                  onClick={() => cargarAsistenciasClase(clase)}
                >
                  <div className="clase-nombre">{clase.nombre}</div>
                  <div className="clase-fecha">
                    {new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="clase-hora">{clase.hora}</div>
                  <span className={`clase-estado ${clase.estado}`}>
                    {clase.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Asistencias de la Clase Seleccionada */}
        <div className="asistencias-panel">
          {!claseSeleccionada ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Selecciona una clase</h3>
              <p>Elige una clase de la lista para ver sus asistencias</p>
            </div>
          ) : cargando ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando asistencias...</p>
            </div>
          ) : (
            <>
              {/* Información de la Clase */}
              <div className="clase-info-card">
                <h3>{claseSeleccionada.nombre}</h3>
                <div className="clase-details">
                  <span>📅 {new Date(claseSeleccionada.fecha + 'T12:00:00').toLocaleDateString('es-ES')}</span>
                  <span>🕐 {claseSeleccionada.hora}</span>
                  <span className={`estado-clase ${claseSeleccionada.estado}`}>
                    {claseSeleccionada.estado}
                  </span>
                </div>
              </div>

              {/* Estadísticas */}
              {asistencias.length > 0 && (
                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Estudiantes</div>
                  </div>
                  <div className="stat-card presente">
                    <div className="stat-value">{stats.presentes}</div>
                    <div className="stat-label">Presentes</div>
                  </div>
                  <div className="stat-card ausente">
                    <div className="stat-value">{stats.ausentes}</div>
                    <div className="stat-label">Ausentes</div>
                  </div>
                  <div className="stat-card porcentaje">
                    <div className="stat-value">{stats.porcentaje}%</div>
                    <div className="stat-label">Asistencia</div>
                  </div>
                </div>
              )}

              {/* Tabla de Asistencias */}
              {asistencias.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No hay asistencias registradas</h3>
                  <p>Aún no se ha tomado asistencia para esta clase</p>
                </div>
              ) : (
                <div className="asistencias-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map((asistencia) => (
                        <tr key={asistencia.id}>
                          <td className="estudiante-nombre">
                            {asistencia.estudiante_nombre}
                          </td>
                          <td className="text-center">
                            {getEstadoBadge(asistencia.estado)}
                          </td>
                          <td className="text-center">
                            {new Date(asistencia.fecha + 'T12:00:00').toLocaleDateString('es-ES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
