<?php
/**
 * Inicialización de la aplicación
 * 
 * Este archivo se encarga de cargar la configuración y establecer la conexión a la base de datos
 */

// Cargar configuración
require_once __DIR__ . '/config/config.php';

// Cargar la clase Database
require_once __DIR__ . '/core/Database.php';

// Inicializar la base de datos
try {
    $db = new Database();
    
    // Verificar conexión
    try {
        // Intentar ejecutar una consulta simple para verificar la conexión
        $db->query('SELECT 1');
        
        // Establecer la conexión como variable global
        $GLOBALS['db'] = $db;
    } catch (Exception $e) {
        throw new Exception('No se pudo conectar a la base de datos: ' . $e->getMessage());
    }
    
} catch (Exception $e) {
    // Registrar el error
    error_log('Error de conexión a la base de datos: ' . $e->getMessage());
    
    // Mostrar mensaje de error amigable
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        die('Error de conexión a la base de datos: ' . $e->getMessage());
    } else {
        die('Error de conexión. Por favor, intente más tarde.');
    }
}

// Cargar modelos
spl_autoload_register(function($className) {
    $file = __DIR__ . '/models/' . $className . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Inicializar controladores
spl_autoload_register(function($className) {
    if (strpos($className, 'Controller') !== false) {
        $file = __DIR__ . '/controllers/' . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

// Cargar helpers
$helpers = glob(__DIR__ . '/helpers/*.php');
foreach ($helpers as $helper) {
    require_once $helper;
}

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
