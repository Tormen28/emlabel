<?php
/**
 * Controlador para gestionar los elementos de plantilla
 */
class ElementoPlantillaController extends Controller {
    private $elementoModel;
    private $plantillaModel;

    /**
     * Constructor - Inicializa los modelos necesarios
     */
    public function __construct() {
        parent::__construct();
        $this->elementoModel = new ElementoPlantilla();
        $this->plantillaModel = new Plantilla();
    }

    /**
     * Obtener elementos de una plantilla (API)
     *
     * @param int $plantillaId ID de la plantilla
     */
    public function obtenerPorPlantilla($plantillaId) {
        try {
            // Validar que la plantilla existe
            $plantilla = $this->plantillaModel->find($plantillaId); // Usar 'find' consistente con el resto del código
            if (!$plantilla) {
                throw new Exception('La plantilla especificada no existe');
            }

            $elementos = $this->elementoModel->obtenerPorPlantilla($plantillaId);

            $this->json([
                'success' => true,
                'data' => $elementos
            ]);
        } catch (Exception $e) {
            $this->json([
                'success' => false,
                'error' => 'Error al obtener elementos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guarda o actualiza múltiples elementos de una plantilla en una sola operación
     * 
     * @return void
     */
    /**
     * Guarda o actualiza múltiples elementos de plantilla en una sola operación
     * 
     * @return void
     */
    public function guardarLote() {
        // Configurar cabeceras para respuesta JSON
        header('Content-Type: application/json');
        
        try {
            // Verificar conexión a la base de datos
            if (!isset($this->pdo)) {
                throw new Exception('No se pudo establecer conexión con la base de datos. Verifica la configuración de la base de datos.');
            }
            
            // Verificar que la petición sea POST
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido', 405);
            }
            
            // Obtener datos del cuerpo de la petición
            $json = file_get_contents('php://input');
            if ($json === false) {
                throw new Exception('No se pudieron leer los datos de la petición');
            }
            
            $data = json_decode($json, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Error al decodificar el JSON: ' . json_last_error_msg());
            }
            
            // Validar datos requeridos
            if (!isset($data['plantilla_id']) || !is_numeric($data['plantilla_id'])) {
                throw new Exception('Se requiere un ID de plantilla válido');
            }
            
            $plantillaId = (int)$data['plantilla_id'];
            $elementos = $data['elementos'] ?? [];
            
            if (!is_array($elementos)) {
                throw new Exception('El formato de los elementos no es válido');
            }
            
            // Iniciar transacción
            if (!$this->pdo->beginTransaction()) {
                throw new Exception('No se pudo iniciar la transacción con la base de datos');
            }
            
            // Validar CSRF después de verificar que podemos iniciar la transacción
            $this->validarCSRF();
            
            try {
                // Obtener IDs de elementos existentes
                $elementosExistentes = $this->elementoModel->obtenerPorPlantilla($plantillaId);
                $idsExistentes = array_column($elementosExistentes, 'id');
                $idsProcesados = [];
                $resultados = [];
                
                // Procesar cada elemento
                foreach ($elementos as $elemento) {
                    try {
                        // Validar datos básicos del elemento
                        if (empty($elemento['type'])) {
                            throw new Exception('Tipo de elemento no especificado');
                        }
                        
                        // Preparar datos del elemento para la base de datos
                        $datosElemento = [
                            'plantilla_id' => $plantillaId,
                            'tipo' => $elemento['type'],
                            'contenido' => $elemento['content'] ?? '',
                            'posicion_x' => $elemento['x'] ?? 0,
                            'posicion_y' => $elemento['y'] ?? 0,
                            'ancho' => $elemento['width'] ?? 100,
                            'alto' => $elemento['height'] ?? 50,
                            'rotacion' => $elemento['rotation'] ?? 0,
                            'z_index' => $elemento['zIndex'] ?? 0,
                            'bloqueado' => $elemento['styles']['lockMovementX'] ?? false,
                            'visible' => ($elemento['styles']['visible'] ?? true) !== false
                        ];
                        
                        // Procesar propiedades específicas del elemento
                        $propiedades = [];
                        
                        // Propiedades de estilo comunes
                        if (isset($elemento['styles']) && is_array($elemento['styles'])) {
                            $propiedades = array_merge($propiedades, [
                                'fontFamily' => $elemento['styles']['fontFamily'] ?? 'Arial',
                                'fontSize' => $elemento['styles']['fontSize'] ?? 14,
                                'fontWeight' => $elemento['styles']['fontWeight'] ?? 'normal',
                                'fill' => $elemento['styles']['fill'] ?? '#000000',
                                'textAlign' => $elemento['styles']['textAlign'] ?? 'left',
                                'lineHeight' => $elemento['styles']['lineHeight'] ?? 1.2,
                                'textBackgroundColor' => $elemento['styles']['textBackgroundColor'] ?? 'transparent',
                                'stroke' => $elemento['styles']['stroke'] ?? null,
                                'strokeWidth' => $elemento['styles']['strokeWidth'] ?? 0,
                                'shadow' => $elemento['styles']['shadow'] ?? null,
                                'backgroundColor' => $elemento['styles']['backgroundColor'] ?? 'transparent',
                                'opacity' => $elemento['styles']['opacity'] ?? 1
                            ]);
                        }
                        
                        // Propiedades específicas por tipo de elemento
                        switch ($elemento['type']) {
                            case 'text':
                                $propiedades['text'] = $elemento['text'] ?? '';
                                break;
                                
                            case 'image':
                                $propiedades['src'] = $elemento['src'] ?? '';
                                $propiedades['crossOrigin'] = $elemento['crossOrigin'] ?? null;
                                break;
                                
                            case 'barcode':
                                $propiedades['barcodeValue'] = $elemento['barcodeValue'] ?? '';
                                $propiedades['barcodeFormat'] = $elemento['barcodeFormat'] ?? 'CODE128';
                                break;
                        }
                        
                        // Asignar propiedades serializadas
                        $datosElemento['propiedades'] = $propiedades;
                        
                        // Determinar si es un elemento nuevo o existente
                        $esNuevo = empty($elemento['id']) || strpos($elemento['id'], 'temp_') === 0;
                        
                        if ($esNuevo) {
                            // Crear nuevo elemento
                            $id = $this->elementoModel->crear($datosElemento);
                            $resultados[] = [
                                'temporal_id' => $elemento['id'] ?? null, 
                                'id' => $id, 
                                'accion' => 'creado',
                                'tipo' => $elemento['type']
                            ];
                            $idsProcesados[] = $id;
                        } else {
                            // Actualizar elemento existente
                            $id = (int)$elemento['id'];
                            $this->elementoModel->actualizar($id, $datosElemento);
                            $resultados[] = [
                                'id' => $id, 
                                'accion' => 'actualizado',
                                'tipo' => $elemento['type']
                            ];
                            $idsProcesados[] = $id;
                        }
                        
                    } catch (Exception $e) {
                        // Registrar error pero continuar con los demás elementos
                        error_log('Error al procesar elemento: ' . $e->getMessage());
                        $resultados[] = [
                            'id' => $elemento['id'] ?? null,
                            'error' => $e->getMessage(),
                            'accion' => 'error'
                        ];
                    }
                }
                
                // Eliminar elementos que ya no están en la lista
                $idsAEliminar = array_diff($idsExistentes, $idsProcesados);
                if (!empty($idsAEliminar)) {
                    foreach ($idsAEliminar as $idEliminar) {
                        $this->elementoModel->eliminar($idEliminar);
                        $resultados[] = [
                            'id' => $idEliminar,
                            'accion' => 'eliminado'
                        ];
                    }
                }
                
                // Confirmar transacción
                if (!$this->pdo->commit()) {
                    throw new Exception('Error al confirmar la transacción');
                }
                
                // Devolver respuesta exitosa
                $this->json([
                    'success' => true,
                    'message' => 'Elementos guardados correctamente',
                    'data' => [
                        'procesados' => count($idsProcesados),
                        'eliminados' => count($idsAEliminar),
                        'resultados' => $resultados
                    ]
                ]);
                
            } catch (Exception $e) {
                // Revertir cambios en caso de error
                if ($this->pdo->inTransaction()) {
                    $this->pdo->rollBack();
                }
                
                // Registrar el error con más detalles
                error_log('Error en guardarLote - ' . $e->getMessage() . 
                         ' en ' . $e->getFile() . ':' . $e->getLine() . 
                         '\n' . $e->getTraceAsString());
                
                // Relanzar la excepción para que sea manejada por el bloque try-catch externo
                throw $e;
            }
            
        } catch (Exception $e) {
            // Registrar error con más detalles
            $errorMessage = 'Error en guardarLote: ' . $e->getMessage() . 
                          ' en ' . $e->getFile() . ':' . $e->getLine();
            error_log($errorMessage);
            
            // Determinar el código de estado HTTP apropiado
            $statusCode = $e->getCode() ?: 500;
            if ($statusCode < 100 || $statusCode > 599) {
                $statusCode = 500; // Asegurar que sea un código de estado HTTP válido
            }
            
            // Mensaje de error para el cliente (sin exponer detalles internos en producción)
            $clientMessage = ENVIRONMENT === 'development' 
                ? $e->getMessage() 
                : 'Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo.';
            
            // Devolver error
            $this->json([
                'success' => false,
                'error' => $clientMessage,
                'code' => $statusCode,
                'trace' => ENVIRONMENT === 'development' ? $e->getTraceAsString() : null
            ], $statusCode);
        }
    }
    
    /**
     * Guardar un nuevo elemento (API)
     */
    public function guardar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['error' => 'Método no permitido'], 405);
            return;
        }

        $datos = json_decode(file_get_contents('php://input'), true);

        // Validar datos
        $errores = $this->validarDatos($datos);
        if (!empty($errores)) {
            $this->json([
                'success' => false,
                'errores' => $errores
            ], 400);
            return;
        }

        // Preparar datos para crear
        // Asignar valores predeterminados si no se proporcionan, similar a tu código original
        $elemento = [
            'plantilla_id' => $datos['plantilla_id'],
            'tipo' => $datos['tipo'],
            'contenido' => $datos['contenido'] ?? null, // Asumimos que contenido puede ser nulo o vacío
            'posicion_x' => $datos['posicion_x'] ?? 0,
            'posicion_y' => $datos['posicion_y'] ?? 0,
            'ancho' => $datos['ancho'] ?? 100,
            'alto' => $datos['alto'] ?? 50,
            'rotacion' => $datos['rotacion'] ?? 0
        ];

        // Guardar el elemento
        $id = $this->elementoModel->create($elemento);

        if ($id) {
            $elemento['id'] = $id; // Añadir el ID al array de datos para la respuesta
            $this->json([
                'success' => true,
                'mensaje' => 'Elemento guardado correctamente',
                'data' => $elemento // Retornar los datos del elemento creado
            ]);
        } else {
            $this->json([
                'success' => false,
                'error' => 'Error al guardar el elemento'
            ], 500);
        }
    }

    /**
     * Actualizar un elemento existente (API)
     *
     * @param int $id ID del elemento a actualizar
     */
    public function actualizar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            $this->json(['error' => 'Método no permitido'], 405);
            return;
        }

        // Verificar que el elemento existe
        $elemento = $this->elementoModel->find($id);
        if (!$elemento) {
            $this->json(['error' => 'Elemento no encontrado'], 404);
            return;
        }

        // Obtener datos del cuerpo de la solicitud
        $datos = json_decode(file_get_contents('php://input'), true);

        // Validar datos, pasando el ID para posibles validaciones específicas de actualización
        $errores = $this->validarDatos($datos, $id);
        if (!empty($errores)) {
            $this->json([
                'success' => false,
                'errores' => $errores
            ], 400);
            return;
        }

        // Preparar datos para actualizar
        $datosActualizados = [];
        $camposPermitidos = ['tipo', 'contenido', 'posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];

        foreach ($camposPermitidos as $campo) {
            if (isset($datos[$campo])) {
                $datosActualizados[$campo] = $datos[$campo];
            }
        }

        // Actualizar el elemento
        $actualizado = $this->elementoModel->update($id, $datosActualizados);

        if ($actualizado) {
            // Obtener el elemento actualizado para la respuesta
            $elementoActualizado = $this->elementoModel->find($id);
            $this->json([
                'success' => true,
                'mensaje' => 'Elemento actualizado correctamente',
                'data' => $elementoActualizado
            ]);
        } else {
            $this->json([
                'success' => false,
                'error' => 'Error al actualizar el elemento'
            ], 500);
        }
    }

    /**
     * Eliminar un elemento (API)
     *
     * @param int $id ID del elemento a eliminar
     */
    public function eliminar($id) {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->json(['error' => 'Método no permitido'], 405);
            return;
        }

        // Verificar que el elemento existe
        $elemento = $this->elementoModel->find($id);
        if (!$elemento) {
            $this->json(['error' => 'Elemento no encontrado'], 404);
            return;
        }

        // Eliminar el elemento
        $eliminado = $this->elementoModel->delete($id);

        if ($eliminado) {
            $this->json([
                'success' => true,
                'mensaje' => 'Elemento eliminado correctamente'
            ]);
        } else {
            $this->json([
                'success' => false,
                'error' => 'Error al eliminar el elemento'
            ], 500);
        }
    }

    /**
     * Validar datos del elemento
     *
     * @param array $datos Array asociativo con los datos a validar.
     * @param int|null $id ID del elemento (opcional, para validaciones de actualización).
     * @return array Array de errores encontrados.
     */
    /**
     * Valida los datos de un elemento
     * 
     * @param array $datos Datos a validar
     * @param int|null $id ID del elemento (opcional)
     * @return array Errores de validación
     */
    private function validarDatos($datos, $id = null) {
        $errores = [];

        // Validar tipo
        $tiposPermitidos = ['texto', 'imagen', 'codigo_barras', 'qr', 'rectangulo', 'linea'];
        if (empty($datos['tipo']) || !in_array($datos['tipo'], $tiposPermitidos)) {
            $errores['tipo'] = 'Tipo de elemento no válido';
        }

        // Validar plantilla_id solo si se está creando o si se proporciona en la actualización
        if ($id === null || isset($datos['plantilla_id'])) {
            if (empty($datos['plantilla_id'])) {
                $errores['plantilla_id'] = 'ID de plantilla requerido';
            } elseif (!$this->plantillaModel->find($datos['plantilla_id'])) {
                $errores['plantilla_id'] = 'La plantilla especificada no existe';
            }
        }

        // Validar posición y dimensiones numéricas
        $camposNumericos = ['posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];
        foreach ($camposNumericos as $campo) {
            if (isset($datos[$campo]) && !is_numeric($datos[$campo])) {
                $errores[$campo] = 'Debe ser un valor numérico';
            }
        }

        return $errores;
    }

    /**
     * Método auxiliar para enviar respuestas JSON
     *
     * @param array $data Los datos a codificar en JSON.
     * @param int $statusCode El código de estado HTTP.
     */
    private function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }
}