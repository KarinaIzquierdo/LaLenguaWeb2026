import { useState } from 'react';
import './CrearEvaluacion.css';

interface Pregunta {
  id: string;
  tipo: 'multiple' | 'verdadero-falso' | 'completar' | 'ensayo';
  enunciado: string;
  opciones?: string[];
  respuestaCorrecta?: number | string;
  puntos: number;
  explicacion?: string;
}

interface FormularioEvaluacion {
  titulo: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  descripcion: string;
  fechaLimite?: string;
  duracionMinutos?: number;
  intentosPermitidos: number;
  mostrarResultados: boolean;
  estudiantesSeleccionados: string[];
  preguntas: Pregunta[];
}

export default function CrearEvaluacion() {
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'crear'>('lista');
  
  const [formulario, setFormulario] = useState<FormularioEvaluacion>({
    titulo: '',
    tipo: 'quiz',
    descripcion: '',
    fechaLimite: '',
    duracionMinutos: 30,
    intentosPermitidos: 1,
    mostrarResultados: true,
    estudiantesSeleccionados: [],
    preguntas: []
  });

  const [preguntaActual, setPreguntaActual] = useState<Pregunta>({
    id: '',
    tipo: 'multiple',
    enunciado: '',
    opciones: ['', '', '', ''],
    respuestaCorrecta: 0,
    puntos: 1,
    explicacion: ''
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEdicion, setIndiceEdicion] = useState(-1);

  // Datos de ejemplo de evaluaciones programadas
  const evaluacionesProgramadas = [
    {
      id: '1',
      titulo: 'Quiz de Vocabulario - Unidad 3',
      tipo: 'quiz',
      fechaCreacion: '2025-08-28',
      fechaLimite: '2025-09-05',
      estudiantes: 12,
      completadas: 8,
      promedio: 85,
      estado: 'activa'
    },
    {
      id: '2',
      titulo: 'Examen Parcial - Present Perfect',
      tipo: 'examen',
      fechaCreacion: '2025-08-25',
      fechaLimite: '2025-09-02',
      estudiantes: 15,
      completadas: 15,
      promedio: 78,
      estado: 'completada'
    },
    {
      id: '3',
      titulo: 'Tarea - Ensayo sobre Cultura Inglesa',
      tipo: 'tarea',
      fechaCreacion: '2025-08-30',
      fechaLimite: '2025-09-10',
      estudiantes: 10,
      completadas: 3,
      promedio: 92,
      estado: 'activa'
    }
  ];

  const estudiantesDisponibles = [
    { id: '1', nombre: 'Ana García', nivel: 'Intermedio' },
    { id: '2', nombre: 'Carlos López', nivel: 'Básico' },
    { id: '3', nombre: 'María Rodríguez', nivel: 'Avanzado' },
    { id: '4', nombre: 'Pedro Martín', nivel: 'Intermedio' },
    { id: '5', nombre: 'Laura Silva', nivel: 'Básico' },
    { id: '6', nombre: 'José Hernández', nivel: 'Avanzado' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormulario(prev => ({ ...prev, [name]: finalValue }));
  };

  const handlePreguntaChange = (field: string, value: any) => {
    setPreguntaActual(prev => ({ ...prev, [field]: value }));
  };

  const handleOpcionChange = (index: number, valor: string) => {
    const nuevasOpciones = [...(preguntaActual.opciones || ['', '', '', ''])];
    nuevasOpciones[index] = valor;
    setPreguntaActual(prev => ({ ...prev, opciones: nuevasOpciones }));
  };

  const agregarPregunta = () => {
    if (!preguntaActual.enunciado.trim()) {
      alert('El enunciado de la pregunta es obligatorio');
      return;
    }

    const nuevaPregunta: Pregunta = {
      ...preguntaActual,
      id: modoEdicion ? preguntaActual.id : Date.now().toString()
    };

    if (modoEdicion) {
      const nuevasPreguntas = [...formulario.preguntas];
      nuevasPreguntas[indiceEdicion] = nuevaPregunta;
      setFormulario(prev => ({ ...prev, preguntas: nuevasPreguntas }));
      setModoEdicion(false);
      setIndiceEdicion(-1);
    } else {
      setFormulario(prev => ({ 
        ...prev, 
        preguntas: [...prev.preguntas, nuevaPregunta] 
      }));
    }

    // Resetear pregunta actual
    setPreguntaActual({
      id: '',
      tipo: 'multiple',
      enunciado: '',
      opciones: ['', '', '', ''],
      respuestaCorrecta: 0,
      puntos: 1,
      explicacion: ''
    });
  };

  const editarPregunta = (index: number) => {
    setPreguntaActual(formulario.preguntas[index]);
    setModoEdicion(true);
    setIndiceEdicion(index);
  };

  const eliminarPregunta = (index: number) => {
    const nuevasPreguntas = formulario.preguntas.filter((_, i) => i !== index);
    setFormulario(prev => ({ ...prev, preguntas: nuevasPreguntas }));
  };

  const toggleEstudiante = (estudianteId: string) => {
    setFormulario(prev => ({
      ...prev,
      estudiantesSeleccionados: prev.estudiantesSeleccionados.includes(estudianteId)
        ? prev.estudiantesSeleccionados.filter(id => id !== estudianteId)
        : [...prev.estudiantesSeleccionados, estudianteId]
    }));
  };

  const calcularPuntosTotales = () => {
    return formulario.preguntas.reduce((total, pregunta) => total + pregunta.puntos, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formulario.preguntas.length === 0) {
      alert('Debes agregar al menos una pregunta');
      return;
    }

    if (formulario.estudiantesSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un estudiante');
      return;
    }

    console.log('Evaluación creada:', formulario);
    alert('¡Evaluación creada exitosamente!');
    
    // Resetear formulario
    setFormulario({
      titulo: '',
      tipo: 'quiz',
      descripcion: '',
      fechaLimite: '',
      duracionMinutos: 30,
      intentosPermitidos: 1,
      mostrarResultados: true,
      estudiantesSeleccionados: [],
      preguntas: []
    });
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'activa': { class: 'badge-active', text: 'Activa' },
      'completada': { class: 'badge-completed', text: 'Completada' },
      'pendiente': { class: 'badge-pending', text: 'Pendiente' }
    };
    return badges[estado as keyof typeof badges] || badges.pendiente;
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      'quiz': { class: 'badge-quiz', text: 'Quiz', icon: '📝' },
      'examen': { class: 'badge-exam', text: 'Examen', icon: '📋' },
      'tarea': { class: 'badge-task', text: 'Tarea', icon: '📚' }
    };
    return badges[tipo as keyof typeof badges] || badges.quiz;
  };

  return (
    <div className="crear-evaluacion-container">
      <div className="evaluacion-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Evaluaciones</h2>
            <p>Gestiona y crea evaluaciones para tus estudiantes</p>
          </div>
          <div className="header-actions">
            <button 
              className={`tab-button ${vistaActiva === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaActiva('lista')}
            >
              📋 Mis Evaluaciones
            </button>
            <button 
              className={`tab-button ${vistaActiva === 'crear' ? 'active' : ''}`}
              onClick={() => setVistaActiva('crear')}
            >
              ➕ Crear Nueva
            </button>
          </div>
        </div>
      </div>

      {vistaActiva === 'lista' ? (
        <div className="evaluaciones-lista">
          <div className="lista-header">
            <h3>Evaluaciones Programadas</h3>
            <div className="stats-summary">
              <span className="stat-item">
                <strong>{evaluacionesProgramadas.length}</strong> Total
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="titulo">Título de la Evaluación</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formulario.titulo}
                onChange={handleInputChange}
                placeholder="Ej: Quiz de Vocabulario - Unidad 3"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tipo">Tipo de Evaluación</label>
              <select
                id="tipo"
                name="tipo"
                value={formulario.tipo}
                onChange={handleInputChange}
              >
                <option value="quiz">Quiz</option>
                <option value="examen">Examen</option>
                <option value="tarea">Tarea</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formulario.descripcion}
              onChange={handleInputChange}
              placeholder="Describe el contenido y objetivos de la evaluación..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fechaLimite">Fecha Límite (opcional)</label>
              <input
                type="datetime-local"
                id="fechaLimite"
                name="fechaLimite"
                value={formulario.fechaLimite}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="duracionMinutos">Duración (minutos)</label>
              <input
                type="number"
                id="duracionMinutos"
                name="duracionMinutos"
                value={formulario.duracionMinutos}
                onChange={handleInputChange}
                min="5"
                max="180"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="intentosPermitidos">Intentos Permitidos</label>
              <select
                id="intentosPermitidos"
                name="intentosPermitidos"
                value={formulario.intentosPermitidos}
                onChange={handleInputChange}
              >
                <option value={1}>1 intento</option>
                <option value={2}>2 intentos</option>
                <option value={3}>3 intentos</option>
                <option value={-1}>Ilimitados</option>
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="mostrarResultados"
                  checked={formulario.mostrarResultados}
                  onChange={handleInputChange}
                />
                Mostrar resultados inmediatamente
              </label>
            </div>
          </div>
        </div>

        {/* Selección de estudiantes */}
        <div className="form-section">
          <h3>Estudiantes Asignados</h3>
          <div className="estudiantes-grid">
            {estudiantesDisponibles.map(estudiante => (
              <div
                key={estudiante.id}
                className={`estudiante-card ${
                  formulario.estudiantesSeleccionados.includes(estudiante.id) ? 'selected' : ''
                }`}
                onClick={() => toggleEstudiante(estudiante.id)}
              >
                <div className="estudiante-info">
                  <span className="nombre">{estudiante.nombre}</span>
                  <span className="nivel">{estudiante.nivel}</span>
                </div>
                <div className="checkbox">
                  {formulario.estudiantesSeleccionados.includes(estudiante.id) ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creador de preguntas */}
        <div className="form-section">
          <h3>
            Preguntas ({formulario.preguntas.length})
            {formulario.preguntas.length > 0 && (
              <span className="puntos-totales">
                - Total: {calcularPuntosTotales()} puntos
              </span>
            )}
          </h3>
          
          <div className="pregunta-creator">
            <div className="creator-header">
              <h4>{modoEdicion ? 'Editar Pregunta' : 'Nueva Pregunta'}</h4>
            </div>
            
            <div className="creator-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Pregunta</label>
                  <select
                    value={preguntaActual.tipo}
                    onChange={(e) => handlePreguntaChange('tipo', e.target.value)}
                  >
                    <option value="multiple">Opción Múltiple</option>
                    <option value="verdadero-falso">Verdadero/Falso</option>
                    <option value="completar">Completar</option>
                    <option value="ensayo">Ensayo</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Puntos</label>
                  <input
                    type="number"
                    value={preguntaActual.puntos}
                    onChange={(e) => handlePreguntaChange('puntos', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Enunciado de la Pregunta</label>
                <textarea
                  value={preguntaActual.enunciado}
                  onChange={(e) => handlePreguntaChange('enunciado', e.target.value)}
                  placeholder="Escribe la pregunta aquí..."
                  rows={3}
                />
              </div>

              {preguntaActual.tipo === 'multiple' && (
                <div className="opciones-section">
                  <label>Opciones de Respuesta</label>
                  {preguntaActual.opciones?.map((opcion, index) => (
                    <div key={index} className="opcion-row">
                      <input
                        type="radio"
                        name="respuesta-correcta"
                        checked={preguntaActual.respuestaCorrecta === index}
                        onChange={() => handlePreguntaChange('respuestaCorrecta', index)}
                      />
                      <input
                        type="text"
                        value={opcion}
                        onChange={(e) => handleOpcionChange(index, e.target.value)}
                        placeholder={`Opción ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {preguntaActual.tipo === 'verdadero-falso' && (
                <div className="form-group">
                  <label>Respuesta Correcta</label>
                  <select
                    value={preguntaActual.respuestaCorrecta}
                    onChange={(e) => handlePreguntaChange('respuestaCorrecta', e.target.value)}
                  >
                    <option value="true">Verdadero</option>
                    <option value="false">Falso</option>
                  </select>
                </div>
              )}

              {preguntaActual.tipo === 'completar' && (
                <div className="form-group">
                  <label>Respuesta Correcta</label>
                  <input
                    type="text"
                    value={preguntaActual.respuestaCorrecta}
                    onChange={(e) => handlePreguntaChange('respuestaCorrecta', e.target.value)}
                    placeholder="Respuesta esperada"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Explicación (opcional)</label>
                <textarea
                  value={preguntaActual.explicacion}
                  onChange={(e) => handlePreguntaChange('explicacion', e.target.value)}
                  placeholder="Explica por qué esta es la respuesta correcta..."
                  rows={2}
                />
              </div>

              <div className="creator-actions">
                <button type="button" onClick={agregarPregunta} className="btn-add-question">
                  {modoEdicion ? 'Actualizar Pregunta' : 'Agregar Pregunta'}
                </button>
                {modoEdicion && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setModoEdicion(false);
                      setIndiceEdicion(-1);
                      setPreguntaActual({
                        id: '',
                        tipo: 'multiple',
                        enunciado: '',
                        opciones: ['', '', '', ''],
                        respuestaCorrecta: 0,
                        puntos: 1,
                        explicacion: ''
                      });
                    }}
                    className="btn-cancel"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de preguntas creadas */}
          {formulario.preguntas.length > 0 && (
            <div className="preguntas-lista">
              <h4>Preguntas Creadas</h4>
              {formulario.preguntas.map((pregunta, index) => (
                <div key={pregunta.id} className="pregunta-item">
                  <div className="pregunta-header">
                    <span className="pregunta-numero">#{index + 1}</span>
                    <span className="pregunta-tipo">{pregunta.tipo}</span>
                    <span className="pregunta-puntos">{pregunta.puntos} pts</span>
                  </div>
                  <div className="pregunta-enunciado">{pregunta.enunciado}</div>
                  <div className="pregunta-actions">
                    <button type="button" onClick={() => editarPregunta(index)}>✏️</button>
                    <button type="button" onClick={() => eliminarPregunta(index)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary">
            Guardar como Borrador
          </button>
          <button type="submit" className="btn-primary">
            Crear y Publicar
          </button>
        </div>
      </form>
    </div>
  );
}
