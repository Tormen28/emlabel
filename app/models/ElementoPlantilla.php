<?php

// Prevent multiple class declarations
if (!class_exists('ElementoPlantilla', false)) {
/**
 * Modelo ElementoPlantilla
 * 
 * Maneja las operaciones de base de datos para los elementos de plantilla
 */
class ElementoPlantilla {
    private $db;
    private $table = 'elementos_plantilla';

    /**
     * Constructor - Inicializa la conexión a la base de datos
     */
    public function __construct() {
        global $db;
        $this->db = $db;
    }

    /**
     * Crea un nuevo elemento de plantilla
     * 
     * @param array $datos Datos del elemento a crear
     * @return int|bool ID del elemento creado o false en caso de error
     */
    public function crear($datos) {
        $sql = "INSERT INTO {$this->table} 
                (plantilla_id, tipo, contenido, posicion_x, posicion_y, 
                 ancho, alto, rotacion, z_index, bloqueado, visible, propiedades) 
                VALUES (:plantilla_id, :tipo, :contenido, :posicion_x, :posicion_y, 
                       :ancho, :alto, :rotacion, :z_index, :bloqueado, :visible, :propiedades)";
        
        $propiedades = isset($datos['propiedades']) ? 
                      json_encode($datos['propiedades']) : '{}';
        
        $params = [
            ':plantilla_id' => $datos['plantilla_id'] ?? null,
            ':tipo' => $datos['tipo'] ?? 'texto',
            ':contenido' => $datos['contenido'] ?? '',
            ':posicion_x' => $datos['posicion_x'] ?? 0,
            ':posicion_y' => $datos['posicion_y'] ?? 0,
            ':ancho' => $datos['ancho'] ?? 100,
            ':alto' => $datos['alto'] ?? 50,
            ':rotacion' => $datos['rotacion'] ?? 0,
            ':z_index' => $datos['z_index'] ?? 0,
            ':bloqueado' => !empty($datos['bloqueado']) ? 1 : 0,
            ':visible' => isset($datos['visible']) ? ($datos['visible'] ? 1 : 0) : 1,
            ':propiedades' => $propiedades
        ];
        
        $this->db->query($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Actualiza un elemento existente
     * 
     * @param int $id ID del elemento a actualizar
     * @param array $datos Nuevos datos del elemento
     * @return bool True si la actualización fue exitosa
     */
    public function actualizar($id, $datos) {
        $sql = "UPDATE {$this->table} SET 
                tipo = :tipo, 
                contenido = :contenido, 
                posicion_x = :posicion_x, 
                posicion_y = :posicion_y,
                ancho = :ancho, 
                alto = :alto, 
                rotacion = :rotacion, 
                z_index = :z_index,
                bloqueado = :bloqueado, 
                visible = :visible, 
                propiedades = :propiedades
                WHERE id = :id";
        
        $propiedades = isset($datos['propiedades']) ? 
                      json_encode($datos['propiedades']) : '{}';
        
        $params = [
            ':tipo' => $datos['tipo'] ?? 'texto',
            ':contenido' => $datos['contenido'] ?? '',
            ':posicion_x' => $datos['posicion_x'] ?? 0,
            ':posicion_y' => $datos['posicion_y'] ?? 0,
            ':ancho' => $datos['ancho'] ?? 100,
            ':alto' => $datos['alto'] ?? 50,
            ':rotacion' => $datos['rotacion'] ?? 0,
            ':z_index' => $datos['z_index'] ?? 0,
            ':bloqueado' => !empty($datos['bloqueado']) ? 1 : 0,
            ':visible' => isset($datos['visible']) ? ($datos['visible'] ? 1 : 0) : 1,
            ':propiedades' => $propiedades,
            ':id' => $id
        ];
        
        $this->db->query($sql, $params);
        return true;
    }

    /**
     * Obtiene un elemento por su ID
     * 
     * @param int $id ID del elemento
     * @return array|false Datos del elemento o false si no se encuentra
     */
    public function obtenerPorId($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $this->db->query($sql, [':id' => $id]);
        $resultado = $this->db->single();
        
        if ($resultado && isset($resultado['propiedades'])) {
            $resultado['propiedades'] = json_decode($resultado['propiedades'], true) ?: [];
        }
        
        return $resultado;
    }

    /**
     * Obtiene todos los elementos de una plantilla
     * 
     * @param int $plantillaId ID de la plantilla
     * @return array Lista de elementos de la plantilla
     */
    public function obtenerPorPlantilla($plantillaId) {
        $sql = "SELECT * FROM {$this->table} 
                WHERE plantilla_id = :plantilla_id 
                ORDER BY z_index ASC";
        
        $this->db->query($sql, [':plantilla_id' => $plantillaId]);
        $resultados = $this->db->resultSet();
        
        return array_map(function($item) {
            if (isset($item['propiedades'])) {
                $item['propiedades'] = json_decode($item['propiedades'], true) ?: [];
            } else {
                $item['propiedades'] = [];
            }
            return $item;
        }, $resultados);
    }

    /**
     * Elimina un elemento
     * 
     * @param int $id ID del elemento a eliminar
     * @return bool True si la eliminación fue exitosa
     */
    public function eliminar($id) {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $this->db->query($sql, [':id' => $id]);
        return $this->db->execute();
    }

    /**
     * Elimina todos los elementos de una plantilla excepto los especificados
     * 
     * @param int $plantillaId ID de la plantilla
     * @param array $idsExcluidos IDs de elementos a excluir de la eliminación
     * @return bool True si se realizó la operación correctamente
     */
    public function eliminarPorPlantillaExcepto($plantillaId, $idsExcluidos = []) {
        if (empty($idsExcluidos)) {
            $sql = "DELETE FROM {$this->table} WHERE plantilla_id = :plantilla_id";
            $this->db->query($sql, [':plantilla_id' => $plantillaId]);
        } else {
            $placeholders = [];
            $params = [':plantilla_id' => $plantillaId];
            
            foreach ($idsExcluidos as $i => $id) {
                $param = ":id_$i";
                $placeholders[] = $param;
                $params[$param] = $id;
            }
            
            $placeholdersStr = implode(', ', $placeholders);
            $sql = "DELETE FROM {$this->table} WHERE plantilla_id = :plantilla_id AND id NOT IN ($placeholdersStr)";
            $this->db->query($sql, $params);
        }
    return $this->db->execute();
    }
}
} // End class ElementoPlantilla
?>
