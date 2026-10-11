console.log('canvas.js cargado correctamente');

// Función para obtener los elementos actuales del lienzo
function obtenerElementosDelLienzo() {
    if (!window.labelDesigner) {
        console.warn('No se puede obtener elementos: LabelDesigner no está correctamente inicializado');
        return [];
    }
    
    try {
        // Asegurarse de que tenemos los elementos actuales
        const elementos = window.labelDesigner.updateElements();
        
        // Mapear a un formato serializable
        return elementos.map(elemento => ({
            id: elemento.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: elemento.type || 'text',
            x: elemento.left || 0,
            y: elemento.top || 0,
            width: (elemento.scaleX || 1) * (elemento.width || 100),
            height: (elemento.scaleY || 1) * (elemento.height || 50),
            rotation: elemento.angle || 0,
            zIndex: elemento.zIndex || 0,
            content: elemento.text || elemento.src || '',
            styles: elemento.styles || {},
            properties: {
                ...(elemento.styles || {}),
                lockMovementX: !!elemento.lockMovementX,
                lockMovementY: !!elemento.lockMovementY,
                lockRotation: !!elemento.lockRotation,
                lockScalingX: !!elemento.lockScalingX,
                lockScalingY: !!elemento.lockScalingY,
                visible: elemento.visible !== false
            }
        }));
    } catch (error) {
        console.error('Error al obtener elementos del lienzo:', error);
        return [];
    }
}

// Función para inicializar el diseñador con elementos existentes
globalThis.inicializarDiseñador = function(elementos) {
    if (!window.labelDesigner || typeof window.labelDesigner.loadElements !== 'function') {
        console.warn('No se pueden cargar elementos: LabelDesigner no está correctamente inicializado');
        return false;
    }
    
    try {
        // Verificar si hay elementos para cargar
        if (Array.isArray(elementos) && elementos.length > 0) {
            window.labelDesigner.loadElements(elementos);
            console.log('Elementos cargados en el diseñador:', elementos.length);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al inicializar el diseñador con elementos:', error);
        return false;
    }
};

// Function to safely get element by ID
function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with ID '${id}' not found`);
    return el;
}

// Function to update canvas size display
function updateCanvasSizeDisplay() {
    if (!window.labelDesigner || typeof window.labelDesigner.getCanvasSize !== 'function') {
        console.warn('LabelDesigner no está correctamente inicializado');
        return;
    }
    
    try {
        const size = window.labelDesigner.getCanvasSize();
        const widthInput = document.getElementById('canvas-width');
        const heightInput = document.getElementById('canvas-height');
        const sizeDisplay = document.getElementById('canvas-size');
        
        if (widthInput && size) widthInput.value = size.width || 800;
        if (heightInput && size) heightInput.value = size.height || 600;
        if (sizeDisplay && size) sizeDisplay.textContent = `${size.width || 800} × ${size.height || 600}px`;
    } catch (error) {
        console.error('Error al actualizar el tamaño del canvas:', error);
    }
}

// Function to update cursor position display
function updateCursorPosition(x, y) {
    if (!window.labelDesigner) return;
    
    const size = window.labelDesigner.getCanvasSize();
    const cursorPos = getElement('cursor-pos');
    
    if (cursorPos) {
        cursorPos.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)} | ${size.width} × ${size.height}px`;
    }
}

// Function to apply new canvas size
function applyNewCanvasSize() {
    if (!window.labelDesigner || typeof window.labelDesigner.setCanvasSize !== 'function') {
        console.warn('No se puede actualizar el tamaño: LabelDesigner no está correctamente inicializado');
        return;
    }
    
    try {
        const widthInput = document.getElementById('canvas-width');
        const heightInput = document.getElementById('canvas-height');
        
        if (!widthInput || !heightInput) {
            console.warn('No se encontraron los controles de tamaño');
            return;
        }
        
        const width = parseInt(widthInput.value) || 800;
        const height = parseInt(heightInput.value) || 600;
        
        // Aplicar restricciones
        const newWidth = Math.min(2000, Math.max(100, width));
        const newHeight = Math.min(2000, Math.max(100, height));
        
        // Actualizar los campos de entrada en caso de que estuvieran fuera de los límites
        widthInput.value = newWidth;
        heightInput.value = newHeight;
        
        // Actualizar el tamaño del canvas usando LabelDesigner
        window.labelDesigner.setCanvasSize(newWidth, newHeight);
        
        // Actualizar la visualización del tamaño
        updateCanvasSizeDisplay();
    } catch (error) {
        console.error('Error al aplicar el nuevo tamaño del canvas:', error);
    }
}

// Función para inicializar los controles del canvas
function inicializarControlesCanvas() {
    console.log('Inicializando controles del canvas...');
    
    // Inicializar Select2 si está disponible
    if (typeof $.fn.select2 === 'function') {
        $('.select2').select2({
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: 'Seleccione una opción',
            allowClear: true
        });
    } else {
        console.warn('Select2 no está cargado, omitiendo inicialización');
    }
    
    try {
        // Obtener el canvas y su contenedor
        const canvas = document.getElementById('label-canvas');
        if (!canvas) {
            throw new Error('No se encontró el elemento canvas');
        }

        // Verificar si el diseñador ya está inicializado
        if (!window.labelDesigner) {
            console.warn('LabelDesigner no está inicializado. Asegúrate de que label-designer.js se cargue antes que canvas.js');
            return;
        }
        
        // Obtener el contenedor del canvas para el zoom
        const canvasContainer = canvas.parentElement;
        
        // Set up zoom controls
        const zoomInBtn = document.getElementById('btn-zoom-in');
        const zoomOutBtn = document.getElementById('btn-zoom-out');
        const zoomFitBtn = document.getElementById('btn-fit');
        const zoomDisplay = document.createElement('span');
        zoomDisplay.className = 'ms-2';
        
        // Add zoom display next to zoom buttons
        if (zoomInBtn && zoomInBtn.parentNode) {
            zoomInBtn.parentNode.appendChild(zoomDisplay);
        }
        
        // Set up size controls
        const widthInput = document.getElementById('canvas-width');
        const heightInput = document.getElementById('canvas-height');
        const applySizeBtn = document.getElementById('btn-apply-size');
        
        let zoomLevel = 1;
        let isFitToScreen = false;
        
        function updateZoom() {
            // Update zoom display
            zoomDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
            
            // Apply zoom transform to canvas container
            if (canvasContainer) {
                canvasContainer.style.transform = `scale(${zoomLevel})`;
                canvasContainer.style.transformOrigin = 'top left';
                
                // Adjust container size to match zoomed canvas
                const canvas = document.getElementById('label-canvas');
                if (canvas) {
                    canvasContainer.style.width = `${canvas.width}px`;
                    canvasContainer.style.height = `${canvas.height}px`;
                }
            }
            
            updateCursorPosition(0, 0);
        }
        
        // Zoom controls - only add if elements exist
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                isFitToScreen = false;
                zoomLevel = Math.min(zoomLevel + 0.2, 3);
                updateZoom();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                isFitToScreen = false;
                zoomLevel = Math.max(zoomLevel - 0.2, 0.3);
                updateZoom();
            });
        }
        
        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => {
                const container = canvasContainer.parentElement;
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const canvas = document.getElementById('label-canvas');
                    if (canvas) {
                        const scaleX = (containerRect.width - 40) / canvas.width;
                        const scaleY = (containerRect.height - 40) / canvas.height;
                        zoomLevel = Math.min(scaleX, scaleY, 3);
                        isFitToScreen = true;
                        updateZoom();
                    }
                }
            });
        }
        
        // Handle zoom with mouse wheel
        if (canvasContainer) {
            canvasContainer.addEventListener('wheel', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const delta = -Math.sign(e.deltaY) * 0.1;
                    zoomLevel = Math.min(Math.max(zoomLevel + delta, 0.3), 3);
                    isFitToScreen = false;
                    updateZoom();
                }
            }, { passive: false });
        }
        
        // Size controls
        function handleSizeInput(e) {
            if (e.key === 'Enter') {
                applyNewCanvasSize();
            }
        }
        
        // Only add event listeners if elements exist
        if (widthInput && heightInput) {
            // Evento para Enter en los campos de entrada
            [widthInput, heightInput].forEach(input => {
                input.addEventListener('keypress', handleSizeInput);
                // Actualizar también cuando cambia el valor (no solo con Enter)
                input.addEventListener('change', applyNewCanvasSize);
            });
        }
        
        // Botón de aplicar tamaño
        if (applySizeBtn) {
            applySizeBtn.addEventListener('click', applyNewCanvasSize);
        }
        
        // Asegurarse de que el canvas sea interactivo
        if (canvas) {
            canvas.style.cursor = 'default';
            canvas.style.touchAction = 'none';
        }
        
        // Initial updates
        updateZoom();
        updateCanvasSizeDisplay();
        
        // Initial fit to screen
        if (zoomFitBtn) {
            zoomFitBtn.click();
        }
        
        // Set up cursor position tracking
        if (canvas) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / (zoomLevel || 1);
                const y = (e.clientY - rect.top) / (zoomLevel || 1);
                updateCursorPosition(x, y);
                
                // Update cursor style based on position
                if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
                    canvas.style.cursor = 'crosshair';
                } else {
                    canvas.style.cursor = 'default';
                }
            });
            
            canvas.addEventListener('mouseleave', () => {
                const size = window.labelDesigner.getCanvasSize();
                const cursorPos = getElement('cursor-pos');
                if (cursorPos) {
                    cursorPos.textContent = `X: 0, Y: 0 | ${size.width} × ${size.height}px`;
                }
            });
            
            // Update canvas size display when it changes
            const observer = new MutationObserver(updateCanvasSizeDisplay);
            observer.observe(canvas, { attributes: true, attributeFilter: ['style'] });
        }
        
        console.log('Diseñador inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar el diseñador:', error);
    }


    // Initialize dimension inputs if they exist
    const anchoInput = document.getElementById('ancho');
    const altoInput = document.getElementById('alto');

    if (anchoInput && altoInput) {
        // Function to update preview when dimensions change
        function handleDimensionChange() {
            actualizarVistaPrevia();
        }
        
        // Agregar event listeners para cambios en las dimensiones
        anchoInput.addEventListener('change', handleDimensionChange);
        altoInput.addEventListener('change', handleDimensionChange);
        
        // Actualizar vista previa inicial
        actualizarVistaPrevia();
    }
    
    // Hacer la función obtenerElementosDelLienzo disponible globalmente
    if (typeof window !== 'undefined') {
        window.obtenerElementosDelLienzo = obtenerElementosDelLienzo;
    }
}

// Function to update preview
function actualizarVistaPrevia() {
    // Usar document.getElementById en lugar de jQuery para evitar dependencias
    const anchoInput = document.getElementById('ancho');
    const altoInput = document.getElementById('alto');
    const previewDimensions = document.getElementById('preview-dimensions');
    const preview = document.getElementById('preview');
    
    if (!anchoInput || !altoInput || !previewDimensions || !preview) {
        console.warn('No se encontraron los elementos necesarios para actualizar la vista previa');
        return;
    }
    
    const ancho = parseFloat(anchoInput.value) || 0;
    const alto = parseFloat(altoInput.value) || 0;
    
    // Actualizar etiqueta de dimensiones
    if (previewDimensions) {
        previewDimensions.textContent = ancho + ' x ' + alto + ' mm';
    }
    
    // Calcular relación de aspecto para la vista previa
    const maxAncho = 300; // Ancho máximo de la vista previa en píxeles
    const relacion = ancho > 0 && alto > 0 ? ancho / alto : 1;
    
    let previewAncho, previewAlto;
    
    if (ancho > alto) {
        previewAncho = maxAncho;
        previewAlto = maxAncho / relacion;
    } else {
        previewAlto = maxAncho;
        previewAncho = maxAncho * relacion;
    }
    
    // Aplicar dimensiones a la vista previa
    if (preview) {
        preview.style.width = previewAncho + 'px';
        preview.style.height = previewAlto + 'px';
    }
}

// Implementación segura de obtenerElementosDelLienzo si no está definida
if (typeof window.obtenerElementosDelLienzo !== 'function') {
    window.obtenerElementosDelLienzo = function() {
        console.warn('Función obtenerElementosDelLienzo no está disponible');
        return [];
    };
}

// Variable global para el estado del diseñador
let elementosDiseño = [];
// labelDesigner ahora se maneja en diseñador.php para evitar conflictos

// Función para inicializar el diseñador
function inicializarAplicacion() {
    console.log('Inicializando aplicación...');
    console.log('obtenerElementosDelLienzo definido:', typeof obtenerElementosDelLienzo === 'function');
    
    // Inicializar el diseñador cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarDiseñadorCompleto);
    } else {
        inicializarDiseñadorCompleto();
    }
}

// Función para inicializar el diseñador
function inicializarDiseñadorCompleto() {
    console.log('Inicializando diseñador...');
    
    // Verificar si hay elementos en el DOM para cargar
    const elementosJson = document.getElementById('elementos-json');
    if (elementosJson && elementosJson.value) {
        try {
            elementosDiseño = JSON.parse(elementosJson.value);
            if (typeof inicializarDiseñador === 'function') {
                inicializarDiseñador(elementosDiseño);
            }
        } catch (e) {
            console.error('Error al cargar los elementos del diseño:', e);
        }
    }
    
    // Manejador para el botón de guardar diseño
    document.getElementById('btn-guardar-diseno').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Obtener el estado actual del lienzo
        const elementos = obtenerElementosDelLienzo();
        
        // Actualizar el campo oculto con los elementos serializados
        document.getElementById('elementos-json').value = JSON.stringify(elementos);
        
        // Actualizar el nombre de la plantilla si se ha modificado
        const nombrePlantilla = document.getElementById('template-name').value.trim();
        if (nombrePlantilla) {
            document.querySelector('input[name="nombre"]').value = nombrePlantilla;
        }
        
        // Mostrar carga
        const btn = this;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
        
        // Enviar el formulario
        const form = document.getElementById('form-plantilla');
        const formData = new FormData(form);
        
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('success', 'Plantilla guardada correctamente');
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                throw new Error(data.error || 'Error al guardar la plantilla');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('danger', error.message || 'Error al guardar la plantilla');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
    });
    
    // Inicializar el PreviewManager
    const previewManager = new PreviewManager(document.getElementById('label-canvas'));
    
    // Manejador para el botón de vista previa
    document.getElementById('btn-export').addEventListener('click', function(e) {
        e.preventDefault();
        // Actualizar los elementos en el PreviewManager
        const elementos = obtenerElementosDelLienzo();
        previewManager.updateElements(elementos);
        // Mostrar el modal de vista previa
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
    });
    
    // Función auxiliar para mostrar mensajes
    function mostrarMensaje(tipo, mensaje) {
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
}

// Inicializar controles del canvas cuando el DOM esté listo
// Solo inicializar si no estamos en la página del diseñador
if (!window.location.pathname.includes('diseñador') && !window.location.pathname.includes('disenador')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarControlesCanvas);
    } else {
        // El DOM ya está listo
        inicializarControlesCanvas();
    }

    // Inicializar la aplicación
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarAplicacion);
    } else {
        // El DOM ya está listo
        inicializarAplicacion();
    }
}
