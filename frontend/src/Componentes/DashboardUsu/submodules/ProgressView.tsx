import React from 'react';
import '../DashboardStudent.css';
import './ProgressView.css';

interface ProgressViewProps {
  userTitle: string;
  progressPercentage: number;
  experience: number;
  skillVocabulario: number;
  skillGramatica: number;
  skillConversacion: number;
}

const CEFR_LEVELS = [
  'Sin nivel',
  'A1',
  'A1+',
  'A2',
  'A2+',
  'B1',
  'B1+',
  'B2',
  'B2+',
  'C1',
];

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
  const normalizedTitle = (userTitle || 'Sin nivel').trim();
  const currentIndex = CEFR_LEVELS.findIndex((l) => l.toLowerCase() === normalizedTitle.toLowerCase());
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="module-view">
      <h2 className="module-title">Progreso</h2>

      <div className="panel progress-panel">
        <div className="progress-summary">
          <div className="progress-current">
            <span className="progress-title">{normalizedTitle || 'Sin nivel'}</span>
            <span className="progress-xp">{experience} XP</span>
          </div>
          <div className="progress-bar-clean">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
            ></div>
          </div>
          <p className="progress-label">{progressPercentage}% hacia el siguiente nivel</p>
        </div>

        <div className="cefr-path-container">
          <div className="cefr-path-title">Tu camino de aprendizaje</div>
          <div className="cefr-scroll-area">
            <div className="cefr-path">
              {CEFR_LEVELS.map((level, idx) => {
                const isCompleted = idx < safeIndex;
                const isCurrent = idx === safeIndex;
                const isLocked = idx > safeIndex;
                return (
                  <React.Fragment key={level}>
                    <div
                      className={`cefr-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                      title={isCurrent ? `Nivel actual: ${level}` : isCompleted ? `${level} completado` : `${level} bloqueado`}
                    >
                      <div className="cefr-node-circle">
                        {isCompleted ? '✓' : isLocked ? '🔒' : level}
                      </div>
                      <span className="cefr-node-label">{level}</span>
                    </div>
                    {idx < CEFR_LEVELS.length - 1 && (
                      <div className={`cefr-connector ${isCompleted ? 'completed' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
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
