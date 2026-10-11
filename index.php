<?php
// Cargar el cargador de clases y configuración
require_once 'app/bootstrap.php';

// Obtener la URL solicitada
$url = $_GET['url'] ?? 'home';
$url = rtrim($url, '/');
$url = filter_var($url, FILTER_SANITIZE_URL);
$url = explode('/', $url);

// El primer segmento es el controlador
$controllerName = !empty($url[0]) ? $url[0] : 'home';
$method = $url[1] ?? 'index';
$params = array_slice($url, 2);

// Convertir a singular si es necesario (ej: plantillas -> plantilla)
$singularController = rtrim($controllerName, 's'); // Elimina la 's' final si existe

// Intentar encontrar el controlador en este orden:
// 1. Nombre exacto (ej: HomeController)
// 2. Nombre en singular (ej: PlantillaController para 'plantillas')
$controllerFiles = [
    'app/controllers/' . ucfirst($controllerName) . 'Controller.php',
    'app/controllers/' . ucfirst($singularController) . 'Controller.php'
];

$controllerFound = false;
$controllerClass = '';

foreach ($controllerFiles as $controllerFile) {
    if (file_exists($controllerFile)) {
        require_once $controllerFile;
        $controllerClass = '\\' . basename($controllerFile, '.php');
        $controllerFound = true;
        break;
    }
}

// Habilitar la visualización de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($controllerFound) {
    // Registrar información de depuración
    error_log("Controlador encontrado: " . $controllerClass);
    error_log("Método: " . $method);
    
    // Verificar si el método existe en el controlador
    if (method_exists($controllerClass, $method)) {
        try {
            $controllerInstance = new $controllerClass();
            
            // Llamar al método con los parámetros
            if (!empty($params)) {
                call_user_func_array([$controllerInstance, $method], $params);
            } else {
                $controllerInstance->$method();
            }
        } catch (Exception $e) {
            // Mostrar el error de manera amigable
            die("<h1>Error en la aplicación</h1><p>" . htmlspecialchars($e->getMessage()) . "</p>");
        }
    } else {
        die("<h1>Error 404 - Página no encontrada</h1><p>El método '{$method}' no existe en el controlador '{$controllerClass}'.</p>");
    }
} else {
    // Mostrar información detallada del error
    echo "<h1>Error: Controlador no encontrado</h1>";
    echo "<p>Se intentó cargar el controlador: '{$controllerName}' o '{$singularController}'</p>";
    echo "<p>Buscado en las siguientes ubicaciones:</p>";
    echo "<ul>";
    foreach ($controllerFiles as $file) {
        $fullPath = __DIR__ . '/' . $file;
        echo "<li>" . htmlspecialchars($file) . " - " . (file_exists($fullPath) ? "Existe" : "No existe") . "</li>";
    }
    echo "</ul>";
    exit;
}
