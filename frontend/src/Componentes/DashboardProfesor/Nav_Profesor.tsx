import { useState } from 'react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { id: 'clases', label: 'Mis Clases', icon: '📚' },
    { id: 'programar-clase', label: 'Programar Clase', icon: '➕' },
    { id: 'crear-evaluacion', label: 'Evaluaciones', icon: '📝' },
    { id: 'estudiantes', label: 'Estudiantes', icon: '👥' }
  ];

  return (
    <nav className="nav-profesor">
      <div className="nav-content">
        {/* Logo */}
        <div className="nav-logo">
          <span className="logo-text">The Language</span>
          <span className="logo-subtitle">Profesor</span>
        </div>

        {/* Menu de navegación */}
        <div className="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Perfil del profesor */}
        <div className="nav-profile">
          <button 
            className="profile-button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {profesorData.nombre.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profile-info">
              <span className="profile-name">{profesorData.nombre}</span>
              <span className="profile-role">{profesorData.especialidad}</span>
            </div>
            <span className="profile-arrow">▼</span>
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <button className="menu-item">
                <span className="menu-icon">👤</span>
                Mi Perfil
              </button>
              <button className="menu-item">
                <span className="menu-icon">⚙️</span>
                Configuración
              </button>
              <hr className="menu-divider" />
              <button className="menu-item logout" onClick={onLogout}>
                <span className="menu-icon">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
