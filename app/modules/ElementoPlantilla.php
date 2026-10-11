<?php
// app/modules/ElementoPlantilla.php

class ElementoPlantilla extends Model {
    protected $table = 'elementos_plantilla';
    
    // Obtener elementos por ID de plantilla
    public function getByPlantillaId($plantilla_id) {
        $sql = "SELECT * FROM " . $this->table . " WHERE plantilla_id = :plantilla_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':plantilla_id' => $plantilla_id]);
        return $stmt->fetchAll();
    }
    
    // Validar datos del elemento antes de guardar
    public function validar($datos) {
        $errores = [];
        
        // Validar que el tipo sea válido
        $tiposPermitidos = ['texto', 'imagen', 'codigo_barras', 'qr', 'rectangulo', 'linea'];
        if (!in_array($datos['tipo'], $tiposPermitidos)) {
            $errores[] = "Tipo de elemento no válido";
        }
        
        // Validar que la plantilla_id existe
        if (empty($datos['plantilla_id'])) {
            $errores[] = "El ID de plantilla es requerido";
        }
        
        // Validar dimensiones y posiciones
        $camposNumericos = ['posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];
        foreach ($camposNumericos as $campo) {
            if (isset($datos[$campo]) && !is_numeric($datos[$campo])) {
                $errores[] = "El campo $campo debe ser numérico";
            }
        }
        
        return $errores;
    }
    
    // Obtener elementos agrupados por tipo
    public function getAgrupadosPorTipo($plantilla_id) {
        $elementos = $this->getByPlantillaId($plantilla_id);
        $agrupados = [];
        
        foreach ($elementos as $elemento) {
            $tipo = $elemento['tipo'];
            if (!isset($agrupados[$tipo])) {
                $agrupados[$tipo] = [];
            }
            $agrupados[$tipo][] = $elemento;
        }
        
        return $agrupados;
    }
}
