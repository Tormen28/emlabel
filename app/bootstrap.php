<?php
/**
 * Bootstrap de la aplicación
 * 
 * Este archivo se encarga de cargar la configuración, inicializar la sesión,
 * configurar el manejo de errores y cargar los helpers necesarios.
 */

// Definir la ruta base de la aplicación
define('APP_ROOT', dirname(__DIR__));

// Cargar configuración
require_once __DIR__ . '/config/config.php';

// Configurar manejo de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configurar la zona horaria
date_default_timezone_set('America/Mexico_City');

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Función para cargar automáticamente las clases
spl_autoload_register(function($className) {
    // Directorios donde buscar las clases
    // Directorios donde buscar las clases
    $directories = [
        __DIR__ . '/core/',
        __DIR__ . '/models/',
        __DIR__ . '/controllers/',
        __DIR__ . '/modules/'
    ];
    
    // Convertir el nombre de la clase a la ruta del archivo
    $className = str_replace('\\', '/', $className);
    
    // Si el nombre de la clase ya incluye 'Controller', buscar directamente
    if (strpos($className, 'Controller') !== false) {
        $file = __DIR__ . '/controllers/' . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return true;
        }
    }
    
    // Buscar en cada directorio
    foreach ($directories as $directory) {
        $file = $directory . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return true;
        }
    }
    
    // Si no se encontró la clase, lanzar una excepción
    throw new Exception("No se pudo cargar la clase: $className");
});

// Cargar helpers
$helpers = [
    'url_helper.php',
    'session_helper.php',
    'security_helper.php'
];

foreach ($helpers as $helper) {
    $helperPath = __DIR__ . '/helpers/' . $helper;
    if (file_exists($helperPath)) {
        require_once $helperPath;
    } else {
        // Si el helper no existe, mostrar un mensaje de error
        error_log("No se pudo cargar el helper: $helper");
    }
}

// Función para manejar errores
error_reporting(E_ALL);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // No ejecutar el gestor de errores interno de PHP
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    $errorType = [
        E_ERROR             => 'Error',
        E_WARNING           => 'Advertencia',
        E_PARSE             => 'Error de análisis',
        E_NOTICE            => 'Aviso',
        E_CORE_ERROR        => 'Error del núcleo',
        E_CORE_WARNING      => 'Advertencia del núcleo',
        E_COMPILE_ERROR     => 'Error de compilación',
        E_COMPILE_WARNING   => 'Advertencia de compilación',
        E_USER_ERROR        => 'Error de usuario',
        E_USER_WARNING      => 'Advertencia de usuario',
        E_USER_NOTICE       => 'Aviso de usuario',
        E_STRICT            => 'Sugerencia de compatibilidad',
        E_RECOVERABLE_ERROR => 'Error recuperable',
        E_DEPRECATED        => 'Advertencia de obsolescencia',
        E_USER_DEPRECATED   => 'Advertencia de obsolescencia de usuario',
    ];
    
    $type = $errorType[$errno] ?? 'Error desconocido';
    $message = "$type: $errstr en $errfile en la línea $errline";
    
    // Registrar el error
    error_log($message);
    
    // Mostrar un mensaje de error amigable en producción
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
        echo 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
    } else {
        echo "<pre>$message</pre>";
    }
    
    // No ejecutar el gestor de errores interno de PHP
    return true;
});

// Función para manejar excepciones no capturadas
set_exception_handler(function($e) {
    error_log("Excepción no capturada: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());
    
    // Mostrar un mensaje de error amigable en producción
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
        echo 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
    } else {
        echo "<h1>Excepción no capturada</h1>";
        echo "<p><strong>Mensaje:</strong> " . $e->getMessage() . "</p>";
        echo "<p><strong>Archivo:</strong> " . $e->getFile() . ":" . $e->getLine() . "</p>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
    
    exit(1);
});
