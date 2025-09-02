import { useState, useEffect } from 'react';
import './Dashboard.css';
import PiePagina from '../Layout/PiePagina';
import EvaluationModal from './EvaluationModal';
import ResultsModal from './ResultsModal';
import NotesModal from './NotesModal';
import OnboardingTour from "../Onboarding/OnboardingTour";
import ChallengeModal from "./ChallengeModal";
import Toast from "./Toast";
import { useDashboardEvents } from "./DashboardEvents";
import NavUsu from "./Nav_Usu";
import { ClaseService } from '../../services/claseService';

interface DashboardProps {
  onLogout?: () => void;
}

export default function LingoLearn({ onLogout }: DashboardProps = {}) {
  
  const [candies, setCandies] = useState(42); // Dulces acumulados
  const [experience, setExperience] = useState(1250); // XP acumulado
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{title: string, description: string, icon: string} | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(() => {
    const saved = localStorage.getItem('challengeProgress');
    return saved ? parseInt(saved) : 0;
  });
  const [hasCompletedToday, setHasCompletedToday] = useState(() => {
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem('lastCompletedDate');
    return lastCompleted === today;
  });
  const [streakLevel, setStreakLevel] = useState(() => {
    const saved = localStorage.getItem('streakLevel');
    return saved ? parseInt(saved) : 0;
  });
  const [currentChallenge, setCurrentChallenge] = useState<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  } | null>(null);
  
  // Estado para notificaciones toast
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    rewards?: { candies?: number; xp?: number };
  }>({
    type: 'success',
    title: '',
    message: ''
  });

  // Evaluation states
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Clases states
  const [clasesUsuario, setClasesUsuario] = useState([]);
  const [isLoadingClases, setIsLoadingClases] = useState(false);

  // Evaluation functions
  const startEvaluation = (type: string) => {
    setCurrentEvaluation(type);
    setShowEvaluationModal(true);
    console.log(`Starting evaluation: ${type}`);
  };

  const viewResults = (type: string) => {
    // Mock results data
    const mockResults = {
      type,
      score: type === 'comprehension' ? 78 : 85,
      totalQuestions: type === 'comprehension' ? 8 : 10,
      correctAnswers: type === 'comprehension' ? 6 : 8,
      timeSpent: '12:34'
    };
    setEvaluationResults(mockResults);
    setShowResultsModal(true);
  };

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
    
    // Mostrar notificación Toast en lugar de alert
    showNotification('success', '¡Felicidades! 🎉', `¡Recompensas ganadas!`, { candies: candiesEarned, xp: xpEarned });
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsNewUser(false);
    setShowOnboarding(false);
  };

  // Función para forzar onboarding (temporal para pruebas)
  const forceOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setIsNewUser(true);
    setShowOnboarding(true);
  };

  // Banco de preguntas para retos diarios
  const dailyChallenges = [
    {
      question: "What is the correct way to say 'I am going to the store'?",
      options: ["I go to the store", "I am going to the store", "I going to store", "I will go store"],
      correctAnswer: 1,
      explanation: "We use 'am going' for present continuous tense to express future plans."
    },
    {
      question: "Choose the correct plural form of 'child':",
      options: ["childs", "children", "childes", "child's"],
      correctAnswer: 1,
      explanation: "'Children' is the irregular plural form of 'child'."
    },
    {
      question: "Which sentence is grammatically correct?",
      options: ["She don't like pizza", "She doesn't like pizza", "She not like pizza", "She no likes pizza"],
      correctAnswer: 1,
      explanation: "We use 'doesn't' (does not) with third person singular subjects like 'she'."
    },
    {
      question: "What does 'How are you?' mean?",
      options: ["¿Cómo estás?", "¿Qué haces?", "¿Dónde estás?", "¿Cuándo vienes?"],
      correctAnswer: 0,
      explanation: "'How are you?' is a common greeting asking about someone's well-being."
    },
    {
      question: "Complete: 'I _____ English every day.'",
      options: ["study", "studies", "studying", "studied"],
      correctAnswer: 0,
      explanation: "We use the base form 'study' with 'I' in present simple tense."
    }
  ];

  // Función para abrir modal de reto diario
  const openChallengeModal = () => {
    if (hasCompletedToday) {
      alert("⏰ Ya completaste tu reto de hoy. ¡Vuelve mañana para continuar tu racha!");
      return;
    }
    const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setCurrentChallenge(randomChallenge);
    setShowChallengeModal(true);
  };

  // Función para cerrar modal de reto
  const closeChallengeModal = () => {
    setShowChallengeModal(false);
    setCurrentChallenge(null);
  };

  // Función para mostrar notificación toast
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string, rewards?: { candies?: number; xp?: number }) => {
    setToastData({ type, title, message, rewards });
    setShowToast(true);
  };

  // Usar hook de eventos DOM con función de notificación
  useDashboardEvents(showNotification);


  // Función para verificar respuesta del reto
  const checkChallengeAnswer = (selectedAnswer: number) => {
    const today = new Date().toDateString();
    setHasCompletedToday(true);
    localStorage.setItem('lastCompletedDate', today);
    
    if (currentChallenge && selectedAnswer === currentChallenge.correctAnswer) {
      // Respuesta correcta - continúa la racha
      const newProgress = challengeProgress + 1;
      setChallengeProgress(newProgress);
      localStorage.setItem('challengeProgress', newProgress.toString());
      
      // Si completa los 7 días, dar recompensa especial y reiniciar
      if (newProgress >= 7) {
        const newStreakLevel = streakLevel + 1;
        setStreakLevel(newStreakLevel);
        localStorage.setItem('streakLevel', newStreakLevel.toString());
        setCandies(prev => prev + 15); // 15 dulces por completar semana
        setExperience(prev => prev + 50); // 50 XP por completar semana
        setChallengeProgress(0); // Reiniciar racha
        localStorage.setItem('challengeProgress', '0');
        showNotification('success', '¡Felicidades! 🎉', `¡Increíble! Completaste 7 días de racha!\n🌟 ¡Nivel de racha: ${newStreakLevel}!\n¡La tarjeta evoluciona!`, { candies: 15, xp: 50 });
      } else {
        setCandies(prev => prev + 3); // 3 dulces por día
        setExperience(prev => prev + 10); // 10 XP por día
        showNotification('success', '¡Correcto! ✅', `¡Excelente! Día ${newProgress} de racha`, { candies: 3, xp: 10 });
      }
      
      closeChallengeModal();
    } else {
      // Respuesta incorrecta - reiniciar racha a cero y mostrar respuesta correcta
      setChallengeProgress(0);
      localStorage.setItem('challengeProgress', '0');
      const correctOption = currentChallenge?.options[currentChallenge.correctAnswer];
      showNotification('error', 'Respuesta incorrecta ❌', `Tu racha se reinicia a 0.\n\nRespuesta correcta: ${correctOption}\n\n${currentChallenge?.explanation}`);
      closeChallengeModal();
    }
  };

  useEffect(() => {
    // Verificar si es un usuario nuevo - con delay para asegurar que el DOM esté listo
    setTimeout(() => {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      console.log('Verificando onboarding:', hasSeenOnboarding); // Debug
      if (!hasSeenOnboarding) {
        console.log('Usuario nuevo detectado, iniciando onboarding'); // Debug
        setIsNewUser(true);
        setShowOnboarding(true);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    const fetchClasesUsuario = async () => {
      setIsLoadingClases(true);
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.id) {
          const data = await ClaseService.getClasesPorUsuario(user.id);
          setClasesUsuario(data);
        }
      } catch (err) {
        setClasesUsuario([]);
      }
      setIsLoadingClases(false);
    };
    fetchClasesUsuario();
  }, []);

  return (
    <>
      {/* Navigation Header - Outside container for full width */}
      <NavUsu 
        candies={candies} 
        experience={experience} 
        onLogout={onLogout} 
      />
      
      <div className="container">
        {/* Content wrapper */}
        <div className="dashboard-content">

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>¡Bienvenido a tu aventura con Lingo! 🦩</h1>
          <p>Acompaña a nuestro flamenco en su viaje migratorio mientras aprendes inglés</p>
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
              <img src="Image/usuario.png" className="icon-img" />
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
        <div className={`card challenge-card streak-level-${streakLevel}`}>
          <div className="star large"></div>
          <div className="star medium"></div>
          <div className="star small-left"></div>
          <div className="star small-right"></div>
          
          {/* Efectos especiales según nivel de racha */}
          {streakLevel >= 1 && (
            <>
              <div className="floating-stars">
                <div className="floating-star star-1">⭐</div>
                <div className="floating-star star-2">✨</div>
                <div className="floating-star star-3">🌟</div>
              </div>
            </>
          )}
          
          {streakLevel >= 2 && (
            <div className="magic-glow"></div>
          )}
          
          {streakLevel >= 3 && (
            <div className="rainbow-border"></div>
          )}

          <div className="card-header">
            <div className="card-icon">
              <img src="Image/fuego.png" className="icon-img" />
            </div>
            <h3>Reto Diario</h3>
          </div>

          <div className="challenge-badge">¡En racha!</div>
          <div className="challenge-day">Día {challengeProgress} de racha</div>
          <div className="challenge-desc">
            Completa el reto de hoy para mantener tu racha invicta.
          </div>

          <div className="challenge-progress-container">
            {[...Array(7)].map((_, index) => (
              <div 
                key={index}
                className={`challenge-segment ${
                  index < challengeProgress ? 'completed' : 
                  index === challengeProgress ? 'current' : ''
                }`}
              ></div>
            ))}
          </div>

          <div className="challenge-reward">
            Próxima recompensa: 50 puntos
          </div>
          <button 
            className={`btn-challenge ${hasCompletedToday ? 'disabled' : ''}`}
            onClick={openChallengeModal}
            disabled={hasCompletedToday}
          >
            {hasCompletedToday ? 'Completado hoy ✓' : 'Completar reto de hoy'}
          </button>
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
        <div className="mission-card vocabulary">
          <div className="mission-header">
            <div className="mission-icon">📚</div>
            <div className="mission-info">
              <h3>Vocabulario de Viaje</h3>
              <span className="mission-type">Quiz Interactivo</span>
            </div>
          </div>
          <div className="mission-content">
            <p>
              Aprende palabras esenciales que Lingo necesita conocer 
              durante su viaje. ¡Juega y aprende con Gimkit!
            </p>
            <div className="mission-stats">
              <div className="stat">
                <span className="stat-icon">🍬</span>
                <span>+10 Dulces</span>
              </div>
              <div className="stat">
                <span className="stat-icon">⭐</span>
                <span>+25 XP</span>
              </div>
            </div>
          </div>
          <button className="mission-button">Jugar Ahora</button>
        </div>

        {/* Gramática Básica */}
        <div className="mission-card grammar">
          <div className="mission-header">
            <div className="mission-icon">✏️</div>
            <div className="mission-info">
              <h3>Gramática Básica</h3>
              <span className="mission-type">Ejercicios Prácticos</span>
            </div>
          </div>
          <div className="mission-content">
            <p>
              Domina las estructuras gramaticales para ayudar a Lingo en su 
              ruta migratoria. ¡Practica con ejercicios interactivos!
            </p>
            <div className="mission-stats">
              <div className="stat">
                <span className="stat-icon">🍬</span>
                <span>+10 Dulces</span>
              </div>
              <div className="stat">
                <span className="stat-icon">⭐</span>
                <span>+25 XP</span>
              </div>
            </div>
          </div>
          <button className="mission-button">Jugar Ahora</button>
        </div>

        {/* Conversación Práctica */}
        <div className="mission-card conversation">
          <div className="mission-header">
            <div className="mission-icon">💬</div>
            <div className="mission-info">
              <h3>Conversación Práctica</h3>
              <span className="mission-type">Juego en Tiempo Real</span>
            </div>
          </div>
          <div className="mission-content">
            <p>
              Practica conversaciones reales que Lingo podría necesitar 
              durante su viaje. ¡Interactúa en tiempo real!
            </p>
            <div className="mission-stats">
              <div className="stat">
                <span className="stat-icon">🍬</span>
                <span>+10 Dulces</span>
              </div>
              <div className="stat">
                <span className="stat-icon">⭐</span>
                <span>+25 XP</span>
              </div>
            </div>
          </div>
          <button className="mission-button">Jugar Ahora</button>
        </div>
      </div>

      {/* Evaluaciones Section */}
      <div className="evaluations-section">
        <div className="section-header">
          <h2 className="section-title">Evaluaciones y Quizzes</h2>
          <button className="view-notes-btn" onClick={() => setShowNotesModal(true)}>
            📝 Ver Notas
          </button>
        </div>

        <div className="evaluations-grid">
          {/* Quiz de Vocabulario */}
          <div className="evaluation-card vocabulary-quiz">
            <div className="evaluation-header">
              <div className="evaluation-icon">📚</div>
              <div className="evaluation-info">
                <h3>Quiz de Vocabulario</h3>
                <span className="evaluation-type">10 preguntas • 15 min</span>
              </div>
              <div className="evaluation-status available">Disponible</div>
            </div>
            <div className="evaluation-content">
              <p>Evalúa tu conocimiento de vocabulario básico en inglés. Palabras esenciales para el viaje de Lingo.</p>
              <div className="evaluation-stats">
                <div className="stat">
                  <span className="stat-icon">🏆</span>
                  <span>Mejor: 85%</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🎯</span>
                  <span>Intentos: 2</span>
                </div>
              </div>
            </div>
            <button className="evaluation-button" onClick={() => startEvaluation('vocabulary')}>
              Comenzar Quiz
            </button>
          </div>

          {/* Evaluación de Gramática */}
          <div className="evaluation-card grammar-test">
            <div className="evaluation-header">
              <div className="evaluation-icon">✏️</div>
              <div className="evaluation-info">
                <h3>Evaluación de Gramática</h3>
                <span className="evaluation-type">15 preguntas • 20 min</span>
              </div>
              <div className="evaluation-status available">Disponible</div>
            </div>
            <div className="evaluation-content">
              <p>Pon a prueba tus conocimientos gramaticales con ejercicios de diferentes niveles de dificultad.</p>
              <div className="evaluation-stats">
                <div className="stat">
                  <span className="stat-icon">🏆</span>
                  <span>Mejor: 92%</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🎯</span>
                  <span>Intentos: 1</span>
                </div>
              </div>
            </div>
            <button className="evaluation-button" onClick={() => startEvaluation('grammar')}>
              Comenzar Evaluación
            </button>
          </div>

          {/* Quiz de Comprensión */}
          <div className="evaluation-card comprehension-quiz">
            <div className="evaluation-header">
              <div className="evaluation-icon">🎧</div>
              <div className="evaluation-info">
                <h3>Comprensión Auditiva</h3>
                <span className="evaluation-type">8 preguntas • 12 min</span>
              </div>
              <div className="evaluation-status completed">Completado</div>
            </div>
            <div className="evaluation-content">
              <p>Evalúa tu capacidad de comprensión auditiva con diálogos y conversaciones reales.</p>
              <div className="evaluation-stats">
                <div className="stat">
                  <span className="stat-icon">🏆</span>
                  <span>Último: 78%</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🎯</span>
                  <span>Intentos: 3</span>
                </div>
              </div>
            </div>
            <button className="evaluation-button completed" onClick={() => viewResults('comprehension')}>
              Ver Resultados
            </button>
          </div>
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
              <button 
                className="action-btn access-btn"
                onClick={() => window.open('https://meet.google.com/abc-defg-hij', '_blank')}
                title="Acceder a la clase"
              >
                📹 Acceder
              </button>
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
              <button 
                className="action-btn access-btn"
                onClick={() => window.open('https://meet.google.com/xyz-mnop-qrs', '_blank')}
                title="Acceder a la clase"
              >
                📹 Acceder
              </button>
            </div>
          </div>
        </div>

        <div className="classes-table">
          <div className="table-header">
            <div>Fecha</div>
            <div>Hora</div>
            <div>Profesor</div>
            <div>Tema</div>
            <div>Acciones</div>
          </div>

          {isLoadingClases ? (
            <div className="table-row"><td colSpan={5}>Cargando...</td></div>
          ) : (
            clasesUsuario.length > 0 ? (
              clasesUsuario.map((clase: any) => (
                <div className="table-row" key={clase.id}>
                  <div className="date-cell">{clase.fecha}</div>
                  <div className="time-cell">{clase.hora || ''}</div>
                  <div className="teacher-info">{clase.profesor}</div>
                  <div className="topic-cell">{clase.nombre}</div>
                  <div className="actions">
                    <button className="action-btn access-btn">📹 Acceder</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="table-row"><td colSpan={5}>No tienes clases programadas</td></div>
            )
          )}
        </div>
      </div>


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

      {/* Componente de Onboarding */}
      <OnboardingTour 
        isNewUser={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Botón flotante de ayuda */}
      <button 
        className="help-floating-btn"
        onClick={forceOnboarding}
        title="¿Necesitas ayuda? Haz clic para ver el tour guiado"
      >
        ?
      </button>

      {/* Evaluation Modal */}
      <EvaluationModal
        isVisible={showEvaluationModal}
        evaluationType={currentEvaluation || ''}
        onClose={() => setShowEvaluationModal(false)}
        onComplete={(results) => {
          setEvaluationResults(results);
          setShowEvaluationModal(false);
          setShowResultsModal(true);
        }}
      />

      {/* Results Modal */}
      <ResultsModal
        isVisible={showResultsModal}
        results={evaluationResults}
        onClose={() => setShowResultsModal(false)}
      />

      {/* Notes Modal */}
      <NotesModal
        isVisible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
      />

      {/* Modal de Reto Diario */}
      {showChallengeModal && currentChallenge && (
        <ChallengeModal
          isOpen={showChallengeModal}
          challenge={currentChallenge}
          onClose={closeChallengeModal}
          onAnswerSubmit={checkChallengeAnswer}
        />
      )}

        {/* Toast Notification */}
        <Toast
          isVisible={showToast}
          type={toastData.type}
          title={toastData.title}
          message={toastData.message}
          rewards={toastData.rewards}
          onClose={() => setShowToast(false)}
        />
        </div>
      </div>
      
      {/* Pie de Página */}
      <PiePagina />
    </>
  );
}
