import { useEffect, useState } from "react";
import "./Dashboard.css";
import ProfileModal from "../Profile/ProfileModal";
// @ts-ignore
import SettingsModal from "../Settings/SettingsModal";

interface DashboardProps {
  onLogout?: () => void;
}

export default function LingoLearn({ onLogout }: DashboardProps = {}) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [candies, setCandies] = useState(42); // Dulces acumulados
  const [experience, setExperience] = useState(1250); // XP acumulado
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{title: string, description: string, icon: string} | null>(null);

  // Definir premios por niveles de dulces
  const prizeThresholds = [
    { candies: 50, title: "Explorador Novato", description: "¡Has comenzado tu aventura con Lingo!", icon: "🎒" },
    { candies: 100, title: "Coleccionista de Palabras", description: "¡Dominas el vocabulario básico!", icon: "📚" },
    { candies: 200, title: "Maestro de Gramática", description: "¡Las reglas gramaticales son tu fuerte!", icon: "✏️" },
    { candies: 350, title: "Conversador Experto", description: "¡Puedes mantener conversaciones fluidas!", icon: "💬" },
    { candies: 500, title: "Guía de Lingo", description: "¡Eres un verdadero compañero de viaje!", icon: "🗺️" },
    { candies: 750, title: "Leyenda del Aprendizaje", description: "¡Tu dedicación es inspiradora!", icon: "👑" }
  ];

  // Función para verificar y otorgar premios
  const checkForPrize = (newCandyCount: number) => {
    const availablePrize = prizeThresholds.find(prize => 
      newCandyCount >= prize.candies && candies < prize.candies
    );
    
    if (availablePrize) {
      setCurrentPrize(availablePrize);
      setShowPrizeModal(true);
    }
  };

  // Función para ganar dulces y experiencia
  const earnRewards = (candiesEarned: number, xpEarned: number) => {
    const newCandyCount = candies + candiesEarned;
    setCandies(newCandyCount);
    setExperience(prev => prev + xpEarned);
    
    // Verificar si se ganó un premio
    setTimeout(() => checkForPrize(newCandyCount), 500);
    
    // Mostrar notificación de recompensa
    alert(`¡Felicidades! 🎉\nGanaste ${candiesEarned} dulces 🍬 y ${xpEarned} XP ⭐`);
  };
  useEffect(() => {
    // Progress bar inicial
    setTimeout(() => {
      const progressFill = document.querySelector<HTMLElement>(".progress-fill");
      if (progressFill) progressFill.style.width = "35%";

      const challengeFill = document.querySelector<HTMLElement>(
        ".challenge-progress-fill"
      );
      if (challengeFill) challengeFill.style.width = "60%";
    }, 500);

    // Avatar color picker
    document.querySelectorAll<HTMLElement>(".color-option").forEach((option) => {
      option.addEventListener("click", function () {
        document
          .querySelectorAll<HTMLElement>(".color-option")
          .forEach((opt) => opt.classList.remove("active"));
        this.classList.add("active");

        const avatar = document.querySelector<HTMLElement>(".avatar-preview");
        const colorClass = this.className.split(" ")[1];
        if (!avatar) return;

        switch (colorClass) {
          case "color-red":
            avatar.style.background = "#fecaca";
            avatar.style.color = "#dc2626";
            break;
          case "color-green":
            avatar.style.background = "#bbf7d0";
            avatar.style.color = "#059669";
            break;
          case "color-purple":
            avatar.style.background = "#ddd6fe";
            avatar.style.color = "#7c3aed";
            break;
          case "color-yellow":
            avatar.style.background = "#fef3c7";
            avatar.style.color = "#d97706";
            break;
        }
      });
    });

    // Hover en botones
    document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
      });
    });

    // Misiones: click en botón
    document.querySelectorAll<HTMLButtonElement>(".mission-button").forEach((btn) => {
      if (!btn.disabled) {
        btn.addEventListener("click", function () {
          const card = this.closest(".mission-card");
          const title = card?.querySelector(".mission-title")?.textContent;
          
          // Ganar recompensas por completar misión
          if (title?.includes("Vocabulario")) {
            earnRewards(5, 50); // 5 dulces, 50 XP por vocabulario
          } else if (title?.includes("Gramática")) {
            earnRewards(8, 75); // 8 dulces, 75 XP por gramática
          } else if (title?.includes("Conversación")) {
            earnRewards(10, 100); // 10 dulces, 100 XP por conversación
          }
        });
      }
    });

    // Nueva clase
    const newClassBtn = document.querySelector<HTMLButtonElement>(".new-class-btn");
    newClassBtn?.addEventListener("click", () => {
      alert("¡Programar nueva clase!");
    });

    // Editar clase
    document.querySelectorAll<HTMLButtonElement>(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest(".table-row");
        const teacher = row?.querySelector(".teacher-name")?.textContent;
        alert(`Reprogramar clase con ${teacher}`);
      });
    });

    // Eliminar clase
    document.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest(".table-row");
        const teacher = row?.querySelector(".teacher-name")?.textContent;
        if (confirm(`¿Cancelar clase con ${teacher}?`)) {
          row?.remove();
        }
      });
    });
  }, []);

  return (
    <div className="container">
      {/* Header con botón de logout */}
      <div className="dashboard-header">
        <h1>The Language</h1>
        <div className="header-actions">
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
              </div>
            )}
          </div>
          {onLogout && (
            <button className="logout-btn" onClick={onLogout}>
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>¡Ayuda a Lingo a migrar mientras aprendes inglés!</h1>
          <p>
            Acompaña a Lingo el flamingo en su viaje migratorio mientras mejoras
            tu inglés con lecciones divertidas y desafíos emocionantes.
          </p>
          <button className="btn-adventure">¡Comenzar aventura!</button>
        </div>
        <div className="hero-image">
          <div className="flamingo">
            <img
              src="Image/flamingo.png"
              alt="Flamingo"
              className="flamingo-img"
            />
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="cards-grid">
        {/* Avatar Card */}
        <div className="card avatar-card">
          <div className="card-header">
            <div className="card-icon">
              <img src="Image/usuario.png" alt="User Avatar" className="icon-img" />
            </div>
            <h3>Tu Avatar</h3>
          </div>
          <div className="card-description">
            Personaliza tu avatar para acompañar a Lingo en su viaje migratorio.
          </div>

          <div className="avatar-preview">👤</div>

          <div className="color-palette">
            <div className="color-option color-red active"></div>
            <div className="color-option color-green"></div>
            <div className="color-option color-purple"></div>
            <div className="color-option color-yellow"></div>
          </div>
          <button className="btn-primary personalizar">Personalizar</button>
        </div>

        {/* Progress Card */}
        <div className="card progress-card">
          <div className="card-header">
            <div className="card-icon">
              <img src="Image/grafico-de-barras.png" className="icon-img" />
            </div>
            <h3>Tu Progreso</h3>
          </div>
          <div className="level-info">
            <div className="level-text">Nivel actual: Principiante</div>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <div className="progress-percentage">35%</div>
            </div>
          </div>
          <ul className="skills-list">
            <li>
              <span>Vocabulario</span>
              <div className="stars">☆⭐⭐</div>
            </li>
            <li>
              <span>Gramática</span>
              <div className="stars">☆☆⭐</div>
            </li>
            <li>
              <span>Conversación</span>
              <div className="stars">⭐⭐⭐</div>
            </li>
          </ul>
          <button className="btn-primary detalles">Ver detalles</button>
        </div>

        {/* Daily Challenge Card */}
        <div className="card challenge-card">
          <div className="star large"></div>
          <div className="star medium"></div>
          <div className="star small-left"></div>
          <div className="star small-right"></div>

          <div className="card-header">
            <div className="card-icon">
              <img src="Image/fuego.png" className="icon-img" />
            </div>
            <h3>Reto Diario</h3>
          </div>

          <div className="challenge-badge">¡En racha!</div>
          <div className="challenge-day">Día 3 de racha</div>
          <div className="challenge-desc">
            Completa el reto de hoy para mantener tu racha invicta.
          </div>

          <div className="challenge-progress-container">
            <div className="challenge-segment completed"></div>
            <div className="challenge-segment completed"></div>
            <div className="challenge-segment current"></div>
            <div className="challenge-segment"></div>
            <div className="challenge-segment"></div>
            <div className="challenge-segment"></div>
            <div className="challenge-segment"></div>
          </div>

          <div className="challenge-reward">
            Próxima recompensa: 50 puntos
          </div>
          <button className="btn-challenge" onClick={() => earnRewards(3, 25)}>Completar reto de hoy</button>
        </div>
      </div>

      {/* Missions */}
      <div className="Seccion_2">
        <h1 className="section-title">Misiones Actuales</h1>
        <a href="#" className="view-all">
          Ver todas ›
        </a>
      </div>

      <div className="missions-grid">
        {/* Vocabulario de Viaje */}
        <div className="mission-card vocabulary-card">
          <div className="mission-content">
            <h2 className="mission-title">Vocabulario de Viaje</h2>
            <div className="progress-info">
              <div className="progress-text">
                <span>Progreso: 2/5</span>
                <span className="status-badge">En progreso</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill vocabulary-progress"></div>
              </div>
            </div>
            <p className="mission-description">
              Aprende palabras esenciales para ayudar a Lingo a comunicarse
              durante su viaje.
            </p>
          </div>
          <button className="mission-button">Continuar</button>
        </div>

        {/* Gramática Básica */}
        <div className="mission-card grammar-card">
          <div className="mission-content">
            <h2 className="mission-title">Gramática Básica</h2>
            <div className="progress-info">
              <div className="progress-text">
                <span>Progreso: 1/5</span>
                <span className="status-badge status-new">Nuevo</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill grammar-progress"></div>
              </div>
            </div>
            <p className="mission-description">
              Domina los tiempos verbales para ayudar a Lingo a planificar su
              ruta migratoria.
            </p>
          </div>
          <button className="mission-button">Continuar</button>
        </div>

        {/* Conversación Práctica */}
        <div className="mission-card conversation-card">
          <div className="mission-content">
            <h2 className="mission-title">Conversación Práctica</h2>
            <div className="progress-info">
              <div className="progress-text">
                <span>Progreso: 0/5</span>
                <span className="status-badge status-blocked">Bloqueado</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill conversation-progress"></div>
              </div>
            </div>
            <p className="mission-description">
              Practica diálogos para que Lingo pueda interactuar con otros
              durante su viaje.
            </p>
          </div>
          <button className="mission-button" disabled>
            Desbloquear
          </button>
        </div>
      </div>

      {/* Classes Section */}
      <div className="classes-section">
        <div className="section-header">
          <h2 className="section-title">Clases Programadas</h2>
        </div>

        <div className="classes-table">
          <div className="table-header">
            <div>Fecha</div>
            <div>Hora</div>
            <div>Profesor</div>
            <div>Tema</div>
            <div>Acciones</div>
          </div>

          <div className="table-row">
            <div className="date-cell">
              15/06/2023
              <div className="date-day">Jueves</div>
            </div>
            <div className="time-cell">10:00 - 11:00</div>
            <div className="teacher-info">
              <div className="teacher-avatar avatar-blue">JD</div>
              <div className="teacher-details">
                <span className="teacher-name">John Doe</span>
                <span className="teacher-role">Profesor Nativo</span>
              </div>
            </div>
            <div className="topic-cell">
              <span className="topic-badge">Conversación básica</span>
            </div>
            <div className="actions">
              <button className="action-btn edit-btn">✏️</button>
              <button className="action-btn delete-btn">🗑️</button>
            </div>
          </div>

          <div className="table-row">
            <div className="date-cell">
              18/06/2023
              <div className="date-day">Domingo</div>
            </div>
            <div className="time-cell">15:30 - 16:30</div>
            <div className="teacher-info">
              <div className="teacher-avatar avatar-green">MS</div>
              <div className="teacher-details">
                <span className="teacher-name">Maria Smith</span>
                <span className="teacher-role">Especialista</span>
              </div>
            </div>
            <div className="topic-cell">
              <span className="topic-badge">Vocabulario de viajes</span>
            </div>
            <div className="actions">
              <button className="action-btn edit-btn">✏️</button>
              <button className="action-btn delete-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Prize Modal */}
      {showPrizeModal && currentPrize && (
        <div className="prize-modal-backdrop" onClick={() => setShowPrizeModal(false)}>
          <div className="prize-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prize-modal-header">
              <div className="prize-icon">{currentPrize.icon}</div>
              <h2>¡Felicidades!</h2>
            </div>
            
            <div className="prize-modal-body">
              <h3 className="prize-title">{currentPrize.title}</h3>
              <p className="prize-description">{currentPrize.description}</p>
              <div className="prize-candy-count">
                <span className="candy-icon">🍬</span>
                <span>Has acumulado {candies} dulces</span>
              </div>
            </div>
            
            <div className="prize-modal-footer">
              <button 
                className="prize-close-btn" 
                onClick={() => setShowPrizeModal(false)}
              >
                ¡Continuar aventura!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
