import React from 'react';
import '../DashboardStudent.css';

interface RewardsViewProps {
  candies: number;
  experience: number;
  challengeProgress: number;
  weeklyProgress: number;
  hasCompletedToday: boolean;
  onOpenChallenge: () => void;
}

export default function RewardsView({
  candies,
  experience,
  challengeProgress,
  weeklyProgress,
  hasCompletedToday,
  onOpenChallenge,
}: RewardsViewProps) {
  return (
    <div className="module-view">
      <h2 className="module-title">Retos y Misiones</h2>

      <div className="rewards-grid">
        <div className="reward-card candies">
          <div className="reward-icon">🍬</div>
          <div className="reward-value">{candies}</div>
          <div className="reward-label">Dulces acumulados</div>
        </div>

        <div className="reward-card xp">
          <div className="reward-icon">⭐</div>
          <div className="reward-value">{experience}</div>
          <div className="reward-label">XP total</div>
        </div>

        <div className="reward-card wide streak">
          <div className="reward-icon">🔥</div>
          <div className="reward-value">Día {challengeProgress} de racha</div>
          <div className="reward-label">Reto diario</div>
          <div className="weekly-progress">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`weekly-segment ${i < weeklyProgress ? 'completed' : i === weeklyProgress ? 'current' : ''}`}
              ></div>
            ))}
          </div>
          <button
            className="btn-action btn-challenge"
            onClick={onOpenChallenge}
            disabled={hasCompletedToday}
          >
            {hasCompletedToday ? 'Completado hoy ✓' : 'Completar reto de hoy'}
          </button>
        </div>
      </div>
    </div>
  );
}
