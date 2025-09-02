import StudentChart from './charts/StudentChart';
import StudentProgressChart from './charts/StudentProgressChart';
import StudentLevelDistributionChart from './charts/StudentLevelDistributionChart';
import StudentAttendanceChart from './charts/StudentAttendanceChart';
import { FaUsers, FaBook, FaDollarSign } from 'react-icons/fa';
import './admin.css';
import './GestionEstudiantes.css';
import './formulario-usuarios.css';

const Dashboard_Admin = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Bienvenido de nuevo, Administrador</h2>
        <p>Aquí tienes un resumen de la actividad de hoy.</p>
      </header>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users"> <FaUsers /> </div>
          <div className="stat-info">
            <p>Total de Estudiantes</p>
            <span>600</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon classes"> <FaBook /> </div>
          <div className="stat-info">
            <p>Clases Programadas</p>
            <span>32</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue"> <FaDollarSign /> </div>
          <div className="stat-info">
            <p>Ingresos del Mes</p>
            <span>$5,480</span>
          </div>
        </div>
      </div>
      <div className="charts-section">
        <div className="chart-container">
          <h3>Análisis de Estudiantes</h3>
          <StudentChart />
        </div>
        <div className="chart-container">
          <h3>Progreso de Estudiantes por Nivel</h3>
          <StudentProgressChart />
        </div>
        <div className="chart-container">
          <h3>Distribución de Estudiantes por Nivel</h3>
          <StudentLevelDistributionChart />
        </div>
        <div className="chart-container">
          <h3>Asistencia Promedio de Estudiantes</h3>
          <StudentAttendanceChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard_Admin;
