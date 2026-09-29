import React from 'react';
import '../DashboardStudent.css';
import AnilloProgreso from './progreso/AnilloProgreso';

interface ProgressViewProps {
  userTitle: string;
  progressPercentage: number;
  experience: number;
  skillVocabulario: number;
  skillGramatica: number;
  skillConversacion: number;
}

const renderStars = (level: number) => {
  const filled = Math.max(0, Math.min(3, level));
  const empty = 3 - filled;
  return '⭐'.repeat(filled) + '☆'.repeat(empty);
};

export default function ProgressView({
  userTitle,
  progressPercentage,
  experience,
  skillVocabulario,
  skillGramatica,
  skillConversacion,
}: ProgressViewProps) {
  return (
    <div className="module-view">
      <h2 className="module-title">Progreso</h2>

      <div className="panel progress-panel">
        <div className="progress-summary">
          <h3 className="progress-subtitle">Mi nivel: {userTitle || 'Principiante'}</h3>
          <AnilloProgreso porcentaje={progressPercentage} xp={experience} />
        </div>

        <div className="skills-grid">
          <div className="skill-card skill-vocabulario">
            <span className="skill-name">Vocabulario</span>
            <div className="skill-stars">{renderStars(skillVocabulario)}</div>
          </div>
          <div className="skill-card skill-gramatica">
            <span className="skill-name">Gramática</span>
            <div className="skill-stars">{renderStars(skillGramatica)}</div>
          </div>
          <div className="skill-card skill-conversacion">
            <span className="skill-name">Conversación</span>
            <div className="skill-stars">{renderStars(skillConversacion)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
