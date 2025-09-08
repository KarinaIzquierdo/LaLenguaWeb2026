import { useState } from 'react';
import './Dashboard_Profesor.css';
import Nav_Profesor from './Nav_Profesor.tsx';
import EstudiantesView from './EstudiantesView.tsx';
import ProgramarClase from './ProgramarClase.tsx';
import CrearEvaluacion from './CrearEvaluacion.tsx';
import MisClases from './MisClases.tsx';
import GestionCLB from './GestionCLB';
import MisClubs from './MisClubs';

interface DashboardProfesorProps {
  onLogout?: () => void;
}

export default function DashboardProfesor({ onLogout }: DashboardProfesorProps = {}) {
  const [activeView, setActiveView] = useState('clases');
  const [profesorData] = useState({
    nombre: 'Prof. María García',
    especialidad: 'Inglés Conversacional',
    clasesTotales: 24,
    estudiantesActivos: 18,
    evaluacionesPendientes: 5
  });

  return (
    <>
      <Nav_Profesor 
        profesorData={profesorData}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      
      <div className="dashboard-profesor-container">
        <div className="dashboard-content">
          
          {/* Header con estadísticas */}
          <div className="profesor-header">
            <div className="welcome-section">
              <h1>¡Bienvenido, {profesorData.nombre}! 👨‍🏫</h1>
              <p>Gestiona tus clases, evaluaciones y estudiantes desde aquí</p>
            </div>
            
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <span className="stat-number">{profesorData.clasesTotales}</span>
                  <span className="stat-label">Clases Totales</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-number">{profesorData.estudiantesActivos}</span>
                  <span className="stat-label">Estudiantes Activos</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <span className="stat-number">{profesorData.evaluacionesPendientes}</span>
                  <span className="stat-label">Evaluaciones Pendientes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal según vista activa */}
          <div className="main-content">
            {activeView === 'clases' && <MisClases profesorId={1} />}            
            {activeView === 'programar-clase' && <ProgramarClase />}
            {activeView === 'crear-evaluacion' && <CrearEvaluacion />}
            {activeView === 'gestion-clb' && <GestionCLB profesorId={1} />}
            {activeView === 'mis-clubs' && <MisClubs />}
            {activeView === 'estudiantes' && <EstudiantesView />}
          </div>
        </div>
      </div>
    </>
  );
}
