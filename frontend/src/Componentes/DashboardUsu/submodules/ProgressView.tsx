import React from 'react';
import '../DashboardStudent.css';
import AnilloProgreso from './progreso/AnilloProgreso';
import RadarHabilidades from './progreso/RadarHabilidades';
import CaminoNiveles from './progreso/CaminoNiveles';

export interface SkillDato {
  valor: number;
  intentos: number;
  aciertos: number;
}

export interface SkillDatos {
  vocabulario: SkillDato;
  gramatica: SkillDato;
  conversacion: SkillDato;
  expresiones: SkillDato;
}

interface ProgressViewProps {
  userTitle: string;
  progressPercentage: number;
  experience: number;
  skillDatos: SkillDatos;
}

export default function ProgressView({
  userTitle,
  progressPercentage,
  experience,
  skillDatos,
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
          <RadarHabilidades datos={skillDatos} />
        </div>
      </div>
    </div>
  );
}
