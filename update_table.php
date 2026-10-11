<?php
// Cargar configuración
require_once __DIR__ . '/app/config/config.php';

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Actualizando estructura de la tabla 'plantillas'</h2>";

try {
    // Conectar a la base de datos
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8';
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    // Verificar si necesitamos actualizar la tabla
    $needsUpdate = false;
    $missingColumns = [];
    
    // Lista de columnas que deberían existir
    $requiredColumns = [
        'descripcion' => "ALTER TABLE `plantillas` ADD COLUMN `descripcion` TEXT DEFAULT NULL AFTER `nombre`;",
        'unidad_medida' => "ALTER TABLE `plantillas` ADD COLUMN `unidad_medida` ENUM('mm','cm','in','px') NOT NULL DEFAULT 'mm' AFTER `alto`;",
        'es_activo' => "ALTER TABLE `plantillas` ADD COLUMN `es_activo` TINYINT(1) NOT NULL DEFAULT '1' AFTER `unidad_medida`;",
        'es_predeterminada' => "ALTER TABLE `plantillas` ADD COLUMN `es_predeterminada` TINYINT(1) NOT NULL DEFAULT '0' AFTER `es_activo`;",
        'fecha_creacion' => "ALTER TABLE `plantillas` ADD COLUMN `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `es_predeterminada`;",
        'fecha_actualizacion' => "ALTER TABLE `plantillas` ADD COLUMN `fecha_actualizacion` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `fecha_creacion`;"
    ];
    
    // Verificar columnas faltantes
    $stmt = $pdo->query("DESCRIBE plantillas");
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Columnas actuales:</h3><ul>";
    foreach ($existingColumns as $col) {
        echo "<li>" . htmlspecialchars($col) . "</li>";
    }
    echo "</ul>";
    
    // Verificar columnas faltantes
    foreach ($requiredColumns as $column => $sql) {
        if (!in_array($column, $existingColumns)) {
            $missingColumns[$column] = $sql;
            $needsUpdate = true;
        }
    }
    
    if ($needsUpdate) {
        echo "<h3>Actualizando la tabla...</h3>";
        echo "<ul>";
        
        // Deshabilitar verificación de claves foráneas temporalmente
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
        
        // Ejecutar cada sentencia SQL para agregar columnas faltantes
        foreach ($missingColumns as $column => $sql) {
            echo "<li>Agregando columna <strong>" . htmlspecialchars($column) . "</strong>... ";
            try {
                $pdo->exec($sql);
                echo "<span style='color: green;'>¡Hecho!</span></li>";
            } catch (PDOException $e) {
                echo "<span style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</span></li>";
            }
        }
        
        // Volver a habilitar verificación de claves foráneas
        $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
        
        echo "</ul>";
        echo "<p style='color: green; font-weight: bold;'>¡Estructura de la tabla actualizada correctamente!</p>";
    } else {
        echo "<p>La tabla ya tiene la estructura correcta. No se necesitan actualizaciones.</p>";
    }
    
    // Mostrar la estructura actualizada
    echo "<h3>Estructura actual de la tabla 'plantillas':</h3>";
    $stmt = $pdo->query("DESCRIBE plantillas");
    $columns = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
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
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
