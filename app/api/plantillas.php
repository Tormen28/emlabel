<?php
// app/api/plantillas.php

// Incluir configuración y modelos
require_once __DIR__ . '/../core/App.php';
require_once __DIR__ . '/../modules/Plantilla.php';
require_once __DIR__ . '/../modules/ElementoPlantilla.php';

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

// Obtener el ID de la plantilla si existe
$plantilla_id = null;
if (isset($uri_segments[3]) && is_numeric($uri_segments[3])) {
    $plantilla_id = (int)$uri_segments[3];
}

try {
    // Inicializar modelos
    $plantillaModel = new Plantilla();
    $elementoModel = new ElementoPlantilla();
    
    // Procesar la solicitud según el método HTTP
    switch ($method) {
        case 'GET':
            // Obtener todas las plantillas o una específica
            if ($plantilla_id) {
                // Obtener una plantilla específica
                $plantilla = $plantillaModel->find($plantilla_id);
                
                if ($plantilla) {
                    // Obtener elementos de la plantilla
                    $elementos = $elementoModel->getByPlantillaId($plantilla_id);
                    $plantilla['elementos'] = $elementos;
                    
                    echo json_encode([
                        'success' => true,
                        'data' => $plantilla
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Plantilla no encontrada'
                    ]);
                }
            } else {
                // Obtener todas las plantillas
                $plantillas = $plantillaModel->all();
                echo json_encode([
                    'success' => true,
                    'data' => $plantillas
                ]);
            }
            break;
            
        case 'POST':
            // Crear una nueva plantilla
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
            if (empty($data['nombre'])) {
                $errores['nombre'] = 'El nombre es obligatorio';
            }
            if (empty($data['ancho']) || !is_numeric($data['ancho'])) {
                $errores['ancho'] = 'El ancho es obligatorio y debe ser un número';
            }
            if (empty($data['alto']) || !is_numeric($data['alto'])) {
                $errores['alto'] = 'El alto es obligatorio y debe ser un número';
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
            $datosPlantilla = [
                'nombre' => $data['nombre'],
                'ancho' => (float)$data['ancho'],
                'alto' => (float)$data['alto'],
                'session_id' => $data['session_id'] ?? null
            ];
            
            // Crear la plantilla
            $id = $plantillaModel->create($datosPlantilla);
            
            if ($id) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'id' => $id,
                    'message' => 'Plantilla creada correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al crear la plantilla'
                ]);
            }
            break;
            
        case 'PUT':
            // Actualizar una plantilla existente
            if (!$plantilla_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'ID de plantilla no proporcionado'
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
            
            // Actualizar solo los campos proporcionados
            $datosActualizados = [];
            if (isset($data['nombre'])) $datosActualizados['nombre'] = $data['nombre'];
            if (isset($data['ancho'])) $datosActualizados['ancho'] = (float)$data['ancho'];
            if (isset($data['alto'])) $datosActualizados['alto'] = (float)$data['alto'];
            if (isset($data['session_id'])) $datosActualizados['session_id'] = $data['session_id'];
            
            if (empty($datosActualizados)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'No se proporcionaron datos para actualizar'
                ]);
                exit();
            }
            
            // Actualizar la plantilla
            $actualizado = $plantillaModel->update($plantilla_id, $datosActualizados);
            
            if ($actualizado) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Plantilla actualizada correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al actualizar la plantilla'
                ]);
            }
            break;
            
        case 'DELETE':
            // Eliminar una plantilla
            if (!$plantilla_id) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'ID de plantilla no proporcionado'
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
            
            // Eliminar la plantilla
            $eliminado = $plantillaModel->delete($plantilla_id);
            
            if ($eliminado) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Plantilla eliminada correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al eliminar la plantilla'
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
