import React from 'react';
import '../DashboardStudent.css';
import AnilloProgreso from './progreso/AnilloProgreso';
import RadarHabilidades from './progreso/RadarHabilidades';
import CaminoNiveles from './progreso/CaminoNiveles';

interface ProgressViewProps {
  userTitle: string;
  progressPercentage: number;
  experience: number;
  skillVocabulario: number;
  skillGramatica: number;
  skillConversacion: number;
  skillExpresiones: number;
}

export default function ProgressView({
  userTitle,
  progressPercentage,
  experience,
  skillVocabulario,
  skillGramatica,
  skillConversacion,
  skillExpresiones,
}: ProgressViewProps) {
  return (
    <div className="module-view">
      <h2 className="module-title">Progreso</h2>

      <div className="panel progress-panel">
        <div className="camino-section">
          <h3 className="progress-subtitle">Tu camino</h3>
          <CaminoNiveles xpTotal={experience} />
        </div>

        <div className="progress-summary">
          <h3 className="progress-subtitle">Mi nivel: {userTitle || 'Principiante'}</h3>
          <AnilloProgreso porcentaje={progressPercentage} xp={experience} />
        </div>

        <div className="skills-section">
          <h3 className="progress-subtitle">Tus habilidades</h3>
          <RadarHabilidades
            vocabulario={skillVocabulario}
            gramatica={skillGramatica}
            conversacion={skillConversacion}
            expresiones={skillExpresiones}
          />
        </div>
      </div>
    </div>
  );
}
