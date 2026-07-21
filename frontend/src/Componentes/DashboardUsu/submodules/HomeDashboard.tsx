import React from 'react';
import '../DashboardStudent.css';
import StatCard from '../StatCard';

interface HomeDashboardProps {
  userName: string;
  userTitle: string;
  progressPercentage: number;
  missionsCount: number;
  materialsCount: number;
  candies: number;
  experience: number;
  onOpenMissions?: () => void;
  onOpenMaterials?: () => void;
  onOpenProgress?: () => void;
  onOpenRewards?: () => void;
}

export default function HomeDashboard({
  userName,
  userTitle,
  progressPercentage,
  missionsCount,
  materialsCount,
  candies,
  experience,
  onOpenMissions,
  onOpenMaterials,
  onOpenProgress,
  onOpenRewards,
}: HomeDashboardProps) {
  return (
    <div className="home-dashboard">
      {/* Welcome banner */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <h1>¡Bienvenida de nuevo, {userName || 'Estudiante'}!</h1>
          <p>Sigue aprendiendo y completa tus misiones para mejorar cada día.</p>
        </div>
        <div className="welcome-illustration">
          <img src="/Lengua-logo.png" alt="Mascota La Lengua" />
        </div>
      </section>

      {/* Summary cards */}
      <section className="summary-cards">
        <StatCard
          title="Misiones actuales"
          value={missionsCount}
          subtitle={`${missionsCount} misiones activas`}
          icon="🎯"
          color="purple"
          onClick={onOpenMissions}
        />
        <StatCard
          title="Material de club"
          value={materialsCount}
          subtitle={`${materialsCount} recursos disponibles`}
          icon="📚"
          color="blue"
          onClick={onOpenMaterials}
        />
        <StatCard
          title="Progreso"
          value={`${progressPercentage}%`}
          subtitle={`Nivel actual: ${userTitle || 'Principiante'}`}
          icon="📊"
          color="green"
          onClick={onOpenProgress}
        />
        <StatCard
          title="R + M"
          value={candies}
          subtitle="puntos acumulados"
          icon="🏆"
          color="orange"
          onClick={onOpenRewards}
        />
      </section>

    </div>
  );
}
