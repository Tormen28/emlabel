/**
 * Diseñador de Plantillas
 * Maneja la lógica del diseñador de plantillas
 */

// Definir la clase global para el diseñador
window.DisenadorPlantillas = class DisenadorPlantillas {
    constructor(options = {}) {
        // Configuración por defecto
        this.config = {
            canvasId: 'label-canvas',
            containerId: 'designer-container', // No usado directamente en este contexto actual, pero útil
            plantillaId: null,
            plantillaNombre: 'Nueva Plantilla',
            plantillaAncho: 100, // Ancho predeterminado en mm
            plantillaAlto: 50,  // Alto predeterminado en mm
            unidadMedida: 'mm',  // Unidad de medida predeterminada
            elementosIniciales: []
        };

        // Fusionar opciones pasadas con la configuración por defecto
        Object.assign(this.config, options);

        // Verificar que LabelDesigner esté disponible
        if (typeof LabelDesigner === 'undefined') {
            console.error('LabelDesigner no está definido. Asegúrate de que el script se haya cargado correctamente.');
            return;
        }

        // Inicializar la instancia de LabelDesigner globalmente
        // Esto permite que otras partes del código accedan a ella
        window.labelDesigner = new LabelDesigner(this.config.canvasId, {
            width: this.config.plantillaAncho,
            height: this.config.plantillaAlto,
            unit: this.config.unidadMedida,
            initialElements: this.config.elementosIniciales
        });

        // Verificar que la inicialización fue exitosa
        if (!window.labelDesigner) {
            console.error('No se pudo inicializar LabelDesigner');
            return;
        }

        // Elementos del DOM (cachear para rendimiento)
        this.canvasWrapper = document.getElementById('canvas-container');
        this.plantillaNombreInput = document.getElementById('plantilla-nombre-input');
        this.plantillaAnchoInput = document.getElementById('plantilla-ancho-input');
        this.plantillaAltoInput = document.getElementById('plantilla-alto-input');
        this.plantillaUnidadMedidaSelect = document.getElementById('plantilla-unidad-medida-select');
        this.plantillaNombreDisplay = document.getElementById('plantilla-nombre-display');
        this.plantillaIdDisplay = document.getElementById('plantilla-id');
        this.propiedadesElementoContainer = document.getElementById('propiedades-elemento-container');
        this.noElementSelectedMessage = document.getElementById('no-element-selected-message');
        this.selectedElementInfoSpan = document.getElementById('selected-element-info');
        this.layersPanel = document.getElementById('layers-panel');
        this.guardarForm = document.getElementById('guardar-plantilla-form');
        this.plantillaDataJsonInput = document.getElementById('plantilla-data-json');
        this.previewModalCanvas = document.getElementById('preview-canvas');

        this.setupPlantillaPropertiesListeners();
        this.setupToolListeners();
        this.setupZoomListeners();
        this.setupSaveForm();
        this.setupPreviewModal();
        this.setupDeleteKeyListener(); // Añadir listener para la tecla Supr/Delete

        // Establecer los valores iniciales en la UI
        this.plantillaNombreInput.value = this.config.plantillaNombre;
        this.plantillaAnchoInput.value = this.config.plantillaAncho;
        this.plantillaAltoInput.value = this.config.plantillaAlto;
        this.plantillaUnidadMedidaSelect.value = this.config.unidadMedida;
        this.plantillaNombreDisplay.textContent = this.config.plantillaNombre;
        this.plantillaIdDisplay.value = this.config.plantillaId;

        // Sobrescribir el método updatePropertiesPanel de LabelDesigner
        // para que apunte a la implementación de DisenadorPlantillas
        window.labelDesigner.updatePropertiesPanel = this.updatePropertiesPanel.bind(this);
        window.labelDesigner.renderLayersPanel = this.renderLayersPanel.bind(this);

        // Renderizar propiedades y capas inicialmente
        window.labelDesigner.updatePropertiesPanel(window.labelDesigner.selectedElement);
        window.labelDesigner.renderLayersPanel();

        console.log('DisenadorPlantillas inicializado.');
    }

    // Configura los listeners para las propiedades de la plantilla (ancho, alto, etc.)
    setupPlantillaPropertiesListeners() {
        const aplicarMedidasBtn = document.getElementById('aplicar-medidas-btn');
        if (aplicarMedidasBtn) {
            aplicarMedidasBtn.addEventListener('click', () => {
                const newWidth = parseFloat(this.plantillaAnchoInput.value);
                const newHeight = parseFloat(this.plantillaAltoInput.value);
                const newUnit = this.plantillaUnidadMedidaSelect.value;
                const newName = this.plantillaNombreInput.value.trim();

                if (isNaN(newWidth) || newWidth <= 0 || isNaN(newHeight) || newHeight <= 0) {
                    this.mostrarMensaje('danger', 'El ancho y alto deben ser números positivos.');
                    return;
                }

                this.config.plantillaAncho = newWidth;
                this.config.plantillaAlto = newHeight;
                this.config.unidadMedida = newUnit;
                this.config.plantillaNombre = newName;

                window.labelDesigner.updatePlantillaSize(newWidth, newHeight, newUnit);
                this.plantillaNombreDisplay.textContent = newName;
                this.mostrarMensaje('success', 'Medidas y nombre de la plantilla aplicados.');
            });
        }
    }

    // Configura los listeners para los botones de herramientas (texto, imagen, etc.)
    setupToolListeners() {
        document.getElementById('tool-select')?.addEventListener('click', () => {
            if (window.labelDesigner) {
                // Modo de selección, Fabric.js lo maneja por defecto
                this.setActiveTool('tool-select');
            }
        });

        document.getElementById('tool-text')?.addEventListener('click', () => {
            if (window.labelDesigner) {
                const x = window.labelDesigner.canvas.width / 4;
                const y = window.labelDesigner.canvas.height / 4;
                window.labelDesigner.agregarElemento('text', {
                    x: x, y: y,
                    content: 'Doble click para editar',
                    styles: { fontSize: 24, fill: '#000', fontFamily: 'Arial' }
                });
                this.setActiveTool('tool-select'); // Vuelve al modo selección después de añadir
            }
        });

        document.getElementById('tool-image')?.addEventListener('click', () => {
            if (window.labelDesigner) {
                const x = window.labelDesigner.canvas.width / 4;
                const y = window.labelDesigner.canvas.height / 4;
                window.labelDesigner.agregarElemento('image', {
                    x: x, y: y, width: 80, height: 80,
                    src: `${window.URLROOT}/public/img/placeholder.png` // Asegúrate de que esta imagen exista
                });
                this.setActiveTool('tool-select'); // Vuelve al modo selección después de añadir
            }
        });

        document.getElementById('tool-barcode')?.addEventListener('click', () => {
            if (window.labelDesigner) {
                const x = window.labelDesigner.canvas.width / 4;
                const y = window.labelDesigner.canvas.height / 4;
                window.labelDesigner.agregarElemento('barcode', {
                    x: x, y: y, width: 150, height: 80, content: '123456789012',
                    properties: { barcodeType: 'CODE128', displayValue: true }
                });
                this.setActiveTool('tool-select'); // Vuelve al modo selección después de añadir
            }
        });

        // Controlar el cambio de herramienta activa visualmente
        document.querySelectorAll('.nav-tools .btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.nav-tools .btn').forEach(innerBtn => {
                    innerBtn.classList.remove('active', 'btn-primary');
                    innerBtn.classList.add('btn-outline-primary');
                });
                this.classList.add('active', 'btn-primary');
                this.classList.remove('btn-outline-primary');
            });
        });

        // Asegurarse de que el botón de selección esté activo por defecto al cargar
        document.getElementById('tool-select')?.classList.add('active', 'btn-primary');
        document.getElementById('tool-select')?.classList.remove('btn-outline-primary');
    }

    // Marca la herramienta activa visualmente
    setActiveTool(toolId) {
        document.querySelectorAll('.nav-tools .btn').forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-primary');
        });
        const activeBtn = document.getElementById(toolId);
        if (activeBtn) {
            activeBtn.classList.add('active', 'btn-primary');
            activeBtn.classList.remove('btn-outline-primary');
        }
    }

    // Configura los listeners para el zoom del canvas
    setupZoomListeners() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const canvas = window.labelDesigner?.canvas;

        if (!canvas) {
            console.warn('Canvas no disponible para configurar zoom listeners.');
            return;
        }

        const ZOOM_STEP = 1.1; // Factor de zoom

        zoomInBtn?.addEventListener('click', () => {
            const newZoom = canvas.getZoom() * ZOOM_STEP;
            canvas.setZoom(newZoom);
            this.adjustCanvasWrapperScroll(newZoom);
        });

        zoomOutBtn?.addEventListener('click', () => {
            const newZoom = canvas.getZoom() / ZOOM_STEP;
            canvas.setZoom(newZoom);
            this.adjustCanvasWrapperScroll(newZoom);
        });

        // Permitir zoom con la rueda del ratón
        this.canvasWrapper?.addEventListener('wheel', (opt) => {
            opt.preventDefault();
            const delta = opt.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            canvas.setZoom(zoom);
            this.adjustCanvasWrapperScroll(zoom);
        });
    }

    // Ajusta el scroll del contenedor del canvas al hacer zoom
    adjustCanvasWrapperScroll(zoom) {
        if (!this.canvasWrapper || !window.labelDesigner || !window.labelDesigner.canvas) return;

        const canvas = window.labelDesigner.canvas;
        const width = canvas.getWidth();
        const height = canvas.getHeight();

        const zoomedWidth = width * zoom;
        const zoomedHeight = height * zoom;

        // Asegurarse de que el canvas wrapper tenga overflow: auto en CSS
        // y que el canvas esté centrado o posicionado correctamente dentro de él.
        // Fabric.js ya ajusta el tamaño del canvas elemento en el DOM.
        // Podríamos ajustar el scroll para mantener el centro de la vista, pero para simplicidad,
        // solo nos aseguramos de que el wrapper pueda mostrar el canvas completo.
    }

    // Configura el formulario de guardado
    setupSaveForm() {
        if (this.guardarForm && this.plantillaDataJsonInput) {
            this.guardarForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevenir el envío por defecto

                if (!window.labelDesigner) {
                    this.mostrarMensaje('danger', 'El diseñador no está inicializado.');
                    return;
                }

                // Asegurarse de que los elementos estén actualizados
                window.labelDesigner.updateElements();

                const designData = {
                    plantillaId: this.config.plantillaId,
                    nombre: this.plantillaNombreInput.value.trim(),
                    ancho: parseFloat(this.plantillaAnchoInput.value),
                    alto: parseFloat(this.plantillaAltoInput.value),
                    unidad_medida: this.plantillaUnidadMedidaSelect.value,
                    elementos: window.labelDesigner.exportarDiseño() // Obtener los elementos serializados
                };

                // Guardar en el campo oculto
                this.plantillaDataJsonInput.value = JSON.stringify(designData);

                // Enviar el formulario
                this.guardarForm.submit();
            });
        }
    }

    // Configura el modal de vista previa
    setupPreviewModal() {
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn && this.previewModalCanvas && window.labelDesigner) {
            previewBtn.addEventListener('click', () => {
                const previewCtx = this.previewModalCanvas.getContext('2d');
                if (!previewCtx) return;

                // Limpiar el canvas de vista previa
                previewCtx.clearRect(0, 0, this.previewModalCanvas.width, this.previewModalCanvas.height);

                // Obtener las dimensiones del canvas del diseñador
                const designerCanvas = window.labelDesigner.canvas;
                const { width, height } = window.labelDesigner.getCanvasDimensionsInPx();

                // Establecer las dimensiones del canvas de vista previa
                this.previewModalCanvas.width = width;
                this.previewModalCanvas.height = height;

                // Renderizar el contenido del canvas del diseñador en el canvas de vista previa
                // Esto crea una imagen del canvas actual.
                const imgData = designerCanvas.toDataURL({
                    format: 'png',
                    multiplier: 1 // Puedes aumentar este valor (ej. 2 o 3) para mayor resolución en la vista previa
                });

                const img = new Image();
                img.onload = () => {
                    previewCtx.drawImage(img, 0, 0, width, height);
                };
                img.src = imgData;

                // Mostrar el modal
                const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
                previewModal.show();
            });
        }
    }

    // Configura el listener para la tecla "Supr" o "Delete"
    setupDeleteKeyListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') { // Usar 'Backspace' también por compatibilidad
                if (window.labelDesigner && window.labelDesigner.selectedElement) {
                    // Evitar eliminar texto en un input o textarea
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
                        return; // No eliminar si el foco está en un campo de texto editable
                    }
                    e.preventDefault(); // Prevenir la acción por defecto (ej. navegar hacia atrás)
                    window.labelDesigner.eliminarElementoSeleccionado();
                }
            }
        });
    }

    // Función auxiliar para mostrar mensajes (alerts de Bootstrap)
    mostrarMensaje(tipo, mensaje) {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alerta.style.zIndex = '1060';
        alerta.role = 'alert';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;
        document.body.appendChild(alerta);

        // Eliminar después de 5 segundos
        setTimeout(() => {
            alerta.remove();
        }, 5000);
    }

    // Sobrescribe el método updatePropertiesPanel de LabelDesigner
    // para usar los elementos del DOM de DisenadorPlantillas
    updatePropertiesPanel(element) {
        if (!this.propiedadesElementoContainer || !this.noElementSelectedMessage || !this.selectedElementInfoSpan) {
            console.warn('Elementos del DOM de propiedades no encontrados en DisenadorPlantillas.');
            return;
        }

        if (!element) {
            this.propiedadesElementoContainer.innerHTML = ''; // Limpiar
            this.noElementSelectedMessage.style.display = 'block';
            this.selectedElementInfoSpan.textContent = 'Ningún elemento seleccionado';
            return;
        }

        this.noElementSelectedMessage.style.display = 'none';
        this.selectedElementInfoSpan.textContent = `Tipo: ${element.elementType || 'Desconocido'} (ID: ${element.elementId.substring(0, 8)}...)`;

        // Llamar al método original de LabelDesigner para generar el HTML y añadir listeners
        // Aquí es donde el LabelDesigner.prototype.updatePropertiesPanel original se ejecuta
        // pero con el contexto (this) de la instancia actual de LabelDesigner, no de DisenadorPlantillas
        // por eso en el constructor se hizo `window.labelDesigner.updatePropertiesPanel = this.updatePropertiesPanel.bind(this);`
        // para que LabelDesigner use la implementación de DisenadorPlantillas.
        // Lo que significa que el HTML se generará en LabelDesigner y luego se inyectará aquí.
        LabelDesigner.prototype.updatePropertiesPanel.call(window.labelDesigner, element);
    }

    // Sobrescribe el método renderLayersPanel de LabelDesigner
    renderLayersPanel() {
        if (!this.layersPanel) {
            console.warn('Panel de capas no encontrado en DisenadorPlantillas.');
            return;
        }
        // Llama al método original de LabelDesigner
        LabelDesigner.prototype.renderLayersPanel.call(window.labelDesigner);
    }
}

// Función para inicializar la aplicación
function inicializarAplicacion() {
    // Verificar que LabelDesigner esté disponible
    if (typeof LabelDesigner === 'undefined') {
        console.error('Error: LabelDesigner no está definido');
        return;
    }

    // Asegurarse de que las variables globales estén disponibles
    if (typeof window.plantillaId !== 'undefined') {
        new DisenadorPlantillas({
            plantillaId: window.plantillaId,
            plantillaNombre: window.plantillaNombre,
            plantillaAncho: window.plantillaAncho,
            plantillaAlto: window.plantillaAlto,
            unidadMedida: window.plantillaUnidadMedida,
            elementosIniciales: window.elementosIniciales
        });
    } else {
        console.error('Variables de plantilla no definidas. Asegúrate de que diseñador.php las pase correctamente.');
        // Si no hay plantilla, se puede inicializar con valores por defecto o redirigir
        new DisenadorPlantillas(); // Inicializar con valores por defecto
    }
}

// Inicializar la aplicación cuando el DOM esté listo y los scripts se hayan cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
    // DOM ya está listo
    inicializarAplicacion();
}

// Hacer que la función esté disponible globalmente para ser llamada manualmente si es necesario
window.inicializarAplicacion = inicializarAplicacion;