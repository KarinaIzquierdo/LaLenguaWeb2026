import React from 'react';
import '../DashboardStudent.css';

interface Mission {
  mission_key: string;
  title: string;
  description: string;
  platform?: string;
  xp?: number;
}

interface MissionsViewProps {
  missions: Mission[];
  isLoading: boolean;
  onOpenMission: (title: string) => void;
}

export default function MissionsView({ missions, isLoading, onOpenMission }: MissionsViewProps) {
  return (
    <div className="module-view">
      <h2 className="module-title">Misiones actuales</h2>

      {isLoading ? (
        <div className="module-empty">Cargando misiones...</div>
      ) : missions.length === 0 ? (
        <div className="module-empty">No hay misiones asignadas por el momento.</div>
      ) : (
        <div className="missions-list">
          {missions.map((mission, index) => {
            const icons = ['📚', '✏️', '💬'];
            const icon = icons[index % icons.length];
            return (
              <div key={mission.mission_key} className="mission-list-card">
                <div className="mission-list-icon">{icon}</div>
                <div className="mission-list-content">
                  <h3>{mission.title}</h3>
                  <p>{mission.description}</p>
                  <div className="mission-list-meta">
                    <span>🍬 +20</span>
                    <span>⭐ +{mission.xp ?? 30} XP</span>
                  </div>
                </div>
                <button className="btn-action" onClick={() => onOpenMission(mission.title)}>
                  Jugar ahora
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
