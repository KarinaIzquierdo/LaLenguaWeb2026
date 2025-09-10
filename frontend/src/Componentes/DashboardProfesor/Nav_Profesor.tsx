import './Nav_Profesor.css';

interface NavProfesorProps {
  profesorData: {
    nombre: string;
    especialidad: string;
  };
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout?: () => void;
}

export default function NavProfesor({ profesorData, activeView, setActiveView, onLogout }: NavProfesorProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'clases', label: 'Mis Clases', icon: '📚' },
    { id: 'calendario', label: 'Calendario', icon: '📅' },
    { id: 'programar-clase', label: 'Programar Clase', icon: '➕' },
    { id: 'crear-evaluacion', label: 'Evaluaciones', icon: '📝' },
    { id: 'estadisticas', label: 'Estadísticas Avanzadas', icon: '📊' },
    { id: 'reportes', label: 'Reportes de Progreso', icon: '📈' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'estudiantes', label: 'Estudiantes', icon: '👥' },
    { id: 'mis-clubs', label: 'Mis Clubs', icon: '🏷️' },
    { id: 'gestion-clb', label: 'Gestión CLB', icon: '📂' }
  ];

  return (
    <aside className="sidebar-profesor">
      <div>
        <div className="sidebar-header">
          <h3>Panel Profesor</h3>
          <div className="profesor-info">
            <div className="profesor-avatar">
              {profesorData.nombre.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profesor-details">
              <span className="profesor-name">{profesorData.nombre}</span>
              <span className="profesor-role">{profesorData.especialidad}</span>
            </div>
          </div>
        </div>
        
        <ul className="sidebar-nav">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        
        <button className="logout-button" onClick={onLogout} style={{ marginTop: '2rem', width: '100%' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
