import { useState, useEffect } from 'react'
import Home from './Componentes/Home/Home'
import Header from './Componentes/Layout/Encabezado'
import Footer from './Componentes/Layout/PiePagina'
import Dashboard from './Componentes/DashboardUsu/Dashboard_Usuario'
import DashboardProfesor from './Componentes/DashboardProfesor/Dashboard_Profesor'
import LoginModal from './Componentes/Login/LoginModal'
import UserInfoModal from './Componentes/UserInfo/UserInfoModal'
import { authService } from './services/authService'

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'profesor' | null>(null)

  useEffect(() => {
    // Verificar si el usuario ya está autenticado al cargar la app
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.verifyToken()
        if (isValid) {
          setIsAuthenticated(true)
          // Obtener el rol del usuario desde el token o perfil
          try {
            const profile = await authService.getUserProfile()
            setUserRole(profile.role || 'student')
          } catch (error) {
            console.error('Error getting user role:', error)
            setUserRole('student') // Default to student
          }
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await authService.login(credentials)
    
    if (result.success) {
      setIsAuthenticated(true)
      setIsLoginModalOpen(false)
      
      // Obtener el rol del usuario y verificar si es primer login
      try {
        const profile = await authService.getUserProfile()
        console.log('Profile check:', profile)
        setUserRole(profile.role || 'student')
        
        // Solo mostrar modal si el perfil no está completado
        if (!profile.profile_completed) {
          setShowUserInfoModal(true)
        }
      } catch (error) {
        console.error('Error getting profile:', error)
        // Si no puede obtener el perfil, asumir que es estudiante y primer login
        setUserRole('student')
        setShowUserInfoModal(true)
      }
    } else {
      throw new Error(result.message || 'Error de autenticación')
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUserRole(null)
    setShowUserInfoModal(false)
  }

  const handleUserInfoComplete = () => {
    setShowUserInfoModal(false)
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    )
  }

  // Si está autenticado, mostrar dashboard correspondiente según el rol
  if (isAuthenticated) {
    if (userRole === 'student') {
      return (
        <>
          <Dashboard onLogout={handleLogout} />
          <UserInfoModal 
            isOpen={showUserInfoModal}
            onClose={() => setShowUserInfoModal(false)}
            onComplete={handleUserInfoComplete}
          />
        </>
      )
    }
    
    if (userRole === 'profesor') {
      return (
        <>
          <DashboardProfesor onLogout={handleLogout} />
        </>
      )
    }
    
  }

  // Si no está autenticado, mostrar home con header, footer y modal de login unificado
  return (
    <>
      <Header onLoginClick={handleLoginClick} />
      <Home />
      <Footer />
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={handleCloseModal}
        onLogin={handleLogin}
      />
    </>
  )
}

export default App
