import React, { useState, useEffect } from 'react';
import './DriveEvaluaciones.css';
import { evaluacionProfesorService, type Estudiante } from '../../services/evaluacionProfesorService';
import { userService } from '../../services/userService';

interface Evaluacion {
  id: number;
  titulo: string;
  nivel: string;
  unidad: string;
  clase: string;
  enlace: string;
  fecha_creacion: string;
  fecha_limite?: string;
  activa: boolean;
  tipo?: string;
  dirigidaA?: 'individual' | 'grupo';
  estudiantes_asignados?: number[];
}

export default function DriveEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'assign'>('list');
  const [editingEvaluacion, setEditingEvaluacion] = useState<Evaluacion | null>(null);
  const [assigningEvaluacion, setAssigningEvaluacion] = useState<Evaluacion | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    titulo: string;
    nivel: string;
    unidad: string;
    clase: string;
    enlace: string;
    tipo: string;
    dirigidaA: 'individual' | 'grupo';
    fecha_limite: string;
  }>({
    titulo: '',
    nivel: '',
    unidad: '',
    clase: '',
    enlace: '',
    tipo: 'quiz',
    dirigidaA: 'grupo',
    fecha_limite: '',
  });

  // Lista de estudiantes (cargada desde el backend)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Array<{id: number; nombre: string}>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Cargar evaluaciones existentes
  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const cargarEvaluaciones = async () => {
    try {
      const evaluacionesData = await evaluacionProfesorService.getEvaluaciones();
      // Asegurarse de que sea un array
      if (Array.isArray(evaluacionesData)) {
        // Parsear cada evaluación del backend
        const evaluacionesParsed = evaluacionesData.map((evalBackend: any) => {
          const descripcion = evalBackend.descripcion || '';
          
          const parseDescripcion = (desc: string) => {
            const nivel = desc.match(/Nivel: ([^|]+)/)?.[1]?.trim() || 'A1';
            const unidad = desc.match(/Unidad: ([^|]+)/)?.[1]?.trim() || 'Unit 1';
            const clase = desc.match(/Clase: ([^|]+)/)?.[1]?.trim() || 'Class 1';
            const dirigidaARaw = desc.match(/Dirigida a: ([^|]+)/)?.[1]?.trim() || 'grupo';
            const dirigidaA = (dirigidaARaw === 'individual' || dirigidaARaw === 'grupo') ? dirigidaARaw : 'grupo';
            const enlace = desc.match(/Enlace: (.+)/)?.[1]?.trim() || '';
            return { nivel, unidad, clase, dirigidaA, enlace };
          };
          
          const { nivel, unidad, clase, dirigidaA, enlace } = parseDescripcion(descripcion);
          
          return {
            id: evalBackend.id,
            titulo: evalBackend.titulo,
            nivel,
            unidad,
            clase,
            enlace,
            dirigidaA: dirigidaA as 'individual' | 'grupo',
            fecha_creacion: evalBackend.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            fecha_limite: evalBackend.fecha_limite ? evalBackend.fecha_limite.slice(0, 16) : undefined,
            activa: evalBackend.estado === 'publicada',
            tipo: evalBackend.tipo || 'quiz',
            estudiantes_asignados: evalBackend.estudiantes_asignados || []
          };
        });
        
        setEvaluaciones(evaluacionesParsed);
      } else {
        console.warn('getEvaluaciones no devolvió un array:', evaluacionesData);
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      setEvaluaciones([]);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      setLoadingStudents(true);
      const estudiantesData = await evaluacionProfesorService.getEstudiantes();
      setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      setEstudiantes([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAvailableStudents = async (nivelFiltro: string = '') => {
    try {
      const users = await userService.getAll();
      const students = (users || [])
        .filter((u: any) => (u.rol === 'student' || u.role === 'student') && u.activo !== false)
        .filter((u: any) => !nivelFiltro || (u.nivel || '').toLowerCase() === nivelFiltro.toLowerCase())
        .map((u: any) => ({
          id: u.id,
          nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.username || `ID ${u.id}`,
        }))
        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
      setAvailableStudents(students);
    } catch (error) {
      console.error('Error cargando estudiantes disponibles:', error);
      setAvailableStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar que haya un enlace
      if (!formData.enlace.trim()) {
        alert('Debes ingresar un enlace de evaluación.');
        return;
      }

      // Validar que la fecha límite tenga un año válido (evitar años excesivos como 72026)
      if (formData.fecha_limite) {
        const selectedYear = new Date(formData.fecha_limite).getFullYear();
        if (selectedYear > 9999 || selectedYear < 1000) {
          alert('Por favor, ingresa una fecha límite con un año válido (entre 1000 y 9999).');
          return;
        }
      }

      // Construir lista de estudiantes asignados
      let estudiantesAsignados: number[] = [];
      if (formData.dirigidaA === 'individual') {
        if (!selectedStudentId) {
          alert('Debes seleccionar un estudiante para una evaluación individual.');
          return;
        }
        estudiantesAsignados = [parseInt(selectedStudentId, 10)];
      } else {
        // Grupo: asignar todos los estudiantes disponibles filtrados por nivel
        estudiantesAsignados = availableStudents.map(s => s.id);
      }

      const payload = { ...formData, estudiantes_asignados: estudiantesAsignados };

      if (editingEvaluacion) {
        // Actualizar evaluación existente en el backend
        const result = await evaluacionProfesorService.actualizarEvaluacion(editingEvaluacion.id, payload);
        
        if (result.success) {
          // Actualizar en el estado local
          setEvaluaciones(prev => 
            prev.map(ev => ev.id === editingEvaluacion.id ? { ...ev, ...formData, dirigidaA: formData.dirigidaA as 'individual' | 'grupo', estudiantes_asignados: estudiantesAsignados } : ev)
          );
          alert('Evaluación actualizada correctamente');
        } else {
          alert(result.message || 'Error al actualizar evaluación');
          return;
        }
      } else {
        // Crear nueva evaluación en el backend
        const result = await evaluacionProfesorService.crearEvaluacion(payload);
        
        if (result.success && result.data) {
          // Parsear la descripción para extraer nivel, unidad, clase, enlace
          const descripcion = result.data.descripcion || '';
          const parseDescripcion = (desc: string) => {
            const nivel = desc.match(/Nivel: ([^|]+)/)?.[1]?.trim() || formData.nivel;
            const unidad = desc.match(/Unidad: ([^|]+)/)?.[1]?.trim() || formData.unidad;
            const clase = desc.match(/Clase: ([^|]+)/)?.[1]?.trim() || formData.clase;
            const enlace = desc.match(/Enlace: ([^|]+)/)?.[1]?.trim() || formData.enlace;
            const dirigidaARaw = desc.match(/Dirigida a: ([^|]+)/)?.[1]?.trim() || formData.dirigidaA;
            const dirigidaA = (dirigidaARaw === 'individual' || dirigidaARaw === 'grupo') ? dirigidaARaw : 'grupo';
            return { nivel, unidad, clase, enlace, dirigidaA };
          };
          
          const { nivel, unidad, clase, enlace, dirigidaA } = parseDescripcion(descripcion);
          
          // Agregar al estado local con los datos del backend
          const nuevaEvaluacion: Evaluacion = {
            id: result.data.id,
            titulo: result.data.titulo,
            nivel,
            unidad,
            clase,
            enlace,
            dirigidaA: dirigidaA as 'individual' | 'grupo',
            estudiantes_asignados: estudiantesAsignados,
            fecha_creacion: result.data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            fecha_limite: result.data.fecha_limite ? result.data.fecha_limite.slice(0, 16) : formData.fecha_limite || undefined,
            activa: result.data.estado === 'publicada'
          };
          
          setEvaluaciones(prev => [...prev, nuevaEvaluacion]);
          alert('Evaluación creada correctamente');
        } else {
          alert(result.message || 'Error al crear evaluación');
          return;
        }
      }
      
      // Resetear formulario solo si todo salió bien
      setFormData({ titulo: '', nivel: '', unidad: '', clase: '', enlace: '', tipo: 'quiz', dirigidaA: 'grupo', fecha_limite: '' });
      setSelectedStudentId('');
      setShowModal(false);
      setEditingEvaluacion(null);
      
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      alert('Error al guardar la evaluación');
    }
  };

  const handleEdit = (evaluacion: Evaluacion) => {
    setEditingEvaluacion(evaluacion);
    setFormData({
      titulo: evaluacion.titulo,
      nivel: evaluacion.nivel,
      unidad: evaluacion.unidad,
      clase: evaluacion.clase,
      enlace: evaluacion.enlace,
      tipo: evaluacion.tipo || 'quiz',
      dirigidaA: evaluacion.dirigidaA || 'grupo',
      fecha_limite: evaluacion.fecha_limite ? evaluacion.fecha_limite.slice(0, 16) : '',
    });
    loadAvailableStudents(evaluacion.nivel);
    if (evaluacion.dirigidaA === 'individual' && evaluacion.estudiantes_asignados && evaluacion.estudiantes_asignados.length > 0) {
      setSelectedStudentId(String(evaluacion.estudiantes_asignados[0]));
    } else {
      setSelectedStudentId('');
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta evaluación?')) {
      try {
        const result = await evaluacionProfesorService.eliminarEvaluacion(id);
        
        if (result.success) {
          setEvaluaciones(prev => prev.filter(ev => ev.id !== id));
          alert(result.message || 'Evaluación eliminada correctamente');
        } else {
          alert(result.message || 'Error al eliminar evaluación');
        }
      } catch (error) {
        console.error('Error eliminando evaluación:', error);
        alert('Error al eliminar evaluación');
      }
    }
  };

  const toggleActiva = async (id: number) => {
    try {
      const result = await evaluacionProfesorService.toggleActiva(id);
      
      if (result.success) {
        setEvaluaciones(prev => 
          prev.map(ev => 
            ev.id === id ? { ...ev, activa: !ev.activa } : ev
          )
        );
        alert(result.message || 'Estado actualizado correctamente');
      } else {
        alert(result.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const openModal = () => {
    setFormData({ titulo: '', nivel: '', unidad: '', clase: '', enlace: '', tipo: 'quiz', dirigidaA: 'grupo', fecha_limite: '' });
    setSelectedStudentId('');
    setEditingEvaluacion(null);
    loadAvailableStudents();
    setShowModal(true);
  };

  useEffect(() => {
    if (showModal) {
      loadAvailableStudents(formData.nivel);
    }
  }, [formData.nivel, showModal]);

  const openAssignView = (evaluacion: Evaluacion) => {
    setAssigningEvaluacion(evaluacion);
    setSelectedStudents([]);
    setCurrentView('assign');
    // Cargar estudiantes cuando se abre la vista de asignación
    cargarEstudiantes();
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignEvaluacion = async () => {
    if (!assigningEvaluacion || selectedStudents.length === 0) {
      alert('Selecciona al menos un estudiante');
      return;
    }

    try {
      const result = await evaluacionProfesorService.asignarEvaluacion(
        assigningEvaluacion.id, 
        selectedStudents
      );
      
      if (result.success) {
        alert(result.message || `Evaluación "${assigningEvaluacion.titulo}" asignada a ${selectedStudents.length} estudiante(s)`);
        
        // Recargar evaluaciones para actualizar el contador
        await cargarEvaluaciones();
        
        setCurrentView('list');
        setAssigningEvaluacion(null);
        setSelectedStudents([]);
      } else {
        alert(result.message || 'Error al asignar evaluación');
      }
    } catch (error) {
      console.error('Error asignando evaluación:', error);
      alert('Error al asignar evaluación');
    }
  };

  const getStudentsByLevel = (nivel: string) => {
    return estudiantes.filter(estudiante => estudiante.nivel === nivel);
  };

  // Función para volver a la lista
  const backToList = () => {
    setCurrentView('list');
    setAssigningEvaluacion(null);
    setSelectedStudents([]);
  };

  // Vista de asignación
  if (currentView === 'assign' && assigningEvaluacion) {
    return (
      <div className="drive-evaluaciones-container">
        <div className="assign-header">
          <button className="btn-back" onClick={backToList}>
            ← Volver a Evaluaciones
          </button>
          <h1>Asignar Evaluación: {assigningEvaluacion.titulo}</h1>
        </div>

        <div className="assign-content-page">
          <div className="evaluacion-info-summary">
            <div className="info-row">
              <span>🎯 Nivel: <strong>{assigningEvaluacion.nivel}</strong></span>
              <span>📚 Unidad: <strong>{assigningEvaluacion.unidad}</strong></span>
              <span>📖 Clase: <strong>{assigningEvaluacion.clase}</strong></span>
            </div>
          </div>

          <div className="students-section">
            <h3>Seleccionar Estudiantes</h3>
            
            {loadingStudents ? (
              <div className="loading-students">
                <div className="spinner"></div>
                <p>Cargando estudiantes...</p>
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="no-students">
                <p>No se encontraron estudiantes registrados.</p>
              </div>
            ) : (
              <>
                {/* Estudiantes del mismo nivel (recomendados) */}
                {getStudentsByLevel(assigningEvaluacion.nivel).length > 0 && (
                  <div className="students-group">
                    <h4>🎯 Estudiantes de nivel {assigningEvaluacion.nivel} (Recomendado)</h4>
                    <div className="students-list">
                      {getStudentsByLevel(assigningEvaluacion.nivel).map(estudiante => (
                        <label key={estudiante.id} className="student-item recommended">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(estudiante.id)}
                            onChange={() => handleStudentToggle(estudiante.id)}
                          />
                          <div className="student-info">
                            <span className="student-name">{estudiante.nombre}</span>
                            <span className="student-email">{estudiante.email}</span>
                            <span className="student-level">{estudiante.nivel}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Otros estudiantes */}
                <div className="students-group">
                  <h4>👥 Otros Estudiantes</h4>
                  <div className="students-list">
                    {estudiantes.filter(e => e.nivel !== assigningEvaluacion.nivel).map(estudiante => (
                      <label key={estudiante.id} className="student-item">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(estudiante.id)}
                          onChange={() => handleStudentToggle(estudiante.id)}
                        />
                        <div className="student-info">
                          <span className="student-name">{estudiante.nombre}</span>
                          <span className="student-email">{estudiante.email}</span>
                          <span className="student-level">{estudiante.nivel}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="selected-count">
                  {selectedStudents.length > 0 && (
                    <p>✅ {selectedStudents.length} estudiante(s) seleccionado(s)</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="assign-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={backToList}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-save" 
              onClick={handleAssignEvaluacion}
              disabled={selectedStudents.length === 0}
            >
              Asignar a {selectedStudents.length} estudiante(s)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal de lista de evaluaciones
  return (
    <div className="drive-evaluaciones-container">
      <div className="evaluaciones-header">
        <h1>📝 Gestión de Evaluaciones</h1>
        <button className="btn-nueva-evaluacion" onClick={openModal}>
          + Nueva Evaluación
        </button>
      </div>

      <div className="evaluaciones-grid">
        {Array.isArray(evaluaciones) && evaluaciones.map((evaluacion) => (
          <div key={evaluacion.id} className={`evaluacion-card ${evaluacion.tipo || 'quiz'} ${!evaluacion.activa ? 'inactiva' : ''}`}>
            <div className="evaluacion-header">
              <h3>{evaluacion.titulo}</h3>
              <div className="evaluacion-status">
                <span className={`status-badge ${evaluacion.activa ? 'activa' : 'inactiva'}`}>
                  {evaluacion.activa ? 'PUBLICADA' : 'BORRADOR'}
                </span>
              </div>
            </div>
            
            <div className="evaluacion-info">
              <div className="info-item">
                <span className="label">🎯 Nivel:</span>
                <span className={`value nivel-badge ${evaluacion.nivel}`}>{evaluacion.nivel}</span>
              </div>
              <div className="info-item">
                <span className="label">📚 Unidad:</span>
                <span className="value">{evaluacion.unidad}</span>
              </div>
              <div className="info-item">
                <span className="label">📖 Clase:</span>
                <span className="value">{evaluacion.clase}</span>
              </div>
              <div className="info-item">
                <span className="label">📅 Creada:</span>
                <span className="value">
                  {new Date(evaluacion.fecha_creacion + 'T12:00:00').toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {evaluacion.fecha_limite && (
                <div className="info-item">
                  <span className="label">⏰ Fecha límite:</span>
                  <span className="value">
                    {new Date(evaluacion.fecha_limite + ':00').toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              <div className="info-item">
                <span className="label">👥 Estudiantes:</span>
                <span className="value estudiantes-count">
                  {evaluacion.estudiantes_asignados?.length || 0} asignado(s)
                </span>
              </div>
            </div>

            <div className="evaluacion-enlace">
              {evaluacion.enlace ? (
                <a 
                  href={evaluacion.enlace} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="enlace-evaluacion"
                >
                  🔗 Abrir Evaluación
                </a>
              ) : (
                <span className="enlace-evaluacion sin-enlace">
                  Sin enlace asignado (solo archivo)
                </span>
              )}
            </div>

            <div className="evaluacion-actions">
              <button 
                className="btn-assign"
                onClick={() => openAssignView(evaluacion)}
              >
                👥 Asignar
              </button>
              <button 
                className="btn-toggle"
                onClick={() => toggleActiva(evaluacion.id)}
              >
                {evaluacion.activa ? '📤 Despublicar' : '📢 Publicar'}
              </button>
              <button 
                className="btn-edit"
                onClick={() => handleEdit(evaluacion)}
              >
                ✏️ Editar
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(evaluacion.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}

        {(!Array.isArray(evaluaciones) || evaluaciones.length === 0) && (
          <div className="no-evaluaciones">
            <p>No hay evaluaciones creadas aún.</p>
            <button className="btn-crear-primera" onClick={openModal}>
              Crear Primera Evaluación
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear/editar evaluación */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEvaluacion ? 'Editar Evaluación' : 'Nueva Evaluación'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="evaluacion-form">
              <div className="form-group">
                <label htmlFor="titulo">Título de la Evaluación *</label>
                <input
                  type="text"
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Tarea Unit 1 - Verbos en presente"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo">Tipo *</label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="quiz">Quiz</option>
                    <option value="examen">Proyectos</option>
                    <option value="tarea">Tarea</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nivel">Nivel de Inglés *</label>
                  <select
                    id="nivel"
                    value={formData.nivel}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona el nivel</option>
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
                  <label htmlFor="unidad">Unidad *</label>
                  <input
                    type="text"
                    id="unidad"
                    value={formData.unidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad: e.target.value }))}
                    placeholder="Ej: Unit 1, Unit 2..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="clase">Clase *</label>
                <input
                  type="text"
                  id="clase"
                  value={formData.clase}
                  onChange={(e) => setFormData(prev => ({ ...prev, clase: e.target.value }))}
                  placeholder="Ej: Class 1, Class 2..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dirigidaA">Dirigida a *</label>
                <select
                  id="dirigidaA"
                  value={formData.dirigidaA}
                  onChange={(e) => {
                    const value = e.target.value as 'individual' | 'grupo';
                    setFormData(prev => ({ ...prev, dirigidaA: value }));
                    if (value === 'grupo') {
                      setSelectedStudentId('');
                    }
                  }}
                  className="form-select"
                  required
                >
                  <option value="grupo">Todo el grupo</option>
                  <option value="individual">Un solo estudiante</option>
                </select>
              </div>

              {formData.dirigidaA === 'individual' && (
                <div className="form-group">
                  <label htmlFor="estudiante">Estudiante *</label>
                  <select
                    id="estudiante"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona un estudiante</option>
                    {availableStudents.map(est => (
                      <option key={est.id} value={est.id}>{est.nombre}</option>
                    ))}
                  </select>
                  {availableStudents.length === 0 && (
                    <small>No hay estudiantes disponibles para este nivel.</small>
                  )}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="enlace">Enlace de la Evaluación</label>
                <input
                  type="text"
                  id="enlace"
                  value={formData.enlace}
                  onChange={(e) => setFormData(prev => ({ ...prev, enlace: e.target.value }))}
                  placeholder="https://... (Gimkit, Kahoot, Quizizz, Google Forms, etc.)"
                />
                <small>Pega aquí el enlace de cualquier plataforma de evaluación (Gimkit, Kahoot, Quizizz, Google Forms, etc.).</small>
              </div>

              <div className="form-group">
                <label htmlFor="fecha_limite">Fecha y hora límite</label>
                <input
                  type="datetime-local"
                  id="fecha_limite"
                  value={formData.fecha_limite}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_limite: e.target.value }))}
                />
                <small>Fecha y hora hasta la cual los estudiantes pueden realizar la evaluación.</small>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingEvaluacion ? 'Actualizar' : 'Crear'} Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
