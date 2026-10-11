<?php
/**
 * Modelo Plantilla
 * 
 * Maneja las operaciones de base de datos para las plantillas
 */
class Plantilla {
    /**
     * @var \PDO Instancia de PDO para la conexión a la base de datos
     */
    protected $pdo;
    
    /**
     * @var string Nombre de la tabla en la base de datos
     */
    private $table = 'plantillas';

    /**
     * Constructor - Inicializa la conexión a la base de datos
     * 
     * @param \PDO $pdo Instancia opcional de PDO (si no se proporciona, se crea una nueva)
     */
    public function __construct(\PDO $pdo = null) {
        if ($pdo instanceof \PDO) {
            $this->pdo = $pdo;
        } else {
            // Obtener la instancia de PDO local
            $this->pdo = $this->getPdoConnection();
        }
    }
    
    /**
     * Obtiene la conexión PDO
     * 
     * @return \PDO
     */
    protected function getPdoConnection() {
        if (!isset($this->pdo)) {
            // Si no hay una instancia de PDO, intentar obtenerla del controlador
            if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof \PDO) {
                $this->pdo = $GLOBALS['pdo'];
                return $this->pdo;
            }
            
            // Si no hay una instancia global, crear una nueva
            $host = DB_HOST;
            $dbname = DB_NAME;
            $username = DB_USER;
            $password = DB_PASS;
            $charset = 'utf8mb4';
            
            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            try {
                $this->pdo = new \PDO($dsn, $username, $password, $options);
                // Almacenar la conexión en el ámbito global para reutilizarla
                $GLOBALS['pdo'] = $this->pdo;
            } catch (\PDOException $e) {
                throw new \Exception('Error de conexión: ' . $e->getMessage());
            }
        }
        
        return $this->pdo;
    }

    /**
     * Obtiene una plantilla por su ID
     * 
     * @param int $id ID de la plantilla
     * @return array|false Datos de la plantilla o false si no se encuentra
     */
    /**
     * Obtiene una plantilla por su ID (alias de obtenerPorId para compatibilidad)
     * 
     * @param int $id ID de la plantilla
     * @return object|false Objeto con los datos de la plantilla o false si no se encuentra
     */
    public function find($id) {
        return $this->obtenerPorId($id);
    }
    
    /**
     * Obtiene una plantilla por su ID
     * 
     * @param int $id ID de la plantilla
     * @return object|false Objeto con los datos de la plantilla o false si no se encuentra
     */
    public function obtenerPorId($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_OBJ);
    }

    /**
     * Obtiene todas las plantillas
     * 
     * @return array Lista de plantillas
     */
    /**
     * Obtiene todas las plantillas (alias de obtenerTodas para compatibilidad)
     * 
     * @return array Lista de plantillas
     */
    public function all() {
        return $this->obtenerTodas();
    }
    
    /**
     * Obtiene todas las plantillas
     * 
     * @return array Lista de plantillas
     */
    /**
     * Obtiene todas las plantillas (sin paginación)
     * 
     * @return array Lista de plantillas
     */
    public function obtenerTodas() {
        return $this->obtenerPaginadas(0, 0);
    }
    
    /**
     * Cuenta el total de plantillas que coinciden con el criterio de búsqueda
     * 
     * @param string $buscar Término de búsqueda opcional
     * @return int Número total de plantillas
     */
    public function contarTotal($buscar = '') {
        try {
            $sql = "SELECT COUNT(*) as total FROM {$this->table}";
            $params = [];
            
            if (!empty($buscar)) {
                $sql .= " WHERE nombre LIKE :buscar OR descripcion LIKE :buscar";
                $params[':buscar'] = "%$buscar%";
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch(PDO::FETCH_OBJ);
            
            return $result ? (int)$result->total : 0;
            
        } catch (\PDOException $e) {
            error_log("Error en Plantilla::contarTotal: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Obtiene plantillas con paginación y filtros
     * 
     * @param int $offset Desplazamiento para la paginación
     * @param int $limit Límite de resultados por página
     * @param string $buscar Término de búsqueda opcional
     * @param string $orden Campo por el que ordenar (opcional)
     * @return array Lista de plantillas
     */
    public function obtenerPaginadas($offset = 0, $limit = 10, $buscar = '', $orden = 'fecha_desc') {
        try {
            // Primero verificar si la tabla existe
            $tableExists = $this->pdo->query("SHOW TABLES LIKE '{$this->table}'")->rowCount() > 0;
            
            if (!$tableExists) {
                error_log("La tabla {$this->table} no existe en la base de datos");
                return [];
            }
            
            // Obtener información de columnas
            $stmt = $this->pdo->query("SHOW COLUMNS FROM {$this->table}");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Columnas base a seleccionar
            $selectColumns = ['id', 'nombre', 'descripcion', 'ancho', 'alto', 'unidad_medida', 'es_activo', 'es_predeterminada', 'fecha_creacion', 'fecha_actualizacion', 'elementos_json'];
            $validColumns = array_intersect($selectColumns, $columns);
            
            if (empty($validColumns)) {
                error_log("No se encontraron columnas válidas en la tabla {$this->table}");
                return [];
            }
            
            // Contar elementos (simplificado para evitar problemas de sintaxis)
            $countElements = ", 0 as total_elementos";
            
            // Si existe la columna elementos_json, intentamos contar los elementos
            if (in_array('elementos_json', $columns)) {
                $countElements = ", 
                    CASE 
                        WHEN elementos_json IS NULL OR elementos_json = '' THEN 0
                        WHEN JSON_VALID(elementos_json) THEN 
                            (LENGTH(elementos_json) - LENGTH(REPLACE(elementos_json, 'id', ''))) / LENGTH('id')
                        ELSE 0 
                    END as total_elementos";
            }
            
            // Agregar categoría si existe la columna
            $categoriaColumn = in_array('categoria', $columns) ? ', categoria' : ', NULL as categoria';
            
            // Determinar la columna de fecha de actualización
            $fechaActualizacion = in_array('fecha_actualizacion', $columns) ? 'fecha_actualizacion' : 
                                 (in_array('fecha_modificacion', $columns) ? 'fecha_modificacion' : 'fecha_creacion');
            
            // Construir la consulta base
            $sql = "SELECT " . implode(', ', $validColumns) . "$countElements $categoriaColumn, 
                   $fechaActualizacion as actualizado_en 
                   FROM {$this->table}";
            
            $params = [];
            
            // Aplicar búsqueda si se especifica
            if (!empty($buscar)) {
                $sql .= " WHERE nombre LIKE :buscar OR descripcion LIKE :buscar";
                $params[':buscar'] = "%$buscar%";
            }
            
            // Aplicar ordenación
            $orden = $this->validarOrden($orden, $columns);
            $sql .= " ORDER BY $orden";
            
            // Aplicar límite y desplazamiento si es necesario
            if ($limit > 0) {
                $sql .= " LIMIT :limit OFFSET :offset";
                $params[':limit'] = $limit;
                $params[':offset'] = $offset;
            }
            
            // Preparar y ejecutar la consulta
            $stmt = $this->pdo->prepare($sql);
            
            // Vincular parámetros
            foreach ($params as $key => $value) {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($key, $value, $paramType);
            }
            
            $stmt->execute();
            
            // Obtener resultados como array asociativo
            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Asegurarse de que todos los campos esperados estén definidos
            foreach ($resultados as &$fila) {
                $fila['categoria'] = $fila['categoria'] ?? null;
                $fila['total_elementos'] = (int)($fila['total_elementos'] ?? 0);
                $fila['actualizado_en'] = $fila['actualizado_en'] ?? $fila['fecha_creacion'] ?? null;
            }
            
            return $resultados;
            
        } catch (\PDOException $e) {
            error_log("Error en Plantilla::obtenerPaginadas: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Elimina una plantilla por su ID
     * 
     * @param int $id ID de la plantilla a eliminar
     * @return bool True si se eliminó correctamente, false en caso contrario
     */
    public function delete($id) {
        try {
            // Verificar que la plantilla existe
            $plantilla = $this->obtenerPorId($id);
            
            if (!$plantilla) {
                error_log("No se encontró la plantilla con ID: $id para eliminar");
                return false;
            }
            
            // Iniciar transacción para asegurar la integridad de los datos
            $this->pdo->beginTransaction();
            
            // Primero, eliminar los elementos asociados (si existe la tabla)
            try {
                if ($this->pdo->query("SHOW TABLES LIKE 'elementos_plantilla'")->rowCount() > 0) {
                    $stmt = $this->pdo->prepare("DELETE FROM elementos_plantilla WHERE plantilla_id = :id");
                    $stmt->execute([':id' => $id]);
                }
            } catch (\PDOException $e) {
                // Si hay un error al eliminar elementos, registrar pero continuar
                error_log("Advertencia al eliminar elementos de la plantilla: " . $e->getMessage());
            }
            
            // Luego, eliminar la plantilla
            $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = :id");
            $resultado = $stmt->execute([':id' => $id]);
            
            // Confirmar la transacción
            $this->pdo->commit();
            
            return $resultado;
            
        } catch (\PDOException $e) {
            // Revertir la transacción en caso de error
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            
            error_log("Error al eliminar la plantilla con ID $id: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Valida y formatea el parámetro de ordenación
     * 
     * @param string $orden Campo y dirección de ordenación
     * @param array $columns Columnas permitidas
     * @return string Cláusula ORDER BY segura
     */
    protected function validarOrden($orden, $columns) {
        $orden = strtolower(trim($orden));
        $ordenParts = explode('_', $orden);
        $campo = $ordenParts[0];
        $direccion = isset($ordenParts[1]) ? strtoupper($ordenParts[1]) : 'ASC';
        
        // Mapear campos de ordenación a columnas reales
        $camposOrden = [
            'nombre' => 'nombre',
            'fecha' => 'fecha_creacion',
            'actualizacion' => 'fecha_actualizacion',
            'id' => 'id'
        ];
        
        // Usar el campo mapeado o el campo original si no existe en el mapeo
        $campoOrden = $camposOrden[$campo] ?? $campo;
        
        // Asegurarse de que el campo de ordenación sea seguro
        if (!in_array($campoOrden, $columns)) {
            $campoOrden = 'fecha_creacion';
        }
        
        // Validar dirección de ordenación
        $direccion = in_array($direccion, ['ASC', 'DESC']) ? $direccion : 'DESC';
        
        return "$campoOrden $direccion";
    }

    /**
     * Crea una nueva plantilla
     * 
     * @param array $datos Datos de la plantilla
     * @return int|false ID de la plantilla creada o false en caso de error
     */
    
    /**
     * Crea una nueva plantilla en la base de datos
     *
     * @param array $datos Datos de la plantilla a crear
     * @return int|false ID de la plantilla creada o false en caso de error
     */
    public function crear($datos) {
        // Depuración: Mostrar datos recibidos
        error_log('Datos recibidos en Plantilla::crear: ' . print_r($datos, true));
        
        $sql = "INSERT INTO {$this->table} 
                (nombre, descripcion, ancho, alto, unidad_medida, es_activo, es_predeterminada, elementos_json, fecha_creacion) 
                VALUES (:nombre, :descripcion, :ancho, :alto, :unidad_medida, :es_activo, :es_predeterminada, :elementos_json, NOW())";
        
        $params = [
            ':nombre' => $datos['nombre'] ?? '',
            ':descripcion' => $datos['descripcion'] ?? '',
            ':ancho' => $datos['ancho'] ?? 100,
            ':alto' => $datos['alto'] ?? 50,
            ':unidad_medida' => $datos['unidad_medida'] ?? 'mm',
            ':es_activo' => isset($datos['es_activo']) ? (int)$datos['es_activo'] : 1,
            ':es_predeterminada' => isset($datos['es_predeterminada']) ? (int)$datos['es_predeterminada'] : 0,
            ':elementos_json' => !empty($datos['elementos_json']) ? $datos['elementos_json'] : null
        ];
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                $id = $this->pdo->lastInsertId();
                error_log("Plantilla creada con ID: " . $id);
                return $id;
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log("Error al ejecutar la consulta: " . ($errorInfo[2] ?? 'Error desconocido'));
                return false;
            }
        } catch (\PDOException $e) {
            error_log("Error en Plantilla::crear: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Actualiza una plantilla existente
     * 
     * @param int $id ID de la plantilla
     * @param array $datos Nuevos datos de la plantilla
     * @return bool True si la actualización fue exitosa
     */
    public function actualizar($id, $datos) {
        error_log('Actualizando plantilla ID ' . $id . ' con datos: ' . print_r($datos, true));
        
        // Construir la consulta SQL dinámicamente
        $campos = [];
        $params = [':id' => $id];
        
        // Mapear campos permitidos para actualización
        $camposPermitidos = [
            'nombre', 'descripcion', 'ancho', 'alto', 
            'unidad_medida', 'es_activo', 'es_predeterminada', 'elementos_json'
        ];
        
        foreach ($datos as $campo => $valor) {
            if (in_array($campo, $camposPermitidos)) {
                $param = ':' . $campo;
                $campos[] = "`$campo` = $param";
                $params[$param] = $valor;
            }
        }
        
        if (empty($campos)) {
            error_log('No hay campos válidos para actualizar');
            return false;
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $campos) . 
               ", fecha_actualizacion = NOW() WHERE id = :id";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                $rowCount = $stmt->rowCount();
                error_log("Plantilla actualizada correctamente. Filas afectadas: $rowCount");
                return $rowCount > 0;
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log('Error al actualizar la plantilla: ' . ($errorInfo[2] ?? 'Error desconocido'));
                return false;
            }
        } catch (\PDOException $e) {
            error_log('Excepción al actualizar plantilla: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Elimina una plantilla
     * 
     * @param int $id ID de la plantilla a eliminar
     * @return bool True si la eliminación fue exitosa
     */
    public function eliminar($id) {
        try {
            // Iniciar transacción
            $this->pdo->beginTransaction();
            
            // Primero eliminamos los elementos asociados a la plantilla
            $sql = "DELETE FROM elementos_plantilla WHERE plantilla_id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            // Luego eliminamos la plantilla
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            $rowCount = $stmt->rowCount();
            
            // Confirmar la transacción
            $this->pdo->commit();
            
            return $rowCount > 0;
            
        } catch (\PDOException $e) {
            // Revertir la transacción en caso de error
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            
            error_log('Error al eliminar plantilla: ' . $e->getMessage());
            return false;
        }
    }
}
