import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { asistenciaService } from '../../services/asistenciaService';
import './TomarAsistencia.css';

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  asistio: boolean | null; // null = no marcado, true = presente, false = ausente
}

interface TomarAsistenciaProps {
  claseId: number;
  estudiantesIds: string[];
  fecha: string;
  tema: string;
  onGuardar: (asistencias: { [key: string]: boolean }) => void;
  onCerrar: () => void;
}

export default function TomarAsistencia({ 
  claseId, 
  estudiantesIds, 
  fecha, 
  tema,
  onGuardar, 
  onCerrar 
}: TomarAsistenciaProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstudiantes();
  }, [estudiantesIds]);

  const cargarEstudiantes = async () => {
    try {
      setCargando(true);
      const [todosUsuarios, asistenciasBackend] = await Promise.all([
        userService.getAll(),
        asistenciaService.getAsistenciasPorClase(claseId).catch(() => [] as any[])
      ]);

      // Filtrar solo los estudiantes asignados a esta clase
      const estudiantesClase = todosUsuarios
        .filter(u => estudiantesIds.includes(u.id.toString()))
        .map(u => ({
          id: u.id.toString(),
          nombre: `${u.nombres} ${u.apellidos}`,
          email: u.correo,
          asistio: null as boolean | null
        }));

      // Precargar asistencias registradas en el servidor
      asistenciasBackend.forEach((a: any) => {
        const estudiante = estudiantesClase.find(est => est.id === a.estudiante_id?.toString());
        if (estudiante) {
          if (a.estado === 'presente') estudiante.asistio = true;
          else if (a.estado === 'ausente') estudiante.asistio = false;
        }
      });

      // Fallback: asistencia guardada localmente
      const asistenciaGuardada = localStorage.getItem(`asistencia_clase_${claseId}`);
      if (asistenciaGuardada) {
        const asistencias = JSON.parse(asistenciaGuardada);
        estudiantesClase.forEach(est => {
          if (asistencias[est.id] !== undefined && est.asistio === null) {
            est.asistio = asistencias[est.id];
          }
        });
      }

      setEstudiantes(estudiantesClase);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarAsistencia = (estudianteId: string, asistio: boolean) => {
    setEstudiantes(prev => 
      prev.map(est => 
        est.id === estudianteId ? { ...est, asistio } : est
      )
    );
  };

  const marcarTodos = (asistio: boolean) => {
    setEstudiantes(prev => 
      prev.map(est => ({ ...est, asistio }))
    );
  };

  const handleGuardar = async () => {
    const asistencias: { [key: string]: boolean } = {};
    const resultados: Array<{ id: string; exito: boolean }> = [];
    const fechaFormateada = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ? fecha
      : new Date(fecha || Date.now()).toLocaleDateString('en-CA');

    for (const est of estudiantes) {
      if (est.asistio !== null) {
        asistencias[est.id] = est.asistio;
        try {
          await asistenciaService.registrarAsistencia({
            estudiante_id: Number(est.id),
            clase_id: claseId,
            fecha: fechaFormateada,
            estado: est.asistio ? 'presente' : 'ausente',
          });
          resultados.push({ id: est.id, exito: true });
        } catch (error) {
          console.error(`Error guardando asistencia para estudiante ${est.id}:`, error);
          resultados.push({ id: est.id, exito: false });
        }
      }
    }

    // Mantener copia local como respaldo
    localStorage.setItem(`asistencia_clase_${claseId}`, JSON.stringify(asistencias));

    const fallidos = resultados.filter(r => !r.exito).length;
    if (fallidos > 0) {
      alert(`⚠️ Se sincronizaron ${resultados.length - fallidos} asistencias, pero ${fallidos} fallaron. Se mantuvo una copia local.`);
    }

    onGuardar(asistencias);
  };

  const presentes = estudiantes.filter(e => e.asistio === true).length;
  const ausentes = estudiantes.filter(e => e.asistio === false).length;
  const sinMarcar = estudiantes.filter(e => e.asistio === null).length;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="asistencia-modal" onClick={(e) => e.stopPropagation()}>
        <div className="asistencia-header">
          <div>
            <h2>📋 Tomar Asistencia</h2>
            <p className="asistencia-info">
              <strong>{tema}</strong> • {fecha}
            </p>
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
              <div className="stat-numero">{sinMarcar}</div>
              <div className="stat-label">Sin marcar</div>
            </div>
          </div>
        </div>

        <div className="acciones-rapidas">
          <button 
            className="btn-accion btn-todos-presentes"
            onClick={() => marcarTodos(true)}
          >
            ✅ Marcar todos presentes
          </button>
          <button 
            className="btn-accion btn-todos-ausentes"
            onClick={() => marcarTodos(false)}
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
                className={`estudiante-item ${
                  estudiante.asistio === true ? 'presente' : 
                  estudiante.asistio === false ? 'ausente' : ''
                }`}
              >
                <div className="estudiante-info">
                  <div className="estudiante-nombre">{estudiante.nombre}</div>
                  <div className="estudiante-email">{estudiante.email}</div>
                </div>
                <div className="estudiante-acciones">
                  <button
                    className={`btn-asistencia ${estudiante.asistio === true ? 'activo' : ''}`}
                    onClick={() => marcarAsistencia(estudiante.id, true)}
                  >
                    ✅ Presente
                  </button>
                  <button
                    className={`btn-asistencia ${estudiante.asistio === false ? 'activo' : ''}`}
                    onClick={() => marcarAsistencia(estudiante.id, false)}
                  >
                    ❌ Ausente
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="asistencia-footer">
          <button className="btn-cancelar" onClick={onCerrar}>
            Cancelar
          </button>
          <button 
            className="btn-guardar" 
            onClick={handleGuardar}
            disabled={sinMarcar === estudiantes.length}
          >
            💾 Guardar Asistencia
          </button>
        </div>
      </div>
    </div>
  );
}
