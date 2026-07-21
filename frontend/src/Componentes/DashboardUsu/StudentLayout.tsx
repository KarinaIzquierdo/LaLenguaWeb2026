import React, { useState, useEffect } from 'react';
import './DashboardStudent.css';
import { notificationService, type Notificacion } from '../../services/notificationService';

export type StudentModule =
  | 'inicio'
  | 'misiones'
  | 'material-club'
  | 'evaluaciones'
  | 'clases'
  | 'progreso'
  | 'recompensas';

interface StudentLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole?: string;
  activeModule: StudentModule;
  onModuleChange: (module: StudentModule) => void;
  onLogout?: () => void;
  candies?: number;
  experience?: number;
  onOpenAchievements?: () => void;
}

const menuItems: { key: StudentModule; label: string; icon: string }[] = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'misiones', label: 'Misiones actuales', icon: '🎯' },
  { key: 'material-club', label: 'Material de club', icon: '📚' },
  { key: 'evaluaciones', label: 'Mis evaluaciones', icon: '📝' },
  { key: 'clases', label: 'Clases programadas', icon: '📅' },
  { key: 'progreso', label: 'Progreso', icon: '📊' },
  { key: 'recompensas', label: 'R + M', icon: '🏆' },
];

export default function StudentLayout({
  children,
  userName,
  userRole = 'Aprendiz',
  activeModule,
  onModuleChange,
  onLogout,
  candies = 0,
  experience = 0,
  onOpenAchievements,
}: StudentLayoutProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cargar notificaciones
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotificaciones(),
        notificationService.getContadorNoLeidas(),
      ]);
      setNotificaciones(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications in StudentLayout:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.marcarComoLeida(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleModuleChange = (module: StudentModule) => {
    onModuleChange(module);
    setIsSidebarOpen(false);
  };

  return (
    <div className="student-dashboard">
      <aside className={`student-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/Lengua-logo.png" alt="La Lengua" className="brand-logo" />
          <span className="brand-name">La Lengua</span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <span className="profile-name">{userName || 'Estudiante'}</span>
            <span className="profile-role">{userRole}</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-item ${activeModule === item.key ? 'active' : ''}`}
              onClick={() => handleModuleChange(item.key)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={onLogout}>
          <span>⬅️</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="student-main">
        <header className="student-header">
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Abrir menú"
            title="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="header-actions">
            <div className="user-stats-pill">
              <span className="pill-item">
                <span className="pill-icon">🍬</span>
                <span className="pill-value">{candies}</span>
              </span>
              <span className="pill-divider" />
              <span className="pill-item">
                <span className="pill-icon">⭐</span>
                <span className="pill-value">{experience}</span>
                <span className="pill-label">XP</span>
              </span>
              <span className="pill-divider" />
              <button
                className="pill-item pill-btn"
                title="Logros"
                onClick={onOpenAchievements}
              >
                <span className="pill-icon">🏅</span>
                <span className="pill-label">Logros</span>
              </button>
            </div>

            <div className="notifications-container">
              <button
                className="header-btn has-badge"
                title="Notificaciones"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notificaciones</h4>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notificaciones.length === 0 ? (
                      <div className="no-notifications">
                        <p>No tienes notificaciones</p>
                      </div>
                    ) : (
                      notificaciones.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                          onClick={() => !notif.leida && handleMarkAsRead(notif.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notif.mensaje}</p>
                            <span className="notification-time">{formatFecha(notif.fecha_creacion)}</span>
                          </div>
                          {!notif.leida && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="header-avatar">
              <span>👤</span>
            </div>
          </div>
        </header>

        <main className="student-content">{children}</main>
      </div>
    </div>
  );
}
