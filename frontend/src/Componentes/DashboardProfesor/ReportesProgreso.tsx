import { useState, useEffect } from 'react';
import './ReportesProgreso.css';
import DetalleEstudianteModal from './DetalleEstudianteModal';

interface EstudianteProgreso {
  id: number;
  nombre: string;
  nivel: string;
  progreso: number;
  clasesCompletadas: number;
  clasesTotales: number;
  ultimaClase: string;
  fortalezas: string[];
  areasAMejorar: string[];
  calificacionPromedio: number;
}

export default function ReportesProgreso() {
  const [estudiantes, setEstudiantes] = useState<EstudianteProgreso[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [ordenPor, setOrdenPor] = useState<'nombre' | 'progreso' | 'calificacion'>('progreso');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [estudianteModal, setEstudianteModal] = useState<EstudianteProgreso | null>(null);

  useEffect(() => {
    const estudiantesEjemplo: EstudianteProgreso[] = [
      {
        id: 1,
        nombre: "Ana García",
        nivel: "Intermedio",
        progreso: 75,
        clasesCompletadas: 18,
        clasesTotales: 24,
        ultimaClase: "2024-12-10",
        fortalezas: ["Pronunciación", "Vocabulario"],
        areasAMejorar: ["Gramática", "Escritura"],
        calificacionPromedio: 8.5
      },
      {
        id: 2,
        nombre: "Carlos López",
        nivel: "Básico",
        progreso: 45,
        clasesCompletadas: 9,
        clasesTotales: 20,
        ultimaClase: "2024-12-08",
        fortalezas: ["Comprensión auditiva"],
        areasAMejorar: ["Conversación", "Confianza"],
        calificacionPromedio: 7.2
      },
      {
        id: 3,
        nombre: "María Rodríguez",
        nivel: "Avanzado",
        progreso: 90,
        clasesCompletadas: 27,
        clasesTotales: 30,
        ultimaClase: "2024-12-12",
        fortalezas: ["Fluidez", "Gramática", "Escritura"],
        areasAMejorar: ["Expresiones idiomáticas"],
        calificacionPromedio: 9.1
      },
      {
        id: 4,
        nombre: "Pedro Martín",
        nivel: "Intermedio",
        progreso: 60,
        clasesCompletadas: 12,
        clasesTotales: 20,
        ultimaClase: "2024-12-09",
        fortalezas: ["Vocabulario técnico"],
        areasAMejorar: ["Pronunciación", "Conversación"],
        calificacionPromedio: 7.8
      }
    ];
    setEstudiantes(estudiantesEjemplo);
  }, []);

  const estudiantesFiltrados = estudiantes
    .filter(estudiante => filtroNivel === 'todos' || estudiante.nivel === filtroNivel)
    .sort((a, b) => {
      switch (ordenPor) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'progreso':
          return b.progreso - a.progreso;
        case 'calificacion':
          return b.calificacionPromedio - a.calificacionPromedio;
        default:
          return 0;
      }
    });

  const progresoPromedio = estudiantes.reduce((acc, est) => acc + est.progreso, 0) / estudiantes.length;
  const calificacionPromedio = estudiantes.reduce((acc, est) => acc + est.calificacionPromedio, 0) / estudiantes.length;
  const promedioClases = estudiantes.reduce((acc, curr) => acc + curr.clasesCompletadas, 0) / estudiantes.length;
  const promedioEstudiantes = estudiantes.length;
  const promedioSatisfaccion = estudiantes.reduce((acc, curr) => acc + curr.calificacionPromedio, 0) / estudiantes.length;

  const mostrarDetalles = (estudiante: EstudianteProgreso) => {
    setEstudianteModal(estudiante);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEstudianteModal(null);
  };

  const generarReporte = (estudiante: EstudianteProgreso) => {
    const reporteTexto = `
REPORTE DE PROGRESO - ${estudiante.nombre}
===============================================

INFORMACIÓN GENERAL:
- Nivel: ${estudiante.nivel}
- Progreso general: ${estudiante.progreso}%
- Clases completadas: ${estudiante.clasesCompletadas} de ${estudiante.clasesTotales}
- Calificación promedio: ${estudiante.calificacionPromedio}/10
- Última clase: ${new Date(estudiante.ultimaClase).toLocaleDateString('es-ES')}

FORTALEZAS:
${estudiante.fortalezas.map(f => `- ${f}`).join('\n')}

ÁREAS A MEJORAR:
${estudiante.areasAMejorar.map(a => `- ${a}`).join('\n')}

RECOMENDACIONES:
- Continuar reforzando las fortalezas identificadas
- Enfocar las próximas clases en las áreas de mejora
- Mantener la motivación y el ritmo de aprendizaje

Generado el: ${new Date().toLocaleDateString('es-ES')}
    `.trim();

    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${estudiante.nombre.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reportes-progreso">
      <div className="reportes-header">
        <h2>📊 Reportes de Progreso</h2>
        <div className="reportes-controles">
          <select 
            value={filtroNivel} 
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los niveles</option>
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
          
          <select 
            value={ordenPor} 
            onChange={(e) => setOrdenPor(e.target.value as any)}
            className="orden-select"
          >
            <option value="progreso">Ordenar por progreso</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="calificacion">Ordenar por calificación</option>
          </select>
        </div>
      </div>

      {/* Resumen general */}
      <div className="resumen-general">
        <div className="resumen-card">
          <div className="resumen-icon">👥</div>
          <div className="resumen-info">
            <h3>Total Estudiantes</h3>
            <span className="resumen-valor">{estudiantes.length}</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon">📈</div>
          <div className="resumen-info">
            <h3>Progreso Promedio</h3>
            <span className="resumen-valor">{progresoPromedio.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon">⭐</div>
          <div className="resumen-info">
            <h3>Calificación Promedio</h3>
            <span className="resumen-valor">{calificacionPromedio.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="estudiantes-lista-container">
        <div className="estudiantes-lista">
        {estudiantesFiltrados.map(estudiante => (
          <div key={estudiante.id} className="estudiante-card">
            <div className="estudiante-header">
              <div className="estudiante-info">
                <h3>{estudiante.nombre}</h3>
                <span className={`nivel-badge ${estudiante.nivel.toLowerCase()}`}>
                  {estudiante.nivel}
                </span>
              </div>
              <div className="estudiante-info-simple">
                <span className="ultima-clase-header">
                  Última clase: {new Date(estudiante.ultimaClase).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>

            <div className="progreso-barra">
              <div className="progreso-fondo">
                <div 
                  className="progreso-relleno"
                  style={{ width: `${estudiante.progreso}%` }}
                ></div>
              </div>
              <span className="progreso-texto">
                {estudiante.clasesCompletadas} de {estudiante.clasesTotales} clases
              </span>
            </div>



            <div className="estudiante-footer">
              <div className="acciones">
                <button 
                  className="btn-accion btn-ver-detalles"
                  onClick={() => mostrarDetalles(estudiante)}
                >
                  👁️ Ver Detalles
                </button>
                <button 
                  className="btn-accion btn-generar"
                  onClick={() => generarReporte(estudiante)}
                >
                  📄 Generar reporte
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Modal de detalles */}
      {estudianteModal && (
        <DetalleEstudianteModal
          estudiante={estudianteModal}
          isOpen={modalAbierto}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}
