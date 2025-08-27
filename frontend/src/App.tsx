import { useState, useEffect } from "react"
import Home from "./Componentes/Home/Home"
import Header from "./Componentes/Layout/Encabezado"
import Footer from "./Componentes/Layout/PiePagina"
import LoginModal from "./Componentes/Login/LoginModal"
import Dashboard from "./Componentes/DashboardUsu/Dashboard_Usuario"
import UserInfoModal from "./Componentes/UserInfo/UserInfoModal"
import { authService } from "./services/authService"

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya está autenticado al cargar la app
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.verifyToken()
        setIsAuthenticated(isValid)
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
      
      // Verificar si es el primer login (usuario sin perfil completado)
      try {
        const profile = await authService.getUserProfile()
        console.log('Profile check:', profile);
        // Solo mostrar modal si el perfil no está completado
        if (!profile.profile_completed) {
          setIsFirstLogin(true)
          setShowUserInfoModal(true)
        }
      } catch (error) {
        console.error('Error getting profile:', error);
        // Si no puede obtener el perfil, asumir que es primer login
        setIsFirstLogin(true)
        setShowUserInfoModal(true)
      }
    } else {
      throw new Error(result.message || 'Error de autenticación')
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setShowUserInfoModal(false)
    setIsFirstLogin(false)
  }

  const handleUserInfoComplete = () => {
    setShowUserInfoModal(false)
    setIsFirstLogin(false)
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

  // Si está autenticado, mostrar dashboard
  if (isAuthenticated) {
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

  // Si no está autenticado, mostrar home con modal de login
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
