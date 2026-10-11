<?php
/**
 * Vista del diseñador de plantillas
 *
 * Muestra el lienzo del diseñador para editar una plantilla existente
 */

// Configuración de la página
$title = 'Diseñador de Plantilla';
$currentPage = 'plantillas';

// Estilos específicos para el diseñador
$styles = [
    // Bootstrap 5 CSS
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    // Bootstrap Icons
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
    // Font Awesome
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    // Estilos personalizados
    '/modulo/public/css/label-designer.css',
    '/modulo/public/css/preview-styles.css',
    '/modulo/public/css/designer.css'
];

// Scripts específicos para el diseñador
$scripts = [
    // jQuery (requerido para varios plugins)
    'https://code.jquery.com/jquery-3.7.0.min.js',
    // Bootstrap Bundle with Popper
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    // Fabric.js para el editor de etiquetas
    'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js',
    // Nuestros scripts personalizados
    '/modulo/public/js/diseñador/disecanvas.js',
    '/modulo/public/js/diseñador/diselabel-designer.js',
    '/modulo/public/js/diseñador/diseñador.js'
];

// Variables de la plantilla
$ruta_base = URLROOT; // Asume que URLROOT ya está definido
$elementos_json = !empty($elementos_plantilla) ? json_encode($elementos_plantilla) : '[]';
$plantilla_id = $plantilla->id ?? 'null';
$plantilla_nombre = htmlspecialchars($plantilla->nombre ?? 'Nueva Plantilla');
$plantilla_ancho = $plantilla->ancho ?? 100;
$plantilla_alto = $plantilla->alto ?? 50;
$plantilla_unidad_medida = htmlspecialchars($plantilla->unidad_medida ?? 'mm');
?>



<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $title; ?></title>
    
    <?php foreach ($styles as $style): ?>
        <link rel="stylesheet" href="<?php echo $style; ?>">
    <?php endforeach; ?>
</head>
<body>
<script>
    // Variables globales necesarias, pasadas desde PHP
    window.URLROOT = '<?php echo $ruta_base; ?>';
    window.elementosIniciales = <?php echo $elementos_json; ?>;
    window.plantillaId = <?php echo $plantilla_id; ?>;
    window.plantillaNombre = '<?php echo addslashes($plantilla_nombre); ?>';
    window.plantillaAncho = <?php echo $plantilla_ancho; ?>;
    window.plantillaAlto = <?php echo $plantilla_alto; ?>;
    window.plantillaUnidadMedida = '<?php echo addslashes($plantilla_unidad_medida); ?>';
</script>

<div id="sidebar">
    <div class="p-3 border-bottom">
        <h5 class="mb-0">Diseñador</h5>
    </div>
    <div class="p-3">
        <h6>Propiedades de la Plantilla</h6>
        <div class="mb-3">
            <label for="plantilla-id" class="form-label">ID</label>
            <input type="text" class="form-control form-control-sm" id="plantilla-id" value="<?php echo $plantilla_id; ?>" readonly>
        </div>
        <div class="mb-3">
            <label for="plantilla-nombre-input" class="form-label">Nombre</label>
            <input type="text" class="form-control form-control-sm" id="plantilla-nombre-input" value="<?php echo $plantilla_nombre; ?>">
        </div>
        <div class="row g-2 mb-3">
            <div class="col-6">
                <label for="plantilla-ancho-input" class="form-label">Ancho</label>
                <input type="number" class="form-control form-control-sm" id="plantilla-ancho-input" value="<?php echo $plantilla_ancho; ?>">
            </div>
            <div class="col-6">
                <label for="plantilla-alto-input" class="form-label">Alto</label>
                <input type="number" class="form-control form-control-sm" id="plantilla-alto-input" value="<?php echo $plantilla_alto; ?>">
            </div>
            <div class="col-12">
                <label for="plantilla-unidad-medida-select" class="form-label">Unidad</label>
                <select class="form-select form-select-sm" id="plantilla-unidad-medida-select">
                    <option value="mm" <?php echo ($plantilla_unidad_medida == 'mm') ? 'selected' : ''; ?>>mm</option>
                    <option value="cm" <?php echo ($plantilla_unidad_medida == 'cm') ? 'selected' : ''; ?>>cm</option>
                    <option value="in" <?php echo ($plantilla_unidad_medida == 'in') ? 'selected' : ''; ?>>in</option>
                    <option value="px" <?php echo ($plantilla_unidad_medida == 'px') ? 'selected' : ''; ?>>px</option>
                </select>
            </div>
        </div>
        <button id="aplicar-medidas-btn" class="btn btn-primary btn-sm w-100">Aplicar Medidas</button>
    </div>
    <div class="mt-auto p-3 border-top">
        <form id="guardar-plantilla-form" method="POST" action="<?php echo $ruta_base; ?>/plantillas/guardar">
            <input type="hidden" name="plantilla_id" value="<?php echo $plantilla_id; ?>">
            <input type="hidden" name="plantilla_data_json" id="plantilla-data-json">
            <button type="submit" class="btn btn-success w-100"><i class="fas fa-save me-2"></i>Guardar Plantilla</button>
        </form>
    </div>
</div>

<div id="main-content">
    <nav id="top-navbar">
        <h4 id="plantilla-nombre-display" class="mb-0"><?php echo $plantilla_nombre; ?></h4>
        <div>
            <button id="preview-btn" class="btn btn-info btn-sm me-2"><i class="fas fa-eye me-1"></i>Vista Previa</button>
            <button id="zoom-in-btn" class="btn btn-secondary btn-sm me-2"><i class="fas fa-search-plus"></i></button>
            <button id="zoom-out-btn" class="btn btn-secondary btn-sm"><i class="fas fa-search-minus"></i></button>
        </div>
    </nav>
    <div id="designer-area">
        <div id="tools-panel">
            <button id="tool-select" class="btn btn-outline-primary tool-button" title="Seleccionar">
                <i class="fas fa-mouse-pointer"></i>
            </button>
            <button id="tool-text" class="btn btn-outline-primary tool-button" title="Añadir Texto">
                <i class="fas fa-font"></i>
            </button>
            <button id="tool-image" class="btn btn-outline-primary tool-button" title="Añadir Imagen">
                <i class="fas fa-image"></i>
            </button>
            <button id="tool-barcode" class="btn btn-outline-primary tool-button" title="Añadir Código de Barras">
                <i class="fas fa-barcode"></i>
            </button>
        </div>
        <div id="canvas-container">
            <canvas id="label-canvas"></canvas>
        </div>
        <div id="properties-panel">
            <div class="p-3 border-bottom">
                <h6>Propiedades del Elemento</h6>
                <span id="selected-element-info" class="text-muted small">Ningún elemento seleccionado</span>
            </div>
            <div id="propiedades-elemento-container" class="p-3 overflow-auto flex-grow-1">
                <p id="no-element-selected-message" class="text-muted text-center my-3">Selecciona un elemento para ver sus propiedades.</p>
            </div>
            <div class="p-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6>Capas</h6>
                    <div>
                        <button id="layer-up-btn" class="btn btn-sm btn-outline-secondary" title="Mover arriba">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button id="layer-down-btn" class="btn btn-sm btn-outline-secondary" title="Mover abajo">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </div>
                <div id="layers-panel" class="list-group list-group-flush">
                    <p class="text-muted text-center my-3">No hay elementos</p>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="previewModal" tabindex="-1" aria-labelledby="previewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="previewModalLabel">Vista Previa de la Plantilla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
                <div id="previewCanvasContainer" class="d-inline-block">
                    <canvas id="preview-canvas" style="border: 1px solid #eee; background-color: #fff;"></canvas>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
        </div>
    </div>
</div>



<!-- Cargar scripts en orden -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

<!-- Cargar scripts locales -->
<script>
    // Función para cargar scripts en orden
    function loadScripts(scripts, callback) {
        if (scripts.length === 0) {
            if (callback) callback();
            return;
        }
        
        var script = document.createElement('script');
        script.src = scripts[0];
        script.onload = function() {
            console.log('Script cargado: ' + scripts[0]);
            loadScripts(scripts.slice(1), callback);
        };
        script.onerror = function() {
            console.error('Error al cargar el script: ' + scripts[0]);
            loadScripts(scripts.slice(1), callback);
        };
        document.head.appendChild(script);
    }

    // Scripts locales a cargar en orden
    var localScripts = [
        '/modulo/public/js/diseñador/disecanvas.js',
        '/modulo/public/js/diseñador/diselabel-designer.js',
        '/modulo/public/js/diseñador/diseñador.js'
    ];

    // Iniciar la carga de scripts
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM completamente cargado, iniciando carga de scripts...');
        loadScripts(localScripts, function() {
            console.log('Todos los scripts se han cargado correctamente');
            // Asegurarse de que todo esté listo
            if (typeof DisenadorPlantillas !== 'undefined') {
                console.log('DisenadorPlantillas está disponible');
            } else {
                console.error('Error: DisenadorPlantillas no está definido');
            }
        });
    });
</script>

</body>
</html>