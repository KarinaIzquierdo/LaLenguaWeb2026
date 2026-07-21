import React, { useMemo, useState } from 'react';
import '../DashboardStudent.css';
import type { Club, ClubMaterial } from '../../../services/clbService';

interface ClubMaterialsViewProps {
  clubs: Club[];
  selectedClubId: number | null;
  onSelectClub: (id: number) => void;
  materials: ClubMaterial[];
  isLoading: boolean;
  onJoinClub?: (clubId: number) => void;
  onLeaveClub?: (clubId: number) => void;
  isJoining?: boolean;
}

export default function ClubMaterialsView({
  clubs,
  selectedClubId,
  onSelectClub,
  materials,
  isLoading,
  onJoinClub,
  onLeaveClub,
  isJoining,
}: ClubMaterialsViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const selectedClub = useMemo(
    () => clubs.find((c) => c.id === selectedClubId) || null,
    [clubs, selectedClubId]
  );

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        window.location.href = url;
        return;
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.location.href = url;
    }
  };

  const toggleDescription = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="module-view">
      <h2 className="module-title">Material de club</h2>

      {clubs.length === 0 ? (
        <div className="module-empty">Aún no hay clubs disponibles.</div>
      ) : (
        <>
          <div className="club-selector-row">
            <label>Club:</label>
            <select
              value={selectedClubId ?? ''}
              onChange={(e) => onSelectClub(Number(e.target.value))}
              className="club-select"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedClub && (
              <span className={`club-member-badge ${selectedClub.is_member ? 'member' : 'not-member'}`}>
                {selectedClub.is_member ? 'Inscrito' : 'No inscrito'}
              </span>
            )}
          </div>

          {selectedClub && !selectedClub.is_member && (
            <div className="club-info-card">
              <div className="club-info-header">
                <h3>{selectedClub.name}</h3>
                <span className={`club-member-badge ${selectedClub.is_member ? 'member' : 'not-member'}`}>
                  {selectedClub.is_member ? 'Inscrito' : 'No inscrito'}
                </span>
              </div>
              {selectedClub.description && (
                <p className="club-info-description">{selectedClub.description}</p>
              )}
              <div className="club-info-meta">
                {selectedClub.profesor_name && <span>Profesor: {selectedClub.profesor_name}</span>}
                {typeof selectedClub.students_count === 'number' && (
                  <span>{selectedClub.students_count} estudiante(s)</span>
                )}
              </div>
              <div className="club-join-row">
                <p>No estás inscrito. Únete para acceder al material.</p>
                <button
                  className="btn-action btn-join"
                  onClick={() => onJoinClub?.(selectedClub.id)}
                  disabled={isJoining}
                >
                  {isJoining ? 'Inscribiendo...' : 'Inscribirme al club'}
                </button>
              </div>
            </div>
          )}

          {selectedClub && selectedClub.is_member && (
            <div className="club-info-card">
              <div className="club-info-header">
                <h3>{selectedClub.name}</h3>
                <span className={`club-member-badge ${selectedClub.is_member ? 'member' : 'not-member'}`}>
                  Inscrito
                </span>
              </div>
              {selectedClub.description && (
                <p className="club-info-description">{selectedClub.description}</p>
              )}
              <div className="club-info-meta">
                {selectedClub.profesor_name && <span>Profesor: {selectedClub.profesor_name}</span>}
                {typeof selectedClub.students_count === 'number' && (
                  <span>{selectedClub.students_count} estudiante(s)</span>
                )}
              </div>
              {onLeaveClub && (
                <div className="club-join-row leave">
                  <button
                    className="btn-action btn-leave"
                    onClick={() => onLeaveClub(selectedClub.id)}
                  >
                    Salir del club
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedClub?.is_member && (
            isLoading ? (
              <div className="module-empty">Cargando material...</div>
            ) : materials.length === 0 ? (
              <div className="module-empty">No hay material publicado aún.</div>
            ) : (
              <div className="materials-list">
                {materials.map((item) => {
                  const isUrl = item.resource_type === 'url' && item.url;
                  const fileUrl = item.file
                    ? `${import.meta.env.VITE_PUBLIC_URL || ''}${item.file}`.replace(/\/+/g, '/')
                    : '';
                  const resourceUrl = item.url || fileUrl;
                  const isExpanded = expandedIds.has(item.id);

                  return (
                    <div key={item.id} className="material-list-card">
                      <div className="material-list-icon">📎</div>
                      <div className="material-list-content">
                        <h3>{item.title}</h3>
                        <p
                          className={isExpanded ? '' : 'clamp'}
                          onClick={() => toggleDescription(item.id)}
                        >
                          {item.description || 'Recurso del club'}
                        </p>
                        <span className="material-week">Semana {item.week}</span>
                      </div>
                      {resourceUrl && (
                        isUrl ? (
                          <a
                            className="btn-action"
                            href={resourceUrl.startsWith('http') ? resourceUrl : `https://${resourceUrl}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir recurso
                          </a>
                        ) : (
                          <button
                            className="btn-action"
                            onClick={() => handleDownload(resourceUrl, item.title || 'recurso')}
                          >
                            Descargar
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
