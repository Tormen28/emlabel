<?php
// Cargar configuración
require_once __DIR__ . '/app/config/config.php';

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Prueba de conexión a la base de datos</h2>";

try {
    // Intentar conectar usando PDO directamente
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    echo "<p>Intentando conectar a la base de datos...</p>";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    echo "<p style='color: green;'>¡Conexión exitosa!</p>";
    
    // Verificar si la tabla plantillas existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'plantillas'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "<p>La tabla 'plantillas' existe.</p>";
        
        // Mostrar estructura de la tabla
        $stmt = $pdo->query("DESCRIBE plantillas");
        $columns = $stmt->fetchAll();
        
        echo "<h3>Estructura de la tabla 'plantillas':</h3>";
        echo "<table border='1'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Valor por defecto</th><th>Extra</th></tr>";
        
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($column['Field']) . "</td>";
            echo "<td>" . htmlspecialchars($column['Type']) . "</td>";
            echo "<td>" . htmlspecialchars($column['Null']) . "</td>";
            echo "<td>" . htmlspecialchars($column['Key']) . "</td>";
            echo "<td>" . htmlspecialchars($column['Default'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($column['Extra'] ?? '') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p style='color: orange;'>La tabla 'plantillas' no existe.</p>";
        
        // Crear la tabla si no existe
        echo "<p>Creando tabla 'plantillas'...</p>";
        
        $sql = "CREATE TABLE IF NOT EXISTS `plantillas` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `nombre` varchar(100) NOT NULL,
            `descripcion` text,
            `ancho` decimal(10,2) NOT NULL DEFAULT '100.00',
            `alto` decimal(10,2) NOT NULL DEFAULT '50.00',
            `unidad_medida` enum('mm','cm','in','px') NOT NULL DEFAULT 'mm',
            `es_activo` tinyint(1) NOT NULL DEFAULT '1',
            `es_predeterminada` tinyint(1) NOT NULL DEFAULT '0',
            `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `fecha_actualizacion` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `es_activo` (`es_activo`),
            KEY `es_predeterminada` (`es_predeterminada`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
        
        try {
            $pdo->exec($sql);
            echo "<p style='color: green;'>Tabla 'plantillas' creada exitosamente.</p>";
        } catch (PDOException $e) {
            echo "<p style='color: red;'>Error al crear la tabla: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Error de conexión: " . htmlspecialchars($e->getMessage()) . "</p>";
    
    // Mostrar información de depuración
    echo "<h3>Información de depuración:</h3>";
    echo "<pre>DSN: mysql:host=" . htmlspecialchars(DB_HOST) . ";dbname=" . htmlspecialchars(DB_NAME) . "</pre>";
    echo "<pre>Usuario: " . htmlspecialchars(DB_USER) . "</pre>";
    echo "<pre>Contraseña: " . (DB_PASS ? '***' : '(vacía)') . "</pre>";
    
    // Verificar si la base de datos existe
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
        $dbExists = $stmt->rowCount() > 0;
        
        if (!$dbExists) {
            echo "<p style='color: red;'>La base de datos '" . htmlspecialchars(DB_NAME) . "' no existe.</p>";
            echo "<p>Puedes crearla con el siguiente comando SQL:</p>";
            echo "<pre>CREATE DATABASE `" . htmlspecialchars(DB_NAME) . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;</pre>";
        } else {
            echo "<p>La base de datos existe, pero hay un problema de permisos o configuración.</p>";
        }
    } catch (PDOException $e) {
        echo "<p>No se pudo verificar la existencia de la base de datos: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
}

echo "<h3>Configuración actual:</h3>";
echo "<pre>" . print_r([
    'DB_HOST' => DB_HOST,
    'DB_NAME' => DB_NAME,
    'DB_USER' => DB_USER,
    'DB_PASS' => DB_PASS ? '***' : '(vacía)',
], true) . "</pre>";
?>
