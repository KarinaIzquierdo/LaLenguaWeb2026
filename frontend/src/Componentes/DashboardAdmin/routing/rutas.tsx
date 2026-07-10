import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "../layout/AdminLayout";

// Pages
import AdminDashboardHome from '../AdminDashboardHome';
import FormularioUsuarios from "../FormularioUsuarios";
import GestionEstudiantes from "../GestionEstudiantes";
import ProgramarClases from "../ProgramarClases";
import GestionCursos from '../GestionCursos';
import Dashboard_Admin from '../Dashboard_Admin';
import RegistrosEliminacion from '../RegistrosEliminacion';
import GestionGaleria from '../GestionGaleria';
import Especializaciones from '../Especializaciones';
import PlanesPrecios from '../PlanesPrecios';
import RegistroVentas from '../RegistroVentas';
import GestionSuscripciones from '../GestionSuscripciones';
import MisionesAdmin from '../MisionesAdmin';
import RetosDiariosAdmin from '../RetosDiariosAdmin';
import RankingRetosAdmin from '../RankingRetosAdmin';
import NotificacionesProfesor from '../../DashboardProfesor/NotificacionesProfesor';

export const Rutas = () => {
    // Función de logout para pasar a AdminLayout
    const handleLogout = () => {
        // Aquí puedes poner la lógica de logout real (limpiar sesión, redirigir, etc.)
        window.location.href = "/login";
    };
    return (
        <Routes>
            {/* Rutas del Panel de Administración */}
            <Route path="/admin" element={<AdminLayout onLogout={handleLogout} />}>
                {/* Redirección por defecto a /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" />} /> 
                <Route path="dashboard" element={<Dashboard_Admin />} />
                <Route path="usuarios" element={<FormularioUsuarios />} />
                <Route path="gestion-estudiantes" element={<GestionEstudiantes />} />
                <Route path="registros-eliminacion" element={<RegistrosEliminacion />} />
                <Route path="programar-clases" element={<ProgramarClases />} />
                <Route path="gestion-cursos" element={<GestionCursos />} />
                <Route path="galeria" element={<GestionGaleria />} />
                <Route path="especializaciones" element={<Especializaciones />} />
                <Route path="planes-precios" element={<PlanesPrecios />} />
                <Route path="registro-ventas" element={<RegistroVentas />} />
                <Route path="gestion-suscripciones" element={<GestionSuscripciones />} />
                <Route path="misiones" element={<MisionesAdmin />} />
                <Route path="retos-diarios" element={<RetosDiariosAdmin />} />
                <Route path="ranking-retos" element={<RankingRetosAdmin />} />
                <Route path="notificaciones" element={<NotificacionesProfesor />} />
            </Route>

            {/* Ruta para manejar páginas no encontradas */}
            <Route path="*" element={<h1>Error 404 - Página no encontrada</h1>} />
        </Routes>
    )
}
