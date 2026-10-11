<?php
// app/core/Controller.php

class Controller {
    /**
     * @var \PDO Instancia de PDO para la conexión a la base de datos
     */
    protected $pdo;
    
    /**
     * Constructor base
     */
    public function __construct() {
        // Inicializar la conexión a la base de datos
        $this->initDatabase();
    }
    
    /**
     * Inicializa la conexión a la base de datos
     * 
     * @throws \Exception Si no se puede conectar a la base de datos
     */
    protected function initDatabase() {
        global $pdo;
        
        if (!isset($pdo)) {
            // Usar constantes definidas en config.php
            $host = DB_HOST;
            $dbname = DB_NAME;
            $username = DB_USER;
            $password = DB_PASS;
            $charset = 'utf8mb4';
            
            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            try {
                $pdo = new \PDO($dsn, $username, $password, $options);
            } catch (\PDOException $e) {
                throw new \Exception('Error de conexión: ' . $e->getMessage());
            }
        }
        
        $this->pdo = $pdo;
    }
    
    // Cargar modelo
    public function model($model) {
        // Directorios donde buscar el modelo
        $directories = [
            __DIR__ . '/../models/',    // app/models (primera opción)
            __DIR__ . '/../modules/'    // app/modules (segunda opción)
        ];
        
        // Buscar el modelo en los directorios
        foreach ($directories as $directory) {
            $modelPath = $directory . $model . '.php';
            
            if (file_exists($modelPath)) {
                // Requerir el archivo del modelo
                require_once $modelPath;
                
                // Verificar si el archivo contiene la clase
                $classes = get_declared_classes();
                $classFound = false;
                $modelClass = null;
                
                // Buscar la clase en el espacio de nombres actual
                if (class_exists($model)) {
                    $modelClass = $model;
                    $classFound = true;
                } else {
                    // Si no se encuentra, buscar en el espacio de nombres global
                    $fullyQualifiedModel = '\\' . $model;
                    if (class_exists($fullyQualifiedModel)) {
                        $modelClass = $fullyQualifiedModel;
                        $classFound = true;
                    }
                }
                
                if ($classFound) {
                    // Verificar si la clase tiene un constructor que requiera parámetros
                    $reflection = new ReflectionClass($modelClass);
                    $constructor = $reflection->getConstructor();
                    
                    if ($constructor && $constructor->getNumberOfRequiredParameters() > 0) {
                        // Si el constructor requiere parámetros, inyectar la conexión PDO
                        return new $modelClass($this->pdo);
                    } else {
                        // Si no requiere parámetros, crear una nueva instancia
                        return new $modelClass();
                    }
                } else {
                    // Si la clase no se encuentra, mostrar un error detallado
                    $declaredClasses = get_declared_classes();
                    $lastClass = end($declaredClasses);
                    die('La clase ' . $model . ' no está definida en ' . $modelPath . 
                        '. Clases declaradas: ' . implode(', ', $declaredClasses));
                }
            }
        }
        
        // Si llegamos aquí, el modelo no se encontró
        die('No se pudo encontrar el modelo: ' . $model . ' en los directorios: ' . implode(', ', $directories));
    }

    // Cargar vista
    public function view($view, $data = []) {
        // Convertir datos a variables
        extract($data);
        
        // Construir la ruta completa al archivo de la vista
        $viewFile = __DIR__ . '/../views/' . $view . '.php';
        
        // Verificar si el archivo de la vista existe
        if (file_exists($viewFile)) {
            // Iniciar el buffer de salida
            ob_start();
            
            // Incluir el archivo de la vista
            include $viewFile;
            
            // Obtener el contenido del búfer y limpiarlo
            $content = ob_get_clean();
            
            // Incluir el layout principal si existe
            $layoutFile = __DIR__ . '/../views/layouts/main.php';
            if (file_exists($layoutFile)) {
                // Extraer las variables de la vista
                extract($data, EXTR_SKIP);
                
                // Definir el contenido para el layout
                $content = $content;
                
                // Incluir el layout
                include $layoutFile;
            } else {
                // Si no hay layout, mostrar solo el contenido de la vista
                echo $content;
            }
        } else {
            // La vista no existe
            throw new Exception("No se pudo encontrar el archivo de la vista: " . $viewFile);
        }
    }

    // Redireccionar
    public function redirect($url) {
        header('Location: ' . URLROOT . '/' . $url);
        exit();
    }

    // Cargar helper
    public function helper($helper) {
        require_once '../app/helpers/' . $helper . '.php';
    }
    
    /**
     * Valida el token CSRF para peticiones que lo requieran
     * 
     * @throws Exception Si el token CSRF no es válido o no está presente
     */
    protected function validarCSRF() {
        // Métodos que requieren validación CSRF
        if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return; // No requiere validación CSRF
        }
        
        // Obtener el token del encabezado o del formulario
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['_csrf'] ?? null;
        
        // Verificar si la sesión tiene un token CSRF
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Validar el token
        if (!$token || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            http_response_code(403);
            if ($this->isAjaxRequest()) {
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Token CSRF no válido o expirado']);
                exit;
            } else {
                throw new Exception('Token CSRF no válido o expirado');
            }
        }
    }
    
    /**
     * Verifica si la petición es AJAX
     * 
     * @return bool
     */
    protected function isAjaxRequest() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
               strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }
}
