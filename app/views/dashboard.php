<?php
// Establecer el título de la página
$title = 'Inicio';
$currentPage = 'dashboard';
?>

<!-- Contenido principal -->
<div class="container mt-4">
    <div class="row">
        <div class="col-12">
            <h1 class="mb-4"><i class="bi bi-speedometer2 me-2"></i>Panel de Control</h1>
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">Bienvenido al Sistema de Gestión de Etiquetas</h5>
                    <p class="card-text">Utilice el menú de navegación para acceder a las diferentes secciones del sistema.</p>
                    
                    <div class="row mt-4">
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 border-primary">
                                <div class="card-body text-center">
                                    <i class="bi bi-file-earmark-text fs-1 text-primary mb-3"></i>
                                    <h5 class="card-title">Plantillas</h5>
                                    <p class="card-text">Administre sus plantillas de etiquetas existentes o cree nuevas.</p>
                                    <a href="/modulo/plantillas" class="btn btn-outline-primary">
                                        Ver Plantillas <i class="bi bi-arrow-right ms-1"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        
                        
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Actividad Reciente</h5>
                                </div>
                                <div class="card-body">
                                    <div class="alert alert-info mb-0">
                                        <i class="bi bi-info-circle me-2"></i>
                                        No hay actividad reciente para mostrar.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
