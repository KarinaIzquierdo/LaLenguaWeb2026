import { NavLink } from 'react-router-dom';
import { ThemeToggleButton } from './ThemeToggleButton';

export const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <aside className="sidebar">
      <div>
        <h3>Admin Panel</h3>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/usuarios" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestionar Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/programar-clases" className={({ isActive }) => isActive ? 'active' : ''}>
              Programar Clases
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/gestion-estudiantes" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestión de Estudiantes
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/gestion-cursos" className={({ isActive }) => isActive ? 'active' : ''}>
              Gestión de Cursos
            </NavLink>
          </li>
        </ul>
        <button className="logout-button" onClick={onLogout} style={{ marginTop: '2rem', width: '100%' }}>
          Cerrar sesión
        </button>
      </div>
      <ThemeToggleButton />
    </aside>
  );
};
