import { useEffect, useState } from 'react';
import { ClaseService } from '../../services/claseService';
import TomarAsistencia from './TomarAsistencia';
import './MisClases.css';

interface Clase {
  id: number;
  nombre: string;
  profesorId: number;
  fecha: string;
  hora: string;
  duracion: number;
  tema: string;
  descripcion: string;
  estudiantes: string[];
  meetLink: string;
  meet_link: string; // Campo del backend
  estado: 'programada' | 'activa' | 'completada';
  tipoClase: 'individual' | 'grupal';
}

export default function MisClases({ profesorId }: { profesorId?: number }) {
  const [clases, setClases] = useState<Clase[]>([]);
  const [clasesDelBloque, setClasesDelBloque] = useState<Clase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'activas' | 'historial'>('activas');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClase, setSelectedClase] = useState<any>(null);
  const [historialPage, setHistorialPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'programada' | 'activa' | 'completada'>('todas');
  const [filtroFecha, setFiltroFecha] = useState<'todas' | 'hoy' | 'manana' | 'semana'>('todas');
  const [searchTermBloque, setSearchTermBloque] = useState('');
  const [filtroBloque, setFiltroBloque] = useState<string>('todos');
  const ITEMS_PER_PAGE = 10;
  const [modoModal, setModoModal] = useState<'ver' | 'editar'>('ver');
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false);
  const [claseAsistencia, setClaseAsistencia] = useState<Clase | null>(null);

  useEffect(() => {
    const fetchClases = async () => {
      setIsLoading(true);
      try {
        // Limpiar estados incorrectos en localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('clase_') && key.endsWith('_estado')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Obtener el nombre completo del profesor desde localStorage
        const userStr = localStorage.getItem('user');
        let nombreCompleto = '';
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            nombreCompleto = `${user.first_name || ''} ${user.last_name || ''}`.trim();
          } catch (e) {
            console.error('Error parseando usuario:', e);
          }
        }
        
        // Obtener TODAS las clases del backend
        const respuestaClases: any = await ClaseService.getClases();

        // Asegurar que siempre trabajamos con un array
        const todasLasClases: any[] = Array.isArray(respuestaClases)
          ? respuestaClases
          : (respuestaClases?.data || []);
        
        // Mostrar todos los profesores únicos (solo para debug / futuro)
        const profesoresUnicos = [...new Set(todasLasClases.map((c: any) => c.profesor))];

        // Filtrar clases donde el profesor coincida EXACTAMENTE
        let clasesDelProfesor = todasLasClases.filter((clase: any) => {
          const coincide = clase.profesor?.trim().toLowerCase() === nombreCompleto.toLowerCase();
          return coincide;
        });

        // Si no se encontró ninguna coincidencia, mostrar todas las clases como fallback
        if (clasesDelProfesor.length === 0) {
          clasesDelProfesor = todasLasClases;
        }

        // NO cargar clases del bloque
        setClasesDelBloque([]);
        setClases(clasesDelProfesor);
      } catch (err) {
        console.error('❌ Error al cargar clases:', err);
        setClases([]);
        setClasesDelBloque([]);
      }
      setIsLoading(false);
    };
    fetchClases();
  }, []);

  const abrirAsistencia = (clase: Clase) => {
    setClaseAsistencia(clase);
    setMostrarAsistencia(true);
  };

  const guardarAsistencia = (asistencias: { [key: string]: boolean }) => {
    const presentes = Object.values(asistencias).filter(a => a).length;
    const ausentes = Object.values(asistencias).filter(a => !a).length;
    alert(`✅ Asistencia guardada:\n${presentes} presentes, ${ausentes} ausentes`);
    setMostrarAsistencia(false);
    setClaseAsistencia(null);
  };

  const iniciarClase = async (claseId: number) => {
    
    // Buscar la clase en ambos arrays
    let clase = clases.find(c => c.id === claseId);
    let esClaseDelBloque = false;
    if (!clase) {
      clase = clasesDelBloque.find(c => c.id === claseId);
      esClaseDelBloque = true;
    } else {
    }
    
    if (!clase) {
      console.error('Clase no encontrada con ID:', claseId);
      alert('Error: No se pudo encontrar la clase.');
      return;
    }

    try {

      // Si es una clase del profesor (no del bloque), actualizar en el backend
      if (!esClaseDelBloque) {
        try {
          const response = await ClaseService.cambiarEstadoClase(claseId, 'activa');
        } catch (error: any) {
          console.error('Error actualizando estado en backend:', error);
          console.error('Detalles del error:', error.response?.data);
          // Continuar con la actualización local aunque falle el backend
        }
      }

      // Actualizar estado local en ambos arrays
      setClases(prev => prev.map(c => {
        if (c.id === claseId) {
          // Para clases del profesor, también guardar en localStorage
          const claseKey = `clase_${c.tema.replace(/\s+/g, '_')}_estado`;
          localStorage.setItem(claseKey, 'activa');
          
          // Disparar evento para sincronización
          window.dispatchEvent(new CustomEvent('claseEstadoChanged', {
            detail: { claseId, estado: 'activa', tema: c.tema }
          }));
          
          return { ...c, estado: 'activa' };
        }
        return c;
      }));
      
      setClasesDelBloque(prev => prev.map(c => {
        if (c.id === claseId) {
          // Guardar estado en localStorage para sincronización con estudiantes
          // Usar el tema de la clase para crear una clave única
          const claseKey = `clase_${c.tema.replace(/\s+/g, '_')}_estado`;
          localStorage.setItem(claseKey, 'activa');
          
          // También disparar evento personalizado para notificar cambios
          window.dispatchEvent(new CustomEvent('claseEstadoChanged', {
            detail: { tema: c.tema, estado: 'activa' }
          }));
          
          return { ...c, estado: 'activa' };
        }
        return c;
      }));

      // Abrir Google Meet - usar el campo correcto del backend
      const meetLink = clase.meet_link || clase.meetLink;
      
      if (!meetLink || meetLink.trim() === '' || meetLink === 'undefined') {
        // Para clases del bloque, generar enlace Meet automáticamente
        const enlaceGenerado = `https://meet.google.com/new`;
        window.open(enlaceGenerado, '_blank');
        alert(`¡Clase "${clase.nombre || clase.tema}" iniciada! Se abrió una nueva reunión de Meet.`);
        return;
      }
      
      // Asegurar que el enlace tenga protocolo
      let enlaceCompleto = meetLink;
      if (!enlaceCompleto.startsWith('http://') && !enlaceCompleto.startsWith('https://')) {
        enlaceCompleto = 'https://' + enlaceCompleto;
      }
      
      window.open(enlaceCompleto, '_blank');
      
      // Mostrar notificación
      alert(`¡Clase "${clase.nombre || clase.tema}" iniciada! Los estudiantes pueden acceder ahora.`);
    } catch (error) {
      console.error('Error al iniciar clase:', error);
      alert('Error al iniciar la clase. Intenta nuevamente.');
    }
  };

  const finalizarClase = async (claseId: number) => {
    try {
      // Intentar marcar la clase como completada en el backend
      try {
        await ClaseService.cambiarEstadoClase(claseId, 'completada');
      } catch (error: any) {
        console.error('Error actualizando estado a completada en backend:', error);
        console.error('Detalles del error:', error?.response?.data);
        // Continuar con la actualización local aunque falle el backend
      }

      // Buscar la clase en ambos arrays para obtener información
      let clase = clases.find(c => c.id === claseId);
      if (!clase) {
        clase = clasesDelBloque.find(c => c.id === claseId);
      }
      
      // Actualizar estado local en ambos arrays
      setClases(prev => prev.map(c => {
        if (c.id === claseId) {
          // Para clases del profesor, también guardar en localStorage
          const claseKey = `clase_${c.tema.replace(/\s+/g, '_')}_estado`;
          localStorage.setItem(claseKey, 'completada');
          
          // Disparar evento para sincronización
          window.dispatchEvent(new CustomEvent('claseEstadoChanged', {
            detail: { claseId, estado: 'completada', tema: c.tema }
          }));
          
          return { ...c, estado: 'completada' };
        }
        return c;
      }));
      
      setClasesDelBloque(prev => prev.map(c => {
        if (c.id === claseId) {
          // Guardar estado completada en localStorage
          const claseKey = `clase_${c.tema.replace(/\s+/g, '_')}_estado`;
          localStorage.setItem(claseKey, 'completada');
          
          // Disparar evento para sincronización
          window.dispatchEvent(new CustomEvent('claseEstadoChanged', {
            detail: { claseId, estado: 'completada', tema: c.tema }
          }));
          
          return { ...c, estado: 'completada' };
        }
        return c;
      }));

      alert('¡Clase finalizada exitosamente!');
    } catch (error) {
      console.error('Error al finalizar clase:', error);
      alert('Error al finalizar la clase. Intenta nuevamente.');
    }
  };

  const verDetallesClase = (clase: Clase) => {
    setSelectedClase(clase);
    setModoModal('ver');
    setModalVisible(true);
  };

  const editarClase = (clase: Clase) => {
    setSelectedClase(clase);
    setModoModal('editar');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setSelectedClase(null);
  };

  const formatearFecha = (fecha: string) => {
    // Agregar tiempo para evitar problema de zona horaria
    const date = new Date(fecha + 'T12:00:00');
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', opciones);
  };

  const esHoy = (fecha: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fecha === hoy;
  };

  const esFechaFutura = (fecha: string) => {
    const hoy = new Date();
    const fechaClase = new Date(fecha);
    // Comparar solo la fecha, sin la hora
    hoy.setHours(0, 0, 0, 0);
    fechaClase.setHours(0, 0, 0, 0);
    return fechaClase > hoy;
  };

  const esFechaPasada = (fecha: string) => {
    // Comparar usando solo la cadena YYYY-MM-DD para evitar problemas de zona horaria
    const hoyStr = new Date().toISOString().split('T')[0];
    return fecha < hoyStr;
  };

  // Función para obtener bloques únicos de las clases
  const obtenerBloquesUnicos = () => {
    const bloques = new Set<string>();
    
    // Primero obtener bloques del localStorage (configurados en admin)
    const bloquesGuardados = JSON.parse(localStorage.getItem('bloques_data') || '[]');
    bloquesGuardados.forEach((bloque: any) => {
      if (bloque.nivel) {
        bloques.add(bloque.nivel);
      }
    });
    
    // También extraer de las clases generadas
    clasesDelBloque.forEach(clase => {
      const match = clase.nombre.match(/- ([A-Z]\d+)/);
      if (match) {
        bloques.add(match[1]);
      }
    });
    
    return Array.from(bloques).sort();
  };

  // Función para filtrar clases del bloque
  const filtrarClasesDelBloque = () => {
    let clasesFiltradas = clasesDelBloque;
    
    // Filtro por bloque
    if (filtroBloque !== 'todos') {
      clasesFiltradas = clasesFiltradas.filter(clase => 
        clase.nombre.includes(filtroBloque)
      );
    }
    
    // Filtro por búsqueda
    if (searchTermBloque.trim()) {
      clasesFiltradas = clasesFiltradas.filter(clase => 
        (clase.nombre || clase.tema).toLowerCase().includes(searchTermBloque.toLowerCase()) ||
        clase.descripcion.toLowerCase().includes(searchTermBloque.toLowerCase())
      );
    }
    
    // Filtro por estado
    if (filtroEstado !== 'todas') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.estado === filtroEstado);
    }
    
    // Filtro por fecha
    const hoy = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (filtroFecha === 'hoy') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.fecha === hoy);
    } else if (filtroFecha === 'manana') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.fecha === manana);
    } else if (filtroFecha === 'semana') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.fecha >= hoy && clase.fecha <= enUnaSemana);
    }
    
    return clasesFiltradas;
  };

  // Filtrar clases por fecha
  const hoy = new Date().toISOString().split('T')[0];
  
  const clasesVisibles = clasesDelBloque.filter(clase => {
    // Verificar estado en localStorage para persistencia
    const claseKey = `clase_${clase.tema.replace(/\s+/g, '_')}_estado`;
    const estadoGuardado = localStorage.getItem(claseKey);
    
    // Si está completada en localStorage, no mostrar
    if (estadoGuardado === 'completada') {
      return false;
    }
    
    return clase.estado !== 'completada';
  });
  const clasesHoy = clases.filter(clase => {
    // Verificar estado en localStorage para persistencia
    const claseKey = `clase_${clase.tema.replace(/\s+/g, '_')}_estado`;
    const estadoGuardado = localStorage.getItem(claseKey);
    
    
    // Si está completada en localStorage, no mostrar
    if (estadoGuardado === 'completada') {
      return false;
    }
    
    return clase.fecha === hoy && clase.estado !== 'completada';
  });
  
  const clasesProximas = clases.filter(clase => {
    // Verificar estado en localStorage para persistencia
    const claseKey = `clase_${clase.tema.replace(/\s+/g, '_')}_estado`;
    const estadoGuardado = localStorage.getItem(claseKey);
    
    // Si está completada en localStorage, no mostrar
    if (estadoGuardado === 'completada') {
      return false;
    }
    
    return clase.fecha > hoy && clase.estado !== 'completada';
  });
  
  const clasesCompletadas = clases.filter(clase => {
    // Considerar como historial tanto las marcadas como 'completada'
    // como las que ya pasaron en fecha aunque sigan 'programada'
    const esCompletadaPorEstado = clase.estado === 'completada';
    const esPasada = esFechaPasada(clase.fecha);
    return esCompletadaPorEstado || esPasada;
  });

  const clasesDelBloqueFiltradas = filtrarClasesDelBloque();

  return (
    <div className="mis-clases-container">
      <div className="mis-clases-header">
        <h2>Mis Clases Programadas</h2>
        <p>Gestiona y controla tus clases programadas</p>
      </div>

      {/* Pestañas de navegación */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'activas' ? 'active' : ''}`}
          onClick={() => setActiveTab('activas')}
        >
          📅 Clases Activas ({clasesHoy.length + clasesProximas.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📚 Historial ({clasesCompletadas.length})
        </button>
      </div>

      {isLoading && <div className="loading-spinner">Cargando clases...</div>}

      {/* Contenido de pestaña activa */}
      {activeTab === 'activas' && (
        <div className="tab-content">
          {/* Clases del Bloque */}
          {clasesDelBloque.length > 0 && (
            <div className="clases-section">
              <h3 className="section-title">📚 Clases del Bloque Asignado</h3>
              
              {/* Filtros para clases del bloque */}
              <div className="filtros-bloque">
                <div className="filtros-row">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTermBloque}
                    onChange={(e) => setSearchTermBloque(e.target.value)}
                    className="search-input-bloque"
                  />
                  
                  <select 
                    value={filtroEstado} 
                    onChange={(e) => setFiltroEstado(e.target.value as any)}
                    className="filtro-select"
                  >
                    <option value="todas">Todos los estados</option>
                    <option value="programada">📋 Programadas</option>
                    <option value="activa">🔴 Activas</option>
                    <option value="completada">✅ Completadas</option>
                  </select>
                  
                  <select 
                    value={filtroBloque} 
                    onChange={(e) => setFiltroBloque(e.target.value)}
                    className="filtro-select"
                  >
                    <option value="todos">Todos los bloques</option>
                    {obtenerBloquesUnicos().map(bloque => (
                      <option key={bloque} value={bloque}>📚 {bloque}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={filtroFecha} 
                    onChange={(e) => setFiltroFecha(e.target.value as any)}
                    className="filtro-select"
                  >
                    <option value="todas">Todas las fechas</option>
                    <option value="hoy">📅 Hoy</option>
                    <option value="manana">🔜 Mañana</option>
                    <option value="semana">📆 Esta semana</option>
                  </select>
                  
                  <button 
                    onClick={() => {
                      setSearchTermBloque('');
                      setFiltroEstado('todas');
                      setFiltroFecha('todas');
                      setFiltroBloque('todos');
                    }}
                    className="btn-limpiar-filtros"
                  >
                    🗑️ Limpiar
                  </button>
                </div>
                
                <div className="filtros-info">
                  Mostrando {clasesDelBloqueFiltradas.length} de {clasesDelBloque.length} clases
                </div>
              </div>
              
              {/* Mostrar estado vacío si no hay clases después de filtrar */}
              {clasesDelBloqueFiltradas.length === 0 ? (
                <div className="estado-vacio-filtros">
                  <div className="vacio-icon">🔍</div>
                  <h3>No se encontraron clases</h3>
                  <p>Intenta ajustar los filtros para ver más resultados</p>
                  <button 
                    onClick={() => {
                      setSearchTermBloque('');
                      setFiltroEstado('todas');
                      setFiltroFecha('todas');
                    }}
                    className="btn-limpiar-filtros-vacio"
                  >
                    🗑️ Limpiar Filtros
                  </button>
                </div>
              ) : (
                <div className="clases-grid">
                  {clasesDelBloqueFiltradas.map(clase => (
                  <div key={clase.id} className={`clase-card bloque ${clase.estado}`}>
                    <div className="clase-header">
                      <div className="clase-info">
                        <h4>{clase.nombre || clase.tema}</h4>
                        <span className="clase-origen">📚 Del Bloque</span>
                      </div>
                      <div className={`estado-badge ${clase.estado}`}>
                        {clase.estado === 'programada' && '⏳ Programada'}
                        {clase.estado === 'activa' && '🔴 En Vivo'}
                        {clase.estado === 'completada' && '✅ Completada'}
                      </div>
                    </div>
                    <div className="clase-detalles">
                      <div className="detalle-item">
                        <span className="detalle-icon">🕐</span>
                        <span>{clase.hora} - {clase.duracion} min</span>
                      </div>
                      <div className="detalle-item">
                        <span className="detalle-icon">👥</span>
                        <span>{(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)</span>
                      </div>
                      <div className="detalle-item">
                        <span className="detalle-icon">📝</span>
                        <span>{clase.descripcion}</span>
                      </div>
                    </div>
                    <div className="clase-acciones">
                      <button 
                        className="btn-asistencia"
                        onClick={() => abrirAsistencia(clase)}
                        title="Tomar asistencia"
                      >
                        📋 Asistencia
                      </button>
                      {clase.estado === 'programada' && (
                        <button 
                          className="btn-iniciar-clase"
                          onClick={() => iniciarClase(clase.id)}
                        >
                          📹 Iniciar Clase
                        </button>
                      )}
                      {clase.estado === 'activa' && (
                        <>
                          <button 
                            className="btn-unirse-clase"
                            onClick={() => {
                              const meetLink = clase.meet_link || clase.meetLink;
                              if (meetLink && meetLink.trim() !== '') {
                                window.open(meetLink, '_blank');
                              } else {
                                alert('No hay enlace de Meet disponible para esta clase.');
                              }
                            }}
                          >
                            🔗 Unirse a Meet
                          </button>
                          <button 
                            className="btn-finalizar-clase"
                            onClick={() => finalizarClase(clase.id)}
                          >
                            ⏹️ Finalizar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Clases de Hoy */}
          {clasesHoy.length > 0 && (
            <div className="clases-section">
              <h3 className="section-title">📅 Clases Programadas por Ti</h3>
          <div className="clases-grid">
            {clasesHoy.map(clase => (
              <div key={clase.id} className={`clase-card hoy ${clase.estado}`}>
                <div className="clase-header">
                  <div className="clase-info">
                    <h4>{clase.nombre || clase.tema}</h4>
                    <span className="clase-tipo">{clase.tipoClase === 'individual' ? '👤 Individual' : '👥 Grupal'}</span>
                  </div>
                  <div className={`estado-badge ${clase.estado}`}>
                    {clase.estado === 'programada' && '⏳ Programada'}
                    {clase.estado === 'activa' && '🔴 En Vivo'}
                    {clase.estado === 'completada' && '✅ Completada'}
                  </div>
                </div>

                <div className="clase-detalles">
                  <div className="detalle-item">
                    <span className="detalle-icon">🕐</span>
                    <span>{clase.hora} - {clase.duracion} min</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-icon">👥</span>
                    <span>{(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-icon">📝</span>
                    <span>{clase.descripcion}</span>
                  </div>
                </div>

                <div className="estudiantes-lista">
                  <strong>Estudiantes:</strong>
                  <div className="estudiantes-tags">
                    {(clase.estudiantes || []).map((estudiante, index) => (
                      <span key={index} className="estudiante-tag">{estudiante}</span>
                    ))}
                  </div>
                </div>

                <div className="clase-acciones">
                  {clase.estado === 'programada' && (
                    <button 
                      className="btn-iniciar-clase"
                      onClick={() => iniciarClase(clase.id)}
                    >
                      📹 Iniciar Clase
                    </button>
                  )}
                  {clase.estado === 'activa' && (
                    <>
                      <button 
                        className="btn-unirse-clase"
                        onClick={() => {
                          const meetLink = clase.meet_link || clase.meetLink;
                          if (meetLink && meetLink.trim() !== '') {
                            window.open(meetLink, '_blank');
                          } else {
                            alert('No hay enlace de Meet disponible para esta clase.');
                          }
                        }}
                      >
                        🔗 Unirse a Meet
                      </button>
                      <button 
                        className="btn-finalizar-clase"
                        onClick={() => finalizarClase(clase.id)}
                      >
                        ⏹️ Finalizar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Próximas Clases */}
          {clasesProximas.length > 0 && (
            <div className="clases-section">
              <h3 className="section-title">📋 Próximas Clases</h3>
          <div className="clases-lista">
            {clasesProximas.map(clase => (
              <div key={clase.id} className="clase-row">
                <div className="clase-fecha">
                  <div className="fecha-principal">{formatearFecha(clase.fecha)}</div>
                  <div className="hora-clase">{clase.hora}</div>
                </div>
                
                <div className="clase-contenido">
                  <h4>{clase.nombre || clase.tema}</h4>
                  <p>{clase.descripcion}</p>
                  <div className="clase-meta">
                    <span className="meta-item">
                      {clase.tipoClase === 'individual' ? '👤' : '👥'} {clase.tipoClase}
                    </span>
                    <span className="meta-item">
                      ⏱️ {clase.duracion} min
                    </span>
                    <span className="meta-item">
                      👥 {(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)
                    </span>
                  </div>
                </div>

                <div className="clase-acciones-row">
                  <button 
                    className="btn-ver-detalles"
                    onClick={() => verDetallesClase(clase)}
                  >
                    👁️ Ver
                  </button>
                  <button 
                    className="btn-editar"
                    onClick={() => editarClase(clase)}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
            </div>
          )}

          {/* Estado vacío para clases activas */}
          {clasesHoy.length === 0 && clasesProximas.length === 0 && (
            <div className="estado-vacio">
              <div className="vacio-icon">📅</div>
              <h3>No tienes clases activas</h3>
              <p>Programa tu primera clase para comenzar</p>
              <button className="btn-programar-primera">➕ Programar Clase</button>
            </div>
          )}
        </div>
      )}

      {/* Contenido de historial */}
      {activeTab === 'historial' && (
        <div className="tab-content">
          {clasesCompletadas.length > 0 ? (
            <div className="clases-section">
              <h3 className="section-title">📚 Historial de Clases Completadas</h3>
              
              {/* Barra de búsqueda */}
              <div className="historial-filtros">
                <input
                  type="text"
                  placeholder="Buscar por tema, descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="clases-historial">
                {clasesCompletadas
                  .filter(clase => 
                    clase.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    clase.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .slice((historialPage - 1) * ITEMS_PER_PAGE, historialPage * ITEMS_PER_PAGE)
                  .map(clase => (
                  <div key={clase.id} className="clase-historial-item">
                    <div className="historial-fecha">{formatearFecha(clase.fecha)}</div>
                    <div className="historial-info">
                      <span className="historial-tema">{clase.nombre || clase.tema}</span>
                      <span className="historial-estudiantes">{(clase.estudiantes ? clase.estudiantes.length : 0)} estudiante(s)</span>
                      <span className="historial-duracion">⏱️ {clase.duracion} min</span>
                    </div>
                    <div className="historial-acciones">
                      <button 
                        className="btn-ver-historial"
                        onClick={() => verDetallesClase(clase)}
                      >
                        👁️ Ver
                      </button>
                    </div>
                    <div className="historial-estado">✅ Completada</div>
                  </div>
                ))}
              </div>
              
              {/* Paginación */}
              {(() => {
                const filteredClases = clasesCompletadas.filter(clase => 
                  clase.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  clase.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
                );
                const totalPages = Math.ceil(filteredClases.length / ITEMS_PER_PAGE);
                
                return totalPages > 1 && (
                  <div className="paginacion">
                    <button 
                      className="btn-paginacion"
                      disabled={historialPage === 1}
                      onClick={() => setHistorialPage(prev => prev - 1)}
                    >
                      ← Anterior
                    </button>
                    
                    <span className="paginacion-info">
                      Página {historialPage} de {totalPages} ({filteredClases.length} clases)
                    </span>
                    
                    <button 
                      className="btn-paginacion"
                      disabled={historialPage === totalPages}
                      onClick={() => setHistorialPage(prev => prev + 1)}
                    >
                      Siguiente →
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="estado-vacio">
              <div className="vacio-icon">📚</div>
              <h3>No hay clases en el historial</h3>
              <p>Las clases completadas aparecerán aquí</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para ver/editar detalles */}
      {modalVisible && selectedClase && (
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modoModal === 'ver' ? 'Detalles de la Clase' : 'Editar Clase'}</h3>
              <button className="modal-close" onClick={cerrarModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detalle-grupo">
                <label><strong>Tema:</strong></label>
                <p>{selectedClase.tema}</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Descripción:</strong></label>
                <p>{selectedClase.descripcion}</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Fecha y Hora:</strong></label>
                <p>{formatearFecha(selectedClase.fecha)} a las {selectedClase.hora}</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Duración:</strong></label>
                <p>{selectedClase.duracion} minutos</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Tipo:</strong></label>
                <p>{selectedClase.tipoClase === 'individual' ? 'Individual' : 'Grupal'}</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Estado:</strong></label>
                <p className={`estado-text ${selectedClase.estado}`}>
                  {selectedClase.estado === 'programada' && '⏳ Programada'}
                  {selectedClase.estado === 'activa' && '🔴 En Vivo'}
                  {selectedClase.estado === 'completada' && '✅ Completada'}
                </p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Enlace de Meet:</strong></label>
                <p>{selectedClase.meet_link || selectedClase.meetLink || 'No configurado'}</p>
              </div>
              
              <div className="detalle-grupo">
                <label><strong>Estudiantes:</strong></label>
                <div className="estudiantes-modal">
                  {(selectedClase.estudiantes || []).length > 0 ? (
                    selectedClase.estudiantes.map((estudiante, index) => (
                      <span key={index} className="estudiante-tag-modal">{estudiante}</span>
                    ))
                  ) : (
                    <p>No hay estudiantes asignados</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-cerrar-modal" onClick={cerrarModal}>
                Cerrar
              </button>
              {modoModal === 'ver' && (
                <button 
                  className="btn-editar-modal" 
                  onClick={() => setModoModal('editar')}
                >
                  ✏️ Editar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asistencia */}
      {mostrarAsistencia && claseAsistencia && (
        <TomarAsistencia
          claseId={claseAsistencia.id}
          estudiantesIds={claseAsistencia.estudiantes || []}
          fecha={claseAsistencia.fecha}
          tema={claseAsistencia.tema}
          onGuardar={guardarAsistencia}
          onCerrar={() => {
            setMostrarAsistencia(false);
            setClaseAsistencia(null);
          }}
        />
      )}
    </div>
  );
}
