import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { asistenciaService } from '../../services/asistenciaService';
import './TomarAsistencia.css';

interface Estudiante {
  id: number;
  nombre: string;
  email: string;
  estado: string | null; // null = sin marcar, 'pendiente' = registrado por código, otros = aprobado
}

interface TomarAsistenciaProps {
  claseId: number;
  estudiantesIds: string[];
  fecha: string;
  tema: string;
  codigoAsistencia?: string | null;
  onGuardar: (asistencias: { [key: string]: string | null }) => void;
  onCerrar: () => void;
}

export default function TomarAsistencia({ 
  claseId, 
  estudiantesIds, 
  fecha, 
  tema,
  codigoAsistencia,
  onGuardar, 
  onCerrar 
}: TomarAsistenciaProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEstudiantes();
  }, [estudiantesIds, claseId]);

  const cargarEstudiantes = async () => {
    try {
      setCargando(true);
      const [todosUsuarios, asistenciasBackend] = await Promise.all([
        userService.getAll(),
        asistenciaService.getAsistenciasPorClase(claseId).catch(() => [] as any[])
      ]);

      // Filtrar solo los estudiantes asignados a esta clase
      const estudiantesClase = todosUsuarios
        .filter((u: any) => estudiantesIds.includes(u.id.toString()))
        .map((u: any) => ({
          id: Number(u.id),
          nombre: `${u.nombres || u.first_name || ''} ${u.apellidos || u.last_name || ''}`.trim() || u.username || u.correo || `ID ${u.id}`,
          email: u.correo || u.email || '',
          estado: null as string | null
        }));

      // Precargar asistencias registradas en el servidor
      asistenciasBackend.forEach((a: any) => {
        const estudiante = estudiantesClase.find((est: Estudiante) => est.id === Number(a.estudiante_id));
        if (estudiante && a.estado) {
          estudiante.estado = a.estado;
        }
      });

      setEstudiantes(estudiantesClase);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarEstado = (estudianteId: number, estado: string) => {
    setEstudiantes(prev => 
      prev.map(est => 
        est.id === estudianteId ? { ...est, estado } : est
      )
    );
  };

  const marcarTodos = (estado: string) => {
    setEstudiantes(prev => 
      prev.map(est => ({ ...est, estado }))
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const asistencias: { [key: string]: string | null } = {};
    const resultados: Array<{ id: number; exito: boolean; estado: string }> = [];

    try {
      for (const est of estudiantes) {
        asistencias[est.id] = est.estado;
        if (!est.estado || est.estado === 'pendiente') {
          continue;
        }

        try {
          await asistenciaService.aprobarAsistenciaClase(claseId, {
            estudiante_id: est.id,
            estado: est.estado as 'presente' | 'ausente' | 'tardanza' | 'justificado'
          });
          resultados.push({ id: est.id, exito: true, estado: est.estado });
        } catch (error) {
          console.error(`Error guardando asistencia para estudiante ${est.id}:`, error);
          resultados.push({ id: est.id, exito: false, estado: est.estado });
        }
      }

      const fallidos = resultados.filter(r => !r.exito).length;
      if (fallidos > 0) {
        alert(`⚠️ Se sincronizaron ${resultados.length - fallidos} asistencias, pero ${fallidos} fallaron.`);
      } else {
        alert('✅ Asistencias guardadas correctamente');
      }

      onGuardar(asistencias);
    } catch (error) {
      console.error('Error guardando asistencias:', error);
    } finally {
      setGuardando(false);
    }
  };

  const estadosValidos: { key: string; label: string; icon: string; clase: string }[] = [
    { key: 'presente', label: 'Presente', icon: '✅', clase: 'presente' },
    { key: 'ausente', label: 'Ausente', icon: '❌', clase: 'ausente' },
    { key: 'tardanza', label: 'Tardanza', icon: '⏰', clase: 'tardanza' },
    { key: 'justificado', label: 'Justificado', icon: '📄', clase: 'justificado' },
  ];

  const sinMarcar = estudiantes.filter(e => !e.estado).length;
  const pendientes = estudiantes.filter(e => e.estado === 'pendiente').length;
  const presentes = estudiantes.filter(e => e.estado === 'presente').length;
  const ausentes = estudiantes.filter(e => e.estado === 'ausente').length;
  const tardanzas = estudiantes.filter(e => e.estado === 'tardanza').length;
  const justificados = estudiantes.filter(e => e.estado === 'justificado').length;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="asistencia-modal" onClick={(e) => e.stopPropagation()}>
        <div className="asistencia-header">
          <div>
            <h2>📋 Tomar Asistencia</h2>
            <p className="asistencia-info">
              <strong>{tema}</strong> • {fecha}
            </p>
            {codigoAsistencia && (
              <p className="asistencia-codigo">
                🎫 Código de asistencia: <strong>{codigoAsistencia}</strong>
              </p>
            )}
          </div>
          <button className="btn-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="asistencia-stats">
          <div className="stat-card presente">
            <span className="stat-icon">✅</span>
            <div>
              <div className="stat-numero">{presentes}</div>
              <div className="stat-label">Presentes</div>
            </div>
          </div>
          <div className="stat-card ausente">
            <span className="stat-icon">❌</span>
            <div>
              <div className="stat-numero">{ausentes}</div>
              <div className="stat-label">Ausentes</div>
            </div>
          </div>
          <div className="stat-card pendiente">
            <span className="stat-icon">⏳</span>
            <div>
              <div className="stat-numero">{pendientes}</div>
              <div className="stat-label">Pendientes</div>
            </div>
          </div>
          <div className="stat-card tardanza">
            <span className="stat-icon">⏰</span>
            <div>
              <div className="stat-numero">{tardanzas}</div>
              <div className="stat-label">Tardanzas</div>
            </div>
          </div>
          <div className="stat-card justificado">
            <span className="stat-icon">📄</span>
            <div>
              <div className="stat-numero">{justificados}</div>
              <div className="stat-label">Justificados</div>
            </div>
          </div>
        </div>

        <div className="acciones-rapidas">
          <button 
            className="btn-accion btn-todos-presentes"
            onClick={() => marcarTodos('presente')}
          >
            ✅ Marcar todos presentes
          </button>
          <button 
            className="btn-accion btn-todos-ausentes"
            onClick={() => marcarTodos('ausente')}
          >
            ❌ Marcar todos ausentes
          </button>
        </div>

        <div className="lista-estudiantes">
          {cargando ? (
            <div className="cargando">Cargando estudiantes...</div>
          ) : estudiantes.length === 0 ? (
            <div className="sin-estudiantes">
              No hay estudiantes asignados a esta clase
            </div>
          ) : (
            estudiantes.map(estudiante => (
              <div 
                key={estudiante.id} 
                className={`estudiante-item ${estudiante.estado || ''}`}
              >
                <div className="estudiante-info">
                  <div className="estudiante-nombre">{estudiante.nombre}</div>
                  <div className="estudiante-email">{estudiante.email}</div>
                  {estudiante.estado && (
                    <span className={`estado-badge ${estudiante.estado}`}>
                      {estudiante.estado === 'pendiente' && '⏳ Pendiente de aprobación'}
                      {estudiante.estado === 'presente' && '✅ Presente'}
                      {estudiante.estado === 'ausente' && '❌ Ausente'}
                      {estudiante.estado === 'tardanza' && '⏰ Tardanza'}
                      {estudiante.estado === 'justificado' && '📄 Justificado'}
                    </span>
                  )}
                </div>
                <div className="estudiante-acciones">
                  {estadosValidos.map(opcion => (
                    <button
                      key={opcion.key}
                      className={`btn-asistencia ${estudiante.estado === opcion.key ? 'activo' : ''}`}
                      onClick={() => marcarEstado(estudiante.id, opcion.key)}
                    >
                      {opcion.icon} {opcion.label}
                    </button>
                  ))}
                  <button
                    className={`btn-asistencia pendiente-btn ${estudiante.estado === 'pendiente' ? 'activo' : ''}`}
                    onClick={() => marcarEstado(estudiante.id, 'pendiente')}
                  >
                    ⏳ Pendiente
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="asistencia-footer">
          <button className="btn-cancelar" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button 
            className="btn-guardar" 
            onClick={handleGuardar}
            disabled={guardando || sinMarcar === estudiantes.length}
          >
            {guardando ? '💾 Guardando...' : '💾 Guardar Asistencia'}
          </button>
        </div>
      </div>
    </div>
  );
}
