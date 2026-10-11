<?php
/**
 * Configuración de la aplicación
 */

// Entorno de la aplicación (development, testing, production)
define('ENVIRONMENT', 'development');

// Configuración de la aplicación
define('APP_NAME', 'Sistema de Etiquetas');
define('URLROOT', '/modulo');

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'emlabel_app');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configuración de sesión
define('SESSION_NAME', 'emlabel_sess');
define('SESSION_LIFETIME', 7200); // 2 horas

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', ENVIRONMENT === 'development' ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Configuración de zona horaria
date_default_timezone_set('America/Mexico_City');

// Configuración de seguridad
define('CSRF_PROTECTION', true);
define('XSS_PROTECTION', true);

// Configuración de subida de archivos
define('UPLOAD_DIR', __DIR__ . '/../../public/uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB

// Configuración de correo electrónico
define('MAIL_FROM', 'no-reply@example.com');
define('MAIL_FROM_NAME', 'Sistema de Etiquetas');

// Configuración de la aplicación
$config = [
    'version' => '1.0.0',
    'debug' => ENVIRONMENT === 'development',
    'timezone' => 'America/Mexico_City',
    'locale' => 'es_MX',
    'url' => 'http://' . $_SERVER['HTTP_HOST'] . URLROOT,
];
