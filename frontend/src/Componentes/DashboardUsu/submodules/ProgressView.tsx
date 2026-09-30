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

export interface NivelPeriodoInfo {
  nivel: string;
  inicio: string;
  fin: string;
  dias_total: number;
  dias_restantes: number;
  reiniciado: boolean;
}

interface ProgressViewProps {
  userTitle: string;
  userTitleCode: string | null;
  nextTitleXp: number | null;
  progressPercentage: number;
  experience: number;
  skillDatos: SkillDatos;
  nivelPeriodo?: NivelPeriodoInfo | null;
}

export default function ProgressView({
  userTitle,
  userTitleCode,
  nextTitleXp,
  progressPercentage,
  experience,
  skillDatos,
  nivelPeriodo,
}: ProgressViewProps) {
  return (
    <div className="module-view">
      <div className="panel progress-panel">
        {/* Ambiente de fondo: degradado + blobs difuminados */}
        <div className="ambiente-fondo" aria-hidden="true" />

        <div className="camino-section">
          <div className="camino-header">
            <h3 className="progress-subtitle">Tu camino</h3>
            <HojaInfoProgreso />
          </div>
          <CaminoNiveles xpTotal={experience} />
        </div>

        <div className="progress-columns">
          <div className="progress-summary">
            <h3 className="progress-subtitle">Mi nivel: {userTitle || 'Principiante'}</h3>
            {nivelPeriodo && (
              <div
                className={`nivel-periodo-chip ${nivelPeriodo.dias_restantes <= 14 ? 'nivel-periodo-alerta' : ''}`}
                title={`Periodo: ${nivelPeriodo.inicio} → ${nivelPeriodo.fin}`}
              >
                <span className="nivel-periodo-nivel">Nivel {nivelPeriodo.nivel}</span>
                <span className="nivel-periodo-dias">
                  {nivelPeriodo.reiniciado
                    ? '¡Nuevo periodo iniciado! 🎉'
                    : `⏳ ${nivelPeriodo.dias_restantes} días restantes`}
                </span>
              </div>
            )}
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
