import React, { useState } from 'react';
import { asistenciaService } from '../../../services/asistenciaService';
import '../DashboardStudent.css';

interface ClassesViewProps {
  classes: any[];
  isLoading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  clasesPerPage: number;
  onAccederClase: (clase: any) => void;
  onRefreshClases: () => void;
}

export default function ClassesView({
  classes,
  isLoading,
  currentPage,
  setCurrentPage,
  clasesPerPage,
  onAccederClase,
  onRefreshClases,
}: ClassesViewProps) {
  const totalPages = Math.ceil(classes.length / clasesPerPage) || 1;
  const indexOfLast = currentPage * clasesPerPage;
  const indexOfFirst = indexOfLast - clasesPerPage;
  const currentClasses = classes.slice(indexOfFirst, indexOfLast);

  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const handleRegistrarAsistencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setRegistrando(true);
    setMensaje(null);
    try {
      const res = await asistenciaService.registrarAsistenciaPorCodigo(codigo.trim());
      setMensaje({
        texto: res.message || 'Asistencia registrada correctamente. Queda pendiente de aprobación.',
        tipo: 'success'
      });
      setCodigo('');
      onRefreshClases();
    } catch (error: any) {
      const texto = error?.response?.data?.error || error?.message || 'Error al registrar la asistencia.';
      setMensaje({ texto, tipo: 'error' });
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="module-view">
      <h2 className="module-title">Clases programadas</h2>

      <div className="panel" style={{ marginBottom: '1rem' }}>
        <div className="panel-header">
          <h3>🎫 Marcar asistencia</h3>
        </div>
        <form
          onSubmit={handleRegistrarAsistencia}
          style={{ display: 'flex', gap: '0.5rem', padding: '1rem', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ingresa el código de asistencia"
            className="search-input"
            style={{ flex: '1 1 200px' }}
            maxLength={20}
            disabled={registrando}
          />
          <button
            type="submit"
            className="btn-action btn-access"
            disabled={registrando || !codigo.trim()}
          >
            {registrando ? 'Registrando...' : 'Marcar asistencia'}
          </button>
        </form>
        {mensaje && (
          <div style={{ padding: '0 1rem 1rem' }}>
            <span
              className="status-badge"
              style={{
                backgroundColor: mensaje.tipo === 'success' ? '#dcfce7' : '#fee2e2',
                color: mensaje.tipo === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${mensaje.tipo === 'success' ? '#86efac' : '#fca5a5'}`
              }}
            >
              {mensaje.texto}
            </span>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Tus próximas clases</h3>
          <button className="btn-refresh" onClick={onRefreshClases}>
            🔄 Actualizar
          </button>
        </div>

        <div className="data-table classes-table">
          <div className="table-row header">
            <div>Fecha</div>
            <div>Hora</div>
            <div>Profesor</div>
            <div>Tema</div>
            <div>Acciones</div>
          </div>

          {isLoading ? (
            <div className="table-message">Cargando clases...</div>
          ) : classes.length === 0 ? (
            <div className="table-message">No hay clases programadas</div>
          ) : (
            currentClasses.map((clase) => (
              <div key={clase.id} className="table-row">
                <div>
                  {clase.fecha
                    ? new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Por definir'}
                </div>
                <div>{clase.hora || 'Por definir'}</div>
                <div>
                  {clase.profesor || 'Sin asignar'}
                  {clase.tipo === 'profesor' && <span className="clase-tag">Reprogramada</span>}
                </div>
                <div>{clase.tema || clase.nombre || 'Sin tema'}</div>
                <div>
                  {clase.estado === 'activa' ? (
                    <button className="btn-action btn-access" onClick={() => onAccederClase(clase)}>
                      Acceder
                    </button>
                  ) : clase.estado === 'programada' ? (
                    <span className="status-badge programada">Programada</span>
                  ) : clase.estado === 'completada' ? (
                    <span className="status-badge completada">Completada</span>
                  ) : (
                    <span className="status-badge pendiente">Pendiente</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {classes.length > clasesPerPage && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
