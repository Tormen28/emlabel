<?php
/**
 * Vista para listar plantillas
 * 
 * Variables disponibles:
 * - $plantillas: Array de plantillas
 * - $paginacion: Datos de paginación
 * - $filtros: Filtros aplicados
 */
?>

<!-- Encabezado con título y botón de crear -->
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2><i class="bi bi-file-earmark-text me-2"></i> Plantillas de Etiquetas</h2>
    <a href="/modulo/plantillas/crear" class="btn btn-primary">
        <i class="bi bi-plus-lg me-1"></i> Nueva Plantilla
    </a>
</div>

<!-- Filtros de búsqueda -->
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body">
        <form method="get" action="/modulo/plantillas" class="row g-3">
            <div class="col-md-5">
                <label for="buscar" class="form-label">Buscar</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="buscar" name="buscar" 
                           value="<?= htmlspecialchars($filtros['buscar'] ?? '') ?>" 
                           placeholder="Buscar por nombre...">
                    <button class="btn btn-outline-secondary" type="submit">
                        <i class="bi bi-search"></i>
                    </button>
                </div>
            </div>
            
            <div class="col-md-3">
                <label for="orden" class="form-label">Ordenar por</label>
                <select class="form-select" id="orden" name="orden">
                    <option value="fecha_desc" <?= ($filtros['orden'] ?? '') === 'fecha_desc' ? 'selected' : '' ?>>Más recientes primero</option>
                    <option value="fecha_asc" <?= ($filtros['orden'] ?? '') === 'fecha_asc' ? 'selected' : '' ?>>Más antiguos primero</option>
                    <option value="nombre_asc" <?= ($filtros['orden'] ?? '') === 'nombre_asc' ? 'selected' : '' ?>>Nombre (A-Z)</option>
                    <option value="nombre_desc" <?= ($filtros['orden'] ?? '') === 'nombre_desc' ? 'selected' : '' ?>>Nombre (Z-A)</option>
                </select>
            </div>
            
            <div class="col-md-2">
                <label for="por_pagina" class="form-label">Mostrar</label>
                <select class="form-select" id="por_pagina" name="por_pagina" onchange="this.form.submit()">
                    <option value="10" <?= ($filtros['por_pagina'] ?? 10) == 10 ? 'selected' : '' ?>>10</option>
                    <option value="25" <?= ($filtros['por_pagina'] ?? 10) == 25 ? 'selected' : '' ?>>25</option>
                    <option value="50" <?= ($filtros['por_pagina'] ?? 10) == 50 ? 'selected' : '' ?>>50</option>
                    <option value="100" <?= ($filtros['por_pagina'] ?? 10) == 100 ? 'selected' : '' ?>>100</option>
                </select>
            </div>
            
            <div class="col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary me-2">
                    <i class="bi bi-funnel me-1"></i> Filtrar
                </button>
                <a href="/modulo/plantillas" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </a>
            </div>
        </form>
    </div>
</div>

<!-- Lista de plantillas -->
<?php if (!empty($plantillas)): ?>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <?php foreach ($plantillas as $plantilla): ?>
            <div class="col">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <a href="<?= URLROOT ?>/plantillas/editar/<?= $plantilla['id'] ?>" class="text-decoration-none">
                                    <?= htmlspecialchars($plantilla['nombre']) ?>
                                </a>
                            </h5>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary rounded-circle" type="button" 
                                        data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <a class="dropdown-item" href="<?= URLROOT ?>/plantillas/disenador/<?= $plantilla['id'] ?>" title="Abrir en el diseñador">
                                            <i class="bi bi-brush me-2"></i>Diseñar
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="/modulo/plantillas/duplicar/<?= $plantilla['id'] ?>">
                                            <i class="bi bi-files me-2"></i>Duplicar
                                        </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item text-danger" href="#" 
                                           onclick="confirmarEliminar(<?= $plantilla['id'] ?>, '<?= htmlspecialchars(addslashes($plantilla['nombre'])) ?>')">
                                            <i class="bi bi-trash me-2"></i>Eliminar
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-light p-2 rounded me-3" style="width: 100px; height: 70px; position: relative;">
                                <div style="
                                    position: absolute;
                                    top: 5px; right: 5px; bottom: 5px; left: 5px;
                                    border: 1px dashed #999;
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 0.8rem; color: #666;
                                ">
                                    <?= $plantilla['ancho'] ?> × <?= $plantilla['alto'] ?> mm
                                </div>
                            </div>
                            <div>
                                <div class="text-muted small mb-1">
                                    <i class="bi bi-grid-3x3-gap me-1"></i> 
                                    <?= $plantilla['total_elementos'] ?> elementos
                                    <?php 
                                    if (!empty($plantilla['elementos_json'])) {
                                        $elementos = json_decode($plantilla['elementos_json'], true);
                                        if (is_array($elementos) && count($elementos) > 0) {
                                            echo '<div class="mt-1">';
                                            $tipos = [];
                                            foreach ($elementos as $elemento) {
                                                $tipo = $elemento['type'] ?? 'desconocido';
                                                if (!isset($tipos[$tipo])) {
                                                    $tipos[$tipo] = 0;
                                                }
                                                $tipos[$tipo]++;
                                            }
                                            foreach ($tipos as $tipo => $cantidad) {
                                                $icono = '';
                                                switch($tipo) {
                                                    case 'barcode':
                                                        $icono = '<i class="bi bi-upc-scan"></i>';
                                                        $tipo = 'Código';
                                                        break;
                                                    case 'text':
                                                        $icono = '<i class="bi bi-text-paragraph"></i>';
                                                        $tipo = 'Texto';
                                                        break;
                                                    case 'image':
                                                        $icono = '<i class="bi bi-image"></i>';
                                                        $tipo = 'Imagen';
                                                        break;
                                                    default:
                                                        $icono = '<i class="bi bi-square"></i>';
                                                }
                                                echo '<span class="badge bg-light text-dark me-1 mb-1" title="' . ucfirst($tipo) . '">' . $icono . ' ' . $cantidad . '</span>';
                                            }
                                            echo '</div>';
                                        }
                                    }
                                    ?>
                                </div>
                                <div class="text-muted small">
                                    <i class="bi bi-clock me-1"></i> 
                                    <?php 
                                    $fecha = !empty($plantilla['actualizado_en']) ? $plantilla['actualizado_en'] : ($plantilla['fecha_creacion'] ?? null);
                                    echo $fecha ? date('d/m/Y H:i', strtotime($fecha)) : 'N/A'; 
                                    ?>
                                </div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="text-muted small" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="<?= htmlspecialchars($plantilla['descripcion'] ?? '') ?>">
                                <?php if (!empty($plantilla['descripcion'])): ?>
                                    <?= htmlspecialchars(mb_substr($plantilla['descripcion'], 0, 30) . (mb_strlen($plantilla['descripcion']) > 30 ? '...' : '')) ?>
                                <?php else: ?>
                                    <span class="text-muted">Sin descripción</span>
                                <?php endif; ?>
                            </div>
                            <div class="btn-group">
                                <a class="dropdown-item" href="<?= URLROOT ?>/plantillas/disenador/<?= $plantilla['id'] ?>" class="btn btn-sm btn-outline-secondary" title="Diseñador">
                                    <i class="bi bi-palette"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    
    <!-- Paginación -->
    <?php if (isset($paginacion) && $paginacion['total_paginas'] > 1): ?>
        <nav class="mt-4">
            <ul class="pagination justify-content-center">
                <!-- Mostrar total de registros -->
                <li class="page-item disabled">
                    <span class="page-link">
                        Total: <?= $paginacion['total_registros'] ?> plantillas
                    </span>
                </li>
                
                <!-- Primera página -->
                <li class="page-item <?= $paginacion['pagina_actual'] == 1 ? 'disabled' : '' ?>">
                    <a class="page-link" href="?pagina=1<?= $paginacion['query_string'] ?>" aria-label="Primera">
                        <i class="bi bi-chevron-double-left"></i>
                    </a>
                </li>
                
                <!-- Página anterior -->
                <li class="page-item <?= $paginacion['pagina_actual'] == 1 ? 'disabled' : '' ?>">
                    <a class="page-link" href="?pagina=<?= $paginacion['pagina_anterior'] . $paginacion['query_string'] ?>" aria-label="Anterior">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
                
                <!-- Indicador de páginas si hay muchas -->
                <?php if ($paginacion['pagina_actual'] > 3): ?>
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                <?php endif; ?>
                
                <!-- Páginas adyacentes -->
                <?php 
                $inicio = max(1, $paginacion['pagina_actual'] - 2);
                $fin = min($paginacion['total_paginas'], $paginacion['pagina_actual'] + 2);
                
                for ($i = $inicio; $i <= $fin; $i++): ?>
                    <li class="page-item <?= $i == $paginacion['pagina_actual'] ? 'active' : '' ?>">
                        <a class="page-link" href="?pagina=<?= $i . $paginacion['query_string'] ?>">
                            <?= $i ?>
                        </a>
                    </li>
                <?php endfor; ?>
                
                <!-- Indicador de páginas si hay muchas -->
                <?php if ($paginacion['pagina_actual'] < $paginacion['total_paginas'] - 2): ?>
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                <?php endif; ?>
                
                <!-- Página siguiente -->
                <li class="page-item <?= $paginacion['pagina_actual'] >= $paginacion['total_paginas'] ? 'disabled' : '' ?>">
                    <a class="page-link" href="?pagina=<?= $paginacion['pagina_siguiente'] . $paginacion['query_string'] ?>" aria-label="Siguiente">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
                
                <!-- Última página -->
                <li class="page-item <?= $paginacion['pagina_actual'] >= $paginacion['total_paginas'] ? 'disabled' : '' ?>">
                    <a class="page-link" href="?pagina=<?= $paginacion['total_paginas'] . $paginacion['query_string'] ?>" aria-label="Última">
                        <i class="bi bi-chevron-double-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
    <?php endif; ?>
    
<?php else: ?>
    <!-- Mensaje cuando no hay plantillas -->
    <div class="text-center py-5">
        <div class="mb-3">
            <i class="bi bi-file-earmark-text text-muted" style="font-size: 3rem;"></i>
        </div>
        <h5 class="text-muted">No se encontraron plantillas</h5>
        <p class="text-muted">
            <?php if (!empty($filtros['buscar'])): ?>
                No hay resultados para "<?= htmlspecialchars($filtros['buscar']) ?>".
                <a href="/modulo/plantillas" class="ms-1">Limpiar búsqueda</a>
            <?php else: ?>
                Crea tu primera plantilla para comenzar
            <?php endif; ?>
        </p>
        <a href="/modulo/plantillas/crear" class="btn btn-primary mt-2">
            <i class="bi bi-plus-lg me-1"></i> Crear plantilla
        </a>
    </div>
<?php endif; ?>

<!-- Modal de confirmación de eliminación -->
<div class="modal fade" id="deleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirmar eliminación</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>¿Estás seguro de que deseas eliminar la plantilla <strong id="plantillaNombre"></strong>?</p>
                <p class="text-danger">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <form id="deleteForm" method="post" action="">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Eliminar
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>


<script>
// Configurar el modal de eliminación
function confirmarEliminar(id, nombre) {
    var modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    document.getElementById('plantillaNombre').textContent = nombre;
    document.getElementById('deleteForm').action = '/modulo/plantillas/eliminar/' + id;
    modal.show();
}

// Inicializar tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});
</script>
