import { useState, useEffect } from 'react';
import './DashboardStudent.css';
import PiePagina from '../Layout/PiePagina';
import EvaluationModal from './EvaluationModal';
import ResultsModal from './ResultsModal';
import NotesModal from './NotesModal';
import AchievementsModal from './AchievementsModal';
import AvatarModal from './AvatarModal';
import AdventureModal from './AdventureModal';
import OnboardingTour from '../Onboarding/OnboardingTour';
import ProfileModal from '../Profile/ProfileModal';
import ChallengeModal from './ChallengeModal';
import Toast from './Toast';
import { useDashboardEvents } from './DashboardEvents';
import { EvaluationService } from '../../services/evaluationService';
import { authService } from '../../services/authService';
import { ClaseService } from '../../services/claseService';
import { clbService, type Club, type ClubMaterial } from '../../services/clbService';
import EvaluacionesEstudiante from '../DashboardUsuario/EvaluacionesEstudiante';
import { gamificationService } from '../../services/gamificationService';
import { API_BASE_URL } from '../../config/api';
import StudentLayout, { type StudentModule } from './StudentLayout';
import HomeDashboard from './submodules/HomeDashboard';
import MissionsView from './submodules/MissionsView';
import ClubMaterialsView from './submodules/ClubMaterialsView';
import ClassesView from './submodules/ClassesView';
import ProgressView from './submodules/ProgressView';
import RewardsView from './submodules/RewardsView';

interface DashboardProps {
  onLogout?: () => void;
}

interface DailyChallenge {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DEFAULT_DAILY_CHALLENGES: DailyChallenge[] = [
  {
    question: "What is the correct way to say 'I am going to the store'?",
    options: ["I go to the store", "I am going to the store", "I going to store", "I will go store"],
    correctAnswer: 1,
    explanation: "We use 'am going' for present continuous tense to express future plans.",
  },
  {
    question: "Choose the correct plural form of 'child':",
    options: ["childs", "children", "childes", "child's"],
    correctAnswer: 1,
    explanation: "'Children' is the irregular plural form of 'child'.",
  },
  {
    question: "Which sentence is grammatically correct?",
    options: ["She don't like pizza", "She doesn't like pizza", "She not like pizza", "She no likes pizza"],
    correctAnswer: 1,
    explanation: "We use 'doesn't' (does not) with third person singular subjects like 'she'.",
  },
  {
    question: "What does 'How are you?' mean?",
    options: ["¿Cómo estás?", "¿Qué haces?", "¿Dónde estás?", "¿Cuándo vienes?"],
    correctAnswer: 0,
    explanation: "'How are you?' is a common greeting asking about someone's well-being.",
  },
  {
    question: "Complete: 'I _____ English every day.'",
    options: ["study", "studies", "studying", "studied"],
    correctAnswer: 0,
    explanation: "We use the base form 'study' with 'I' in present simple tense.",
  },
];

const prizeThresholds = [
  { candies: 50, title: 'Explorador Novato', description: '¡Has comenzado tu aventura con Lingo!', icon: '🎒' },
  { candies: 100, title: 'Coleccionista de Palabras', description: '¡Dominas el vocabulario básico!', icon: '📚' },
  { candies: 200, title: 'Maestro de Gramática', description: '¡Las reglas gramaticales son tu fuerte!', icon: '✏️' },
  { candies: 350, title: 'Conversador Experto', description: '¡Puedes mantener conversaciones fluidas!', icon: '💬' },
  { candies: 500, title: 'Guía de Lingo', description: '¡Eres un verdadero compañero de viaje!', icon: '🗺️' },
  { candies: 750, title: 'Leyenda del Aprendizaje', description: '¡Tu dedicación es inspiradora!', icon: '👑' },
];

export default function LingoLearn({ onLogout }: DashboardProps = {}) {
  const [activeModule, setActiveModule] = useState<StudentModule>('inicio');

  const [candies, setCandies] = useState(0);
  const [experience, setExperience] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{ title: string; description: string; icon: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [streakLevel, setStreakLevel] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>(DEFAULT_DAILY_CHALLENGES);

  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    rewards?: { candies?: number; xp?: number };
  }>({ type: 'success', title: '', message: '' });

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any>(null);

  const [clases, setClases] = useState<any[]>([]);
  const [isLoadingClases, setIsLoadingClases] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubMaterials, setClubMaterials] = useState<ClubMaterial[]>([]);
  const [isLoadingClubMaterials, setIsLoadingClubMaterials] = useState(false);
  const [isJoiningClub, setIsJoiningClub] = useState(false);

  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(false);

  const [userTitle, setUserTitle] = useState<string>('');
  const [userTitleCode, setUserTitleCode] = useState<string | null>(null);
  const [nextTitleXp, setNextTitleXp] = useState<number | null>(null);

  const [skillVocabulario, setSkillVocabulario] = useState(0);
  const [skillGramatica, setSkillGramatica] = useState(0);
  const [skillConversacion, setSkillConversacion] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [userFirstName, setUserFirstName] = useState<string>('');

  const [availableMissions, setAvailableMissions] = useState<
    Array<{ mission_key: string; title: string; description: string; platform: string; xp: number }>
  >([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const clasesPerPage = 5;

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const list: any[] = [];
    
    // Candies achievements
    const candyThresholds = [
      { threshold: 50, name: 'Explorador Novato' },
      { threshold: 100, name: 'Coleccionista de Palabras' },
      { threshold: 200, name: 'Maestro de Gramática' },
      { threshold: 350, name: 'Conversador Experto' },
      { threshold: 500, name: 'Guía de Lingo' },
      { threshold: 750, name: 'Leyenda del Aprendizaje' },
    ];
    
    candyThresholds.forEach(t => {
      if (candies >= t.threshold) {
        list.push({
          code: `candies_${t.threshold}`,
          name: t.name,
          type: 'candies',
          threshold: t.threshold,
        });
      }
    });

    // Streak achievements
    const streakThresholds = [
      { threshold: 3, name: 'Racha de Bronce' },
      { threshold: 7, name: 'Racha de Plata' },
      { threshold: 15, name: 'Racha de Oro' },
      { threshold: 30, name: 'Racha de Platino' },
    ];

    streakThresholds.forEach(t => {
      if (challengeProgress >= t.threshold) {
        list.push({
          code: `streak_${t.threshold}`,
          name: t.name,
          type: 'streak',
          threshold: t.threshold,
        });
      }
    });

    setAchievements(list);
  }, [candies, challengeProgress]);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAdventureModal, setShowAdventureModal] = useState(false);

  const showNotification = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    rewards?: { candies?: number; xp?: number }
  ) => {
    setToastData({ type, title, message, rewards });
    setShowToast(true);
  };

  useDashboardEvents(showNotification);

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const checkForPrize = (newCandyCount: number) => {
    const availablePrize = prizeThresholds.find((prize) => newCandyCount >= prize.candies && candies < prize.candies);
    if (availablePrize) {
      setCurrentPrize(availablePrize);
      setShowPrizeModal(true);
    }
  };

  const earnRewards = (candiesEarned: number, xpEarned: number) => {
    const newCandyCount = candies + candiesEarned;
    setCandies(newCandyCount);
    setExperience((prev) => prev + xpEarned);
    setTimeout(() => checkForPrize(newCandyCount), 500);
    showNotification('success', '¡Felicidades! 🎉', '¡Recompensas ganadas!', { candies: candiesEarned, xp: xpEarned });
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsNewUser(false);
    setShowOnboarding(false);
  };

  const forceOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setIsNewUser(true);
    setShowOnboarding(true);
  };

  const openChallengeModal = () => {
    if (hasCompletedToday) {
      alert('⏰ Ya completaste tu reto de hoy. ¡Vuelve mañana para continuar tu racha!');
      return;
    }
    if (!dailyChallenges.length) {
      alert('No hay retos configurados por ahora. Intenta más tarde.');
      return;
    }

    // Marcar el intento inmediatamente para garantizar una sola oportunidad por día
    const todayStr = new Date().toDateString();
    setHasCompletedToday(true);
    if (userId) {
      localStorage.setItem(`lastCompletedDate_${userId}`, todayStr);
    }

    const randomChallenge = dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)];
    setCurrentChallenge(randomChallenge);
    setShowChallengeModal(true);
  };

  const closeChallengeModal = () => {
    setShowChallengeModal(false);
    setCurrentChallenge(null);
  };

  const startEvaluation = (type: string) => {
    setCurrentEvaluation(type);
    setShowEvaluationModal(true);
  };

  const viewResults = (type: string) => {
    const mockResults = {
      type,
      score: type === 'comprehension' ? 78 : 85,
      totalQuestions: type === 'comprehension' ? 8 : 10,
      correctAnswers: type === 'comprehension' ? 6 : 8,
      timeSpent: '12:34',
    };
    setEvaluationResults(mockResults);
    setShowResultsModal(true);
  };

  const accederClase = (clase: any) => {
    if (clase.estado !== 'activa') {
      alert('Esta clase no está disponible aún. El profesor debe iniciarla primero.');
      return;
    }
    const meetLink = clase.meet_link || clase.meetLink;
    const esLinkInvalido =
      !meetLink || meetLink.trim() === '' || meetLink === 'undefined' || meetLink.includes('meet.google.com/new');
    if (esLinkInvalido) {
      alert('Esta clase aún no tiene enlace de videoconferencia configurado. Pide a tu profesor que agregue el enlace (Zoom, Meet, Teams, etc.).');
      return;
    }
    let enlaceCompleto = meetLink;
    if (!enlaceCompleto.startsWith('http://') && !enlaceCompleto.startsWith('https://')) {
      enlaceCompleto = 'https://' + enlaceCompleto;
    }
    window.open(enlaceCompleto, '_blank');
  };

  const procesarClasesRelevantes = (rawClases: any[]) => {
    // Comparar fechas como cadenas YYYY-MM-DD para evitar problemas de zona horaria
    const hoyStr = new Date().toLocaleDateString('en-CA');

    const clasesConFecha = (rawClases || []).map((clase) => {
      const fechaRaw = clase.fecha || new Date().toISOString();
      const fechaClaseStr =
        typeof fechaRaw === 'string' && fechaRaw.length >= 10
          ? fechaRaw.slice(0, 10)
          : new Date(fechaRaw).toLocaleDateString('en-CA');

      return {
        ...clase,
        fechaObj: new Date(`${fechaClaseStr}T12:00:00`),
        esPasada: fechaClaseStr < hoyStr,
        esHoy: fechaClaseStr === hoyStr,
        esFutura: fechaClaseStr > hoyStr,
      };
    });

    clasesConFecha.sort((a, b) => {
      const getPrioridad = (estado: string) => {
        switch (estado) {
          case 'activa':
            return 1;
          case 'programada':
            return 2;
          case 'completada':
            return 3;
          default:
            return 2;
        }
      };
      const prioridadA = getPrioridad(a.estado);
      const prioridadB = getPrioridad(b.estado);
      if (prioridadA === prioridadB) return a.fechaObj.getTime() - b.fechaObj.getTime();
      return prioridadA - prioridadB;
    });

    return clasesConFecha.filter((clase) => !clase.esPasada && clase.estado !== 'completada');
  };

  const cargarEstadoGamificacion = async (currentUserId: string) => {
    try {
      const estado = await gamificationService.getEstado();
      if (estado.success && estado.data) {
        const {
          total_dulces,
          total_xp,
          title,
          title_code,
          next_title_xp,
          achievements: allAchievements,
          skill_vocabulario,
          skill_gramatica,
          skill_conversacion,
          reto_semana_progreso,
          reto_racha_actual,
          reto_ultima_fecha,
        } = estado.data as any;
        setCandies(total_dulces ?? 0);
        setExperience(total_xp ?? 0);
        if (title) setUserTitle(title);
        if (typeof title_code === 'string') setUserTitleCode(title_code);
        if (typeof next_title_xp !== 'undefined') setNextTitleXp(next_title_xp);
        if (Array.isArray(allAchievements)) setAchievements(allAchievements);
        setSkillVocabulario(skill_vocabulario ?? 0);
        setSkillGramatica(skill_gramatica ?? 0);
        setSkillConversacion(skill_conversacion ?? 0);
        setWeeklyProgress(reto_semana_progreso ?? 0);

        const racha = typeof reto_racha_actual === 'number' ? reto_racha_actual : 0;
        setChallengeProgress(racha);
        if (currentUserId) {
          localStorage.setItem(`challengeProgress_${currentUserId}`, racha.toString());
        }

        const todayStr = new Date().toDateString();
        const todayIso = new Date().toLocaleDateString('en-CA');
        const lastCompleted = currentUserId ? localStorage.getItem(`lastCompletedDate_${currentUserId}`) : null;
        const completedTodayLocal = lastCompleted === todayStr;

        let completedTodayServer = false;
        if (reto_ultima_fecha) {
          const serverDateStr = reto_ultima_fecha.slice(0, 10);
          completedTodayServer = serverDateStr === todayIso;
        }

        const completedToday = completedTodayLocal || completedTodayServer;
        setHasCompletedToday(completedToday);
        if (completedToday && currentUserId) {
          localStorage.setItem(`lastCompletedDate_${currentUserId}`, todayStr);
        }
      }
    } catch (e) {
      console.error('Error cargando estado de gamificación:', e);
    }
  };

  const refreshClases = async () => {
    try {
      const profile = await authService.getUserProfile();
      const userIdStr = profile.id?.toString() || '';
      const userIdNum = Number(userIdStr);
      const clasesDelBackend = await ClaseService.getClasesPorUsuario(userIdNum);
      const clasesUsuario = (clasesDelBackend || []).map((clase: any) => ({
        ...clase,
        profesor: clase.profesor || 'Sin asignar',
        tipo: 'profesor',
      }));
      const clasesRelevantes = procesarClasesRelevantes(clasesUsuario);
      setClases(clasesRelevantes);
    } catch (error) {
      console.error('Error refrescando clases:', error);
    }
  };

  const loadAvailableMissions = async () => {
    try {
      setIsLoadingMissions(true);
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const url = `${API_BASE_URL}/missions/available/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvailableMissions(data || []);
      } else {
        setAvailableMissions([]);
      }
    } catch (e) {
      console.error('loadAvailableMissions error', e);
      setAvailableMissions([]);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  const openMission = async (missionTitle: string) => {
    try {
      const missionKey = slugify(missionTitle);
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const url = `${API_BASE_URL}/missions/${missionKey}/link/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.status === 204) {
        showNotification('info', 'Misión no disponible', 'Esta misión no tiene un enlace vigente.');
        return;
      }
      if (!res.ok) throw new Error('Error consultando enlace de misión');
      const data = await res.json();
      if (data?.url) {
        const finalUrl: string = data.url.startsWith('http') ? data.url : `https://${data.url}`;
        window.open(finalUrl, '_blank', 'noopener');
        try {
          const reward = await gamificationService.claimMissionReward(missionKey);
          if (reward.success && reward.data) {
            const d = reward.data;
            if (d.already_completed) {
              showNotification('info', 'Misión ya completada', 'Ya reclamaste la recompensa de esta misión. ¡Sigue con otra!');
              return;
            }
            const newCandies = d.total_dulces ?? candies;
            const newXp = d.total_xp ?? experience;
            setCandies(newCandies);
            setExperience(newXp);
            if (d.title) setUserTitle(d.title);
            if (typeof d.title_code === 'string') setUserTitleCode(d.title_code);
            if (typeof d.next_title_xp !== 'undefined') setNextTitleXp(d.next_title_xp ?? null);
            if (Array.isArray(d.achievements)) setAchievements(d.achievements);
            setTimeout(() => checkForPrize(newCandies), 500);
            if (Array.isArray(d.new_achievements) && d.new_achievements.length > 0) {
              const names = d.new_achievements.map((a: any) => a.name).join(', ');
              showNotification('success', '🏅 Nuevo logro', `Has desbloqueado: ${names}`);
            }
            const dulcesGan = d.dulces_ganados ?? 10;
            const xpGan = d.xp_ganado ?? 10;
            showNotification('success', '¡Misión registrada! 🎮', `Has ganado ${dulcesGan} dulces y ${xpGan} XP por esta misión.`, { candies: dulcesGan, xp: xpGan });
          }
        } catch (e) {
          console.error('Error al registrar recompensa de misión:', e);
        }
      } else {
        showNotification('info', 'Misión no disponible', 'No hay enlace configurado por ahora.');
      }
    } catch (e) {
      console.error('openMission error', e);
      showNotification('error', 'Error', 'No se pudo abrir la misión. Intenta más tarde.');
    }
  };

  const checkChallengeAnswer = async (selectedAnswer: number) => {
    const todayStr = new Date().toDateString();
    setHasCompletedToday(true);
    localStorage.setItem(`lastCompletedDate_${userId}`, todayStr);

    if (currentChallenge && selectedAnswer === currentChallenge.correctAnswer) {
      try {
        const resp = await gamificationService.claimDailyChallenge();
        if (!resp.success) {
          showNotification('info', 'Reto diario', resp.message || 'Ya reclamaste la recompensa del reto diario hoy.');
        } else if (resp.data) {
          const d = resp.data;
          const newCandies = d.total_dulces ?? 0;
          const newXp = d.total_xp ?? 0;
          setCandies(newCandies);
          setExperience(newXp);
          if (d.title) setUserTitle(d.title);
          if (typeof d.title_code === 'string') setUserTitleCode(d.title_code);
          if (typeof d.next_title_xp !== 'undefined') setNextTitleXp(d.next_title_xp ?? null);
          const serverStreak = d.reto_racha_actual ?? challengeProgress + 1;
          setChallengeProgress(serverStreak);
          localStorage.setItem(`challengeProgress_${userId}`, serverStreak.toString());
          if (typeof d.reto_semana_progreso === 'number') {
            setWeeklyProgress(d.reto_semana_progreso);
          } else {
            setWeeklyProgress((prev) => (prev >= 7 ? 1 : prev + 1));
          }
          if (d.bonus_aplicado) {
            const newStreakLevel = streakLevel + 1;
            setStreakLevel(newStreakLevel);
            localStorage.setItem(`streakLevel_${userId}`, newStreakLevel.toString());
          }
          if (Array.isArray(d.achievements)) setAchievements(d.achievements);
          setTimeout(() => checkForPrize(newCandies), 500);
          if (Array.isArray(d.new_achievements) && d.new_achievements.length > 0) {
            const names = d.new_achievements.map((a: any) => a.name).join(', ');
            showNotification('success', '🏅 Nuevo logro', `Has desbloqueado: ${names}`);
          }
          const dulcesGan = d.dulces_ganados ?? 5;
          const xpGan = d.xp_ganado ?? 5;
          showNotification('success', '¡Correcto! ✅', `Has ganado ${dulcesGan} dulces y ${xpGan} XP.`, { candies: dulcesGan, xp: xpGan });
        }
      } catch (error) {
        console.error('Error registrando reto diario:', error);
        showNotification('error', 'Error', 'No se pudo registrar tu reto diario. Intenta más tarde.');
      }
      closeChallengeModal();
    } else {
      setChallengeProgress(0);
      setWeeklyProgress(0);
      localStorage.setItem(`challengeProgress_${userId}`, '0');
      try {
        await gamificationService.registerDailyChallengeFailure();
      } catch (error) {
        console.error('Error registrando fallo de reto diario:', error);
      }
      const correctOption = currentChallenge?.options[currentChallenge.correctAnswer];
      showNotification(
        'error',
        'Respuesta incorrecta ❌',
        `Tu racha se reinicia a 0.\n\nRespuesta correcta: ${correctOption}\n\n${currentChallenge?.explanation}`
      );
      closeChallengeModal();
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await authService.getUserProfile();
        const userIdStr = profile.id?.toString() || '';
        setUserId(userIdStr);
        setUserFirstName(profile.first_name || profile.username || '');

        if (userIdStr) {
          const storedAvatar = localStorage.getItem(`avatar_${userIdStr}`);
          if (storedAvatar) setAvatarSrc(storedAvatar);
        }

        try {
          await cargarEstadoGamificacion(userIdStr);
        } catch (e) {
          console.error('Error cargando estado de gamificación:', e);
        }

        setIsNewUser(false);

        let clasesFinales: any[] = [];
        try {
          const userIdNum = Number(userIdStr);
          const clasesDelBackend = await ClaseService.getClasesPorUsuario(userIdNum);
          const clasesProfesor = (clasesDelBackend || []).map((clase: any) => ({
            ...clase,
            profesor: clase.profesor || 'Sin asignar',
            tipo: 'profesor',
          }));
          clasesFinales = [...clasesProfesor];
        } catch (error) {
          console.error('Error cargando clases del profesor:', error);
        }

        const clasesRelevantes = procesarClasesRelevantes(clasesFinales);
        setClases(clasesRelevantes);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoadingClases(false);
      }
    };

    loadUserData();

    const loadDailyChallenges = async () => {
      try {
        const token = authService.getToken?.() || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/daily-challenges/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: DailyChallenge[] = data.data.map((item: any) => ({
            id: item.id,
            question: item.question,
            options: item.options || [],
            correctAnswer: item.correct_answer,
            explanation: item.explanation || '',
          }));
          if (mapped.length > 0) setDailyChallenges(mapped);
        }
      } catch (e) {
        console.error('Error cargando retos diarios:', e);
      }
    };

    loadDailyChallenges();

    const handleClaseEstadoChanged = (event: any) => {
      console.log('Evento de cambio de estado recibido en estudiante:', event.detail);
      setTimeout(() => loadUserData(), 500);
    };

    window.addEventListener('claseEstadoChanged', handleClaseEstadoChanged);
    const intervalId = setInterval(() => refreshClases(), 30000);

    return () => {
      window.removeEventListener('claseEstadoChanged', handleClaseEstadoChanged);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const userClubs = await clbService.getClubs();
        setClubs(userClubs);
        if (userClubs.length > 0) setSelectedClubId(userClubs[0].id);
      } catch (e) {
        console.error('Error loading clubs:', e);
        setClubs([]);
      }
    };
    loadClubs();
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedClubId) {
        setClubMaterials([]);
        return;
      }
      try {
        setIsLoadingClubMaterials(true);
        const mats = await clbService.getClubMaterials(selectedClubId);
        setClubMaterials(mats);
      } catch (e) {
        console.error('Error loading club materials:', e);
        setClubMaterials([]);
      } finally {
        setIsLoadingClubMaterials(false);
      }
    };
    loadMaterials();
  }, [selectedClubId]);

  useEffect(() => {
    if (userId) loadAvailableMissions();
  }, [userId]);

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      setIsLoadingEvaluaciones(true);
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await EvaluationService.getEvaluationsForUser(token);
          setEvaluaciones(data);
        }
      } catch (err) {
        setEvaluaciones([]);
      }
      setIsLoadingEvaluaciones(false);
    };
    fetchEvaluaciones();
  }, []);

  const refreshClubs = async () => {
    try {
      const userClubs = await clbService.getClubs();
      setClubs(userClubs);
      if (selectedClubId && !userClubs.find((c) => c.id === selectedClubId)) {
        setSelectedClubId(userClubs.length > 0 ? userClubs[0].id : null);
      }
    } catch (e) {
      console.error('Error reloading clubs:', e);
    }
  };

  const handleJoinClub = async (clubId: number) => {
    try {
      setIsJoiningClub(true);
      await clbService.joinClub(clubId);
      await refreshClubs();
    } catch (e) {
      console.error('Error joining club:', e);
      alert('No se pudo inscribir al club');
    } finally {
      setIsJoiningClub(false);
    }
  };

  const handleLeaveClub = async (clubId: number) => {
    if (!confirm('¿Salir de este club?')) return;
    try {
      await clbService.leaveClub(clubId);
      await refreshClubs();
      setClubMaterials([]);
    } catch (e) {
      console.error('Error leaving club:', e);
      alert('No se pudo salir del club');
    }
  };

  const progressPercentage = (() => {
    if (!nextTitleXp || nextTitleXp <= 0) return 100;
    const code = userTitleCode || '';
    let minXp = 0;
    switch (code) {
      case 'explorador':
        minXp = 100;
        break;
      case 'aventurero':
        minXp = 300;
        break;
      case 'intermedio':
        minXp = 600;
        break;
      case 'avanzado':
        minXp = 1000;
        break;
      case 'experto':
        minXp = 1500;
        break;
      default:
        minXp = 0;
    }
    const span = nextTitleXp - minXp;
    if (span <= 0) return 100;
    const value = ((experience - minXp) / span) * 100;
    return Math.max(0, Math.min(100, Math.round(value)));
  })();

  const renderModule = () => {
    switch (activeModule) {
      case 'inicio':
        return (
          <HomeDashboard
            userName={userFirstName}
            userTitle={userTitle}
            progressPercentage={progressPercentage}
            missionsCount={availableMissions.length}
            materialsCount={clubMaterials.length}
            candies={candies}
            experience={experience}
            onOpenMissions={() => setActiveModule('misiones')}
            onOpenMaterials={() => setActiveModule('material-club')}
            onOpenProgress={() => setActiveModule('progreso')}
            onOpenRewards={() => setActiveModule('recompensas')}
          />
        );
      case 'misiones':
        return (
          <MissionsView
            missions={availableMissions}
            isLoading={isLoadingMissions}
            onOpenMission={openMission}
          />
        );
      case 'material-club':
        return (
          <ClubMaterialsView
            clubs={clubs}
            selectedClubId={selectedClubId}
            onSelectClub={setSelectedClubId}
            materials={clubMaterials}
            isLoading={isLoadingClubMaterials}
            onJoinClub={handleJoinClub}
            onLeaveClub={handleLeaveClub}
            isJoining={isJoiningClub}
          />
        );
      case 'evaluaciones':
        return (
          <div className="module-view">
            <EvaluacionesEstudiante />
          </div>
        );
      case 'clases':
        return (
          <ClassesView
            classes={clases}
            isLoading={isLoadingClases}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            clasesPerPage={clasesPerPage}
            onAccederClase={accederClase}
            onRefreshClases={refreshClases}
          />
        );
      case 'progreso':
        return (
          <ProgressView
            userTitle={userTitle}
            progressPercentage={progressPercentage}
            experience={experience}
            skillVocabulario={skillVocabulario}
            skillGramatica={skillGramatica}
            skillConversacion={skillConversacion}
          />
        );
      case 'recompensas':
        return (
          <RewardsView
            candies={candies}
            experience={experience}
            challengeProgress={challengeProgress}
            weeklyProgress={weeklyProgress}
            hasCompletedToday={hasCompletedToday}
            onOpenChallenge={openChallengeModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StudentLayout
        userName={userFirstName}
        userRole="Aprendiz"
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={onLogout}
        candies={candies}
        experience={experience}
        onOpenAchievements={() => setShowAchievementsModal(true)}
      >
        {renderModule()}
      </StudentLayout>

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
              <button className="prize-close-btn" onClick={() => setShowPrizeModal(false)}>
                ¡Continuar aventura!
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingTour isNewUser={showOnboarding} onComplete={handleOnboardingComplete} />

      <button className="help-floating-btn" onClick={forceOnboarding} title="¿Necesitas ayuda? Haz clic para ver el tour guiado">
        ?
      </button>

      <EvaluationModal
        isVisible={showEvaluationModal}
        evaluationType={currentEvaluation || ''}
        onClose={() => setShowEvaluationModal(false)}
        onComplete={async (results) => {
          setEvaluationResults(results);
          setShowEvaluationModal(false);
          setShowResultsModal(true);
          await cargarEstadoGamificacion(userId);
        }}
      />

      <ResultsModal isVisible={showResultsModal} results={evaluationResults} onClose={() => setShowResultsModal(false)} />

      <NotesModal isVisible={showNotesModal} onClose={() => setShowNotesModal(false)} />

      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        achievements={achievements}
      />

      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={(src: string) => {
          setAvatarSrc(src);
          if (userId) localStorage.setItem(`avatar_${userId}`, src);
        }}
      />

      {showChallengeModal && currentChallenge && (
        <ChallengeModal
          isOpen={showChallengeModal}
          challenge={currentChallenge}
          onClose={closeChallengeModal}
          onAnswerSubmit={checkChallengeAnswer}
        />
      )}

      <Toast
        isVisible={showToast}
        type={toastData.type}
        title={toastData.title}
        message={toastData.message}
        rewards={toastData.rewards}
        onClose={() => setShowToast(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setIsNewUser(false);
          const loadUpdatedProfile = async () => {
            try {
              const updatedProfile = await authService.getUserProfile();
              if (updatedProfile.profile_completed) setIsNewUser(false);
            } catch (error) {
              console.error('Error recargando perfil:', error);
            }
          };
          loadUpdatedProfile();
        }}
      />

      <AdventureModal isOpen={showAdventureModal} onClose={() => setShowAdventureModal(false)} />

      <PiePagina />
    </>
  );
}
