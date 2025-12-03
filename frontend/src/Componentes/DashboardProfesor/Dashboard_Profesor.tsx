import React, { useState, useEffect } from 'react';
import './Dashboard_Profesor.css';
import Nav_Profesor from './Nav_Profesor';
import MisClases from './MisClases';
import ProgramarClase from './ProgramarClase';
import DriveEvaluaciones from './DriveEvaluaciones';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import GestionCLB from './GestionCLB';
import MisClubs from './MisClubs';
import ReportesProgreso from './ReportesProgreso';
import NotificacionesProfesor from './NotificacionesProfesor';
import EstudiantesView from './EstudiantesView';
import HistorialAsistencias from './HistorialAsistencias';
import CalificarEvaluaciones from './CalificarEvaluaciones';

interface DashboardProfesorProps {
  onLogout?: () => void;
}

export default function DashboardProfesor({ onLogout }: DashboardProfesorProps = {}) {
  const [activeView, setActiveView] = useState('clases');
  const [profesorData, setProfessorData] = useState({
    nombre: 'Cargando...',
    especialidad: 'Inglés Conversacional',
    clasesTotales: 24,
    estudiantesActivos: 18,
    evaluacionesPendientes: 5,
    initials: 'CG'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfessorData = async () => {
      try {
        // 1) Intentar leer directamente del usuario guardado en el login (localStorage)
        const savedUser = authService.getUser?.();
        if (savedUser) {
          const firstName = savedUser.first_name || '';
          const lastName = savedUser.last_name || '';
          const username = savedUser.username || '';

          const fullNameRaw = `${firstName} ${lastName}`.trim();
          const fullName = fullNameRaw || username || savedUser.email || 'Profesor';

          const initials = (
            (firstName?.charAt(0) || username?.charAt(0) || 'P') +
            (lastName?.charAt(0) || '')
          ).toUpperCase();

          setProfessorData(prev => ({
            ...prev,
            nombre: `Prof. ${fullName}`,
            initials,
          }));
          return;
        }

        // 2) Fallback: intentar obtener el perfil desde el backend si el endpoint existe
        const response = await userService.getCurrentUser();
        if (response.success && response.user) {
          setProfessorData(prev => ({
            ...prev,
            nombre: `Prof. ${response.user.full_name}`,
            initials: response.user.initials,
          }));
        }
      } catch (error) {
        console.error('Error loading professor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfessorData();
  }, []);

  return (
    <div className="profesor-layout">
      <Nav_Profesor 
        profesorData={profesorData}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      
      <div className="profesor-content">
        {/* Contenido principal según vista activa */}
        {activeView === 'dashboard' && (
          <div className="dashboard-home">
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
          </div>
        )}
        
        <div className="main-content">
          {activeView === 'clases' && <MisClases profesorId={1} />}            
          {activeView === 'programar-clase' && <ProgramarClase />}
          {activeView === 'drive-evaluaciones' && <DriveEvaluaciones />}
          {activeView === 'gestion-clb' && <GestionCLB profesorId={1} />}
          {activeView === 'mis-clubs' && <MisClubs />}
          {activeView === 'estudiantes' && <EstudiantesView />}
          {activeView === 'reportes' && <ReportesProgreso />}
          {activeView === 'historial-asistencias' && <HistorialAsistencias />}
          {activeView === 'calificar-evaluaciones' && <CalificarEvaluaciones />}
          {activeView === 'notificaciones' && <NotificacionesProfesor />}
        </div>
      </div>
    </div>
  );
}
