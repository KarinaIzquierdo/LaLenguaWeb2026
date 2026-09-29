import React from 'react';
import '../DashboardStudent.css';
import AnilloProgreso from './progreso/AnilloProgreso';
import RadarHabilidades from './progreso/RadarHabilidades';
import CaminoNiveles from './progreso/CaminoNiveles';
import HojaInfoProgreso from './progreso/HojaInfoProgreso';
import './ProgressView.css';

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
  userTitleCode: string | null;
  nextTitleXp: number | null;
  progressPercentage: number;
  experience: number;
  skillDatos: SkillDatos;
}

export default function ProgressView({
  userTitle,
  userTitleCode,
  nextTitleXp,
  progressPercentage,
  experience,
  skillDatos,
}: ProgressViewProps) {
  return (
    <div className="module-view">
      <h2 className="module-title">Progreso</h2>

      <div className="panel progress-panel">
        {/* Ambiente de fondo: degradado + blobs difuminados */}
        <div className="ambiente-fondo" aria-hidden="true" />
        <HojaInfoProgreso />

        <div className="camino-section">
          <h3 className="progress-subtitle">Tu camino</h3>
          <CaminoNiveles xpTotal={experience} />
        </div>

        <div className="progress-columns">
          <div className="progress-summary">
            <h3 className="progress-subtitle">Mi nivel: {userTitle || 'Principiante'}</h3>
            <AnilloProgreso
              porcentaje={progressPercentage}
              xp={experience}
              titulo={userTitleCode || userTitle}
              proximoTituloXp={nextTitleXp ?? 0}
            />
          </div>

          <div className="skills-section">
            <h3 className="progress-subtitle">Tus habilidades</h3>
            <RadarHabilidades datos={skillDatos} />
          </div>
        </div>
      </div>
    </div>
  );
}
