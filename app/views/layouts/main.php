<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($title) ? $title . ' - ' : '' ?>Sistema de Etiquetas</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    
    <!-- Estilos personalizados -->
    <link rel="stylesheet" href="/modulo/public/css/style.css">
    
    <?php if (isset($styles)): ?>
        <?php foreach ($styles as $style): ?>
            <link rel="stylesheet" href="<?= $style ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <!-- Barra de navegación -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/modulo">
                <i class="bi bi-tags me-2"></i>Sistema de Etiquetas
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'dashboard' ? 'active' : '' ?>" href="/modulo">
                            <i class="bi bi-speedometer2 me-1"></i> Inicio
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'plantillas' ? 'active' : '' ?>" href="/modulo/plantillas">
                            <i class="bi bi-file-earmark-text me-1"></i> Plantillas
                        </a>
                    </li>
                   
                </ul>
                
                <div class="d-flex">
                    <div class="dropdown">
                        <button class="btn btn-outline-light dropdown-toggle" type="button" id="userMenu" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle me-1"></i> Usuario
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Perfil</a></li>
                            <li><a class="dropdown-item" href="#"><i class="bi bi-gear me-2"></i>Configuración</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Contenido principal -->
    <main class="container py-4">
        <!-- Encabezado de la página -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h3 mb-0">
                <?php if (isset($icon)): ?>
                    <i class="bi bi-<?= $icon ?> me-2"></i>
                <?php endif; ?>
                <?= $title ?? 'Bienvenido' ?>
            </h1>
            
            <?php if (isset($actions)): ?>
                <div class="btn-group">
                    <?= $actions ?>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- Mensajes flash -->
        <?php if (isset($_SESSION['flash_messages'])): ?>
            <?php foreach ($_SESSION['flash_messages'] as $type => $messages): ?>
                <?php foreach ($messages as $message): ?>
                    <div class="alert alert-<?= $type ?> alert-dismissible fade show">
                        <?= $message ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endforeach; ?>
            <?php endforeach; ?>
            <?php unset($_SESSION['flash_messages']); ?>
        <?php endif; ?>
        
        <!-- Contenido de la vista -->
        <?= $content ?>
    </main>

    <!-- Pie de página -->
    <footer class="bg-light py-3 mt-auto">
        <div class="container text-center text-muted">
            <small>&copy; <?= date('Y') ?> Sistema de Etiquetas. Todos los derechos reservados.</small>
        </div>
    </footer>

    <!-- Scripts -->
    <!-- jQuery must be loaded first -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" 
            integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" 
            crossorigin="anonymous"></script>
    
    <!-- jQuery (required for label designer) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Application scripts -->
    <script src="/modulo/public/js/app.js"></script>
    
    <!-- Page-specific scripts -->
    <?php if (isset($scripts)): ?>
        <?php foreach ($scripts as $script): ?>
            <?php if (is_array($script)): ?>
                <script src="<?= $script['src'] ?>" 
                        <?= isset($script['integrity']) ? 'integrity="' . $script['integrity'] . '"' : '' ?> 
                        <?= isset($script['crossorigin']) ? 'crossorigin="' . $script['crossorigin'] . '"' : '' ?>>
                </script>
            <?php else: ?>
                <script src="<?= $script ?>"></script>
            <?php endif; ?>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <script>
        // Wait for document to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize tooltips
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            // Initialize popovers
            var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl);
            });
            
            // Log jQuery version for debugging
            if (typeof jQuery !== 'undefined') {
                console.log('jQuery version:', jQuery.fn.jquery);
            } else {
                console.error('jQuery is not loaded!');
            }
        });
    </script>
</body>
</html>
