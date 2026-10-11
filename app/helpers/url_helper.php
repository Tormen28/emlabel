<?php
/**
 * URL Helper
 * Funciones de ayuda para el manejo de URLs
 */

/**
 * Obtener la URL completa de un recurso
 * 
 * @param string $path Ruta relativa al directorio raíz de la aplicación
 * @return string URL completa
 */
function url($path = '') {
    // Asegurarse de que la ruta no comience con una barra
    $path = ltrim($path, '/');
    
    // Obtener la URL base de la aplicación
    $baseUrl = rtrim(URLROOT, '/');
    
    // Retornar la URL completa
    return $baseUrl . '/' . $path;
}

/**
 * Redirigir a una URL
 * 
 * @param string $url URL a la que redirigir
 * @param int $statusCode Código de estado HTTP (opcional, por defecto 302)
 */
function redirect($url, $statusCode = 302) {
    // Si la URL no comienza con http, asumimos que es una ruta relativa
    if (!preg_match("~^(?:f|ht)tps?://~i", $url)) {
        $url = url($url);
    }
    
    header('Location: ' . $url, true, $statusCode);
    exit();
}

/**
 * Obtener la URL actual
 * 
 * @return string URL actual
 */
function current_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    return $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
}

/**
 * Obtener el segmento de la URL
 * 
 * @param int $num Número del segmento (comenzando desde 1)
 * @return string|null Valor del segmento o null si no existe
 */
function segment($num) {
    $url = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $segments = explode('/', trim($url, '/'));
    
    // Eliminar el primer segmento si es el nombre del directorio de la aplicación
    if (defined('URLROOT') && !empty($segments[0]) && strpos(URLROOT, $segments[0]) !== false) {
        array_shift($segments);
    }
    
    return isset($segments[$num - 1]) ? $segments[$num - 1] : null;
}
