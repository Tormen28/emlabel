<?php
/**
 * Security Helper
 * Funciones de ayuda para la seguridad de la aplicación
 */

/**
 * Genera un token CSRF si no existe uno en la sesión
 * 
 * @return string Token CSRF
 */
function generarTokenCSRF() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verifica si el token CSRF es válido
 * 
 * @param string $token Token a verificar
 * @return bool True si el token es válido, false en caso contrario
 */
function verificarTokenCSRF($token) {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Valida el token CSRF del formulario
 * 
 * @return void
 * @throws Exception Si el token no es válido
 */
function validarCSRF() {
    $token = $_POST['csrf_token'] ?? '';
    if (!verificarTokenCSRF($token)) {
        throw new Exception('Token CSRF inválido o expirado');
    }
}
