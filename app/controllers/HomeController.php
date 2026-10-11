<?php
// app/controllers/HomeController.php

// Asegurarse de que el controlador base esté cargado
if (!class_exists('Controller')) {
    require_once __DIR__ . '/../core/Controller.php';
}

// Incluir el helper de sesión
require_once __DIR__ . '/../helpers/session_helper.php';

class HomeController extends Controller {
    public function index() {
        // Cargar el modelo de Plantilla
        $plantillaModel = $this->model('Plantilla');
        
        // Obtener todas las plantillas
        $plantillas = $plantillaModel->all();
        
        // Cargar la vista del dashboard
        $this->view('dashboard', [
            'titulo' => 'Inicio',
            'plantillas' => $plantillas
        ]);
    }
    
    public function about() {
        $this->view('about', [
            'titulo' => 'Acerca de',
            'version' => '1.0.0'
        ]);
    }
    
    public function error404() {
        // Establecer el código de respuesta HTTP 404
        header("HTTP/1.0 404 Not Found");
        
        $this->view('errors/404', [
            'titulo' => 'Página no encontrada'
        ]);
    }
    
    /**
     * Método para manejar el inicio de sesión
     */
    public function login() {
        // Si ya está autenticado, redirigir al dashboard
        if (isset($_SESSION['usuario'])) {
            redirect('home');
        }
        
        // Verificar si se envió el formulario
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Aquí iría la lógica de autenticación
            // Por ahora, simulamos un inicio de sesión exitoso
            $_SESSION['usuario'] = [
                'id' => 1,
                'nombre' => 'Administrador',
                'email' => 'admin@example.com',
                'rol' => 'admin'
            ];
            
            // Redirigir a la URL guardada o al dashboard
            $redirectUrl = $_SESSION['redirect_url'] ?? 'home';
            unset($_SESSION['redirect_url']);
            redirect($redirectUrl);
        } else {
            // Mostrar el formulario de inicio de sesión
            $this->view('auth/login', [
                'titulo' => 'Iniciar Sesión',
                'email' => $_POST['email'] ?? ''
            ]);
        }
    }
}
