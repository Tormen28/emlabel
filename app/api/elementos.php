<?php
// app/api/elementos.php

// Incluir configuración y modelos
require_once __DIR__ . '/../core/App.php';
require_once __DIR__ . '/../modules/ElementoPlantilla.php';
require_once __DIR__ . '/../modules/Plantilla.php';

// Configurar cabeceras para respuesta JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar solicitudes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Obtener la ruta solicitada
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri_segments = explode('/', trim($request_uri, '/'));

// Obtener IDs de la URL
$elemento_id = null;
$plantilla_id = null;

// El formato esperado es /api/elementos[/plantilla_id[/elemento_id]]
if (isset($uri_segments[3]) && is_numeric($uri_segments[3])) {
    $plantilla_id = (int)$uri_segments[3];
    
    if (isset($uri_segments[4]) && is_numeric($uri_segments[4])) {
        $elemento_id = (int)$uri_segments[4];
    }
}

try {
    // Inicializar modelos
    $elementoModel = new ElementoPlantilla();
    $plantillaModel = new Plantilla();
    
    // Procesar la solicitud según el método HTTP
    switch ($method) {
        case 'GET':
            // Obtener elementos de una plantilla o un elemento específico
            if ($plantilla_id) {
                // Verificar que la plantilla existe
                $plantilla = $plantillaModel->find($plantilla_id);
                if (!$plantilla) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Plantilla no encontrada'
                    ]);
                    exit();
                }
                
                if ($elemento_id) {
                    // Obtener un elemento específico
                    $elemento = $elementoModel->find($elemento_id);
                    
                    if ($elemento && $elemento['plantilla_id'] == $plantilla_id) {
                        echo json_encode([
                            'success' => true,
                            'data' => $elemento
                        ]);
                    } else {
                        http_response_code(404);
                        echo json_encode([
                            'success' => false,
                            'error' => 'Elemento no encontrado o no pertenece a esta plantilla'
                        ]);
                    }
                } else {
                    // Obtener todos los elementos de la plantilla
                    $elementos = $elementoModel->getByPlantillaId($plantilla_id);
                    echo json_encode([
                        'success' => true,
                        'data' => $elementos
                    ]);
                }
            } else {
                // No se proporcionó ID de plantilla
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere el ID de la plantilla'
                ]);
            }
            break;
            
        case 'POST':
            // Crear un nuevo elemento
            if (!$plantilla_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere el ID de la plantilla'
                ]);
                exit();
            }
            
            // Verificar que la plantilla existe
            $plantilla = $plantillaModel->find($plantilla_id);
            if (!$plantilla) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Plantilla no encontrada'
                ]);
                exit();
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Datos no proporcionados'
                ]);
                exit();
            }
            
            // Validar datos requeridos
            $errores = [];
            if (empty($data['tipo'])) {
                $errores['tipo'] = 'El tipo de elemento es obligatorio';
            }
            
            // Validar posición y dimensiones
            $camposNumericos = ['posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];
            foreach ($camposNumericos as $campo) {
                if (isset($data[$campo]) && !is_numeric($data[$campo])) {
                    $errores[$campo] = 'Debe ser un valor numérico';
                }
            }
            
            if (!empty($errores)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $errores
                ]);
                exit();
            }
            
            // Preparar datos
            $datosElemento = [
                'plantilla_id' => $plantilla_id,
                'tipo' => $data['tipo'],
                'contenido' => $data['contenido'] ?? '',
                'posicion_x' => (float)($data['posicion_x'] ?? 0),
                'posicion_y' => (float)($data['posicion_y'] ?? 0),
                'ancho' => (float)($data['ancho'] ?? 100),
                'alto' => (float)($data['alto'] ?? 50),
                'rotacion' => (float)($data['rotacion'] ?? 0)
            ];
            
            // Crear el elemento
            $id = $elementoModel->create($datosElemento);
            
            if ($id) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'id' => $id,
                    'message' => 'Elemento creado correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al crear el elemento'
                ]);
            }
            break;
            
        case 'PUT':
            // Actualizar un elemento existente
            if (!$plantilla_id || !$elemento_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Se requieren los IDs de plantilla y elemento'
                ]);
                exit();
            }
            
            // Verificar que el elemento existe y pertenece a la plantilla
            $elemento = $elementoModel->find($elemento_id);
            if (!$elemento || $elemento['plantilla_id'] != $plantilla_id) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Elemento no encontrado o no pertenece a esta plantilla'
                ]);
                exit();
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Datos no proporcionados'
                ]);
                exit();
            }
            
            // Validar datos
            $errores = [];
            $camposNumericos = ['posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];
            
            foreach ($camposNumericos as $campo) {
                if (isset($data[$campo]) && !is_numeric($data[$campo])) {
                    $errores[$campo] = 'Debe ser un valor numérico';
                }
            }
            
            if (!empty($errores)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $errores
                ]);
                exit();
            }
            
            // Preparar datos para actualizar
            $datosActualizados = [];
            $camposPermitidos = ['tipo', 'contenido', 'posicion_x', 'posicion_y', 'ancho', 'alto', 'rotacion'];
            
            foreach ($camposPermitidos as $campo) {
                if (array_key_exists($campo, $data)) {
                    $datosActualizados[$campo] = is_numeric($data[$campo]) ? (float)$data[$campo] : $data[$campo];
                }
            }
            
            if (empty($datosActualizados)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'No se proporcionaron datos para actualizar'
                ]);
                exit();
            }
            
            // Actualizar el elemento
            $actualizado = $elementoModel->update($elemento_id, $datosActualizados);
            
            if ($actualizado) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Elemento actualizado correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al actualizar el elemento'
                ]);
            }
            break;
            
        case 'DELETE':
            // Eliminar un elemento
            if (!$plantilla_id || !$elemento_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Se requieren los IDs de plantilla y elemento'
                ]);
                exit();
            }
            
            // Verificar que el elemento existe y pertenece a la plantilla
            $elemento = $elementoModel->find($elemento_id);
            if (!$elemento || $elemento['plantilla_id'] != $plantilla_id) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Elemento no encontrado o no pertenece a esta plantilla'
                ]);
                exit();
            }
            
            // Eliminar el elemento
            $eliminado = $elementoModel->delete($elemento_id);
            
            if ($eliminado) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Elemento eliminado correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al eliminar el elemento'
                ]);
            }
            break;
            
        default:
            // Método no permitido
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Método no permitido'
            ]);
            break;
    }
    
} catch (Exception $e) {
    // Manejar errores
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
