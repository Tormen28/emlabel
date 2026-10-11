<?php
// app/core/Model.php

class Model {
    protected $db;
    protected $table;
    protected $primaryKey = 'id';

    public function __construct() {
        // Obtener instancia de la base de datos
        $this->db = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }

    // Obtener todos los registros
    public function all() {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // Encontrar un registro por ID
    public function find($id) {
        $stmt = $this->db->prepare("SELECT * FROM " . $this->table . " WHERE " . $this->primaryKey . " = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    // Crear un nuevo registro
    public function create($data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $query = "INSERT INTO " . $this->table . " ($columns) VALUES ($placeholders)";
        $stmt = $this->db->prepare($query);
        
        return $stmt->execute($data);
    }

    // Actualizar un registro
    public function update($id, $data) {
        $set = [];
        foreach ($data as $key => $value) {
            $set[] = "$key = :$key";
        }
        $set = implode(', ', $set);
        
        $query = "UPDATE " . $this->table . " SET $set WHERE " . $this->primaryKey . " = :id";
        $data['id'] = $id;
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute($data);
    }

    // Eliminar un registro
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM " . $this->table . " WHERE " . $this->primaryKey . " = :id");
        return $stmt->execute([':id' => $id]);
    }

    // Ejecutar consulta personalizada
    protected function query($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
