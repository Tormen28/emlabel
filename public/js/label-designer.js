/**
 * Label Designer - Main JavaScript (Refactored and Completed)
 * Handles the label designer canvas and interactions
 */
// Barcode format descriptions and validation utilities
const BarcodeUtils = {
    // Format descriptions for UI
    formatDescriptions: {
        'CODE128': 'Código 128 - Alfanumérico, longitud variable',
        'CODE39': 'Código 39 - Alfanumérico, longitud variable',
        'EAN13': 'EAN-13 - 13 dígitos numéricos',
        'EAN8': 'EAN-8 - 8 dígitos numéricos',
        'UPC': 'UPC-A - 12 dígitos numéricos',
        'ITF14': 'ITF-14 - 14 dígitos numéricos',
        'MSI': 'MSI - Solo numérico',
        'pharmacode': 'Pharmacode - Números de 3 a 131070'
    },
    
    // Validate barcode value based on format
    validateBarcodeValue: function(format, value) {
        if (!value) return false;
        const strValue = String(value).trim();
        
        // Common validation patterns
        const patterns = {
            'EAN13': /^\d{12,13}$/,
            'EAN8': /^\d{7,8}$/,
            'UPC': /^\d{11,12}$/,
            'ITF14': /^\d{14}$/,
            'MSI': /^\d+$/,
            'pharmacode': /^\d+$/ // More specific validation needed for pharmacode
        };
        
        // Check if format has specific validation
        if (patterns[format]) {
            return patterns[format].test(strValue) && this.checkBarcodeChecksum(format, strValue);
        }
        
        // Default validation for other formats
        return strValue.length > 0;
    },
    
    // Check barcode checksum if applicable
    checkBarcodeChecksum: function(format, value) {
        // Add checksum validation for formats that require it
        // This is a simplified version - you might want to implement full checksum validation
        switch(format) {
            case 'EAN13':
            case 'EAN8':
            case 'UPC':
                // These formats use a checksum digit
                return true; // Implement actual checksum validation if needed
            default:
                return true;
        }
    },
    
    // Get default value for a barcode format
    getDefaultValue: function(format) {
        const defaults = {
            'EAN13': '5901234123457',
            'EAN8': '96385074',
            'UPC': '123456789012',
            'ITF14': '12345678901231',
            'MSI': '123456',
            'pharmacode': '12345',
            'default': '1234567890'
        };
        return defaults[format] || defaults['default'];
    },
    
    // Format value according to barcode format
    formatValue: function(format, value) {
        // Add formatting (like adding spaces, dashes) if needed
        return String(value);
    }
};

class LabelDesigner {
    // ... otros métodos existentes ...

    /**
     * Actualiza la referencia a los elementos actuales
     */
    updateElements() {
        if (this.canvas) {
            this.elements = this.canvas.getObjects();
        }
        return this.elements || [];
    }

    /**
     * Guarda los elementos individualmente mediante AJAX
     * @returns {Promise<Object>} Resultado de la operación
     */
    async saveElements(plantillaId) {
        try {
            if (!plantillaId) {
                throw new Error('Se requiere el ID de la plantilla');
            }

            // Asegurarse de que tenemos los elementos actuales
            const elements = this.updateElements();
            
            // Preparar los datos para enviar
            const elementosData = elements.map(element => {
                // Extraer estilos comunes
                const styles = {
                    ...(element.styles || {}),
                    fontFamily: element.fontFamily || 'Arial',
                    fontSize: element.fontSize || 14,
                    fontWeight: element.fontWeight || 'normal',
                    fill: element.fill || '#000000',
                    textAlign: element.textAlign || 'left',
                    lineHeight: element.lineHeight || 1.2,
                    textBackgroundColor: element.textBackgroundColor || 'transparent',
                    stroke: element.stroke || null,
                    strokeWidth: element.strokeWidth || 0,
                    shadow: element.shadow || null,
                    backgroundColor: element.backgroundColor || 'transparent',
                    opacity: element.opacity !== undefined ? element.opacity : 1,
                    selectable: element.selectable !== false,
                    evented: element.evented !== false,
                    hasControls: element.hasControls !== false,
                    hasBorders: element.hasBorders !== false,
                    lockMovementX: !!element.lockMovementX,
                    lockMovementY: !!element.lockMovementY,
                    lockRotation: !!element.lockRotation,
                    lockScalingX: !!element.lockScalingX,
                    lockScalingY: !!element.lockScalingY,
                    lockUniScaling: !!element.lockUniScaling,
                    lockScalingFlip: !!element.lockScalingFlip
                };

                // Crear el objeto de datos del elemento
                return {
                    id: element.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: element.type || 'text',
                    content: element.text || element.src || '',
                    x: element.left || 0,
                    y: element.top || 0,
                    width: (element.scaleX || 1) * (element.width || 100),
                    height: (element.scaleY || 1) * (element.height || 50),
                    rotation: element.angle || 0,
                    zIndex: element.zIndex || 0,
                    styles: styles,
                    // Propiedades específicas de tipo
                    ...(element.type === 'text' && {
                        fontFamily: element.fontFamily,
                        fontSize: element.fontSize,
                        textAlign: element.textAlign,
                        text: element.text
                    }),
                    ...(element.type === 'image' && {
                        src: element.src,
                        crossOrigin: element.crossOrigin
                    }),
                    ...(element.type === 'barcode' && {
                        barcodeValue: element.barcodeValue,
                        barcodeFormat: element.barcodeFormat
                    })
                };
            });

            // Mostrar datos de depuración
            console.log('Enviando elementos al servidor:', elementosData);

            // Enviar los elementos al servidor
            const response = await fetch('/elementos/guardar-lote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    plantilla_id: plantillaId,
                    elementos: elementosData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error del servidor:', errorData);
                throw new Error(errorData.error || `Error al guardar los elementos: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Elementos guardados exitosamente:', result);
            return result;
            
        } catch (error) {
            console.error('Error al guardar elementos:', error);
            throw error;
        }
    }


    /**
     * Guarda los elementos actuales en el campo oculto del formulario
     * @deprecated Este método se mantiene por compatibilidad, pero se recomienda usar saveElements()
     */
    saveElementsToForm() {
        try {
            const elements = this.updateElements();
            const jsonInput = document.getElementById('elementos-json');
            
            if (!jsonInput) {
                console.error('No se encontró el campo oculto para guardar los elementos');
                return false;
            }

            const nombreInput = document.getElementById('template-name');
            const descripcionInput = document.getElementById('descripcion');
            const anchoInput = document.getElementById('form-ancho');
            const altoInput = document.getElementById('form-alto');

            const designData = {
                nombre: nombreInput ? nombreInput.value.trim() : 'Sin título',
                descripcion: descripcionInput ? descripcionInput.value.trim() : '',
                ancho: anchoInput ? parseInt(anchoInput.value) || 800 : 800,
                alto: altoInput ? parseInt(altoInput.value) || 600 : 600,
                unidad_medida: 'mm',
                es_activo: true,
                elementos: elements,
                fecha_creacion: new Date().toISOString()
            };

            jsonInput.value = JSON.stringify(designData);
            return true;
        } catch (error) {
            console.error('Error al guardar los elementos:', error);
            return false;
        }
    }
    // Constantes estáticas para herramientas y estilos
    static TOOL_SELECT = 'select';
    static TOOL_TEXT = 'text';
    static TOOL_IMAGE = 'image';
    static TOOL_BARCODE = 'barcode';
    static TOOL_RECTANGLE = 'rectangle';

    /**
     * Obtiene las propiedades para un tipo de elemento
     * @param {string} type - Tipo de elemento
     * @returns {Object} Definición de propiedades
     */
    static getElementProperties(type) {
        const commonProps = {
            x: { label: 'Posición X', type: 'number' },
            y: { label: 'Posición Y', type: 'number' },
            width: { label: 'Ancho', type: 'number', min: 1 },
            height: { label: 'Alto', type: 'number', min: 1 },
            opacity: {
                label: 'Opacidad',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.1,
                default: 1
            },
            rotation: {
                label: 'Rotación',
                type: 'range',
                min: 0,
                max: 360,
                step: 1,
                default: 0
            }
        };

        switch(type) {
            case this.TOOL_TEXT:
                return {
                    ...commonProps,
                    text: { label: 'Texto', type: 'text' },
                    fontSize: {
                        label: 'Tamaño de fuente',
                        type: 'number',
                        min: 8,
                        max: 72,
                        default: 14
                    },
                    fontFamily: {
                        label: 'Fuente',
                        type: 'select',
                        options: [
                            'Arial', 'Verdana', 'Times New Roman', 'Courier New',
                            'Georgia', 'Helvetica', 'Impact', 'Lucida Console'
                        ]
                    },
                    fill: { label: 'Color', type: 'color' },
                    textAlign: {
                        label: 'Alineación',
                        type: 'select',
                        options: ['left', 'center', 'right']
                    }
                };

            case this.TOOL_RECTANGLE:
                return {
                    ...commonProps,
                    fill: { label: 'Color de relleno', type: 'color' },
                    stroke: { label: 'Color de borde', type: 'color' },
                    strokeWidth: {
                        label: 'Ancho de borde',
                        type: 'number',
                        min: 0,
                        default: 1
                    },
                    rx: {
                        label: 'Radio X de esquina',
                        type: 'number',
                        min: 0,
                        default: 0
                    },
                    ry: {
                        label: 'Radio Y de esquina',
                        type: 'number',
                        min: 0,
                        default: 0
                    }
                };

            case this.TOOL_BARCODE:
                return {
                    ...commonProps,
                    value: { label: 'Valor', type: 'text' },
                    format: {
                        label: 'Formato',
                        type: 'select',
                        options: [
                            // CORRECCIÓN PRINCIPAL 1: Usar los nombres de formato correctos sin guiones
                            'CODE128', 'CODE39', 'EAN13', 'EAN8',
                            'UPC', 'ITF14', 'MSI', 'pharmacode'
                        ]
                    },
                    lineColor: {
                        label: 'Color de líneas',
                        type: 'color',
                        default: '#000000'
                    },
                    background: {
                        label: 'Color de fondo',
                        type: 'color',
                        default: '#FFFFFF'
                    },
                    displayValue: {
                        label: 'Mostrar valor',
                        type: 'checkbox',
                        default: true
                    }
                };

            case this.TOOL_IMAGE:
                return {
                    ...commonProps,
                    src: { label: 'URL de imagen', type: 'text', readonly: true }, // URL de la imagen
                    maintainAspectRatio: {
                        label: 'Mantener relación de aspecto',
                        type: 'checkbox',
                        default: true
                    }
                };

            default:
                return commonProps;
        }
    }

    static CURSORS = {
        'nw': 'nwse-resize', 'ne': 'nesw-resize', 'sw': 'nesw-resize', 'se': 'nwse-resize',
        'n': 'ns-resize', 's': 'ns-resize', 'w': 'ew-resize', 'e': 'ew-resize',
        'rotate': 'grab' // Cursor para rotación
    };

    static DEFAULT_STYLES = {
        fill: '#000000', stroke: '#000000', strokeWidth: 1,
        fontSize: 14, fontFamily: 'Arial', textAlign: 'left',
        textBaseline: 'top', opacity: 1, rotation: 0
    };

    /**
     * Crea una nueva instancia de LabelDesigner
     * @param {string} canvasId - El ID del elemento canvas
     */
    constructor(canvasId) {
        console.group('LabelDesigner Constructor');
        try {
            // Initialize canvas
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas con ID '${canvasId}' no encontrado.`);
            }

            // Initialize canvas context and dimensions
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 800;  // Increased default width
            this.canvas.height = 600; // Increased default height

            // Initialize elements and state
            this.elements = [];
            this.selectedElement = null;
            this.copiedElement = null;
            this.currentTool = LabelDesigner.TOOL_SELECT;

            // Initialize drag/drop state
            this.isDragging = false;
            this.isResizing = false;
            this.isRotating = false; // Nuevo estado para rotación
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
            this.currentResizeHandle = null;
            this.initialElementState = null; // Para guardar el estado inicial de un elemento en arrastre/redimensionamiento

            // Initialize history for undo/redo
            this.history = [];
            this.historyIndex = -1;

            // Initialize properties panel
            this.propertiesPanel = document.getElementById('properties-panel');
            if (!this.propertiesPanel) {
                console.warn('Properties panel element not found. Property editing will not work. Creating fallback.');
                // Create a fallback properties panel
                this.propertiesPanel = document.createElement('div');
                this.propertiesPanel.id = 'fallback-properties';
                this.propertiesPanel.className = 'border p-3 bg-light';
                this.propertiesPanel.style.position = 'absolute';
                this.propertiesPanel.style.right = '10px';
                this.propertiesPanel.style.top = '10px';
                this.propertiesPanel.style.width = '250px';
                this.propertiesPanel.style.maxHeight = '80vh';
                this.propertiesPanel.style.overflowY = 'auto';
                document.body.appendChild(this.propertiesPanel);
            }

            // Throttling variables for performance
            this.lastPropertyUpdate = 0;
            this.lastDraw = 0;
            this.animationFrameId = null;

            console.log('LabelDesigner initialized with canvas:', {
                width: this.canvas.width,
                height: this.canvas.height,
                hasPropertiesPanel: !!this.propertiesPanel
            });

            // Initialize the designer
            this.initialize();
        } catch (error) {
            console.error('Error initializing LabelDesigner:', error);
            throw error; // Re-throw to allow error handling by the caller
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Inicializa el diseñador de etiquetas
     */
    initialize() {
        try {
            console.group('Initializing LabelDesigner');
            
            // Configurar la interfaz de usuario primero
            this.setupUI();
            
            // Configurar los manejadores de eventos
            this.setupEventListeners();
            
            // Establecer la herramienta por defecto
            this.setTool(LabelDesigner.TOOL_SELECT);
            
            // Guardar el estado inicial
            this.saveState();
            
            // Dibujar el canvas
            this.draw();
            
            console.log('Diseñador de etiquetas inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar el diseñador de etiquetas:', error);
            // Mostrar un mensaje de error al usuario
            alert('Error al inicializar el diseñador de etiquetas. Por favor, recarga la página e inténtalo de nuevo.');
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Configura los componentes de la interfaz de usuario (caja de herramientas, etc.)
     */
    setupUI() {
        this.setupToolbox();
        this.setupActions();
        this.setTool(LabelDesigner.TOOL_SELECT); // Activar herramienta de selección por defecto
    }

    /**
     * Configura los escuchadores de eventos para el canvas y el documento
     */
    setupEventListeners() {
        // Guardar referencias a los manejadores para poder eliminarlos después
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleDoubleClick = this.handleDoubleClick.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        
        // Remover cualquier manejador existente para evitar duplicados
        this.removeEventListeners();
        
        // Eventos del ratón
        this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
        this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
        this.canvas.addEventListener('mouseup', this.boundHandleMouseUp);
        this.canvas.addEventListener('dblclick', this.boundHandleDoubleClick);

        // Eventos táctiles para soporte móvil
        // Se recomienda usar { passive: false } para preventDefault en touchstart/touchmove
        this.canvas.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.handleMouseDown(this.touchToMouseEvent(e, 'mousedown')); 
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => { 
            e.preventDefault(); 
            this.handleMouseMove(this.touchToMouseEvent(e, 'mousemove')); 
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            this.handleMouseUp(this.touchToMouseEvent(e, 'mouseup')); 
        });
        
        // Eventos de teclado
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }
    
    /**
     * Elimina los manejadores de eventos para evitar fugas de memoria
     */
    removeEventListeners() {
        if (this.boundHandleMouseDown) { // Solo si los listeners fueron inicializados
            this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
            this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
            this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
            this.canvas.removeEventListener('dblclick', this.boundHandleDoubleClick);
            document.removeEventListener('keydown', this.boundHandleKeyDown);

            // También para eventos táctiles si fueron añadidos
            // Para poder removerlos correctamente, necesitarías haber guardado las referencias a las funciones anónimas
            // o haber usado funciones nombradas/bindeadas y referenciarlas aquí.
            // Por simplicidad, si no se guardaron, no se pueden remover explícitamente aquí de esta manera.
            // Para una implementación más robusta, se recomienda guardar las referencias de las funciones de callback.
        }
    }

    /**
     * Convierte un evento táctil en un evento de ratón simulado
     */
    touchToMouseEvent(e, type) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return null; // No hay touch, no se puede simular

        // Crear un evento de ratón con coordenadas de la pantalla para compatibilidad
        // Usar clientX/Y que son comunes en MouseEvent y Touch
        return new MouseEvent(type, {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0, // Click primario
            bubbles: true,
            cancelable: true,
            composed: true,
            // Simular shiftKey si existe en el evento táctil (no nativo, pero útil para depuración si se emula)
            shiftKey: e.shiftKey || false
        });
    }

    /**
     * Configura la caja de herramientas
     */
    setupToolbox() {
        const toolbox = document.getElementById('toolbox');
        if (!toolbox) {
            console.warn('Toolbox element not found. Cannot setup tools.');
            return;
        }

        const tools = [
            { id: LabelDesigner.TOOL_SELECT, icon: 'bi-arrows-move', label: 'Seleccionar' },
            { id: LabelDesigner.TOOL_TEXT, icon: 'bi-fonts', label: 'Texto' },
            { id: LabelDesigner.TOOL_RECTANGLE, icon: 'bi-square', label: 'Rectángulo' },
            { id: LabelDesigner.TOOL_BARCODE, icon: 'bi-upc-scan', label: 'Código de Barras' },
            { id: LabelDesigner.TOOL_IMAGE, icon: 'bi-image', label: 'Imagen', isFileInput: true },
        ];

        toolbox.innerHTML = '';
        tools.forEach(tool => {
            if (tool.isFileInput) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                fileInput.id = 'image-upload-input';
                fileInput.addEventListener('change', this.handleImageUpload.bind(this));

                const button = document.createElement('label');
                button.className = 'btn btn-outline-secondary';
                button.innerHTML = `<i class="${tool.icon}"></i> ${tool.label}`;
                button.htmlFor = 'image-upload-input';
                button.dataset.tool = tool.id; // Añadir dataset.tool para el resaltado
                
                toolbox.appendChild(fileInput);
                toolbox.appendChild(button);
            } else {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-secondary';
                button.innerHTML = `<i class="${tool.icon}"></i> ${tool.label}`;
                button.dataset.tool = tool.id;
                button.addEventListener('click', () => this.setTool(tool.id));
                toolbox.appendChild(button);
            }
        });
    }

    /**
     * Configura los botones de acción (deshacer, rehacer, etc.)
     */
    setupActions() {
        const actionsContainer = document.getElementById('actions');

        // Si no existe el contenedor de acciones, mostramos un warning y salimos
        if (!actionsContainer) {
            console.warn('No se encontró el contenedor de acciones (elemento con id="actions")');
            return;
        }

        try {
            const actions = [
                { id: 'undo', icon: 'bi-arrow-counterclockwise', label: 'Deshacer', action: this.undo.bind(this) },
                { id: 'redo', icon: 'bi-arrow-clockwise', label: 'Rehacer', action: this.redo.bind(this) },
                { id: 'export-pdf', icon: 'bi-file-earmark-pdf', label: 'Exportar PDF', action: this.exportPDF.bind(this) },
                { id: 'clear', icon: 'bi-trash', label: 'Limpiar Todo', action: this.clearCanvas.bind(this) },
            ];

            // Limpiar solo si el contenedor existe
            if (actionsContainer) {
                actionsContainer.innerHTML = '';

                // Crear y agregar botones de acción
                actions.forEach(action => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.id = action.id;
                    button.className = 'btn btn-outline-primary btn-sm mb-1';
                    button.style.width = '100%';
                    button.innerHTML = `<i class="bi ${action.icon} me-1"></i> ${action.label}`;
                    button.addEventListener('click', action.action);
                    actionsContainer.appendChild(button);
                });
            }
        } catch (error) {
            console.error('Error al configurar las acciones:', error);
        }
    }

    // --- Manejadores de Eventos ---

    handleMouseDown(e) {
        console.group('handleMouseDown');
        try {
            // Prevent default to avoid text selection and other browser behaviors
            e.preventDefault();
            e.stopPropagation();

            // Get mouse position relative to canvas
            const pos = this.getMousePos(e);
            if (!pos) { // En caso de que touchToMouseEvent devuelva null
                console.warn('Invalid mouse position from event.');
                return;
            }
            console.log('Mouse down at position:', pos);

            // Store initial mouse position for drag/resize/rotate calculations
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;

            // Reset drag/resize/rotate states
            this.isDragging = false;
            this.isResizing = false;
            this.isRotating = false;
            this.currentResizeHandle = null;
            this.initialElementState = null; // Restablecer estado inicial

            // Check if clicking on rotation handle (only if element is selected and supports rotation)
            if (this.selectedElement && this.selectedElement.type !== LabelDesigner.TOOL_TEXT) {
                const rotationHandlePos = this.getRotationHandlePosition(this.selectedElement);
                if (rotationHandlePos && this.isNear(pos, rotationHandlePos, 15)) { // 15px de tolerancia
                    console.log('Rotation handle clicked.');
                    this.isRotating = true;
                    this.canvas.style.cursor = LabelDesigner.CURSORS['rotate'];

                    // Store initial rotation for calculation
                    this.initialElementState = {
                        rotation: this.selectedElement.rotation || 0,
                        centerX: this.selectedElement.x + this.selectedElement.width / 2,
                        centerY: this.selectedElement.y + this.selectedElement.height / 2
                    };
                    return; // Stop further processing for rotation
                }
            }


            // First check if we're clicking on a resize handle of the selected element
            if (this.selectedElement) {
                const handle = this.getResizeHandleAt(pos, this.selectedElement);
                if (handle) {
                    console.log('Resize handle clicked:', handle, 'on element:', {
                        id: this.selectedElement.id,
                        type: this.selectedElement.type,
                        x: this.selectedElement.x,
                        y: this.selectedElement.y,
                        width: this.selectedElement.width,
                        height: this.selectedElement.height
                    });

                    this.isResizing = true;
                    this.currentResizeHandle = handle;
                    this.canvas.style.cursor = LabelDesigner.CURSORS[handle] || 'default';

                    // Store the initial element state in case we need to revert or maintain aspect ratio
                    this.initialElementState = {
                        x: this.selectedElement.x,
                        y: this.selectedElement.y,
                        width: this.selectedElement.width,
                        height: this.selectedElement.height,
                        rotation: this.selectedElement.rotation || 0
                    };

                    console.log('Starting resize operation');
                    return; // Stop further processing for resize
                }
            }

            // Check if we're clicking on any element
            const element = this.getElementAt(pos);
            console.log('Element at click position:', element ? {
                id: element.id,
                type: element.type,
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
            } : 'No element');

            // Update selection before any other action
            this.selectElement(element);

            if (element) {
                // If we clicked on an element, prepare for dragging
                this.isDragging = true;
                this.dragOffsetX = pos.x - element.x;
                this.dragOffsetY = pos.y - element.y;

                console.log('Starting drag on element:', {
                    id: element.id,
                    type: element.type,
                    position: { x: element.x, y: element.y },
                    size: { width: element.width, height: element.height },
                    offset: { x: this.dragOffsetX, y: this.dragOffsetY }
                });

                this.canvas.style.cursor = 'move';

                // Store the initial position in case we need to revert
                this.initialElementState = {
                    x: element.x,
                    y: element.y
                };

            } else if (this.currentTool !== LabelDesigner.TOOL_SELECT) {
                // Create new element if not in select mode
                console.log('Creating new element of type:', this.currentTool);
                // createNewElement ya selecciona el elemento y guarda el estado
                this.createNewElement(this.currentTool, pos);

                // Si creamos un nuevo elemento, lo seleccionamos y lo preparamos para arrastrarlo
                const newElement = this.elements[this.elements.length - 1];
                if (newElement) {
                    this.isDragging = true;
                    // Offset para que el punto inicial del arrastre no sea la esquina del elemento
                    this.dragOffsetX = pos.x - newElement.x;
                    this.dragOffsetY = pos.y - newElement.y;
                    this.canvas.style.cursor = 'move';

                    console.log('Created and selected new element:', {
                        id: newElement.id,
                        type: newElement.type,
                        position: { x: newElement.x, y: newElement.y }
                    });
                }
            } else {
                // Clicked on empty space in select mode - clear selection
                console.log('Clicked on empty space, clearing selection');
                this.selectElement(null);
                this.canvas.style.cursor = 'default';
            }

            // Force redraw to show selection handles (or clear them)
            this.draw();
        } catch (error) {
            console.error('Error in handleMouseDown:', error);
            // Show error to user if possible
            if (this.propertiesPanel) {
                this.propertiesPanel.innerHTML = `
                    <div class="alert alert-danger p-2">
                        <strong>Error:</strong> ${error.message}
                    </div>`;
            }
            // No re-throw, handle within the event handler
        } finally {
            console.groupEnd();
        }
    }

    handleMouseMove(e) {
        // Cancel previous animation frame to prevent flickering/over-drawing
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const pos = this.getMousePos(e);
        if (!pos) return;

        const shiftKey = e.shiftKey || false;
        let cursorStyle = 'default';
        let shouldRedraw = false;
        let shouldUpdateProperties = false;

        // Actualizar la posición del cursor en la interfaz
        const cursorPosElement = document.getElementById('cursor-position');
        if (cursorPosElement) {
            cursorPosElement.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
        }

        // Manejar rotación
        if (this.isRotating && this.selectedElement && this.initialElementState) {
            const centerX = this.initialElementState.centerX;
            const centerY = this.initialElementState.centerY;

            // Calcular el ángulo entre el centro del elemento, el punto inicial del arrastre
            // y la posición actual del ratón
            const startAngle = Math.atan2(this.dragStartY - centerY, this.dragStartX - centerX);
            const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX);

            let angleDiff = (currentAngle - startAngle) * (180 / Math.PI); // Diferencia en grados

            // Normalizar el ángulo para que esté entre 0 y 360
            angleDiff = (angleDiff % 360 + 360) % 360;

            let newRotation = (this.initialElementState.rotation + angleDiff) % 360;

            // Ajustar a incrementos de 15 grados con Shift
            if (shiftKey) {
                newRotation = Math.round(newRotation / 15) * 15;
            }

            // Aplicar la nueva rotación
            this.selectedElement.rotation = newRotation;
            shouldRedraw = true;
            shouldUpdateProperties = true;
            cursorStyle = LabelDesigner.CURSORS['rotate'];

            // Actualizar dragStartX/Y para suavizar el movimiento de rotación continuo
            this.dragStartX = pos.x;
            this.dragStartY = pos.y;
        }
        // Manejar redimensionamiento
        else if (this.isResizing && this.selectedElement && this.initialElementState) {
            this.resizeElement(pos, shiftKey);
            cursorStyle = LabelDesigner.CURSORS[this.currentResizeHandle] || 'default';
            shouldRedraw = true;
            shouldUpdateProperties = true;
        }
        // Manejar arrastre
        else if (this.isDragging && this.selectedElement && this.initialElementState) {
            const gridSize = 1; // 1 para sin cuadrícula, o mayor para ajuste a cuadrícula
            
            // Asegurarse de que el elemento siempre tiene las propiedades iniciales correctas
            // al iniciar el arrastre, no se aplica directamente el offset en `pos.x/y`
            const newX = pos.x - this.dragOffsetX;
            const newY = pos.y - this.dragOffsetY;

            this.selectedElement.x = gridSize > 1
                ? Math.round(newX / gridSize) * gridSize
                : newX;

            this.selectedElement.y = gridSize > 1
                ? Math.round(newY / gridSize) * gridSize
                : newY;

            cursorStyle = 'move';
            shouldRedraw = true;
            shouldUpdateProperties = true; // Siempre actualizar propiedades al arrastrar
        }
        // Manejar estados de hover (cambio de cursor sin arrastrar/redimensionar)
        else {
            const hoverElement = this.getElementAt(pos);
            if (this.selectedElement) {
                // Verificar si se está sobre un manejador de redimensionamiento del elemento seleccionado
                const handle = this.getResizeHandleAt(pos, this.selectedElement);
                if (handle) {
                    cursorStyle = LabelDesigner.CURSORS[handle];
                } else if (this.selectedElement.type !== LabelDesigner.TOOL_TEXT) {
                    // Verificar si se está sobre el manejador de rotación
                    const rotationHandlePos = this.getRotationHandlePosition(this.selectedElement);
                    if (rotationHandlePos && this.isNear(pos, rotationHandlePos, 15)) {
                        cursorStyle = LabelDesigner.CURSORS['rotate'];
                    } else if (hoverElement === this.selectedElement) {
                        // Si se está sobre el elemento seleccionado pero no un manejador
                        cursorStyle = 'move';
                    }
                } else if (hoverElement === this.selectedElement) {
                    cursorStyle = 'move';
                }
            } else if (hoverElement) {
                cursorStyle = 'move';
            } else if (this.currentTool !== LabelDesigner.TOOL_SELECT) {
                cursorStyle = 'crosshair';
            }
            // Si no se hace nada, el cursor será 'default'
        }

        // Actualizar el estilo del cursor solo si ha cambiado
        if (this.canvas.style.cursor !== cursorStyle) {
            this.canvas.style.cursor = cursorStyle;
        }
        
        // Solicitar un nuevo frame de animación si se necesita redibujar
        if (shouldRedraw) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.draw();
                // Limitar la actualización de propiedades para mejor rendimiento
                if (shouldUpdateProperties && (!this.lastPropertyUpdate || Date.now() - this.lastPropertyUpdate > 100)) {
                    this.updatePropertiesPanel(this.selectedElement);
                    this.lastPropertyUpdate = Date.now();
                }
            });
        }
    }

    handleMouseUp(e) {
        console.group('handleMouseUp');
        try {
            if (this.isDragging || this.isResizing || this.isRotating) {
                console.log('Ending operation:', {
                    wasDragging: this.isDragging,
                    wasResizing: this.isResizing,
                    wasRotating: this.isRotating,
                    selectedElement: this.selectedElement ? {
                        type: this.selectedElement.type,
                        id: this.selectedElement.id,
                        x: this.selectedElement.x,
                        y: this.selectedElement.y,
                        width: this.selectedElement.width,
                        height: this.selectedElement.height,
                        rotation: this.selectedElement.rotation
                    } : null
                });

                // Save state after any modification operation
                this.saveState();

                // Update properties panel to reflect any changes
                if (this.selectedElement) {
                    this.updatePropertiesPanel(this.selectedElement);
                }

                // Force a redraw to update selection handles
                this.draw();
            }
        } catch (error) {
            console.error('Error in handleMouseUp:', error);
            // Show error to user if possible
            if (this.propertiesPanel) {
                this.propertiesPanel.innerHTML = `
                    <div class="alert alert-danger p-2">
                        <strong>Error:</strong> ${error.message}
                    </div>`;
            }
        } finally {
            // Always reset states, even if there was an error
            this.isDragging = false;
            this.isResizing = false;
            this.isRotating = false;
            this.currentResizeHandle = null;
            this.initialElementState = null; // Clear initial state
            // Let the next mousemove event set the cursor based on hover
            console.groupEnd();
        }
    }

    handleDoubleClick(e) {
        const pos = this.getMousePos(e);
        const element = this.getElementAt(pos);
        if (element && element.type === LabelDesigner.TOOL_TEXT) {
            this.startTextEditing(element);
        }
    }

    handleKeyDown(e) {
        // Evitar que los atajos de teclado actúen si se está editando un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedElement) {
            e.preventDefault();
            this.deleteSelectedElement();
        } else if (e.ctrlKey || e.metaKey) { // Ctrl for Windows/Linux, Meta (Cmd) for Mac
            switch (e.key.toLowerCase()) {
                case 'c': this.copySelectedElement(); e.preventDefault(); break;
                case 'v': this.pasteElement(); e.preventDefault(); break;
                case 'z': this.undo(); e.preventDefault(); break;
                case 'y': this.redo(); e.preventDefault(); break;
            }
        } else if (this.selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); // Evitar el scroll de la página
            const step = e.shiftKey ? 10 : 1; // Mover 10px con Shift, 1px sin Shift
            switch (e.key) {
                case 'ArrowUp': this.selectedElement.y -= step; break;
                case 'ArrowDown': this.selectedElement.y += step; break;
                case 'ArrowLeft': this.selectedElement.x -= step; break;
                case 'ArrowRight': this.selectedElement.x += step; break;
            }
            this.draw();
            this.updatePropertiesPanel(this.selectedElement);
            // Guardar estado después de un pequeño retraso para agrupar movimientos
            clearTimeout(this.keyMoveTimeout);
            this.keyMoveTimeout = setTimeout(() => this.saveState(), 300);
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const element = {
                    id: Date.now(),
                    type: LabelDesigner.TOOL_IMAGE,
                    x: 50, // Posición inicial por defecto
                    y: 50,
                    width: img.width,
                    height: img.height,
                    src: event.target.result,
                    image: img, // Almacenar el objeto Image
                    opacity: LabelDesigner.DEFAULT_STYLES.opacity,
                    rotation: LabelDesigner.DEFAULT_STYLES.rotation,
                    selected: true,
                    maintainAspectRatio: LabelDesigner.getElementProperties(LabelDesigner.TOOL_IMAGE).maintainAspectRatio.default,
                    // Añadir métodos getProperties y setProperty para imágenes
                    getProperties: function() {
                        return LabelDesigner.getElementProperties(LabelDesigner.TOOL_IMAGE);
                    },
                    getProperty: function(prop) {
                        return this[prop];
                    },
                    setProperty: function(prop, value) {
                        // Implementar lógica específica si es necesario (ej. para redimensionar con aspecto)
                        if (prop === 'width' && this.maintainAspectRatio) {
                            this.height = value / (this.image.width / this.image.height);
                        } else if (prop === 'height' && this.maintainAspectRatio) {
                            this.width = value * (this.image.width / this.image.height);
                        }
                        this[prop] = value;
                    }
                };

                // Ajustar el tamaño inicial si es demasiado grande para el canvas
                const maxWidth = this.canvas.width * 0.8;
                const maxHeight = this.canvas.height * 0.8;
                if (element.width > maxWidth || element.height > maxHeight) {
                    const aspectRatio = element.width / element.height;
                    if (element.width > maxWidth) {
                        element.width = maxWidth;
                        element.height = maxWidth / aspectRatio;
                    }
                    if (element.height > maxHeight) {
                        element.height = maxHeight;
                        element.width = maxHeight * aspectRatio;
                    }
                }
                
                this.elements.push(element);
                this.selectElement(element);
                this.saveState();
                this.draw();

                // Actualizar el panel de propiedades para mostrar las opciones de la imagen
                this.updatePropertiesPanel(element);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset para poder subir la misma imagen de nuevo
    }

    /**
     * Dibuja los manejadores de selección alrededor de un elemento
     * @param {Object} el - El elemento a dibujar
     */
    drawSelectionHandles(el) {
        if (!el.selected) return;

        const ctx = this.ctx;
        const handleSize = 14; // Aumentado a 14px para mejor visibilidad y usabilidad táctil
        const halfSize = handleSize / 2;
        const rotationHandleRadius = 7; // Aumentado de 5 a 7px
        const rotationHandleOffset = Math.max(el.width, el.height) / 2 + 30; // Aumentado de 20 a 30px
        
        // Configuración de estilos
        const selectionColor = '#007bff';
        const selectionFill = 'rgba(0, 123, 255, 0.1)';
        const handleFill = '#ffffff';
        const handleStroke = selectionColor;
        const handleStrokeWidth = 2;
        const shadowBlur = 4;
        const shadowColor = 'rgba(0, 0, 0, 0.5)';

        ctx.save();
        
        // Aplicar la rotación del elemento para que los manejadores también roten
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(el.rotation * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        // Dibujar fondo de selección semi-transparente
        ctx.fillStyle = selectionFill;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        
        // Dibujar borde de selección con sombra
        ctx.strokeStyle = selectionColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = shadowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        
        // Restaurar sombra para los manejadores
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        // Obtener manejadores de redimensionamiento (las coordenadas ya están relativas al elemento rotado)
        const handles = this.getHandles(el);

        // Dibujar manejadores de redimensionamiento
        handles.forEach(handle => {
            // Relleno del manejador
            ctx.fillStyle = handleFill;
            ctx.fillRect(
                handle.x - halfSize,
                handle.y - halfSize,
                handleSize,
                handleSize
            );
            
            // Borde del manejador
            ctx.strokeStyle = handleStroke;
            ctx.lineWidth = handleStrokeWidth;
            ctx.strokeRect(
                handle.x - halfSize + handleStrokeWidth/2,
                handle.y - halfSize + handleStrokeWidth/2,
                handleSize - handleStrokeWidth,
                handleSize - handleStrokeWidth
            );
            
            // Agregar efecto visual para indicar la dirección de redimensionamiento
            if (handle.name.includes('n') || handle.name.includes('s')) {
                // Línea horizontal para manejadores norte/sur
                ctx.fillStyle = handleStroke;
                ctx.fillRect(
                    handle.x - halfSize/2,
                    handle.y - 1,
                    halfSize,
                    2
                );
            }
            if (handle.name.includes('e') || handle.name.includes('w')) {
                // Línea vertical para manejadores este/oeste
                ctx.fillStyle = handleStroke;
                ctx.fillRect(
                    handle.x - 1,
                    handle.y - halfSize/2,
                    2,
                    halfSize
                );
            }
        });

        // Dibujar el punto de rotación si el elemento soporta rotación
        if (el.type !== LabelDesigner.TOOL_TEXT) { // Los textos no soportan rotación por ahora
            const rotationHandleX = centerX;
            const rotationHandleY = centerY - rotationHandleOffset;
            
            // Línea que conecta el centro con el manejador de rotación
            ctx.beginPath();
            ctx.strokeStyle = selectionColor;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(rotationHandleX, rotationHandleY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Círculo del manejador de rotación
            ctx.beginPath();
            ctx.arc(rotationHandleX, rotationHandleY, rotationHandleRadius, 0, 2 * Math.PI);
            ctx.fillStyle = handleFill;
            ctx.fill();
            ctx.strokeStyle = handleStroke;
            ctx.lineWidth = handleStrokeWidth;
            ctx.stroke();
            
            // Ícono de rotación (una flecha circular simplificada)
            ctx.beginPath();
            ctx.arc(rotationHandleX, rotationHandleY, rotationHandleRadius - 4, Math.PI * 0.25, Math.PI * 1.75);
            ctx.strokeStyle = handleStroke;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Flecha final del ícono de rotación
            const arrowAngle = Math.PI * 1.75;
            const arrowPointX = rotationHandleX + (rotationHandleRadius - 4) * Math.cos(arrowAngle);
            const arrowPointY = rotationHandleY + (rotationHandleRadius - 4) * Math.sin(arrowAngle);
            
            ctx.beginPath();
            ctx.moveTo(arrowPointX, arrowPointY);
            ctx.lineTo(arrowPointX - 5 * Math.cos(arrowAngle + Math.PI / 4), arrowPointY - 5 * Math.sin(arrowAngle + Math.PI / 4));
            ctx.lineTo(arrowPointX - 5 * Math.cos(arrowAngle - Math.PI / 4), arrowPointY - 5 * Math.sin(arrowAngle - Math.PI / 4));
            ctx.closePath();
            ctx.fillStyle = handleStroke;
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Obtiene la posición del manejador de rotación
     * @param {Object} el - El elemento
     * @returns {Object} Coordenadas x, y del manejador de rotación
     */
    getRotationHandlePosition(el) {
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;
        const rotationHandleOffset = Math.max(el.width, el.height) / 2 + 30; // Debe ser consistente con drawSelectionHandles
        
        // El manejador de rotación se dibuja "arriba" del centro del elemento rotado
        // Sus coordenadas no necesitan ser rotadas porque drawSelectionHandles ya aplica la rotación del canvas
        // antes de dibujar el manejador.
        return {
            x: centerX,
            y: centerY - rotationHandleOffset
        };
    }

    /**
     * Verifica si un punto está cerca de otro (para detectar clic en manejador)
     * @param {Object} p1 - Primer punto {x, y}
     * @param {Object} p2 - Segundo punto {x, y}
     * @param {number} tolerance - Distancia máxima para considerar "cercano"
     * @returns {boolean} True si están cerca, false en caso contrario
     */
    isNear(p1, p2, tolerance) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    /**
     * Obtiene la posición de los manejadores de redimensionamiento
     * @param {Object} el - El elemento
     * @returns {Array} Un array de objetos con las propiedades del manejador
     */
    getHandles(el) {
        const x = el.x;
        const y = el.y;
        const w = el.width;
        const h = el.height;

        // Las coordenadas de los manejadores se calculan en el espacio del elemento no rotado.
        // La rotación del canvas se encarga de posicionarlos correctamente en drawSelectionHandles.
        const handles = [
            // Esquinas
            { x: x, y: y, name: 'nw' },
            { x: x + w, y: y, name: 'ne' },
            { x: x, y: y + h, name: 'sw' },
            { x: x + w, y: y + h, name: 'se' },
            // Bordes
            { x: x + w / 2, y: y, name: 'n' },
            { x: x + w / 2, y: y + h, name: 's' },
            { x: x, y: y + h / 2, name: 'w' },
            { x: x + w, y: y + h / 2, name: 'e' }
        ];

        return handles;
    }

    /**
     * Determina si el cursor está sobre un manejador de redimensionamiento
     * @param {Object} pos - Posición del ratón (coordenadas del canvas)
     * @param {Object} el - Elemento seleccionado
     * @returns {string|null} El nombre del manejador si se encuentra, de lo contrario null
     */
    getResizeHandleAt(pos, el) {
        const handleDetectionRadius = 8; // Radio de detección para los manejadores

        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;
        const angle = -el.rotation * (Math.PI / 180); // Ángulo inverso para rotar el punto

        // Transforma las coordenadas del ratón al sistema de coordenadas del elemento no rotado
        const rotatedMouseX = (pos.x - centerX) * Math.cos(angle) - (pos.y - centerY) * Math.sin(angle) + centerX;
        const rotatedMouseY = (pos.x - centerX) * Math.sin(angle) + (pos.y - centerY) * Math.cos(angle) + centerY;

        const handles = this.getHandles(el);

        for (const handle of handles) {
            // Comprueba si el ratón rotado está dentro del área de detección del manejador
            if (this.isNear({ x: rotatedMouseX, y: rotatedMouseY }, handle, handleDetectionRadius)) {
                return handle.name;
            }
        }
        return null;
    }

    /**
     * Obtiene la posición del ratón relativa al canvas
     * @param {MouseEvent|TouchEvent} e - Evento del ratón o táctil
     * @returns {Object|null} Coordenadas x, y o null si el evento es inválido
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Asegurarse de que e.clientX/Y estén disponibles
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);

        if (clientX === undefined || clientY === undefined) {
            console.warn('Invalid event for getMousePos: clientX or clientY missing.');
            return null;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * Dibuja todos los elementos en el canvas
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.elements.forEach(el => this.drawElement(el));
        if (this.selectedElement) {
            this.drawSelectionHandles(this.selectedElement);
        }
    }

    /**
     * Dibuja un elemento individual en el canvas
     * @param {Object} el - El elemento a dibujar
     */
    drawElement(el) {
        this.ctx.save();
        this.ctx.globalAlpha = el.opacity !== undefined ? el.opacity : LabelDesigner.DEFAULT_STYLES.opacity;

        // Aplicar rotación del elemento
        if (el.rotation && el.rotation !== 0) {
            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(el.rotation * Math.PI / 180);
            this.ctx.translate(-centerX, -centerY);
        }

        switch (el.type) {
            case LabelDesigner.TOOL_TEXT:
                this.ctx.fillStyle = el.fill || LabelDesigner.DEFAULT_STYLES.fill;
                this.ctx.font = `${el.fontSize || LabelDesigner.DEFAULT_STYLES.fontSize}px ${el.fontFamily || LabelDesigner.DEFAULT_STYLES.fontFamily}`;
                this.ctx.textAlign = el.textAlign || LabelDesigner.DEFAULT_STYLES.textAlign;
                this.ctx.textBaseline = LabelDesigner.DEFAULT_STYLES.textBaseline;

                let textX = el.x;
                // Ajustar textX basado en textAlign para que el texto se dibuje dentro de su bounding box
                if (el.textAlign === 'center') textX = el.x + el.width / 2;
                if (el.textAlign === 'right') textX = el.x + el.width;

                this.ctx.fillText(el.text, textX, el.y + el.height / 2 - el.fontSize / 2); // Ajustar Y para centrar verticalmente

                // Para depuración: dibujar bounding box del texto
                // this.ctx.strokeStyle = 'red';
                // this.ctx.lineWidth = 1;
                // this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                break;
            case LabelDesigner.TOOL_RECTANGLE:
                this.ctx.fillStyle = el.fill || 'transparent';
                this.ctx.strokeStyle = el.stroke || LabelDesigner.DEFAULT_STYLES.stroke;
                this.ctx.lineWidth = el.strokeWidth || LabelDesigner.DEFAULT_STYLES.strokeWidth;

                if ((el.rx || el.ry) && (el.rx > 0 || el.ry > 0)) {
                    // Dibujar rectángulo redondeado
                    const radiusX = Math.min(el.rx || 0, el.width / 2); // Evitar que el radio sea mayor que la mitad del ancho
                    const radiusY = Math.min(el.ry || 0, el.height / 2); // Evitar que el radio sea mayor que la mitad del alto
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(el.x + radiusX, el.y);
                    this.ctx.lineTo(el.x + el.width - radiusX, el.y);
                    this.ctx.quadraticCurveTo(el.x + el.width, el.y, el.x + el.width, el.y + radiusY);
                    this.ctx.lineTo(el.x + el.width, el.y + el.height - radiusY);
                    this.ctx.quadraticCurveTo(el.x + el.width, el.y + el.height, el.x + el.width - radiusX, el.y + el.height);
                    this.ctx.lineTo(el.x + radiusX, el.y + el.height);
                    this.ctx.quadraticCurveTo(el.x, el.y + el.height, el.x, el.y + el.height - radiusY);
                    this.ctx.lineTo(el.x, el.y + radiusY);
                    this.ctx.quadraticCurveTo(el.x, el.y, el.x + radiusX, el.y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                } else {
                    // Dibujar rectángulo normal
                    this.ctx.fillRect(el.x, el.y, el.width, el.height);
                    this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                }
                break;
            case LabelDesigner.TOOL_BARCODE:
                try {
                    // CORRECCIÓN PRINCIPAL 2: Validar y normalizar el formato para JsBarcode
                    let format = el.format || 'CODE128';
                    const formatMap = {
                        'EAN-13': 'EAN13',
                        'EAN-8': 'EAN8',
                        'ITF-14': 'ITF14'
                    };
                    
                    if (formatMap[format]) {
                        format = formatMap[format]; // Convertir formato si es necesario (para datos antiguos)
                    }

                    // Crear un canvas temporal para generar el código de barras
                    const tempCanvas = document.createElement('canvas');
                    
                    // Asegurar un alto mínimo para el código de barras
                    const barcodeHeight = el.height - (el.displayValue !== false ? 20 : 0);
                    if (barcodeHeight <= 0) {
                        console.warn('Barcode height too small for rendering with display value. Skipping barcode.');
                        // Dibujar un placeholder
                        this.ctx.fillStyle = el.background || '#FFFFFF';
                        this.ctx.fillRect(el.x, el.y, el.width, el.height);
                        this.ctx.strokeStyle = '#FF0000';
                        this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                        this.ctx.fillStyle = '#000000';
                        this.ctx.font = '12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('Altura inv.', el.x + el.width / 2, el.y + el.height / 2);
                        this.ctx.restore();
                        return;
                    }
                    
                    // Configurar JsBarcode
                    JsBarcode(tempCanvas, String(el.value) || '1234567890', {
                        format: format, // Usar el formato normalizado
                        lineColor: String(el.lineColor) || '#000000',
                        background: String(el.background) || '#FFFFFF',
                        displayValue: false, // Lo manejamos manualmente para mejor control
                        width: Math.max(1, Math.floor(el.width / 100)), // Ancho de barra adaptable, asegurar al menos 1
                        height: barcodeHeight, 
                        margin: 0,
                        valid: function(valid) {
                            if (!valid) {
                                console.error('Formato de código de barras no válido o valor inválido');
                            }
                        }
                    });
                    
                    // Dibujar el código de barras en el canvas principal
                    this.ctx.drawImage(tempCanvas, el.x, el.y, el.width, barcodeHeight);
                    
                    // Si se muestra el valor, dibujarlo manualmente para un mejor control
                    if (el.displayValue !== false) {
                        this.ctx.fillStyle = el.lineColor || '#000000';
                        this.ctx.font = '12px Arial'; // Tamaño fijo para el valor
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'top'; // Alinear al top para que quede debajo del código
                        this.ctx.fillText(
                            String(el.value) || '1234567890', 
                            el.x + el.width / 2, 
                            el.y + barcodeHeight + 5 // 5px de padding
                        );
                    }
                } catch (error) {
                    console.error('Error al generar el código de barras:', error);
                    // En caso de error, mostrar un placeholder
                    this.ctx.fillStyle = el.background || '#FFFFFF';
                    this.ctx.fillRect(el.x, el.y, el.width, el.height);
                    this.ctx.strokeStyle = '#FF0000';
                    this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('Error en código de barras', el.x + el.width / 2, el.y + el.height / 2);
                }
                break;
            case LabelDesigner.TOOL_IMAGE:
                if (el.image && el.image.complete) {
                    this.ctx.drawImage(el.image, el.x, el.y, el.width, el.height);
                } else if (el.src) {
                    // Cargar la imagen si aún no está cargada o si image es null/undefined
                    const img = new Image();
                    img.onload = () => {
                        el.image = img;
                        this.draw(); // Redibujar una vez que la imagen esté cargada
                    };
                    img.onerror = () => {
                        console.error('Error al cargar la imagen:', el.src);
                        el.image = null; // Marcar como fallida para no intentar cargar de nuevo hasta que se cambie el src
                        // Dibujar un placeholder si la imagen no se carga
                        this.ctx.fillStyle = '#CCCCCC';
                        this.ctx.fillRect(el.x, el.y, el.width, el.height);
                        this.ctx.strokeStyle = '#FF0000';
                        this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                        this.ctx.fillStyle = '#000000';
                        this.ctx.font = `12px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('Error imagen', el.x + el.width / 2, el.y + el.height / 2);
                    };
                    img.src = el.src;
                } else {
                     // Dibujar un placeholder si no hay SRC
                    this.ctx.fillStyle = '#CCCCCC';
                    this.ctx.fillRect(el.x, el.y, el.width, el.height);
                    this.ctx.strokeStyle = '#999999';
                    this.ctx.strokeRect(el.x, el.y, el.width, el.height);
                    this.ctx.fillStyle = '#666666';
                    this.ctx.font = `12px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('Sin imagen', el.x + el.width / 2, el.y + el.height / 2);
                }
                break;
        }
        this.ctx.restore();
    }

    /**
     * Selecciona un elemento y actualiza el panel de propiedades
     * @param {Object|null} element - El elemento a seleccionar, o null para deseleccionar
     */
    selectElement(element) {
        if (this.selectedElement === element) {
            // Ya está seleccionado, no hacer nada para evitar redibujados innecesarios
            return;
        }

        if (this.selectedElement) {
            this.selectedElement.selected = false;
        }
        this.selectedElement = element;
        if (this.selectedElement) {
            this.selectedElement.selected = true;
        }
        this.updatePropertiesPanel(this.selectedElement);
        this.draw(); // Forzar redibujado para mostrar/ocultar manejadores
    }

    /**
     * Crea un nuevo elemento en el canvas
     * @param {string} type - Tipo de elemento a crear
     * @param {Object} pos - Posición inicial (x, y)
     */
    createNewElement(type, pos) {
        if (type === LabelDesigner.TOOL_IMAGE) {
            console.warn('createNewElement no debe usarse directamente para TOOL_IMAGE. Use handleImageUpload.');
            return;
        }

        const defaultWidth = 100;
        const defaultHeight = 50;
        let newElement = {
            id: Date.now(),
            type: type,
            x: pos.x - defaultWidth / 2,
            y: pos.y - defaultHeight / 2,
            width: defaultWidth,
            height: defaultHeight,
            opacity: LabelDesigner.DEFAULT_STYLES.opacity,
            rotation: LabelDesigner.DEFAULT_STYLES.rotation,
            selected: true,
            // Métodos para interactuar con el panel de propiedades (se agregan dinámicamente)
            getProperties: () => LabelDesigner.getElementProperties(type),
            getProperty: function(prop) { return this[prop]; },
            setProperty: function(prop, value) {
                // Implementación básica para setear propiedades
                this[prop] = value;
            }
        };

        // Asignar propiedades específicas del tipo y sus valores por defecto
        const typeProperties = LabelDesigner.getElementProperties(type);
        for (const prop in typeProperties) {
            // Solo asignar si la propiedad no existe o si se define un valor por defecto
            if (newElement[prop] === undefined && typeProperties[prop].default !== undefined) {
                newElement[prop] = typeProperties[prop].default;
            }
        }

        // Sobreescribir con valores específicos si es necesario
        switch (type) {
            case LabelDesigner.TOOL_TEXT:
                newElement.text = 'Nuevo Texto';
                // Ya se asignan por default los estilos de texto si están en commonProps
                break;
            case LabelDesigner.TOOL_RECTANGLE:
                newElement.fill = '#ADD8E6'; // Light Blue
                // Ya se asignan por default los estilos de borde si están en commonProps
                break;
            case LabelDesigner.TOOL_BARCODE:
                newElement.value = '1234567890';
                // Ya se asignan por default los estilos de código de barras
                break;
        }

        this.elements.push(newElement);
        this.saveState();
        this.draw();
    }

    /**
     * Establece la herramienta actual
     * @param {string} tool - La herramienta a activar
     */
    setTool(tool) {
        this.currentTool = tool;
        // Resaltar el botón activo en la caja de herramientas
        document.querySelectorAll('#toolbox .btn').forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = document.querySelector(`#toolbox button[data-tool="${tool}"], #toolbox label[data-tool="${tool}"]`); // Busca el label también
        if (activeButton) {
             activeButton.classList.add('active');
        }

        // Si la herramienta es diferente de seleccionar, deselecciona cualquier elemento y cambia el cursor
        if (tool !== LabelDesigner.TOOL_SELECT) {
            this.selectElement(null);
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
        console.log('Herramienta cambiada a:', tool);
    }

    /**
     * Busca un elemento en una posición dada
     * @param {Object} pos - Coordenadas (x, y)
     * @returns {Object|null} El elemento encontrado o null
     */
    getElementAt(pos) {
        const padding = 15; // Aumentado de 10 a 15px para mejor experiencia táctil
        
        // Buscar elementos de atrás hacia adelante (los que están encima se seleccionan primero)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            
            // Si el elemento está rotado, necesitamos transformar las coordenadas del clic al espacio no rotado del elemento
            if (el.rotation && el.rotation !== 0) {
                const centerX = el.x + el.width / 2;
                const centerY = el.y + el.height / 2;
                const angle = -el.rotation * (Math.PI / 180); // Ángulo inverso para la transformación
                
                // Transformar las coordenadas del punto de clic
                const dx = pos.x - centerX;
                const dy = pos.y - centerY;
                
                // Aplicar rotación inversa para obtener las coordenadas del clic en el sistema de referencia del elemento no rotado
                const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
                const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
                
                // Verificar colisión con el bounding box no rotado, con padding
                if (rotatedX >= -el.width/2 - padding && 
                    rotatedX <= el.width/2 + padding && 
                    rotatedY >= -el.height/2 - padding && 
                    rotatedY <= el.height/2 + padding) {
                    return el;
                }
            } else {
                // Para elementos no rotados, usar detección simple con padding
                if (pos.x >= el.x - padding && pos.x <= el.x + el.width + padding && 
                    pos.y >= el.y - padding && pos.y <= el.y + el.height + padding) {
                    return el;
                }
            }
        }
        return null;
    }

    /**
     * Redimensiona un elemento seleccionado
     * @param {Object} pos - La posición actual del ratón
     * @param {boolean} shiftKey - Si la tecla Shift está presionada
     */
    resizeElement(pos, shiftKey = false) {
        if (!this.selectedElement || !this.currentResizeHandle || !this.initialElementState) return;

        const el = this.selectedElement;
        const initialState = this.initialElementState;
        const minSize = 10; // Tamaño mínimo para el elemento

        // Calcular el desplazamiento relativo al punto de inicio del arrastre
        // Este desplazamiento se aplica a la posición del ratón YA ROTADA
        // para asegurar un redimensionamiento intuitivo con elementos rotados.
        const angle = el.rotation * (Math.PI / 180); // Ángulo del elemento
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Posición del ratón transformada al espacio de coordenadas no rotado del elemento
        const transformedMouseX = (pos.x - (el.x + el.width / 2)) * cos + (pos.y - (el.y + el.height / 2)) * sin;
        const transformedMouseY = -(pos.x - (el.x + el.width / 2)) * sin + (pos.y - (el.y + el.height / 2)) * cos;
        
        // Posición inicial del ratón transformada
        const transformedStartX = (this.dragStartX - (el.x + el.width / 2)) * cos + (this.dragStartY - (el.y + el.height / 2)) * sin;
        const transformedStartY = -(this.dragStartX - (el.x + el.width / 2)) * sin + (this.dragStartY - (el.y + el.height / 2)) * cos;

        // Delta del movimiento en el espacio no rotado
        const dx = transformedMouseX - transformedStartX;
        const dy = transformedMouseY - transformedStartY;

        let newX = el.x;
        let newY = el.y;
        let newWidth = el.width;
        let newHeight = el.height;

        // Calcular las nuevas dimensiones y posición según el manejador utilizado
        switch (this.currentResizeHandle) {
            case 'nw':
                newX = initialState.x + dx;
                newY = initialState.y + dy;
                newWidth = Math.max(minSize, initialState.width - dx);
                newHeight = Math.max(minSize, initialState.height - dy);
                break;
            case 'n':
                newY = initialState.y + dy;
                newHeight = Math.max(minSize, initialState.height - dy);
                break;
            case 'ne':
                newY = initialState.y + dy;
                newWidth = Math.max(minSize, initialState.width + dx);
                newHeight = Math.max(minSize, initialState.height - dy);
                break;
            case 'w':
                newX = initialState.x + dx;
                newWidth = Math.max(minSize, initialState.width - dx);
                break;
            case 'e':
                newWidth = Math.max(minSize, initialState.width + dx);
                break;
            case 'sw':
                newX = initialState.x + dx;
                newWidth = Math.max(minSize, initialState.width - dx);
                newHeight = Math.max(minSize, initialState.height + dy);
                break;
            case 's':
                newHeight = Math.max(minSize, initialState.height + dy);
                break;
            case 'se':
                newWidth = Math.max(minSize, initialState.width + dx);
                newHeight = Math.max(minSize, initialState.height + dy);
                break;
        }

        // Mantener relación de aspecto si Shift está presionado o si la propiedad está activa
        const shouldMaintainAspect = shiftKey || (el.type === LabelDesigner.TOOL_IMAGE && el.maintainAspectRatio);
        if (shouldMaintainAspect) {
            const originalAspectRatio = initialState.width / initialState.height;
            
            // Priorizar el cambio de la dimensión más grande
            if (Math.abs(newWidth - initialState.width) > Math.abs(newHeight - initialState.height)) {
                newHeight = newWidth / originalAspectRatio;
            } else {
                newWidth = newHeight * originalAspectRatio;
            }

            // Asegurar tamaño mínimo
            if (newWidth < minSize) {
                newWidth = minSize;
                newHeight = newWidth / originalAspectRatio;
            }
            if (newHeight < minSize) {
                newHeight = minSize;
                newWidth = newHeight * originalAspectRatio;
            }
            
            // Recalcular la posición X e Y para los manejadores de esquina/borde si se mantiene el aspecto
            // Esto es crucial para que el redimensionamiento se sienta natural.
            switch (this.currentResizeHandle) {
                case 'nw':
                    newX = initialState.x + (initialState.width - newWidth);
                    newY = initialState.y + (initialState.height - newHeight);
                    break;
                case 'n': // Al redimensionar "n", solo cambia Y y Height, X y Width se mantienen (pero height cambia width)
                    newX = initialState.x + (initialState.width - newWidth) / 2; // Centrar X
                    newY = initialState.y + (initialState.height - newHeight);
                    break;
                case 'ne':
                    newY = initialState.y + (initialState.height - newHeight);
                    break;
                case 'w': // Al redimensionar "w", solo cambia X y Width, Y y Height se mantienen (pero width cambia height)
                    newX = initialState.x + (initialState.width - newWidth);
                    newY = initialState.y + (initialState.height - newHeight) / 2; // Centrar Y
                    break;
                case 'e':
                    newY = initialState.y + (initialState.height - newHeight) / 2; // Centrar Y
                    break;
                case 'sw':
                    newX = initialState.x + (initialState.width - newWidth);
                    break;
                case 's':
                    newX = initialState.x + (initialState.width - newWidth) / 2; // Centrar X
                    break;
                // 'se' no necesita ajuste de posición ya que se expande desde la esquina superior izquierda
            }
        }

        // Aplicar los nuevos valores al elemento
        el.x = newX;
        el.y = newY;
        el.width = newWidth;
        el.height = newHeight;
    }

    /**
     * Elimina el elemento seleccionado
     */
    deleteSelectedElement() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.saveState();
                this.draw();
                this.updatePropertiesPanel(null);
            }
        }
    }

    /**
     * Copia el elemento seleccionado
     */
    copySelectedElement() {
        if (this.selectedElement) {
            // Realizar una copia profunda para evitar referencias
            // JSON.parse(JSON.stringify) es un método simple para copia profunda,
            // pero no copia funciones ni objetos como 'Image'.
            this.copiedElement = JSON.parse(JSON.stringify(this.selectedElement));
            
            // Eliminar propiedades temporales que no deben copiarse
            delete this.copiedElement.id;
            delete this.copiedElement.selected;
            delete this.copiedElement.image; // No copiar el objeto Image
            
            console.log('Elemento copiado:', this.copiedElement);
        }
    }

    /**
     * Pega el elemento copiado
     */
    pasteElement() {
        if (this.copiedElement) {
            const newElement = JSON.parse(JSON.stringify(this.copiedElement));
            newElement.id = Date.now(); // Nuevo ID
            newElement.x += 10; // Desplazar un poco para que no quede encima
            newElement.y += 10;
            newElement.selected = true; // Seleccionar el elemento pegado

            // Restaurar métodos para interactuar con el panel de propiedades
            newElement.getProperties = () => LabelDesigner.getElementProperties(newElement.type);
            newElement.getProperty = function(prop) { return this[prop]; };
            newElement.setProperty = function(prop, value) {
                 // Lógica específica para propiedades de imagen al pegar
                if (newElement.type === LabelDesigner.TOOL_IMAGE && prop === 'maintainAspectRatio') {
                    // Si se activa maintainAspectRatio, ajustar dimensiones si es necesario
                    if (value && newElement.image && newElement.image.width && newElement.image.height) {
                         const aspectRatio = newElement.image.width / newElement.image.height;
                         newElement.width = newElement.height * aspectRatio; // Ajustar ancho al alto
                    }
                } else if (newElement.type === LabelDesigner.TOOL_IMAGE && (prop === 'width' || prop === 'height') && newElement.maintainAspectRatio) {
                    const originalWidth = newElement.image ? newElement.image.width : newElement.width;
                    const originalHeight = newElement.image ? newElement.image.height : newElement.height;
                    const aspectRatio = originalWidth / originalHeight;
                    if (prop === 'width') {
                        newElement.height = value / aspectRatio;
                    } else if (prop === 'height') {
                        newElement.width = value * aspectRatio;
                    }
                }
                this[prop] = value;
            };

            // Si es una imagen, recargarla
            if (newElement.type === LabelDesigner.TOOL_IMAGE && newElement.src) {
                const img = new Image();
                img.onload = () => {
                    newElement.image = img;
                    this.draw();
                };
                img.onerror = () => {
                    console.error('Error al cargar la imagen al pegar:', newElement.src);
                    newElement.image = null; // Marcar como fallida
                };
                img.src = newElement.src;
            }

            this.elements.push(newElement);
            this.selectElement(newElement);
            this.saveState();
            this.draw();
            console.log('Elemento pegado:', newElement);
        }
    }

    /**
     * Inicia la edición de texto para un elemento de texto
     * @param {Object} textElement - El elemento de texto a editar
     */
    startTextEditing(textElement) {
        // Implementación futura: superponer un textarea sobre el canvas para edición directa.
        // Por ahora, la edición se realiza solo a través del panel de propiedades.
        console.log('Iniciando edición de texto para:', textElement.text);
        if (textElement.type === LabelDesigner.TOOL_TEXT) {
            // Activar el campo de texto en el panel de propiedades y enfocarlo
            this.selectElement(textElement); // Asegurarse de que esté seleccionado y el panel actualizado
            setTimeout(() => {
                const textField = this.propertiesPanel.querySelector('[data-property="text"]');
                if (textField) {
                    textField.focus();
                    textField.select(); // Seleccionar el texto para facilitar la edición
                } else {
                    alert('La edición de texto directa aún no está implementada. Por favor, edite el texto en el panel de propiedades.');
                }
            }, 50); // Pequeño retraso para asegurar que el panel se ha actualizado
        }
    }

    // --- Panel de Propiedades ---

    updatePropertiesPanel(element) {
        console.group('updatePropertiesPanel');
        try {
            if (!element) {
                console.log('No element provided, clearing panel');
                this.propertiesPanel.innerHTML = '<p class="text-muted text-center p-3">Selecciona un elemento para ver sus propiedades.</p>';
                return;
            }

            console.log('Updating properties panel for element:', {
                type: element.type,
                id: element.id
            });

            // Usar el método getProperties del elemento para obtener su definición
            const properties = element.getProperties ? element.getProperties() : {};
            console.log('Element properties:', properties);

            let html = `<h6 class="mb-3">${element.type.toUpperCase() || 'Elemento'}</h6>`;

            // Añadir un identificador único para el elemento seleccionado
            html += `<p class="small text-muted mb-3">ID: ${element.id}</p>`;

            for (const [prop, config] of Object.entries(properties)) {
                try {
                    // console.log(`Processing property: ${prop}`, config); // Demasiado verboso
                    if (!config) {
                        console.warn(`Skipping null/undefined config for property: ${prop}`);
                        continue;
                    }

                    const { label, type } = config;
                    // Obtener el valor actual del elemento. Si no está definido, usar el default de la configuración.
                    const value = element.getProperty ? element.getProperty(prop) : element[prop];
                    const effectiveValue = (value !== undefined && value !== null) ? value : config.default;

                    html += this.createInput(prop, label || prop, effectiveValue, type || 'text', config || {}); // Pasamos config completa
                } catch (propError) {
                    console.error(`Error processing property ${prop}:`, propError);
                    html += `
                        <div class="alert alert-warning p-2 mb-2">
                            Error loading property ${prop}: ${propError.message}
                        </div>`;
                }
            }

            this.propertiesPanel.innerHTML = html;
            this.setupPropertyChangeListeners();
        } catch (error) {
            console.error('Error updating properties panel:', error);
            this.propertiesPanel.innerHTML = `
                <div class="alert alert-danger p-2">
                    <strong>Error:</strong> ${error.message || 'Unknown error'}
                    ${error.stack ? `<pre class="mt-2 mb-0 small">${error.stack}</pre>` : ''}
                </div>`;
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Creates an input element for the properties panel
     * @param {string} id - The ID of the input element (corresponds to element property name)
     * @param {string} label - The label text for the input
     * @param {string|number|boolean} value - The current value of the input
     * @param {string} type - The type of input to create (text, number, select, checkbox, color, range)
     * @param {Object} config - Configuration options for the input (min, max, step, options, readonly, etc.)
     * @returns {string} HTML string for the input element
     */
    createInput(id, label, value, type = 'text', config = {}) {
        const safeValue = value !== undefined ? String(value).replace(/"/g, '&quot;') : '';
        const attrs = [];

        if (config.required) attrs.push('required');
        if (config.readonly) attrs.push('readonly');
        if (config.placeholder) attrs.push(`placeholder="${config.placeholder}"`);
        if (config.min !== undefined) attrs.push(`min="${config.min}"`);
        if (config.max !== undefined) attrs.push(`max="${config.max}"`);
        if (config.step) attrs.push(`step="${config.step}"`);
        // Deshabilitar input si readonly es true
        if (config.readonly) attrs.push('disabled');


        switch (type.toLowerCase()) {
            case 'select': {
                const options = Array.isArray(config.options) ? config.options : [];
                const optionsHtml = options.map(opt => {
                    if (opt === null || opt === undefined) return '';
                    const strVal = String(opt);
                    // Asegurarse de que el valor actual coincida con la opción
                    return `<option value="${strVal}" ${strVal === safeValue ? 'selected' : ''}>${strVal}</option>`;
                }).join('');

                return `
                    <div class="form-group mb-2">
                        <label for="prop-${id}" class="form-label small mb-1">${label}</label>
                        <select id="prop-${id}" data-property="${id}" class="form-select form-select-sm" ${attrs.join(' ')}>
                            <option value="">Seleccionar...</option>
                            ${optionsHtml}
                        </select>
                    </div>`;
            }

            case 'checkbox':
                const isChecked = value === true; // Convertir a booleano explícito
                return `
                    <div class="form-check mb-2">
                        <input type="checkbox" id="prop-${id}" data-property="${id}"
                               class="form-check-input" ${isChecked ? 'checked' : ''} ${attrs.join(' ')}>
                        <label for="prop-${id}" class="form-check-label small">${label}</label>
                    </div>`;

            case 'color':
                const colorValue = safeValue || '#000000';
                return `
                    <div class="form-group mb-2">
                        <label for="prop-${id}" class="form-label small mb-1">${label}</label>
                        <div class="input-group input-group-sm">
                            <input type="color" id="prop-${id}" data-property="${id}"
                                   class="form-control form-control-color"
                                   value="${colorValue}" ${attrs.join(' ')}>
                            <input type="text" class="form-control" value="${colorValue}"
                                   oninput="this.previousElementSibling.value=this.value; this.previousElementSibling.dispatchEvent(new Event('input'));" ${attrs.join(' ')}>
                        </div>
                    </div>`;

            case 'file': // El tipo 'file' para 'src' es solo para mostrar, no para subir
                return `
                    <div class="form-group mb-2">
                        <label for="prop-${id}" class="form-label small mb-1">${label}</label>
                        <input type="text" id="prop-${id}" data-property="${id}"
                               class="form-control form-control-sm" value="${safeValue}" readonly ${attrs.join(' ')}>
                        <small class="form-text text-muted">La imagen se sube desde la barra de herramientas.</small>
                    </div>`;

            case 'range':
                const min = config.min !== undefined ? config.min : 0;
                const max = config.max !== undefined ? config.max : 100;
                const step = config.step || 1;
                const displayValue = config.displayValue !== false;
                const fixedDecimal = config.step && parseFloat(config.step) < 1 ? 1 : 0;

                return `
                    <div class="form-group mb-2">
                        <label for="prop-${id}" class="form-label small mb-1">
                            ${label}${displayValue ? ` <span id="prop-${id}-display" class="badge bg-secondary float-end">${parseFloat(safeValue).toFixed(fixedDecimal)}</span>` : ''}
                        </label>
                        <input type="range" id="prop-${id}" data-property="${id}"
                               class="form-range"
                               min="${min}" max="${max}" step="${step}"
                               value="${safeValue}" ${attrs.join(' ')}>
                    </div>`;

            default: // text, number
                return `
                    <div class="form-group mb-2">
                        <label for="prop-${id}" class="form-label small mb-1">${label}</label>
                        <input type="${type}" id="prop-${id}" data-property="${id}"
                               class="form-control form-control-sm"
                               value="${safeValue}" ${attrs.join(' ')}>
                    </div>`;
        }
    }

    /**
     * Sets up event listeners for property changes in the properties panel
     */
    setupPropertyChangeListeners() {
        // Eliminar listeners existentes para evitar duplicados
        // Iterar sobre todos los inputs con data-property y remover el listener
        this.propertiesPanel.querySelectorAll('[data-property]').forEach(input => {
            const property = input.dataset.property;
            const eventType = (input.type === 'range' || input.type === 'color' || input.type === 'text') ? 'input' : 'change';
            
            // Usar una función anónima o una función con bind que se pueda referenciar para remover
            // La mejor práctica es guardar las referencias de las funciones con bind en un mapa si se necesita remover selectivamente
            // Para simplificar, asumimos que se re-agregan todos los listeners cada vez que se actualiza el panel.
            // Una forma más robusta sería:
            // if (this._boundPropertyChangeHandlers && this._boundPropertyChangeHandlers[property]) {
            //     input.removeEventListener(eventType, this._boundPropertyChangeHandlers[property]);
            // }
        });

        // Crear y agregar nuevos listeners
        this.propertiesPanel.querySelectorAll('[data-property]').forEach(input => {
            const property = input.dataset.property;
            const eventType = (input.type === 'range' || input.type === 'color' || input.type === 'text') ? 'input' : 'change';
            
            const handler = this.handlePropertyChange.bind(this);
            input.addEventListener(eventType, handler);
            // Si quieres poder remover específicamente, podrías hacer:
            // if (!this._boundPropertyChangeHandlers) this._boundPropertyChangeHandlers = {};
            // this._boundPropertyChangeHandlers[property] = handler;

            // Para el tipo 'range', también actualizamos el valor mostrado
            if (input.type === 'range') {
                input.addEventListener('input', (e) => {
                    const displaySpan = document.getElementById(`${e.target.id}-display`);
                    if (displaySpan) {
                        const fixedDecimal = e.target.step && parseFloat(e.target.step) < 1 ? 1 : 0;
                        displaySpan.textContent = parseFloat(e.target.value).toFixed(fixedDecimal);
                    }
                });
            }
        });
    }

    handlePropertyChange(e) {
        if (!this.selectedElement) return;
        const property = e.target.dataset.property;
        let value;

        switch (e.target.type) {
            case 'checkbox':
                value = e.target.checked;
                break;
            case 'number':
            case 'range':
                value = parseFloat(e.target.value);
                if (isNaN(value)) { // Manejar inputs numéricos vacíos o inválidos
                    value = e.target.min ? parseFloat(e.target.min) : 0; // Usar el min como fallback
                }
                break;
            case 'color':
                value = e.target.value;
                break;
            default: // text, select
                value = e.target.value;
        }

        // Usar el método setProperty del elemento si está disponible (para lógica específica)
        if (this.selectedElement.setProperty) {
            this.selectedElement.setProperty(property, value);
        } else {
            this.selectedElement[property] = value;
        }

        this.draw();
        // Solo guardar estado si la acción no es una actualización continua (e.g., arrastrar un rango)
        // La actualización de propiedades al arrastrar/redimensionar/rotar se maneja en handleMouseUp
        if (e.type === 'change') { // 'change' event fires when editing is complete (e.g., blur from text input, selection in dropdown)
            this.saveState();
        }
    }

    // --- Manejo de Historial (Undo/Redo) ---

    /**
     * Sanitiza el estado actual para guardarlo en el historial
     * @returns {Object} Estado serializable
     */
    getSanitizedState() {
        return {
            elements: this.elements.map(el => {
                const cleanEl = {};
                // Copiar solo propiedades que son directamente serializables y relevantes
                for (const key in el) {
                    if (el.hasOwnProperty(key)) {
                        const val = el[key];
                        // Excluir funciones y objetos Image
                        if (typeof val !== 'function' && !(val instanceof Image)) {
                            cleanEl[key] = val;
                        }
                    }
                }
                return cleanEl;
            }),
            // Almacenar el ID del elemento seleccionado en lugar del objeto completo
            selectedElementId: this.selectedElement ? this.selectedElement.id : null,
            timestamp: Date.now()
        };
    }

    /**
     * Guarda el estado actual en el historial
     */
    saveState() {
        // Eliminar estados futuros (si se deshizo y luego se hace una nueva acción)
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        const state = this.getSanitizedState();
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        console.log('State saved. History index:', this.historyIndex);
    }

    /**
     * Restaura el estado desde un objeto serializado
     * @param {Object} state - Estado a restaurar
     */
    async restoreState(state) {
        if (!state || !Array.isArray(state.elements)) return;

        try {
            // Restaurar elementos
            this.elements = [];
            for (const el of state.elements) {
                const restored = { ...el };

                // Restaurar imágenes si es necesario
                if (el.type === LabelDesigner.TOOL_IMAGE && el.src) {
                    try {
                        const img = new Image();
                        img.src = el.src;
                        // Esperar a que la imagen cargue antes de continuar para asegurar el dibujo correcto
                        await new Promise((resolve, reject) => {
                            img.onload = () => {
                                restored.image = img;
                                resolve();
                            };
                            img.onerror = () => {
                                console.warn('Failed to load image on restore:', el.src);
                                restored.image = null; // Marcar como fallida
                                resolve(); // Resolver de todas formas para no bloquear la restauración
                            };
                        });
                    } catch (error) {
                        console.error('Error al cargar imagen al restaurar estado:', error);
                        restored.image = null;
                    }
                }

                // Restaurar los métodos para que el panel de propiedades funcione
                restored.getProperties = () => LabelDesigner.getElementProperties(restored.type);
                restored.getProperty = function(prop) { return this[prop]; };
                restored.setProperty = function(prop, value) {
                    // Lógica específica para propiedades de imagen para mantener el aspecto
                    if (this.type === LabelDesigner.TOOL_IMAGE && (prop === 'width' || prop === 'height') && this.maintainAspectRatio && this.image) {
                        const aspectRatio = this.image.width / this.image.height;
                        if (prop === 'width') {
                            this.height = value / aspectRatio;
                        } else if (prop === 'height') {
                            this.width = value * aspectRatio;
                        }
                    }
                    this[prop] = value;
                };

                this.elements.push(restored);
            }

            // Restaurar selección
            this.selectedElement = null; // Deseleccionar primero
            if (state.selectedElementId !== null) {
                this.selectedElement = this.elements.find(el => el.id === state.selectedElementId);
            }
            if (this.selectedElement) {
                this.selectedElement.selected = true;
            }

            // Redibujar
            this.draw();
            this.updatePropertiesPanel(this.selectedElement);

        } catch (error) {
            console.error('Error al restaurar estado:', error);
        }
    }

    // --- Acciones Adicionales ---

    /**
     * Muestra una vista previa del diseño actual antes de exportar a PDF
     */
    showPreview() {
        if (window.previewManager) {
            window.previewManager.showPreview();
        } else {
            console.warn('El gestor de vista previa no está disponible. Exportando directamente a PDF.');
            this.exportPDF(); // Fallback a la exportación directa
        }
    }
    
    /**
     * Exporta el diseño actual a un archivo PDF
     */
    exportPDF() {
        this.selectElement(null); // Deseleccionar para que no aparezcan las asas
        
        // Usar setTimeout para asegurar que el canvas se actualice sin la selección
        setTimeout(() => {
            // Verificar si jsPDF está disponible globalmente
            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                console.error('La biblioteca jsPDF no está cargada o no es accesible globalmente.');
                if (window.previewManager) {
                    window.previewManager.showToast('Error', 'La biblioteca jsPDF no está cargada. Asegúrate de incluirla.', 'danger');
                } else {
                    alert('Error: La biblioteca jsPDF no está cargada.');
                }
                return;
            }
            
            try {
                const { jsPDF } = window.jspdf;
                // Obtener el contenido del canvas como una imagen PNG
                const imgData = this.canvas.toDataURL('image/png');
                
                // Usar las dimensiones del canvas para el PDF
                const pdf = new jsPDF({
                    orientation: this.canvas.width > this.canvas.height ? 'landscape' : 'portrait',
                    unit: 'px', // Usar píxeles para coincidir con las dimensiones del canvas
                    format: [this.canvas.width, this.canvas.height]
                });
                
                // Añadir la imagen al PDF, cubriendo toda la página
                pdf.addImage(imgData, 'PNG', 0, 0, this.canvas.width, this.canvas.height);
                
                // Obtener el nombre del archivo del campo de nombre de plantilla o usar un valor predeterminado
                const templateNameInput = document.getElementById('template-name');
                const templateName = templateNameInput ? templateNameInput.value : 'etiqueta';
                // Limpiar el nombre del archivo para asegurar que sea seguro
                const fileName = `${templateName.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'etiqueta'}.pdf`;
                
                // Guardar el PDF
                pdf.save(fileName);
                
                // Mostrar notificación de éxito si está disponible el gestor de vista previa
                if (window.previewManager) {
                    window.previewManager.showToast('Éxito', 'La etiqueta se ha exportado correctamente', 'success');
                }
                
            } catch (error) {
                console.error('Error al exportar a PDF:', error);
                if (window.previewManager) {
                    window.previewManager.showToast('Error', `Ocurrió un error al exportar la etiqueta: ${error.message}`, 'danger');
                } else {
                    alert(`Error al exportar PDF: ${error.message}`);
                }
            }
        }, 100); // Pequeño retraso para que el canvas se redibuje
    }

    clearCanvas() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el lienzo? Esto eliminará todos los elementos y no se puede deshacer una vez guardado.')) {
            this.elements = [];
            this.selectElement(null); // Deseleccionar cualquier elemento
            this.saveState(); // Guardar el estado vacío
            this.draw(); // Redibujar el canvas en blanco
            if (window.previewManager) {
                window.previewManager.showToast('Lienzo Limpio', 'Todos los elementos han sido eliminados.', 'info');
            }
        }
    }

    /**
     * Deshace el último cambio
     */
    async undo() {
        if (this.historyIndex <= 0) {
            console.log('No more states to undo.');
            if (window.previewManager) window.previewManager.showToast('Deshacer', 'No hay más cambios para deshacer', 'warning');
            return;
        }

        try {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            await this.restoreState(state);
            console.log('Deshacer - Índice actual:', this.historyIndex);
            if (window.previewManager) window.previewManager.showToast('Deshacer', 'Último cambio deshecho', 'info');
        } catch (error) {
            console.error('Error al deshacer:', error);
            // Intentar con el estado anterior si hay un error
            if (this.historyIndex > 0) this.historyIndex--;
            if (window.previewManager) window.previewManager.showToast('Error', 'Error al deshacer el cambio', 'danger');
        }
    }

    /**
     * Rehace el último cambio deshecho
     */
    async redo() {
        if (this.historyIndex >= this.history.length - 1) {
            console.log('No more states to redo.');
            if (window.previewManager) window.previewManager.showToast('Rehacer', 'No hay más cambios para rehacer', 'warning');
            return;
        }

        try {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            await this.restoreState(state);
            console.log('Rehacer - Índice actual:', this.historyIndex);
            if (window.previewManager) window.previewManager.showToast('Rehacer', 'Último cambio rehecho', 'info');
        } catch (error) {
            console.error('Error al rehacer:', error);
            // Avanzar al siguiente estado si hay un error
            if (this.historyIndex < this.history.length - 1) this.historyIndex++;
            if (window.previewManager) window.previewManager.showToast('Error', 'Error al rehacer el cambio', 'danger');
        }
    }

    
    /**
     * Obtiene el tamaño actual del canvas
     * @returns {Object} Un objeto con las propiedades width y height
     */
    getCanvasSize() {
        if (!this.canvas) {
            console.warn('Canvas no está disponible');
            return { width: 0, height: 0 };
        }
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Establece un nuevo tamaño para el canvas
     * @param {number} width - El nuevo ancho del canvas
     * @param {number} height - El nuevo alto del canvas
     * @returns {Object} El tamaño establecido {width, height}
     */
    setCanvasSize(width, height) {
        if (!this.canvas) {
            console.error('No se puede establecer el tamaño: Canvas no inicializado');
            return { width: 0, height: 0 };
        }
        
        // Asegurarse de que el tamaño sea válido (mínimo 100px, máximo 5000px)
        const newWidth = Math.max(100, Math.min(5000, parseInt(width) || 800));
        const newHeight = Math.max(100, Math.min(5000, parseInt(height) || 600));
        
        console.log(`Cambiando tamaño del canvas a: ${newWidth}x${newHeight}`);
        
        // Actualizar el tamaño del canvas
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // Actualizar los campos ocultos del formulario
        const anchoInput = document.getElementById('form-ancho');
        const altoInput = document.getElementById('form-alto');
        if (anchoInput) anchoInput.value = newWidth;
        if (altoInput) altoInput.value = newHeight;
        
        // Actualizar los controles de tamaño si existen
        const canvasWidthInput = document.getElementById('canvas-width');
        const canvasHeightInput = document.getElementById('canvas-height');
        if (canvasWidthInput) canvasWidthInput.value = newWidth;
        if (canvasHeightInput) canvasHeightInput.value = newHeight;
        
        // Redibujar el contenido
        this.draw();
        this.saveState(); // Guardar el cambio de tamaño en el historial
        
        return { width: newWidth, height: newHeight };
    }
}

// Inicializar la aplicación cuando el DOM esté listo
// Función para inicializar el diseñador de etiquetas
function initializeLabelDesigner() {
    try {
        console.log('Inicializando LabelDesigner...');
        
        // Verificar si ya está inicializado para evitar duplicados
        if (window.labelDesigner instanceof LabelDesigner) {
            console.warn('LabelDesigner ya está inicializado. Saltando la inicialización.');
            return window.labelDesigner;
        }
        
        // Crear una nueva instancia
        const designer = new LabelDesigner('label-canvas');
        window.labelDesigner = designer; // Hacer la instancia accesible globalmente
        
        console.log('LabelDesigner inicializado correctamente');
        
        // Disparar evento personalizado cuando esté listo (útil para otros scripts)
        document.dispatchEvent(new CustomEvent('labelDesignerReady', { detail: designer }));
        
        return designer;
    } catch (error) {
        console.error('No se pudo inicializar el diseñador de etiquetas:', error);
        alert('Error al cargar la aplicación. Por favor, revise la consola para más detalles.');
        return null;
    }
}

// Función para manejar el envío del formulario
function setupFormSubmit() {
    // Configurar el botón de guardar diseño
    const btnGuardar = document.getElementById('btn-guardar-diseno');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!window.labelDesigner) {
                console.error('El diseñador no está inicializado');
                alert('Error: El diseñador no está listo. Por favor, recargue la página.');
                return;
            }

            // Obtener los valores del formulario
            const form = document.getElementById('form-plantilla');
            const nombreInput = document.getElementById('template-name');
            const descripcionInput = document.getElementById('descripcion');
            const anchoInput = document.getElementById('canvas-width');
            const altoInput = document.getElementById('canvas-height');
            const jsonInput = document.getElementById('elementos-json');

            // Validar campos requeridos
            if (!nombreInput || !nombreInput.value.trim()) {
                alert('Por favor ingrese un nombre para la plantilla');
                nombreInput.focus();
                return;
            }

            // Obtener el tamaño del canvas
            const ancho = anchoInput ? parseInt(anchoInput.value) : 800;
            const alto = altoInput ? parseInt(altoInput.value) : 600;

            // Guardar los elementos en el campo oculto
            try {
                const elements = window.labelDesigner.elements || [];
                const designData = {
                    nombre: nombreInput.value.trim(),
                    descripcion: descripcionInput ? descripcionInput.value.trim() : '',
                    ancho: ancho,
                    alto: alto,
                    elementos: elements,
                    fecha_creacion: new Date().toISOString()
                };

                // Guardar en el campo oculto
                if (jsonInput) {
                    jsonInput.value = JSON.stringify(designData);
                    
                    // Enviar el formulario
                    form.submit();
                } else {
                    throw new Error('No se encontró el campo para guardar los elementos');
                }
            } catch (error) {
                console.error('Error al guardar el diseño:', error);
                alert('Error al guardar el diseño: ' + error.message);
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeLabelDesigner();
        setupFormSubmit();
    });
} else {
    // Usar setTimeout para asegurar que el DOM esté completamente cargado
    setTimeout(function() {
        initializeLabelDesigner();
        setupFormSubmit();
    }, 0);
}