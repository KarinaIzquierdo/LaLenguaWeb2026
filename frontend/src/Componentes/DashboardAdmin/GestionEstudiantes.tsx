import { useState, useEffect } from 'react';
import './GestionEstudiantes.css';
import { userService } from '../../services/userService';
import { especializacionService } from '../../services/especializacionService';
import { generateStudentReportPDF } from '../../utils/generateStudentReportPDF';
import ModalEliminarEstudiante from './ModalEliminarEstudiante';
import type { EliminacionData } from './ModalEliminarEstudiante';

const ITEMS_PER_PAGE = 20;
interface Student {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  correo_personal?: string;
  bloque_asignado: string;
  nivel?: string;
  especializacion?: string;
  especializacion_id?: number | null;
  is_active: boolean;
  date_joined: string;
}

interface EditForm {
  nombres: string;
  apellidos: string;
  correo_personal: string;
  nivel: string;
  especializacion: number | null;
}

const GestionEstudiantes = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [academicDetail, setAcademicDetail] = useState<any>(null);
  const [loadingAcademicDetail, setLoadingAcademicDetail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [especializaciones, setEspecializaciones] = useState<{ id: number; nombre: string }[]>([]);
  const [editForm, setEditForm] = useState<EditForm>({
    nombres: '',
    apellidos: '',
    correo_personal: '',
    nivel: 'A1',
    especializacion: null
  });

  // Cargar estudiantes del backend
  useEffect(() => {
    loadStudents();
    loadEspecializaciones();
  }, []);

  const loadEspecializaciones = async () => {
    try {
      const data = await especializacionService.getEspecializaciones();
      setEspecializaciones(data);
    } catch (error) {
      console.error('Error cargando especializaciones:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      console.log('Datos de usuarios:', data);
      // Filtrar solo estudiantes (excluir admin, teacher, profesor)
      const estudiantesOnly = data.filter((u: any) => 
        u.rol === 'student' || u.rol === 'estudiante'
      );
      console.log('Estudiantes filtrados:', estudiantesOnly);
      console.log('Especializaciones:', estudiantesOnly.map((e: any) => ({ id: e.id, esp: e.especializacion })));
      setStudents(estudiantesOnly);
      setFilteredStudents(estudiantesOnly);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = students;

    // Filtro de búsqueda por nombre o email
    if (searchTerm) {
      filtered = filtered.filter(s => 
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.correo_personal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por nivel
    if (filterNivel) {
      filtered = filtered.filter(s => s.nivel === filterNivel);
    }

    setFilteredStudents(filtered);
    setPaginaActual(1);
  }, [searchTerm, filterNivel, students]);

  const handleViewDetails = async (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
    setLoadingAcademicDetail(true);
    setAcademicDetail(null);
    try {
      const detail = await userService.getAcademicDetail(student.id);
      if (detail.success) {
        setAcademicDetail(detail);
      } else {
        console.error('Error cargando expediente:', detail.message);
      }
    } catch (error) {
      console.error('Error cargando expediente:', error);
    } finally {
      setLoadingAcademicDetail(false);
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      nombres: student.nombres || '',
      apellidos: student.apellidos || '',
      correo_personal: student.correo_personal || '',
      nivel: student.nivel || 'A1',
      especializacion: student.especializacion_id ?? null
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    try {
      // Mapear nivel a english_level para el backend
      const dataToSend = {
        first_name: editForm.nombres,
        last_name: editForm.apellidos,
        correo_personal: editForm.correo_personal,
        english_level: editForm.nivel,
        especializacion: editForm.especializacion
      };
      await userService.update(selectedStudent.id, dataToSend);
      setShowEditModal(false);
      loadStudents();
      alert('Estudiante actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando estudiante:', error);
      alert('Error al actualizar estudiante');
    }
  };

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (data: EliminacionData) => {
    if (!studentToDelete) return;
    
    try {
      const result = await userService.deleteUser(studentToDelete.id, data);

      if (result.success) {
        alert('Estudiante eliminado correctamente. Se ha creado un registro de eliminación.');
        loadStudents();
        setShowDeleteModal(false);
        setStudentToDelete(null);
      } else {
        alert('Error al eliminar estudiante: ' + result.message);
      }
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      alert('Error al eliminar estudiante');
    }
  };

  const getNivelColor = (nivel?: string) => {
    const colors: any = {
      'A1': '#10b981',
      'A2': '#3b82f6',
      'B1': '#f59e0b',
      'B2': '#ef4444',
      'C1': '#8b5cf6',
      'C2': '#ec4899'
    };
    return colors[nivel || 'A1'] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const totalStudents = filteredStudents.length;
  const totalPaginas = Math.max(1, Math.ceil(totalStudents / ITEMS_PER_PAGE));
  const paginaActualSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaActualSegura - 1) * ITEMS_PER_PAGE;
  const studentsPagina = filteredStudents.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const irAPagina = (pagina: number) => {
    const nuevaPagina = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaActual(nuevaPagina);
  };

  const irPrimera = () => irAPagina(1);
  const irUltima = () => irAPagina(totalPaginas);
  const irAnterior = () => irAPagina(paginaActualSegura - 1);
  const irSiguiente = () => irAPagina(paginaActualSegura + 1);

  return (
    <div className="student-management-container">
      <div className="header-section">
        <h2>Gestión de Estudiantes</h2>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Total Estudiantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{students.filter(s => s.is_active).length}</span>
            <span className="stat-label">Activos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{students.filter(s => !s.is_active).length}</span>
            <span className="stat-label">Inactivos</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los niveles</option>
          <option value="A1">A1</option>
          <option value="A1+">A1+</option>
          <option value="A2">A2</option>
          <option value="A2+">A2+</option>
          <option value="B1">B1</option>
          <option value="B1+">B1+</option>
          <option value="B2">B2</option>
          <option value="B2+">B2+</option>
          <option value="C1">C1</option>
          <option value="C1+">C1+</option>
          <option value="C2">C2</option>
        </select>
        {(searchTerm || filterNivel) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterNivel('');
            }}
            className="clear-filters-btn"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de estudiantes */}
      {loading ? (
        <div className="loading-message">Cargando estudiantes...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="no-data-message">No se encontraron estudiantes</div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Nivel</th>
                <th>Especialización</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {studentsPagina.map((student) => (
                <tr key={student.id}>
                  <td className="student-name">
                    {student.nombres} {student.apellidos}
                  </td>
                  <td>{student.correo_personal || 'N/A'}</td>
                  <td>
                    <span 
                      className="nivel-badge"
                      style={{ backgroundColor: getNivelColor(student.nivel) }}
                    >
                      {student.nivel || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="especializacion-badge">
                      {student.especializacion || 'Sin asignar'}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${student.is_active ? 'activo' : 'inactivo'}`}>
                      {student.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatDate(student.date_joined)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="action-btn view-btn"
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="action-btn edit-btn"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="action-btn delete-btn"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalStudents > 0 && (
            <div className="paginacion-registros">
              <span className="paginacion-info">
                Mostrando {indiceInicio + 1}
                –{Math.min(indiceInicio + ITEMS_PER_PAGE, totalStudents)} de {totalStudents}
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
      )}

      {/* Modal de Detalles / Expediente */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content academic-record-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Expediente del Estudiante</h3>
              <button onClick={() => setShowDetailsModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              {loadingAcademicDetail && <div className="loading-message">Cargando expediente...</div>}
              {!loadingAcademicDetail && academicDetail && (
                <>
                  {/* Información personal */}
                  <div className="record-section">
                    <h4>Información Personal</h4>
                    <div className="detail-grid">
                      <div className="detail-row"><span className="detail-label">Nombre:</span><span className="detail-value">{academicDetail.estudiante.nombres} {academicDetail.estudiante.apellidos}</span></div>
                      <div className="detail-row"><span className="detail-label">Email:</span><span className="detail-value">{academicDetail.estudiante.email || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Correo personal:</span><span className="detail-value">{academicDetail.estudiante.correo_personal || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Teléfono:</span><span className="detail-value">{academicDetail.estudiante.telefono || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Cédula:</span><span className="detail-value">{academicDetail.estudiante.cedula || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Ubicación:</span><span className="detail-value">{[academicDetail.estudiante.ciudad, academicDetail.estudiante.pais].filter(Boolean).join(', ') || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Nivel de inglés:</span><span className="detail-value">{academicDetail.estudiante.nivel_ingles || 'N/A'}</span></div>
                      <div className="detail-row"><span className="detail-label">Especialización:</span><span className="detail-value">{academicDetail.estudiante.especializacion || 'Sin asignar'}</span></div>
                      <div className="detail-row"><span className="detail-label">Estado:</span><span className="detail-value">{academicDetail.estudiante.activo ? 'Activo' : 'Inactivo'}</span></div>
                      <div className="detail-row"><span className="detail-label">Fecha de registro:</span><span className="detail-value">{formatDate(academicDetail.estudiante.fecha_registro)}</span></div>
                    </div>
                  </div>

                  {/* Suscripción y progreso */}
                  {academicDetail.suscripcion ? (
                    <div className="record-section">
                      <h4>Suscripción y Progreso</h4>
                      <div className="detail-grid">
                        <div className="detail-row"><span className="detail-label">Plan:</span><span className="detail-value">{academicDetail.suscripcion.plan}</span></div>
                        <div className="detail-row"><span className="detail-label">Estado:</span><span className="detail-value">{academicDetail.suscripcion.estado}</span></div>
                        <div className="detail-row"><span className="detail-label">Clases tomadas:</span><span className="detail-value">{academicDetail.suscripcion.clases_tomadas} / {academicDetail.suscripcion.clases_totales}</span></div>
                        <div className="detail-row"><span className="detail-label">Progreso:</span><span className="detail-value">{academicDetail.suscripcion.progreso_porcentaje}%</span></div>
                        <div className="detail-row"><span className="detail-label">Días restantes:</span><span className="detail-value">{academicDetail.suscripcion.dias_restantes}</span></div>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${academicDetail.suscripcion.progreso_porcentaje}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="record-section">
                      <h4>Suscripción y Progreso</h4>
                      <p className="empty-section">No tiene suscripción activa.</p>
                    </div>
                  )}

                  {/* Gamificación */}
                  <div className="record-section">
                    <h4>Gamificación</h4>
                    <div className="gamification-grid">
                      <div className="gamification-card"><span className="gamification-value">{academicDetail.gamificacion.total_xp}</span><span className="gamification-label">XP</span></div>
                      <div className="gamification-card"><span className="gamification-value">{academicDetail.gamificacion.total_dulces}</span><span className="gamification-label">Dulces</span></div>
                      <div className="gamification-card"><span className="gamification-value">{academicDetail.gamificacion.reto_racha_actual}</span><span className="gamification-label">Racha actual</span></div>
                      <div className="gamification-card"><span className="gamification-value">{academicDetail.gamificacion.reto_mejor_racha}</span><span className="gamification-label">Mejor racha</span></div>
                    </div>
                  </div>

                  {/* Asistencia */}
                  <div className="record-section">
                    <h4>Asistencia</h4>
                    {academicDetail.asistencia.stats.total > 0 ? (
                      <>
                        <div className="attendance-stats">
                          <div className="attendance-item presente"><span className="attendance-count">{academicDetail.asistencia.stats.presente}</span><span className="attendance-label">Presente</span></div>
                          <div className="attendance-item ausente"><span className="attendance-count">{academicDetail.asistencia.stats.ausente}</span><span className="attendance-label">Ausente</span></div>
                          <div className="attendance-item tardanza"><span className="attendance-count">{academicDetail.asistencia.stats.tardanza}</span><span className="attendance-label">Tardanza</span></div>
                          <div className="attendance-item justificado"><span className="attendance-count">{academicDetail.asistencia.stats.justificado}</span><span className="attendance-label">Justificado</span></div>
                        </div>
                        <h5>Registros recientes</h5>
                        <ul className="recent-list">
                          {academicDetail.asistencia.recientes.map((a: any, idx: number) => (
                            <li key={idx}><span className={`status-badge-mini ${a.estado}`}>{a.estado}</span> {formatDate(a.fecha)} {a.observaciones && <em>({a.observaciones})</em>}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="empty-section">No hay registros de asistencia.</p>
                    )}
                  </div>

                  {/* Clases */}
                  <div className="record-section">
                    <h4>Clases Asignadas ({academicDetail.clases.length})</h4>
                    {academicDetail.clases.length > 0 ? (
                      <ul className="recent-list">
                        {academicDetail.clases.map((c: any) => (
                          <li key={c.id}><strong>{c.nombre}</strong> — {c.profesor} — {formatDate(c.fecha)} {c.hora && `(${c.hora})`} <span className="class-state">{c.estado}</span></li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-section">No tiene clases asignadas.</p>
                    )}
                  </div>

                  {/* Evaluaciones */}
                  <div className="record-section">
                    <h4>Evaluaciones ({academicDetail.evaluaciones.length})</h4>
                    {academicDetail.evaluaciones.length > 0 ? (
                      <table className="evaluations-table">
                        <thead><tr><th>Título</th><th>Tipo</th><th>Estado</th><th>Calificación</th></tr></thead>
                        <tbody>
                          {academicDetail.evaluaciones.map((e: any) => (
                            <tr key={e.id}>
                              <td>{e.titulo}</td>
                              <td>{e.tipo}</td>
                              <td><span className={`status-badge-mini ${e.estado === 'Entregada' ? 'entregada' : 'pendiente'}`}>{e.estado}</span></td>
                              <td>{e.calificacion !== null ? `${e.calificacion}/100` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="empty-section">No tiene evaluaciones asignadas.</p>
                    )}
                  </div>
                </>
              )}
              {!loadingAcademicDetail && !academicDetail && (
                <div className="loading-message">No se pudo cargar el expediente.</div>
              )}
            </div>
            {!loadingAcademicDetail && academicDetail && (
              <div className="modal-footer">
                <button
                  onClick={() => generateStudentReportPDF(academicDetail)}
                  className="btn-report"
                >
                  📄 Descargar reporte PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Estudiante</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombres:</label>
                <input
                  type="text"
                  value={editForm.nombres}
                  onChange={(e) => setEditForm({...editForm, nombres: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  value={editForm.apellidos}
                  onChange={(e) => setEditForm({...editForm, apellidos: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editForm.correo_personal}
                  onChange={(e) => setEditForm({...editForm, correo_personal: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Nivel de inglés:</label>
                <select
                  value={editForm.nivel}
                  onChange={(e) => setEditForm({...editForm, nivel: e.target.value})}
                  className="form-input"
                >
                  <option value="">Sin nivel</option>
                  <option value="A1">A1</option>
                  <option value="A1+">A1+</option>
                  <option value="A2">A2</option>
                  <option value="A2+">A2+</option>
                  <option value="B1">B1</option>
                  <option value="B1+">B1+</option>
                  <option value="B2">B2</option>
                  <option value="B2+">B2+</option>
                  <option value="C1">C1</option>
                  <option value="C1+">C1+</option>
                  <option value="C2">C2</option>
                </select>
              </div>
              <div className="form-group">
                <label>Especialización:</label>
                <select
                  value={editForm.especializacion ?? ''}
                  onChange={(e) => setEditForm({...editForm, especializacion: e.target.value ? Number(e.target.value) : null})}
                  className="form-input"
                >
                  <option value="">Sin asignar</option>
                  {especializaciones.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && studentToDelete && (
        <ModalEliminarEstudiante
          estudiante={{
            id: studentToDelete.id,
            username: studentToDelete.correo || studentToDelete.correo_personal || '',
            first_name: studentToDelete.nombres,
            last_name: studentToDelete.apellidos,
            email: studentToDelete.correo_personal || studentToDelete.correo || ''
          }}
          onClose={() => {
            setShowDeleteModal(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default GestionEstudiantes;
