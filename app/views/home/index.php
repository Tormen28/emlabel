<?php
/**
 * Vista del dashboard principal
 * 
 * Variables disponibles:
 * - $stats: Array con estadísticas para mostrar en las tarjetas
 */
?>

<div class="row g-4">
    <!-- Tarjeta de plantillas -->
    <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                        <i class="bi bi-file-earmark-text text-primary fs-1"></i>
                    </div>
                    <div>
                        <h6 class="text-muted mb-1">Plantillas</h6>
                        <h3 class="mb-0"><?= $stats['total_plantillas'] ?? 0 ?></h3>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="/modulo/plantillas" class="btn btn-sm btn-outline-primary">
                        Ver todas <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
    
    
    <!-- Tarjeta de actividad reciente -->
    <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                        <i class="bi bi-clock-history text-info fs-1"></i>
                    </div>
                    <div>
                        <h6 class="text-muted mb-1">Actividad reciente</h6>
                        <h3 class="mb-0"><?= $stats['actividad_reciente'] ?? 0 ?></h3>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-info" data-bs-toggle="modal" data-bs-target="#activityModal">
                        Ver actividad
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Sección de plantillas recientes -->
<div class="card border-0 shadow-sm mt-4">
    <div class="card-header bg-white border-0 py-3">
        <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
                <i class="bi bi-clock-history me-2"></i> Plantillas recientes
            </h5>
            <a href="/modulo/plantillas" class="btn btn-sm btn-outline-primary">
                Ver todas <i class="bi bi-arrow-right ms-1"></i>
            </a>
        </div>
    </div>
    <div class="card-body p-0">
        <?php if (!empty($recent_plantillas)): ?>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Nombre</th>
                            <th>Tamaño</th>
                            <th>Elementos</th>
                            <th>Última modificación</th>
                            <th class="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_plantillas as $plantilla): ?>
                            <tr>
                                <td>
                                    <a href="/modulo/plantillas/editar/<?= $plantilla['id'] ?>" class="text-decoration-none">
                                        <?= htmlspecialchars($plantilla['nombre']) ?>
                                    </a>
                                </td>
                                <td><?= $plantilla['ancho'] ?>mm x <?= $plantilla['alto'] ?>mm</td>
                                <td><?= $plantilla['total_elementos'] ?></td>
                                <td><?= date('d/m/Y H:i', strtotime($plantilla['actualizado_en'])) ?></td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <a href="/modulo/plantillas/editar/<?= $plantilla['id'] ?>" class="btn btn-outline-primary" title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </a>
                                        <a href="/modulo/plantillas/eliminar/<?= $plantilla['id'] ?>" class="btn btn-outline-danger" title="Eliminar" onclick="return confirm('¿Estás seguro de eliminar esta plantilla?')">
                                            <i class="bi bi-trash"></i>
                                        </a>
                                        <button type="button" class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown">
                                            <span class="visually-hidden">Más opciones</span>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li>
                                                <a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#printModal" data-id="<?= $plantilla['id'] ?>">
                                                    <i class="bi bi-printer me-2"></i>Imprimir
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="/modulo/plantillas/duplicar/<?= $plantilla['id'] ?>">
                                                    <i class="bi bi-files me-2"></i>Duplicar
                                                </a>
                                            </li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                                <a class="dropdown-item text-danger" href="/modulo/plantillas/eliminar/<?= $plantilla['id'] ?>" onclick="return confirm('¿Estás seguro de eliminar esta plantilla?')">
                                                    <i class="bi bi-trash me-2"></i>Eliminar
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div class="text-center py-5">
                <div class="mb-3">
                    <i class="bi bi-file-earmark-text text-muted" style="font-size: 3rem;"></i>
                </div>
                <h5 class="text-muted">No hay plantillas recientes</h5>
                <p class="text-muted">Crea tu primera plantilla para comenzar</p>
                <a href="/modulo/plantillas/crear" class="btn btn-primary">
                    <i class="bi bi-plus-lg me-1"></i> Crear plantilla
                </a>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Modal de actividad reciente -->
<div class="modal fade" id="activityModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Actividad reciente</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="list-group list-group-flush">
                    <?php if (!empty($actividad_reciente)): ?>
                        <?php foreach ($actividad_reciente as $actividad): ?>
                            <div class="list-group-item border-0 px-0">
                                <div class="d-flex">
                                    <div class="flex-shrink-0 me-3">
                                        <div class="avatar-sm">
                                            <span class="avatar-title bg-soft-<?= $actividad['tipo'] ?> text-<?= $actividad['tipo'] ?> rounded-circle">
                                                <i class="bi bi-<?= $actividad['icono'] ?>"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1"><?= $actividad['titulo'] ?></h6>
                                        <p class="text-muted small mb-0"><?= $actividad['descripcion'] ?></p>
                                        <small class="text-muted">
                                            <i class="bi bi-clock me-1"></i> <?= $actividad['tiempo'] ?>
                                        </small>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="text-center py-4">
                            <i class="bi bi-inbox text-muted" style="font-size: 2.5rem;"></i>
                            <p class="text-muted mt-2 mb-0">No hay actividad reciente</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <a href="/modulo/actividad" class="btn btn-primary">Ver todo el historial</a>
            </div>
        </div>
    </div>
</div>

<!-- Modal de impresión -->
<div class="modal fade" id="printModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Imprimir plantilla</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="printForm" method="post" action="/modulo/plantillas/imprimir">
                    <input type="hidden" name="plantilla_id" id="printPlantillaId">
                    
                    <div class="mb-3">
                        <label for="printer" class="form-label">Impresora</label>
                        <select class="form-select" id="printer" name="printer_id" required>
                            <option value="" selected disabled>Seleccione una impresora</option>
                            <?php foreach ($impresoras as $impresora): ?>
                                <option value="<?= $impresora['id'] ?>"><?= htmlspecialchars($impresora['nombre']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="copies" class="form-label">Número de copias</label>
                        <input type="number" class="form-control" id="copies" name="copies" value="1" min="1" required>
                    </div>
                    
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="showPreview" name="show_preview">
                        <label class="form-check-label" for="showPreview">Mostrar vista previa antes de imprimir</label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="printForm" class="btn btn-primary">
                    <i class="bi bi-printer me-1"></i> Imprimir
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Configurar el modal de impresión
var printModal = document.getElementById('printModal');
if (printModal) {
    printModal.addEventListener('show.bs.modal', function (event) {
        var button = event.relatedTarget;
        var plantillaId = button.getAttribute('data-id');
        var modalTitle = printModal.querySelector('.modal-title');
        var plantillaName = button.closest('tr').querySelector('td:first-child').textContent.trim();
        
        modalTitle.textContent = 'Imprimir: ' + plantillaName;
        document.getElementById('printPlantillaId').value = plantillaId;
    });
}

// Inicializar tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});
</script>
