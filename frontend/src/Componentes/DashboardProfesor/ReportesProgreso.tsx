import { useState, useEffect } from 'react';
import './ReportesProgreso.css';
import DetalleEstudianteModal from './DetalleEstudianteModal';
import { evaluacionService } from '../../services/evaluacionService';

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

interface EstadisticasGenerales {
  total_estudiantes: number;
  progreso_promedio: number;
  calificacion_promedio: number;
}

export default function ReportesProgreso() {
  const [estudiantes, setEstudiantes] = useState<EstudianteProgreso[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [ordenPor, setOrdenPor] = useState<'nombre' | 'progreso' | 'calificacion'>('progreso');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [estudianteModal, setEstudianteModal] = useState<EstudianteProgreso | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportesProgreso();
  }, []);

  const loadReportesProgreso = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionService.getReportesProgreso();
      
      if (response.success) {
        setEstudiantes(response.data.estudiantes);
        setEstadisticas(response.data.estadisticas);
      } else {
        setError('Error al cargar reportes de progreso');
      }
    } catch (err) {
      setError('Error al cargar reportes de progreso');
      console.error('Error loading reportes:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Usar estadísticas del backend si están disponibles
  const progresoPromedio = estadisticas?.progreso_promedio || 0;
  const calificacionPromedio = estadisticas?.calificacion_promedio || 0;
  const totalEstudiantes = estadisticas?.total_estudiantes || estudiantes.length;

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
            <span className="resumen-valor">{totalEstudiantes}</span>
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

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <p>Cargando reportes de progreso...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={loadReportesProgreso} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de estudiantes */}
      {!loading && !error && (
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
      )}

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
