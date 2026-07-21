import { useState, useEffect } from 'react';
import './ReportesProgreso.css';
import DetalleEstudianteModal from './DetalleEstudianteModal';
import { evaluacionService } from '../../services/evaluacionService';

interface AsistenciaDetalle {
  fecha: string;
  estado: string;
  clase: string;
}

interface EvaluacionDetalle {
  titulo: string;
  tipo: string;
  estado: string;
  calificacion: number | null;
  fecha_envio: string | null;
}

interface EstudianteProgreso {
  id: number;
  nombre: string;
  email: string;
  correo_personal?: string;
  phone?: string;
  country?: string;
  city?: string;
  birth_date?: string;
  cedula?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  learning_goals?: string;
  especializacion?: string;
  nivel: string;
  progreso: number;
  clasesCompletadas: number;
  clasesTotales: number;
  ultimaClase: string;
  fortalezas: string[];
  areasAMejorar: string[];
  calificacionPromedio: number;
  asistencias_detalle?: AsistenciaDetalle[];
  evaluaciones_detalle?: EvaluacionDetalle[];
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

      if (!response.success || !response.data) {
        setError(response.message || 'Error al cargar reportes de progreso');
        setEstudiantes([]);
        setEstadisticas(null);
        setLoading(false);
        return;
      }

      const estudiantesData: EstudianteProgreso[] = (response.data.estudiantes || []).map((est: any) => ({
        id: est.id,
        nombre: est.nombre,
        email: est.email || '',
        correo_personal: est.correo_personal,
        phone: est.phone,
        country: est.country,
        city: est.city,
        birth_date: est.birth_date,
        cedula: est.cedula,
        address: est.address,
        emergency_contact: est.emergency_contact,
        emergency_phone: est.emergency_phone,
        learning_goals: est.learning_goals,
        especializacion: est.especializacion,
        nivel: est.nivel || 'Sin nivel',
        progreso: est.progreso || 0,
        clasesCompletadas: est.clasesCompletadas || 0,
        clasesTotales: est.clasesTotales || 0,
        ultimaClase: est.ultimaClase || new Date().toISOString(),
        fortalezas: est.fortalezas || [],
        areasAMejorar: est.areasAMejorar || [],
        calificacionPromedio: est.calificacionPromedio || 0,
        asistencias_detalle: est.asistencias_detalle || [],
        evaluaciones_detalle: est.evaluaciones_detalle || []
      }));

      setEstudiantes(estudiantesData);
      setEstadisticas(response.data.estadisticas || null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes de progreso');
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
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return 'No registrada';
      return new Date(dateString).toLocaleDateString('es-ES');
    };

    const formatValue = (value?: string | null) => value || 'No registrado';

    const asistenciasRows = (estudiante.asistencias_detalle || [])
      .map(a => `
        <tr>
          <td>${formatDate(a.fecha)}</td>
          <td>${a.clase}</td>
          <td><span class="badge ${a.estado.toLowerCase().replace(' ', '-')}">${a.estado}</span></td>
        </tr>
      `)
      .join('');

    const evaluacionesRows = (estudiante.evaluaciones_detalle || [])
      .map(e => `
        <tr>
          <td>${e.titulo}</td>
          <td>${e.tipo}</td>
          <td><span class="badge ${e.estado.toLowerCase()}">${e.estado}</span></td>
          <td>${e.calificacion !== null ? e.calificacion.toFixed(1) : '—'}</td>
          <td>${formatDate(e.fecha_envio)}</td>
        </tr>
      `)
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Progreso - ${estudiante.nombre}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      padding: 48px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0;
      color: #4f46e5;
      font-size: 2rem;
    }
    .header p {
      margin: 8px 0 0;
      color: #64748b;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      color: #4f46e5;
      font-size: 1.25rem;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .info-item {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .info-item .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .info-item .value {
      font-weight: 600;
      color: #1e293b;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .number {
      font-size: 2rem;
      font-weight: 700;
      display: block;
    }
    .stat-card .label {
      font-size: 0.85rem;
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      color: #475569;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge.presente { background: #dcfce7; color: #166534; }
    .badge.ausente { background: #fee2e2; color: #991b1b; }
    .badge.tardanza { background: #fef3c7; color: #92400e; }
    .badge.justificado { background: #e0e7ff; color: #3730a3; }
    .badge.completado { background: #dcfce7; color: #166534; }
    .badge.pendiente { background: #fee2e2; color: #991b1b; }
    .badge.enviado { background: #fef3c7; color: #92400e; }
    .badge.calificado { background: #dbeafe; color: #1e40af; }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .list li {
      background: #f8fafc;
      border-left: 4px solid #4f46e5;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #94a3b8;
      font-size: 0.85rem;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reporte de Progreso</h1>
      <p>${estudiante.nombre}</p>
      <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="section">
      <h2>Información Personal</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Correo institucional</div>
          <div class="value">${formatValue(estudiante.email)}</div>
        </div>
        <div class="info-item">
          <div class="label">Correo personal</div>
          <div class="value">${formatValue(estudiante.correo_personal)}</div>
        </div>
        <div class="info-item">
          <div class="label">Teléfono</div>
          <div class="value">${formatValue(estudiante.phone)}</div>
        </div>
        <div class="info-item">
          <div class="label">Cédula</div>
          <div class="value">${formatValue(estudiante.cedula)}</div>
        </div>
        <div class="info-item">
          <div class="label">Fecha de nacimiento</div>
          <div class="value">${formatDate(estudiante.birth_date)}</div>
        </div>
        <div class="info-item">
          <div class="label">País / Ciudad</div>
          <div class="value">${formatValue(estudiante.country)}${estudiante.city ? `, ${estudiante.city}` : ''}</div>
        </div>
        <div class="info-item">
          <div class="label">Dirección</div>
          <div class="value">${formatValue(estudiante.address)}</div>
        </div>
        <div class="info-item">
          <div class="label">Contacto de emergencia</div>
          <div class="value">${formatValue(estudiante.emergency_contact)}${estudiante.emergency_phone ? ` (${estudiante.emergency_phone})` : ''}</div>
        </div>
        <div class="info-item">
          <div class="label">Nivel de inglés</div>
          <div class="value">${estudiante.nivel}</div>
        </div>
        <div class="info-item">
          <div class="label">Especialización</div>
          <div class="value">${formatValue(estudiante.especializacion)}</div>
        </div>
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="label">Objetivos de aprendizaje</div>
          <div class="value">${formatValue(estudiante.learning_goals)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Resumen Académico</h2>
      <div class="stats">
        <div class="stat-card">
          <span class="number">${estudiante.progreso}%</span>
          <span class="label">Progreso General</span>
        </div>
        <div class="stat-card">
          <span class="number">${estudiante.clasesCompletadas}</span>
          <span class="label">Clases Completadas</span>
        </div>
        <div class="stat-card">
          <span class="number">${estudiante.clasesTotales}</span>
          <span class="label">Total de Clases</span>
        </div>
        <div class="stat-card">
          <span class="number">${estudiante.calificacionPromedio.toFixed(1)}</span>
          <span class="label">Calificación Promedio</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Última clase</div>
          <div class="value">${formatDate(estudiante.ultimaClase)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Detalle de Asistencias</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Clase</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${asistenciasRows || '<tr><td colspan="3" style="text-align:center;color:#64748b;">No hay registros de asistencia</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Evaluaciones Asignadas</h2>
      <table>
        <thead>
          <tr>
            <th>Evaluación</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Calificación</th>
            <th>Fecha de envío</th>
          </tr>
        </thead>
        <tbody>
          ${evaluacionesRows || '<tr><td colspan="5" style="text-align:center;color:#64748b;">No hay evaluaciones asignadas</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Fortalezas</h2>
      <ul class="list">
        ${estudiante.fortalezas.length > 0 ? estudiante.fortalezas.map(f => `<li>${f}</li>`).join('') : '<li style="border-left-color:#94a3b8;">Sin fortalezas registradas</li>'}
      </ul>
    </div>

    <div class="section">
      <h2>Áreas a Mejorar</h2>
      <ul class="list">
        ${estudiante.areasAMejorar.length > 0 ? estudiante.areasAMejorar.map(a => `<li>${a}</li>`).join('') : '<li style="border-left-color:#94a3b8;">Sin áreas a mejorar registradas</li>'}
      </ul>
    </div>

    <div class="footer">
      Reporte generado por The Language - ${new Date().toLocaleDateString('es-ES')}
    </div>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${estudiante.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
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

      {/* Tabla de estudiantes */}
      {!loading && !error && (
        <div className="reportes-table-container">
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nivel</th>
                  <th>Progreso</th>
                  <th>Clases Completadas</th>
                  <th>Calificación Promedio</th>
                  <th>Última Clase</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map(estudiante => (
                  <tr key={estudiante.id}>
                    <td>{estudiante.nombre}</td>
                    <td>
                      <span className={`nivel-badge-table ${estudiante.nivel.toLowerCase()}`}>
                        {estudiante.nivel}
                      </span>
                    </td>
                    <td>
                      <div className="progreso-cell">
                        <div className="progreso-barra-table">
                          <div 
                            className="progreso-relleno-table"
                            style={{ width: `${estudiante.progreso}%` }}
                          ></div>
                        </div>
                        <span className="progreso-porcentaje">{estudiante.progreso}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      {estudiante.clasesCompletadas} / {estudiante.clasesTotales}
                    </td>
                    <td className="text-center">
                      <span className="calificacion-badge">
                        {estudiante.calificacionPromedio.toFixed(1)}
                      </span>
                    </td>
                    <td>{new Date(estudiante.ultimaClase).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div className="acciones-table">
                        <button 
                          className="btn-accion-table btn-generar"
                          onClick={() => generarReporte(estudiante)}
                          title="Generar Reporte"
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
