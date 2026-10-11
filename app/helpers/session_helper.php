<?php
/**
 * Session Helper
 * Funciones de ayuda para el manejo de sesiones
 */

// Asegurarse de que la sesión esté iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Establecer un mensaje flash
 * 
 * @param string $key Clave del mensaje
 * @param mixed $value Valor del mensaje
 * @return void
 */
function set_flash($key, $value) {
    $_SESSION['_flash'][$key] = $value;
}

/**
 * Obtener un mensaje flash
 * 
 * @param string $key Clave del mensaje
 * @param mixed $default Valor por defecto si no existe el mensaje
 * @return mixed Valor del mensaje o valor por defecto
 */
function get_flash($key, $default = null) {
    if (isset($_SESSION['_flash'][$key])) {
        $value = $_SESSION['_flash'][$key];
        unset($_SESSION['_flash'][$key]);
        return $value;
    }
    return $default;
}

/**
 * Verificar si existe un mensaje flash
 * 
 * @param string $key Clave del mensaje
 * @return bool True si existe, false en caso contrario
 */
function has_flash($key) {
    return isset($_SESSION['_flash'][$key]);
}

/**
 * Establecer un valor en la sesión
 * 
 * @param string $key Clave
 * @param mixed $value Valor
 * @return void
 */
function session_set($key, $value) {
    $_SESSION[$key] = $value;
}

/**
 * Obtener un valor de la sesión
 * 
 * @param string $key Clave
 * @param mixed $default Valor por defecto si no existe la clave
 * @return mixed Valor de la sesión o valor por defecto
 */
function session_get($key, $default = null) {
    return $_SESSION[$key] ?? $default;
}

/**
 * Verificar si existe una clave en la sesión
 * 
 * @param string $key Clave a verificar
 * @return bool True si existe, false en caso contrario
 */
function session_has($key) {
    return isset($_SESSION[$key]);
}

/**
 * Eliminar una clave de la sesión
 * 
 * @param string $key Clave a eliminar
 * @return void
 */
function session_remove($key) {
    if (isset($_SESSION[$key])) {
        unset($_SESSION[$key]);
    }
}

/**
 * Destruir la sesión actual
 * 
 * @return void
 */
function session_destroy_all() {
    session_unset();
    session_destroy();
}
