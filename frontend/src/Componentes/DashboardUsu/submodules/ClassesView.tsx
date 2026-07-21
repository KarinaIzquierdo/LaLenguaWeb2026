import React from 'react';
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

  return (
    <div className="module-view">
      <h2 className="module-title">Clases programadas</h2>

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
