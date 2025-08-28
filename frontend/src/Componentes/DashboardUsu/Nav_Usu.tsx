import { useState } from "react";
import "./Nav_Usu.css";
import ProfileModal from "../Profile/ProfileModal";
// @ts-ignore
import SettingsModal from "../Settings/SettingsModal";

interface NavUsuProps {
  candies: number;
  experience: number;
  onLogout?: () => void;
}

export default function NavUsu({ candies, experience, onLogout }: NavUsuProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <>
      {/* Header de navegación */}
      <div className="nav-header">
        <div className="nav-header-inner">
          <h1>The Tongue 😜</h1>
          <div className="nav-actions">
            {/* Sistema de Dulces y Experiencia */}
            <div className="rewards-section">
              <div className="candy-counter">
                <span className="candy-icon">🍬</span>
                <span className="candy-count">{candies}</span>
              </div>
              <div className="xp-counter">
                <span className="xp-icon">⭐</span>
                <span className="xp-count">{experience} XP</span>
              </div>
            </div>
            
            <div className="profile-dropdown-container">
              <div className="profile-icon" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Ver Perfil
                  </div>
                  <div className="dropdown-item" onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Editar Perfil
                  </div>
                  <div className="dropdown-item" onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="m12 1 l1.09 3.26 L16 4 l-1.91 2.26 L16 8 l-2.91.74 L12 12 l-1.09-3.26 L8 8 l1.91-2.26 L8 4 l2.91-.74 L12 1z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Configuración
                  </div>
                  <div className="dropdown-divider"></div>
                  {onLogout && (
                    <div className="dropdown-item logout-item" onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onLogout();
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Cerrar Sesión
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </>
  );
}
