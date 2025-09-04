import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Componentes/Home/Home'
import Header from './Componentes/Layout/Encabezado'
import Footer from './Componentes/Layout/PiePagina'
import Dashboard from './Componentes/DashboardUsu/Dashboard_Usuario'
import DashboardProfesor from './Componentes/DashboardProfesor/Dashboard_Profesor'
import LoginModal from './Componentes/Login/LoginModal'
import UserInfoModal from './Componentes/UserInfo/UserInfoModal'
import { authService } from './services/authService'
import { ThemeProvider } from './context/ThemeContext'
import { AdminLayout } from './Componentes/DashboardAdmin/layout/AdminLayout'
import Dashboard_Admin from './Componentes/DashboardAdmin/Dashboard_Admin'
import FormularioUsuarios from './Componentes/DashboardAdmin/FormularioUsuarios'
import GestionEstudiantes from './Componentes/DashboardAdmin/GestionEstudiantes'
import ProgramarClases from './Componentes/DashboardAdmin/ProgramarClases'
import GestionCursos from './Componentes/DashboardAdmin/GestionCursos'
import BloquesView from './Componentes/DashboardAdmin/BloquesView'

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [userRole, setUserRole] = useState<'student' | 'profesor' | 'admin' | null>(null)

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

  return (
    <ThemeProvider>
      <Router>
        {isLoading ? (
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
        ) : (
          <Routes>
            {/* Ruta principal */}
            <Route path="/" element={
              isAuthenticated ? (
                userRole === 'student' ? (
                  <Navigate to="/dashboard" replace />
                ) : userRole === 'profesor' ? (
                  <Navigate to="/dashboard-profesor" replace />
                ) : userRole === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
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
            } />
            
            {/* Dashboard de estudiante */}
            <Route path="/dashboard" element={
              isAuthenticated && userRole === 'student' ? (
                <>
                  <Dashboard onLogout={handleLogout} />
                  <UserInfoModal 
                    isOpen={showUserInfoModal}
                    onClose={() => setShowUserInfoModal(false)}
                    onComplete={handleUserInfoComplete}
                  />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Dashboard de profesor */}
            <Route path="/dashboard-profesor" element={
              isAuthenticated && userRole === 'profesor' ? (
                <DashboardProfesor onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            
            {/* Rutas del Panel de Administración */}
            <Route path="/admin" element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }>
              {/* Redirección por defecto a /admin/dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard_Admin />} />
              <Route path="usuarios" element={<FormularioUsuarios />} />
              <Route path="gestion-estudiantes" element={<GestionEstudiantes />} />
              <Route path="programar-clases" element={<ProgramarClases />} />
              <Route path="gestion-cursos" element={<GestionCursos />} />
              <Route path="bloques" element={<BloquesView />} />
            </Route>
            
            {/* Ruta de login - redirige al home */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center'
              }}>
                <h1 style={{ color: '#667eea', marginBottom: '1rem' }}>Error 404 - Página no encontrada</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>La página que buscas no existe.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Ir al inicio
                </button>
              </div>
            } />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  )
}

export default App
