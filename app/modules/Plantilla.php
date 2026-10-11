<?php
// app/modules/Plantilla.php

class Plantilla extends Model {
    protected $table = 'plantillas';
    
    // Obtener todos los elementos de una plantilla
    public function getElementos($plantilla_id) {
        $sql = "SELECT * FROM elementos_plantilla WHERE plantilla_id = :plantilla_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':plantilla_id' => $plantilla_id]);
        return $stmt->fetchAll();
    }
    
    // Crear una nueva plantilla con sus elementos
    public function crearConElementos($datosPlantilla, $elementos) {
        try {
            $this->db->beginTransaction();
            
            // Insertar la plantilla
            $plantillaId = $this->create($datosPlantilla);
            
            // Insertar los elementos de la plantilla
            if ($plantillaId && !empty($elementos)) {
                $elementoModel = new ElementoPlantilla();
                foreach ($elementos as $elemento) {
                    $elemento['plantilla_id'] = $plantillaId;
                    $elementoModel->create($elemento);
                }
            }
            
            $this->db->commit();
            return $plantillaId;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    // Actualizar una plantilla y sus elementos
    public function actualizarConElementos($id, $datosPlantilla, $elementos) {
        try {
            $this->db->beginTransaction();
            
            // Actualizar la plantilla
            $this->update($id, $datosPlantilla);
            
            // Eliminar elementos existentes
            $this->db->prepare("DELETE FROM elementos_plantilla WHERE plantilla_id = :id")
                    ->execute([':id' => $id]);
            
            // Insertar los nuevos elementos
            if (!empty($elementos)) {
                $elementoModel = new ElementoPlantilla();
                foreach ($elementos as $elemento) {
                    $elemento['plantilla_id'] = $id;
                    $elementoModel->create($elemento);
                }
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
