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

      // Mapa de usuarios por ID para acceder rápido
      const usuariosPorId: { [key: string]: any } = {};
      (todosUsuarios || []).forEach((u: any) => {
        if (u?.id != null) usuariosPorId[u.id.toString()] = u;
      });

      // Reunir todos los IDs: asignados a la clase + los que ya marcaron asistencia
      const idsSet = new Set<string>();
      (estudiantesIds || []).forEach((id: any) => {
        if (id != null) idsSet.add(id.toString());
      });
      (asistenciasBackend || []).forEach((a: any) => {
        if (a?.estudiante_id != null) idsSet.add(a.estudiante_id.toString());
      });

      const estudiantesList: Estudiante[] = [];
      idsSet.forEach((idStr) => {
        const u = usuariosPorId[idStr];
        const asistencia = asistenciasBackend.find((a: any) => a?.estudiante_id?.toString() === idStr);
        const nombre = asistencia?.estudiante_nombre ||
          (u ? `${u.nombres || u.first_name || ''} ${u.apellidos || u.last_name || ''}`.trim() || u.username || u.correo : `ID ${idStr}`);
        const email = u ? (u.correo || u.email || '') : '';

        estudiantesList.push({
          id: Number(idStr),
          nombre,
          email,
          estado: asistencia?.estado ?? null
        });
      });

      setEstudiantes(estudiantesList);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarEstado = (estudianteId: number, estado: string | null) => {
    setEstudiantes(prev => 
      prev.map(est => 
        est.id === estudianteId ? { ...est, estado } : est
      )
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

  const sinMarcar = estudiantes.filter(e => !e.estado).length;

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
                  <div className="estudiante-email">{estudiante.email || 'Sin correo'}</div>
                </div>
                <select
                  className="estado-select"
                  value={estudiante.estado || ''}
                  onChange={(e) => marcarEstado(estudiante.id, e.target.value || null)}
                >
                  <option value="" hidden disabled>—</option>
                  <option value="presente">✅ Presente</option>
                  <option value="ausente">❌ Rechazado</option>
                </select>
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
