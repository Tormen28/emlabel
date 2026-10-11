<?php
// app/controllers/PlantillaController.php

// Depuración: Verificar si el archivo se está cargando
error_log('Cargando PlantillaController.php');

class PlantillaController extends Controller {
    private $plantillaModel;
    
    public function __construct() {
        parent::__construct();
        // Cargar el modelo necesario
        $this->plantillaModel = $this->model('Plantilla');
    }
    

    
    /**
     * Envía una respuesta JSON
     * 
     * @param mixed $data Datos a enviar
     * @param int $statusCode Código de estado HTTP
     */
    protected function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    // Listar todas las plantillas
    public function index() {
        try {
            // Obtener parámetros de paginación
            $paginaActual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
            $porPagina = isset($_GET['por_pagina']) ? (int)$_GET['por_pagina'] : 10;
            $buscar = $_GET['buscar'] ?? '';
            $orden = $_GET['orden'] ?? 'fecha_desc';
            
            // Validar valores
            $paginaActual = max(1, $paginaActual);
            $porPagina = in_array($porPagina, [10, 25, 50, 100]) ? $porPagina : 10;
            
            // Obtener las plantillas con paginación
            $totalPlantillas = $this->plantillaModel->contarTotal($buscar);
            $totalPaginas = ceil($totalPlantillas / $porPagina);
            $offset = ($paginaActual - 1) * $porPagina;
            
            // Obtener plantillas para la página actual
            $plantillas = $this->plantillaModel->obtenerPaginadas($offset, $porPagina, $buscar, $orden);
            
            // Construir la cadena de consulta para la paginación
            $queryParams = [];
            if (!empty($buscar)) $queryParams['buscar'] = $buscar;
            if (!empty($orden)) $queryParams['orden'] = $orden;
            if ($porPagina != 10) $queryParams['por_pagina'] = $porPagina;
            $queryString = !empty($queryParams) ? '&' . http_build_query($queryParams) : '';
            
            // Datos para la vista
            $data = [
                'titulo' => 'Gestión de Plantillas',
                'plantillas' => $plantillas,
                'currentPage' => 'plantillas',
                'filtros' => [
                    'buscar' => $buscar,
                    'orden' => $orden,
                    'por_pagina' => $porPagina
                ],
                'paginacion' => [
                    'pagina_actual' => $paginaActual,
                    'total_paginas' => $totalPaginas,
                    'total_registros' => $totalPlantillas,
                    'por_pagina' => $porPagina,
                    'query_string' => $queryString,
                    'pagina_anterior' => max(1, $paginaActual - 1),
                    'pagina_siguiente' => min($totalPaginas, $paginaActual + 1)
                ]
            ];
            
            // Cargar la vista con los datos
            $this->view('plantillas/index', $data);
            
        } catch (Exception $e) {
            // En caso de error, mostrar mensaje de error
            error_log('Error en PlantillaController::index: ' . $e->getMessage());
            $this->view('error/error', [
                'titulo' => 'Error',
                'mensaje' => 'Ocurrió un error al cargar las plantillas. Por favor, intente nuevamente.'
            ]);
        }
    }
    
    /**
     * Muestra el diseñador de plantillas
     * 
     * @param int $id ID de la plantilla a editar
     */
    public function disenador($id) {
        // Obtener la plantilla por ID
        $plantilla = $this->plantillaModel->obtenerPorId($id);
        
        if (!$plantilla) {
            // Redirigir si la plantilla no existe
            $this->redirect('plantillas');
            return;
        }
        
        // Inicializar elementos como array vacío
        $elementos = [];
        
        // Si hay elementos JSON guardados, decodificarlos
        if (!empty($plantilla->elementos_json)) {
            $elementos = json_decode($plantilla->elementos_json, true);
            
            // Verificar si hubo error en la decodificación
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('Error al decodificar elementos_json: ' . json_last_error_msg());
                $elementos = [];
            }
        }
        
        // Cargar la vista del diseñador con los datos
        $this->view('plantillas/diseñador', [
            'titulo' => 'Diseñador de Plantilla: ' . $plantilla->nombre,
            'plantilla' => $plantilla,
            'elementos_json' => json_encode($elementos, JSON_HEX_APOS | JSON_HEX_QUOT)
        ]);
    }
    
    // Mostrar formulario para crear nueva plantilla
    public function crear() {
        $this->view('plantillas/crear', [
            'titulo' => 'Nueva Plantilla'
        ]);
    }
    
    /**
     * Guarda una nueva plantilla o actualiza una existente
     * 
     * @return void
     */
    public function guardar() {
        // Iniciar transacción para asegurar consistencia
        $this->pdo->beginTransaction();
        
        try {
            // Depuración: Mostrar datos POST recibidos
            error_log('Datos POST recibidos: ' . print_r($_POST, true));
            
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido');
            }
            
            if (!empty($_POST['elementos_json'])) {
                $jsonData = json_decode($_POST['elementos_json'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Si el JSON es válido, usamos esos datos
                    $datos = [
                        'nombre' => trim($jsonData['nombre'] ?? ($_POST['nombre'] ?? '')),
                        'ancho' => floatval($jsonData['ancho'] ?? ($_POST['ancho'] ?? 100)),
                        'alto' => floatval($jsonData['alto'] ?? ($_POST['alto'] ?? 50)),
                        'unidad_medida' => $jsonData['unidad_medida'] ?? ($_POST['unidad_medida'] ?? 'mm'),
                        'descripcion' => trim($jsonData['descripcion'] ?? ($_POST['descripcion'] ?? '')),
                        'es_activo' => 1,
                        'es_predeterminada' => 0,
                        'elementos_json' => !empty($jsonData['elementos']) ? json_encode($jsonData['elementos']) : ($_POST['elementos_json'] ?? '[]')
                    ];
                } else {
                    // Si hay error en el JSON, usar los datos del formulario directamente
                    $datos = [
                        'nombre' => trim($_POST['nombre'] ?? ''),
                        'ancho' => floatval($_POST['ancho'] ?? 100),
                        'alto' => floatval($_POST['alto'] ?? 50),
                        'unidad_medida' => $_POST['unidad_medida'] ?? 'mm',
                        'descripcion' => trim($_POST['descripcion'] ?? ''),
                        'es_activo' => 1,
                        'es_predeterminada' => 0,
                        'elementos_json' => $_POST['elementos_json'] ?? '[]'
                    ];
                }
            } else {
                // Procesar datos del formulario tradicional
                $datos = [
                    'nombre' => trim($_POST['nombre'] ?? ''),
                    'ancho' => floatval($_POST['ancho'] ?? 100),
                    'alto' => floatval($_POST['alto'] ?? 50),
                    'unidad_medida' => $_POST['unidad_medida'] ?? 'mm',
                    'descripcion' => trim($_POST['descripcion'] ?? ''),
                    'es_activo' => 1,
                    'es_predeterminada' => 0,
                    'elementos_json' => $_POST['elementos_json'] ?? '[]'
                ];
            }
            
            // Validar datos requeridos
            if (empty($datos['nombre'])) {
                throw new Exception('El nombre de la plantilla es requerido');
            }
            
            // Depuración: Mostrar datos procesados
            error_log('Datos procesados para guardar: ' . print_r($datos, true));
            
            // Intentar guardar la plantilla
            $id = $this->plantillaModel->crear($datos);
            
            if (!$id) {
                throw new Exception('Error al guardar la plantilla en la base de datos');
            }
            
            // Si se guardó correctamente, confirmar la transacción
            $this->pdo->commit();
            
            // Depuración: Guardado exitoso
            error_log('Plantilla guardada exitosamente con ID: ' . $id);
            
            // Manejar la acción según el botón presionado
            $accion = $_POST['accion'] ?? 'guardar';
            
            // Determinar la URL de redirección
            $redirectUrl = URLROOT . '/plantillas';
            $mensaje = 'Plantilla guardada correctamente.';
            
            if ($accion === 'guardar_y_disenar') {
                $redirectUrl = URLROOT . '/plantillas/disenar/' . $id;
                $mensaje = 'Plantilla guardada correctamente. Redirigiendo al diseñador...';
            } elseif ($accion === 'guardar_y_editar') {
                $redirectUrl = URLROOT . '/plantillas/editar/' . $id;
                $mensaje = 'Plantilla guardada correctamente. Puedes continuar editando.';
            }
            
            // Responder con éxito
            return $this->json([
                'success' => true,
                'id' => $id,
                'message' => $mensaje,
                'redirect' => $redirectUrl
            ]);
            
        } catch (Exception $e) {
            // Revertir cambios en caso de error
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            
            error_log('Error en PlantillaController::guardar: ' . $e->getMessage());
            return $this->json([
                'success' => false,
                'error' => 'Error al guardar la plantilla: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Mostrar formulario para editar plantilla
    public function editar($id) {
        $plantilla = $this->plantillaModel->find($id);
        
        if (!$plantilla) {
            // Si no se encuentra la plantilla, redirigir con error
            $_SESSION['mensaje'] = 'Plantilla no encontrada';
            $_SESSION['tipo_mensaje'] = 'error';
            header('Location: ' . URLROOT . '/plantillas');
            exit();
        }
        
        $this->view('plantillas/editar', [
            'titulo' => 'Editar Plantilla',
            'plantilla' => $plantilla
        ]);
    }
    
    // Actualizar plantilla existente
    public function actualizar($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Verificar que la plantilla existe
            $plantilla = $this->plantillaModel->find($id);
            if (!$plantilla) {
                $_SESSION['mensaje'] = 'Plantilla no encontrada';
                $_SESSION['tipo_mensaje'] = 'error';
                header('Location: ' . URLROOT . '/plantillas');
                exit();
            }
            
            // Procesar datos del formulario
            $datos = [
                'nombre' => trim($_POST['nombre'] ?? ''),
                'ancho' => intval($_POST['ancho'] ?? 0),
                'alto' => intval($_POST['alto'] ?? 0)
            ];
            
            // Validar datos
            $errores = $this->validarDatos($datos);
            
            if (empty($errores)) {
                // Intentar actualizar la plantilla
                if ($this->plantillaModel->update($id, $datos)) {
                    // Redirigir con mensaje de éxito
                    $_SESSION['mensaje'] = 'Plantilla actualizada correctamente';
                    $_SESSION['tipo_mensaje'] = 'exito';
                    header('Location: ' . URLROOT . '/plantillas');
                    exit();
                } else {
                    $errores[] = 'Error al actualizar la plantilla';
                }
            }
            
            // Si hay errores, volver a mostrar el formulario
            $this->view('plantillas/editar', [
                'titulo' => 'Editar Plantilla',
                'plantilla' => array_merge(['id' => $id], $datos),
                'errores' => $errores
            ]);
        } else {
            // Si no es POST, redirigir a la lista
            header('Location: ' . URLROOT . '/plantillas');
            exit();
        }
    }
    
    // Eliminar plantilla
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Verificar que la plantilla existe
            $plantilla = $this->plantillaModel->find($id);
            
            if ($plantilla) {
                // Intentar eliminar la plantilla
                if ($this->plantillaModel->delete($id)) {
                    $_SESSION['mensaje'] = 'Plantilla eliminada correctamente';
                    $_SESSION['tipo_mensaje'] = 'exito';
                } else {
                    $_SESSION['mensaje'] = 'Error al eliminar la plantilla';
                    $_SESSION['tipo_mensaje'] = 'error';
                }
            } else {
                $_SESSION['mensaje'] = 'Plantilla no encontrada';
                $_SESSION['tipo_mensaje'] = 'error';
            }
        }
        
        // Redirigir a la lista de plantillas
        header('Location: ' . URLROOT . '/plantillas');
        exit();
    }
    /**
     * Guardar elementos del diseñador y propiedades de la plantilla
     */
    public function guardarElementos($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Obtener datos del POST
            $elementos_json = $_POST['elementos'] ?? '[]';
            $nombre = $_POST['nombre'] ?? '';
            $ancho = isset($_POST['ancho']) ? (float)$_POST['ancho'] : 0;
            $alto = isset($_POST['alto']) ? (float)$_POST['alto'] : 0;
            $unidad_medida = $_POST['unidad_medida'] ?? 'mm';
            $descripcion = $_POST['descripcion'] ?? '';
            
            // Validar datos requeridos
            if (empty($nombre)) {
                $this->json(['error' => 'El nombre de la plantilla es requerido'], 400);
                return;
            }
            
            if ($ancho <= 0 || $alto <= 0) {
                $this->json(['error' => 'El ancho y alto deben ser mayores a cero'], 400);
                return;
            }
            
            // Validar que el JSON sea válido
            if (json_decode($elementos_json) === null) {
                $this->json(['error' => 'El formato de los elementos no es válido'], 400);
                return;
            }
            
            // Preparar datos para actualizar
            $datos = [
                'nombre' => $nombre,
                'ancho' => $ancho,
                'alto' => $alto,
                'unidad_medida' => $unidad_medida,
                'descripcion' => $descripcion,
                'elementos_json' => $elementos_json
            ];
            
            // Actualizar la plantilla en la base de datos
            $resultado = $this->plantillaModel->actualizar($id, $datos);
            
            if ($resultado) {
                $this->json([
                    'success' => true, 
                    'message' => 'Plantilla guardada correctamente',
                    'plantilla' => [
                        'id' => $id,
                        'nombre' => $nombre,
                        'ancho' => $ancho,
                        'alto' => $alto,
                        'unidad_medida' => $unidad_medida
                    ]
                ]);
            } else {
                $this->json(['error' => 'Error al guardar la plantilla'], 500);
            }
        } else {
            $this->json(['error' => 'Método no permitido'], 405);
        }
    }
    
    /**
     * Duplica una plantilla existente
     * 
     * @param int $id ID de la plantilla a duplicar
     * @return void
     */
    public function duplicar($id) {
        try {
            // Obtener la plantilla original
            $plantilla = $this->plantillaModel->obtenerPorId($id);
            
            if (!$plantilla) {
                // Si no se encuentra la plantilla, redirigir con mensaje de error
                $_SESSION['error'] = 'La plantilla que intentas duplicar no existe.';
                header('Location: ' . URLROOT . '/plantillas');
                exit;
            }
            
            // Crear un nuevo array con los datos de la plantilla
            $nuevaPlantilla = [
                'nombre' => 'Copia de ' . $plantilla->nombre,
                'descripcion' => $plantilla->descripcion,
                'ancho' => $plantilla->ancho,
                'alto' => $plantilla->alto,
                'elementos_json' => $plantilla->elementos_json,
                'margen_superior' => $plantilla->margen_superior,
                'margen_inferior' => $plantilla->margen_inferior,
                'margen_izquierdo' => $plantilla->margen_izquierdo,
                'margen_derecho' => $plantilla->margen_derecho,
                'espacio_entre_etiquetas' => $plantilla->espacio_entre_etiquetas,
                'filas_por_pagina' => $plantilla->filas_por_pagina,
                'columnas_por_pagina' => $plantilla->columnas_por_pagina,
                'ancho_etiqueta' => $plantilla->ancho_etiqueta,
                'alto_etiqueta' => $plantilla->alto_etiqueta,
                'unidad_medida' => $plantilla->unidad_medida,
                'orientacion' => $plantilla->orientacion,
                'tipo_papel' => $plantilla->tipo_papel,
                'categoria' => $plantilla->categoria,
                'estado' => $plantilla->estado
            ];
            
            // Insertar la nueva plantilla
            $nuevoId = $this->plantillaModel->crear($nuevaPlantilla);
            
            if ($nuevoId) {
                // Mensaje de éxito
                $_SESSION['mensaje'] = 'Plantilla duplicada correctamente.';
            } else {
                throw new Exception('Error al duplicar la plantilla');
            }
            
            // Redirigir al listado de plantillas
            header('Location: ' . URLROOT . '/plantillas');
            
        } catch (Exception $e) {
            error_log('Error al duplicar plantilla: ' . $e->getMessage());
            $_SESSION['error'] = 'Ocurrió un error al intentar duplicar la plantilla.';
            header('Location: ' . URLROOT . '/plantillas');
        }
        exit;
    }
    
    // Validar datos de la plantilla
    private function validarDatos($datos) {
        $errores = [];
        
        if (empty($datos['nombre'])) {
            $errores['nombre'] = 'El nombre es obligatorio';
        }
        
        if ($datos['ancho'] <= 0) {
            $errores['ancho'] = 'El ancho debe ser mayor que cero';
        }
        
        if ($datos['alto'] <= 0) {
            $errores['alto'] = 'El alto debe ser mayor que cero';
        }
        
        return $errores;
    }
}
