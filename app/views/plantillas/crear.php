<?php
// Establecer el título de la página
$title = 'Diseñador de Plantillas';
$currentPage = 'plantillas';

// Agregar estilos y scripts específicos para el diseñador
$styles = [
    // Bootstrap 5 CSS
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    // Bootstrap Icons
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
    // Select2 CSS
    'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
    'https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css',
    // Estilos personalizados
    '/modulo/public/css/label-designer.css',
    // Estilos para la vista previa
    '/modulo/public/css/preview-styles.css'
];

$scripts = [
    // jQuery (requerido por Select2)
    'https://code.jquery.com/jquery-3.7.0.min.js',
    // Bootstrap Bundle with Popper
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    // Select2
    'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
    // Fabric.js para el editor de etiquetas
    'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
    // InteractJS para arrastrar y redimensionar
    'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js',
    // jsPDF para exportar a PDF
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    // JsBarcode para generar códigos de barras
    'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
    // Nuestros scripts personalizados
    '/modulo/public/js/utils/unit-converter.js',
    '/modulo/public/js/label-designer.js',
    '/modulo/public/js/canvas.js',
    '/modulo/public/js/vista-previa.js'
];
?>

<!-- Contenido principal -->
<form id="form-plantilla" method="post" action="<?php echo URLROOT; ?>/plantillas/guardar">
    <div class="container-fluid mt-3">
        <div class="row">
            <div class="col-12">
                <!-- Campo oculto para los elementos JSON -->
                <input type="hidden" name="elementos_json" id="elementos-json">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h1>
                        <i class="bi bi-tags me-2"></i>Crear Nueva Plantilla
                    </h1>
                    <div>
                        <a href="<?php echo URLROOT; ?>/plantillas" class="btn btn-outline-secondary">
                            <i class="bi bi-arrow-left me-1"></i>Volver al listado
                        </a>
                    </div>
                </div>
            
            <!-- Barra de herramientas superior -->
            <div class="card mb-3">
                <div class="card-body py-2">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <input type="text" class="form-control form-control-sm" id="template-name" placeholder="Nombre de la plantilla" style="width: 250px;">
                        </div>
                        <div class="btn-group me-2">

                         
                    
                            <button class="btn btn-sm btn-outline-secondary" id="btn-zoom-in">
                                <i class="bi bi-zoom-in"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="btn-zoom-out">
                                <i class="bi bi-zoom-out"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="btn-fit">
                                <i class="bi bi-zoom-fit"></i>
                            </button>
                        </div>
                        <div class="ms-auto">
                            <button type="button" class="btn btn-sm btn-primary me-2" id="btn-guardar-diseno">
                                <i class="bi bi-save me-1"></i>Guardar Diseño
                            </button>
                            <button class="btn btn-sm btn-success" id="btn-export">
                                <i class="bi bi-file-earmark-pdf me-1"></i>Vista Previa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row gx-2">
                <!-- Barra lateral izquierda - Herramientas -->
                <div class="col-md-2">
                    <div class="card mb-3">
                        <div class="card-header py-2">
                            <h6 class="mb-0"><i class="bi bi-tools me-2"></i>Herramientas</h6>
                        </div>
                        <div class="card-body p-2" id="toolbox">
                            <!-- Las herramientas se agregarán dinámicamente -->
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header py-2">
                            <h6 class="mb-0"><i class="bi bi-lightning-charge me-2"></i>Acciones</h6>
                        </div>
                        <div class="card-body p-2" id="actions">
                            <!-- Los botones de acción se agregarán dinámicamente -->
                        </div>
                    </div>
                </div>
                
                <!-- Área de diseño -->
                <div class="col-md-8">
                    <div class="card h-100">
                        <div class="card-header py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="bi bi-bounding-box me-2"></i>Área de diseño</h6>
                                <div class="text-muted small">
                                    <span id="cursor-position">0, 0</span> px
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0 overflow-auto" style="background-color: #f8f9fa;">
                            <div class="d-flex justify-content-between align-items-center mb-2 px-2">
                                <div class="input-group input-group-sm" style="width: 300px;">
                                    <span class="input-group-text">Ancho</span>
                                    <input type="number" id="canvas-width" class="form-control form-control-sm" value="800" min="100" max="2000">
                                    <span class="input-group-text">px</span>
                                    <span class="input-group-text">Alto</span>
                                    <input type="number" id="canvas-height" class="form-control form-control-sm" value="600" min="100" max="2000">
                                    <span class="input-group-text">px</span>
                                    <button class="btn btn-sm btn-outline-primary" id="btn-apply-size" title="Aplicar tamaño">
                                        <i class="bi bi-check-lg"></i>
                                    </button>
                                </div>
                                <div class="text-muted small">
                                    <span id="canvas-size">800 × 600px</span>
                                </div>
                            </div>
                            <div class="position-relative" style="width: 100%; height: calc(100% - 40px); min-height: 560px;">
                                <canvas id="label-canvas" width="800" height="600" 
                                        style="background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                                    Tu navegador no soporta el elemento canvas.
                                </canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Barra lateral derecha - Propiedades -->
                <div class="col-md-2">
                    <div class="card h-100">
                        <div class="card-header py-2">
                            <h6 class="mb-0"><i class="bi bi-sliders me-2"></i>Propiedades</h6>
                        </div>
                        <div class="card-body p-2" id="properties-panel">
                            <p class="text-muted small mb-0">Seleccione un elemento</p>
                        </div>
                    </div>
                </div>
            </div>                 
                                <div class="mb-3">
    <label for="nombre" class="form-label">Nombre de la plantilla</label>
    <input type="text" class="form-control" id="template-name" name="nombre" required>
</div>
<div class="mb-3">
    <label for="descripcion" class="form-label">Descripción</label>
    <textarea class="form-control" id="descripcion" name="descripcion" 
              rows="3" placeholder="Opcional: describa el propósito de esta plantilla"></textarea>
</div>                                </div>
                            </div>
                            
                            
                                
    
</div>                                </div>
                                </div>
                            </div>
                        </div>
                        
    
</div>

<!-- Modal de vista previa -->
<!-- Modal de vista previa (se puede eliminar si no se usa) -->
<div class="modal fade" id="previewModal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header bg-light border-bottom-0 pb-0">
                <div class="d-flex align-items-center w-100">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-file-earmark-pdf-fill text-primary fs-4 me-2"></i>
                        <h5 class="modal-title mb-0" id="previewModalLabel">Vista Previa del Diseño</h5>
                    </div>
                    <button type="button" class="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
            </div>
            <div class="modal-body p-0">
                <div class="row g-0">
                    <!-- Panel lateral de opciones -->
                    <div class="col-md-3 border-end">
                        <div class="h-100 d-flex flex-column">
                            <div class="p-3 border-bottom">
                                <h6 class="mb-3 fw-semibold text-uppercase text-muted small">Opciones de Exportación</h6>
                                <div id="export-options-container">
                                    <!-- Las opciones de exportación se cargarán aquí dinámicamente -->
                                </div>
                            </div>
                            <div class="p-3 mt-auto">
                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-primary" id="btn-confirm-export">
                                        <i class="bi bi-download me-2"></i>Exportar a PDF
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                        <i class="bi bi-x-lg me-2"></i>Cerrar
                                    </button>
                                </div>
                                <div class="mt-3 text-center">
                                    <div class="text-muted small">
                                        <div><i class="bi bi-zoom-in me-1"></i> Ctrl + Rueda para zoom</div>
                                        <div class="mt-1"><i class="bi bi-arrows-move me-1"></i> Arrastra para mover</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Área de vista previa -->
                    <div class="col-md-9">
                        <div class="d-flex flex-column h-100">
                            <!-- Barra de herramientas de la vista previa -->
                            <div class="border-bottom p-2 bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-primary bg-opacity-10 text-primary ms-2">
                                            <i class="bi bi-rulers me-1"></i>
                                            <span id="canvas-dimensions">0 × 0 px</span>
                                        </span>
                                        <span class="badge bg-info bg-opacity-10 text-info ms-2">
                                            <i class="bi bi-zoom-in me-1"></i>
                                            <span id="zoom-level">100%</span>
                                        </span>
                                    </div>
                                    <div>
                                        <button class="btn btn-sm btn-outline-secondary" id="btn-reset-view">
                                            <i class="bi bi-zoom-reset"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contenedor de la vista previa -->
                            <div class="preview-container flex-grow-1" style="min-height: 60vh;">
                                <div class="h-100 d-flex align-items-center justify-content-center p-4">
                                    <canvas id="preview-canvas" class="shadow"></canvas>
                                </div>
                            </div>
                            
                            <!-- Estado de la exportación -->
                            <div class="border-top p-2 bg-light">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="text-muted small" id="export-status">
                                        <i class="bi bi-info-circle me-1"></i> Listo para exportar
                                    </div>
                                    <div class="d-none" id="export-progress">
                                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                        <span class="text-muted small">Generando PDF...</span>
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
            </div>
        </div>
    </div>
</form>