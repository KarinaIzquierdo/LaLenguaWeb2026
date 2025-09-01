import { useState } from 'react';
import './ProgramarClase.css';

interface EstudianteDisponible {
  id: string;
  nombre: string;
  nivel: string;
  email: string;
}

interface FormularioClase {
  fecha: string;
  hora: string;
  duracion: number;
  tema: string;
  descripcion: string;
  estudiantesSeleccionados: string[];
  tipoClase: 'individual' | 'grupal';
  modalidad: 'presencial' | 'virtual';
  meetLink?: string;
}

export default function ProgramarClase() {
  const [formulario, setFormulario] = useState<FormularioClase>({
    fecha: '',
    hora: '',
    duracion: 60,
    tema: '',
    descripcion: '',
    estudiantesSeleccionados: [],
    tipoClase: 'individual',
    modalidad: 'virtual',
    meetLink: ''
  });

  const [estudiantesDisponibles] = useState<EstudianteDisponible[]>([
    { id: '1', nombre: 'Ana García', nivel: 'Intermedio', email: 'ana@email.com' },
    { id: '2', nombre: 'Carlos López', nivel: 'Básico', email: 'carlos@email.com' },
    { id: '3', nombre: 'María Rodríguez', nivel: 'Avanzado', email: 'maria@email.com' },
    { id: '4', nombre: 'Pedro Martín', nivel: 'Intermedio', email: 'pedro@email.com' },
    { id: '5', nombre: 'Laura Silva', nivel: 'Básico', email: 'laura@email.com' },
    { id: '6', nombre: 'José Hernández', nivel: 'Avanzado', email: 'jose@email.com' },
    { id: '7', nombre: 'Carmen Díaz', nivel: 'Intermedio', email: 'carmen@email.com' },
    { id: '8', nombre: 'Roberto Torres', nivel: 'Básico', email: 'roberto@email.com' }
  ]);

  const [mostrarEstudiantes, setMostrarEstudiantes] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [generandoMeet, setGenerandoMeet] = useState(false);

  const temasComunes = [
    'Conversación Básica',
    'Gramática Avanzada',
    'Vocabulario de Negocios',
    'Pronunciación',
    'Comprensión Auditiva',
    'Escritura Académica',
    'Inglés Conversacional',
    'Preparación TOEFL',
    'Inglés para Viajes'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const toggleEstudiante = (estudianteId: string) => {
    setFormulario(prev => ({
      ...prev,
      estudiantesSeleccionados: prev.estudiantesSeleccionados.includes(estudianteId)
        ? prev.estudiantesSeleccionados.filter(id => id !== estudianteId)
        : [...prev.estudiantesSeleccionados, estudianteId]
    }));
  };

  const estudiantesFiltrados = estudiantesDisponibles.filter(estudiante =>
    filtroNivel === 'todos' || estudiante.nivel.toLowerCase() === filtroNivel.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Clase programada:', formulario);
    // Aquí iría la lógica para enviar al backend
    alert('¡Clase programada exitosamente!');
    
    // Resetear formulario
    setFormulario({
      fecha: '',
      hora: '',
      duracion: 60,
      tema: '',
      descripcion: '',
      estudiantesSeleccionados: [],
      tipoClase: 'individual',
      modalidad: 'virtual',
      meetLink: ''
    });
  };

  const getEstudianteNombre = (id: string) => {
    return estudiantesDisponibles.find(e => e.id === id)?.nombre || '';
  };

  const generarEnlaceMeet = async () => {
    setGenerandoMeet(true);
    try {
      // Simular generación de enlace de Meet (en producción sería una API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const meetId = Math.random().toString(36).substring(2, 15);
      const meetLink = `https://meet.google.com/${meetId}`;
      
      setFormulario(prev => ({ ...prev, meetLink }));
    } catch (error) {
      console.error('Error generando enlace de Meet:', error);
      alert('Error al generar el enlace de Meet. Intenta nuevamente.');
    } finally {
      setGenerandoMeet(false);
    }
  };

  return (
    <div className="programar-clase">
      <div className="programar-header">
        <h2>Programar Nueva Clase</h2>
        <p>Crea una nueva clase y asigna estudiantes</p>
      </div>

      <form onSubmit={handleSubmit} className="clase-form">
        <div className="form-grid">
          {/* Información básica */}
          <div className="form-section">
            <h3>Información Básica</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formulario.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="hora">Hora</label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={formulario.hora}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duracion">Duración (minutos)</label>
                <select
                  id="duracion"
                  name="duracion"
                  value={formulario.duracion}
                  onChange={handleInputChange}
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="modalidad">Modalidad</label>
                <select
                  id="modalidad"
                  name="modalidad"
                  value={formulario.modalidad}
                  onChange={handleInputChange}
                >
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tema">Tema de la Clase</label>
              <select
                id="tema"
                name="tema"
                value={formulario.tema}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un tema</option>
                {temasComunes.map(tema => (
                  <option key={tema} value={tema}>{tema}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formulario.descripcion}
                onChange={handleInputChange}
                placeholder="Describe los objetivos y contenido de la clase..."
                rows={4}
              />
            </div>

            {/* Google Meet Section */}
            {formulario.modalidad === 'virtual' && (
              <div className="form-group meet-section">
                <label>Enlace de Google Meet</label>
                <div className="meet-container">
                  {!formulario.meetLink ? (
                    <button
                      type="button"
                      className="btn-generar-meet"
                      onClick={generarEnlaceMeet}
                      disabled={generandoMeet}
                    >
                      {generandoMeet ? (
                        <>
                          <span className="spinner"></span>
                          Generando enlace...
                        </>
                      ) : (
                        <>
                          📹 Generar enlace de Meet
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="meet-link-container">
                      <div className="meet-link">
                        <span className="meet-icon">📹</span>
                        <a href={formulario.meetLink} target="_blank" rel="noopener noreferrer">
                          {formulario.meetLink}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn-regenerar-meet"
                        onClick={generarEnlaceMeet}
                        disabled={generandoMeet}
                      >
                        🔄 Regenerar
                      </button>
                    </div>
                  )}
                </div>
                <small className="meet-help">
                  El enlace se compartirá automáticamente con los estudiantes seleccionados
                </small>
              </div>
            )}
          </div>

          {/* Selección de estudiantes */}
          <div className="form-section">
            <h3>Estudiantes</h3>
            
            <div className="form-group">
              <label htmlFor="tipoClase">Tipo de Clase</label>
              <select
                id="tipoClase"
                name="tipoClase"
                value={formulario.tipoClase}
                onChange={handleInputChange}
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
              </select>
            </div>

            <div className="estudiantes-selector">
              <div className="selector-header">
                <button
                  type="button"
                  className="toggle-estudiantes"
                  onClick={() => setMostrarEstudiantes(!mostrarEstudiantes)}
                >
                  {mostrarEstudiantes ? '▼' : '▶'} Seleccionar Estudiantes
                  {formulario.estudiantesSeleccionados.length > 0 && (
                    <span className="selected-count">
                      ({formulario.estudiantesSeleccionados.length} seleccionados)
                    </span>
                  )}
                </button>
              </div>

              {mostrarEstudiantes && (
                <div className="estudiantes-panel">
                  <div className="panel-header">
                    <select
                      value={filtroNivel}
                      onChange={(e) => setFiltroNivel(e.target.value)}
                      className="nivel-filter"
                    >
                      <option value="todos">Todos los niveles</option>
                      <option value="básico">Básico</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="avanzado">Avanzado</option>
                    </select>
                  </div>

                  <div className="estudiantes-list">
                    {estudiantesFiltrados.map(estudiante => (
                      <div
                        key={estudiante.id}
                        className={`estudiante-item ${
                          formulario.estudiantesSeleccionados.includes(estudiante.id) ? 'selected' : ''
                        }`}
                        onClick={() => toggleEstudiante(estudiante.id)}
                      >
                        <div className="estudiante-info">
                          <span className="estudiante-nombre">{estudiante.nombre}</span>
                          <span className="estudiante-nivel">{estudiante.nivel}</span>
                        </div>
                        <div className="checkbox">
                          {formulario.estudiantesSeleccionados.includes(estudiante.id) ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formulario.estudiantesSeleccionados.length > 0 && (
                <div className="selected-students">
                  <h4>Estudiantes Seleccionados:</h4>
                  <div className="selected-tags">
                    {formulario.estudiantesSeleccionados.map(id => (
                      <span key={id} className="student-tag">
                        {getEstudianteNombre(id)}
                        <button
                          type="button"
                          onClick={() => toggleEstudiante(id)}
                          className="remove-student"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Programar Clase
          </button>
        </div>
      </form>
    </div>
  );
}
