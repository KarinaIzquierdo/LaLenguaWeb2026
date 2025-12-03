<?php
/**
 * Router principal de la API La Lengua
 */

// Incluir configuración CORS
require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'jwt-simple.php';

// Obtener la ruta solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Obtener la ruta desde diferentes fuentes (compatible con LiteSpeed)
$path = '';

// Método 1: PATH_INFO
if (isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $path = trim($_SERVER['PATH_INFO'], '/');
}
// Método 2: Query parameter 'route' 
elseif (isset($_GET['route'])) {
    $path = trim($_GET['route'], '/');
}
// Método 3: REQUEST_URI parsing
else {
    $uri_path = parse_url($request_uri, PHP_URL_PATH);
    $path = str_replace('/api', '', $uri_path);
    $path = str_replace('/index.php', '', $path);
    $path = trim($path, '/');
}

// Debug: mostrar la ruta capturada
error_log("DEBUG - Ruta capturada: '$path' - REQUEST_URI: $request_uri");

// Dividir la ruta en segmentos
$segments = explode('/', $path);

// Router básico
try {
    switch ($segments[0]) {
        case 'auth':
            if (isset($segments[1]) && $segments[1] == 'profile') {
                require_once 'profile-simple.php';
            } else {
                require_once 'auth-simple.php';
            }
            break;
            
        case 'users':
            require_once 'users.php';
            break;
            
        case 'evaluaciones':
            require_once 'evaluaciones.php';  // Versión completa con CRUD y JWT
            break;

        case 'calificaciones':
            // Rutas de calificaciones y respuestas de evaluaciones
            require_once 'calificaciones.php';
            break;

        case 'student':
            // Rutas tipo /student/evaluaciones/ y /student/respuestas/
            if (isset($segments[1]) && $segments[1] === 'respuestas') {
                // Listado de respuestas del estudiante autenticado
                require_once 'calificaciones.php';
            } else {
                // Evaluaciones asignadas al estudiante
                require_once 'evaluaciones.php';
            }
            break;

        case 'clases':
            require_once 'clases.php';
            break;

        case 'planes':
            require_once 'planes.php';
            break;

        case 'ventas':
        case 'estadisticas':
            require_once 'financial.php';
            break;

        case 'suscripciones':
            require_once 'suscripciones.php';
            break;

        case 'missions':
            require_once 'missions.php';
            break;

        case 'daily-challenges':
            require_once 'daily_challenges.php';
            break;

        case 'admin':
            require_once 'admin_dashboard.php';
            break;

        case 'contact':
            require_once 'contact.php';
            break;

        case 'notificaciones':
            require_once 'notificaciones.php';
            break;

        case 'clubs':
            require_once 'clubs.php';
            break;

        case 'asistencias':
            require_once 'asistencias.php';
            break;

        case 'registros-eliminacion':
            require_once 'registros-eliminacion.php';
            break;

        case 'gallery':
            require_once 'gallery.php';
            break;

        case 'especializaciones':
            require_once 'especializaciones.php';
            break;
            
        case 'test':
            // Endpoint de prueba
            echo json_encode([
                'success' => true,
                'message' => 'API La Lengua funcionando correctamente',
                'timestamp' => date('Y-m-d H:i:s'),
                'path' => $path,
                'method' => $request_method
            ]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Endpoint no encontrado',
                'path' => $path
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'error' => $e->getMessage()
    ]);
}
?>
