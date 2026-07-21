import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
//importar estilos css
import './AdminLayout.css';

export const AdminLayout = ({ onLogout }: { onLogout: () => void }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <button className="mobile-menu-button" onClick={toggleSidebar} aria-label="Abrir menú">
        <FaBars />
      </button>
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
      <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};
