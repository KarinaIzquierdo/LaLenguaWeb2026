import React from 'react';
import './DashboardStudent.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
  onClick?: () => void;
}

const colorMap = {
  purple: 'var(--card-purple)',
  blue: 'var(--card-blue)',
  green: 'var(--card-green)',
  orange: 'var(--card-orange)',
};

export default function StatCard({ title, value, subtitle, icon, color, onClick }: StatCardProps) {
  return (
    <div
      className={`stat-card stat-card-${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-icon" style={{ background: colorMap[color] }}>
        <span>{icon}</span>
      </div>
      <div className="stat-card-content">
        <h4>{title}</h4>
        <div className="stat-card-value">{value}</div>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
