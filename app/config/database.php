<?php
// Configuración de la base de datos
// Los valores reales viven en config.local.php (ignorado por git).
$_localConf = __DIR__ . '/config.local.php';
if (!file_exists($_localConf)) {
    die('Falta config.local.php. Copia config.example.php y ajusta tus datos de MySQL.');
}
$_db = require $_localConf;
define('DB_HOST', $_db['host']);
define('DB_NAME', $_db['name']);
define('DB_USER', $_db['user']);
define('DB_PASS', $_db['pass']);
define('DB_CHARSET', 'utf8mb4');
