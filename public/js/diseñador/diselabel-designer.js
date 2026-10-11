/**
 * Label Designer - Main JavaScript (Refactored and Completed)
 * Handles the label designer canvas and interactions
 */

// Evitar declaraciones duplicadas
if (!window.BarcodeUtils) {
    // Barcode format descriptions and validation utilities
    window.BarcodeUtils = {
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
        
        if (patterns[format]) {
            return patterns[format].test(strValue);
        }

        // For CODE128 and CODE39, any non-empty string is generally valid,
        // but specific character sets might be restricted by the encoder.
        // For simplicity, we'll allow any non-empty string for these.
        if (format === 'CODE128' || format === 'CODE39') {
            return strValue.length > 0;
        }

        // Default to false for unknown formats or missing validation
        return false;
    }
};
} // Cierre del if (typeof window.BarcodeUtils === 'undefined')

class LabelDesigner {
    constructor(canvasId, options = {}) {
        this.canvas = new fabric.Canvas(canvasId, {
            backgroundColor: '#fff',
            selection: true, // Habilita la selección de múltiples elementos
            preserveObjectStacking: true // Mantiene el orden de apilamiento al seleccionar
        });

        this.config = {
            width: options.width || 100, // Ancho de la plantilla en unidades
            height: options.height || 50, // Alto de la plantilla en unidades
            unit: options.unit || 'mm', // Unidad de medida (mm, cm, in, px)
            dpi: 96, // Puntos por pulgada, estándar para web
            initialElements: options.initialElements || []
        };

        this.elements = []; // Array para almacenar los elementos del lienzo
        this.selectedElement = null; // Elemento actualmente seleccionado

        this.initializeCanvasSize();
        this.loadInitialElements();
        this.setupEventListeners();
        this.renderLayersPanel(); // Renderiza el panel de capas inicialmente
    }

    // Calcula el tamaño del canvas en píxeles
    getCanvasDimensionsInPx() {
        const dpi = this.config.dpi;
        let widthPx, heightPx;

        switch (this.config.unit) {
            case 'mm':
                widthPx = (this.config.width / 25.4) * dpi;
                heightPx = (this.config.height / 25.4) * dpi;
                break;
            case 'cm':
                widthPx = (this.config.width / 2.54) * dpi;
                heightPx = (this.config.height / 2.54) * dpi;
                break;
            case 'in':
                widthPx = this.config.width * dpi;
                heightPx = this.config.height * dpi;
                break;
            case 'px':
            default:
                widthPx = this.config.width;
                heightPx = this.config.height;
                break;
        }
        return { width: widthPx, height: heightPx };
    }

    // Inicializa el tamaño del canvas basado en las dimensiones de la plantilla
    initializeCanvasSize() {
        const { width, height } = this.getCanvasDimensionsInPx();
        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
        this.canvas.renderAll();
    }

    // Actualiza el tamaño de la plantilla y del canvas
    updatePlantillaSize(newWidth, newHeight, newUnit) {
        this.config.width = newWidth;
        this.config.height = newHeight;
        this.config.unit = newUnit;
        this.initializeCanvasSize(); // Vuelve a calcular y aplicar el tamaño
        this.canvas.renderAll();
        // Disparar un evento o llamar a una función para actualizar la UI si es necesario
        document.dispatchEvent(new CustomEvent('plantillaSizeUpdated', {
            detail: {
                width: newWidth,
                height: newHeight,
                unit: newUnit
            }
        }));
    }

    // Carga los elementos iniciales en el lienzo
    loadInitialElements() {
        this.config.initialElements.forEach(elData => {
            this.agregarElemento(elData.type, {
                id: elData.id,
                x: elData.x,
                y: elData.y,
                width: elData.width,
                height: elData.height,
                rotation: elData.rotation,
                zIndex: elData.zIndex,
                content: elData.content,
                styles: elData.styles,
                properties: elData.properties
            }, false); // El último argumento false evita la renderización inmediata para cada elemento
        });
        this.sortAndReorderElements(); // Reordena los elementos por zIndex al final
        this.canvas.renderAll(); // Renderiza todo al final de la carga inicial
        this.renderLayersPanel(); // Vuelve a renderizar el panel de capas después de cargar
    }

    // Añade un nuevo elemento al lienzo
    agregarElemento(type, options = {}, render = true) {
        let fabricObject;
        const commonProps = {
            left: options.x || 0,
            top: options.y || 0,
            angle: options.rotation || 0,
            // Estos valores iniciales de width/height son importantes para el scaling
            width: options.width || 100,
            height: options.height || 50,
            originX: 'left',
            originY: 'top',
            padding: 0,
            transparentCorners: false,
            cornerColor: '#007bff',
            cornerSize: 10,
            borderColor: '#007bff',
            borderScaleFactor: 2,
            hasControls: true,
            hasBorders: true,
            lockMovementX: options.properties?.lockMovementX || false,
            lockMovementY: options.properties?.lockMovementY || false,
            lockRotation: options.properties?.lockRotation || false,
            lockScalingX: options.properties?.lockScalingX || false,
            lockScalingY: options.properties?.lockScalingY || false,
            visible: options.properties?.visible !== false, // Por defecto visible
            // Propiedades personalizadas para guardar en el JSON
            elementType: type, // Para saber qué tipo de elemento es al reconstruir
            elementId: options.id || `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único
            zIndex: options.zIndex || this.canvas.getObjects().length, // Z-index basado en el orden de adición
            customStyles: options.styles || {} // Almacenar estilos CSS custom
        };

        switch (type) {
            case 'text':
                fabricObject = new fabric.IText(options.content || 'Nuevo Texto', {
                    ...commonProps,
                    fontSize: options.styles?.fontSize || 24,
                    fill: options.styles?.color || '#000',
                    fontFamily: options.styles?.fontFamily || 'Arial',
                    fontWeight: options.styles?.fontWeight || 'normal',
                    fontStyle: options.styles?.fontStyle || 'normal',
                    textDecoration: options.styles?.textDecoration || '',
                    textAlign: options.styles?.textAlign || 'left',
                    lineHeight: options.styles?.lineHeight || 1.2,
                    editable: true,
                    objectCaching: false // Deshabilitar caching para texto editable
                });
                break;
            case 'image':
                fabric.Image.fromURL(options.content || `${window.URLROOT}/public/img/placeholder.png`, (img) => {
                    if (img) {
                        img.set({
                            ...commonProps,
                            scaleX: options.width ? options.width / img.width : 1,
                            scaleY: options.height ? options.height / img.height : 1,
                            src: options.content // Guardar la URL original de la imagen
                        });
                        this.canvas.add(img);
                        this.canvas.setActiveObject(img);
                        this.elements.push(img);
                        this.sortAndReorderElements();
                        this.renderLayersPanel();
                        this.updatePropertiesPanel(img);
                        this.canvas.renderAll();
                    } else {
                        console.error('Error al cargar la imagen:', options.content);
                    }
                }, {
                    crossOrigin: 'anonymous' // Importante para cargar imágenes de diferentes orígenes
                });
                return; // Salir temprano porque la adición es asíncrona
            case 'barcode':
                // Para el código de barras, dibujaremos en un canvas separado y lo usaremos como imagen
                // Esto es una simplificación, en un caso real se usaría una librería de códigos de barras (ej: JsBarcode)
                // y se generaría el SVG/canvas dinámicamente.
                // Aquí solo estamos creando un placeholder visual.
                const barcodeContent = options.content || '123456789012';
                const barcodeType = options.properties?.barcodeType || 'CODE128';
                const displayValue = options.properties?.displayValue !== false;

                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, barcodeContent, {
                    format: barcodeType,
                    displayValue: displayValue,
                    width: 2, // Ancho de barra delgada
                    height: 80,
                    margin: 5
                });
                
                fabricObject = new fabric.Image(barcodeCanvas, {
                    ...commonProps,
                    // Asegurarse de que el tamaño del objeto en Fabric.js refleje el tamaño del barcodeCanvas
                    // width: barcodeCanvas.width, // Esto puede hacer que el barcode sea demasiado grande si no se escala
                    // height: barcodeCanvas.height,
                    src: barcodeContent, // Almacenar el contenido como src para recuperación
                    barcodeType: barcodeType, // Propiedad personalizada
                    displayValue: displayValue // Propiedad personalizada
                });
                break;
            default:
                console.warn('Tipo de elemento no reconocido:', type);
                return;
        }

        if (fabricObject) {
            this.canvas.add(fabricObject);
            this.elements.push(fabricObject); // Añadir a la lista de elementos gestionados
            if (render) {
                this.canvas.setActiveObject(fabricObject);
                this.updatePropertiesPanel(fabricObject);
                this.sortAndReorderElements(); // Ordenar al añadir
                this.renderLayersPanel();
                this.canvas.renderAll();
            }
        }
    }
    
    // Elimina el elemento seleccionado
    eliminarElementoSeleccionado() {
        if (this.selectedElement) {
            this.canvas.remove(this.selectedElement);
            this.elements = this.elements.filter(el => el !== this.selectedElement);
            this.selectedElement = null;
            this.updatePropertiesPanel(null); // Limpia el panel de propiedades
            this.renderLayersPanel();
            this.canvas.renderAll();
        }
    }

    // Actualiza las propiedades de un elemento
    updateElementProperties(element, props) {
        if (!element) return;

        // Actualizar propiedades de Fabric.js
        element.set(props);

        // Manejar propiedades especiales
        if (props.text !== undefined && element.elementType === 'text') {
            element.set('text', props.text);
        }
        if (props.src !== undefined && element.elementType === 'image') {
            // Recargar imagen si la URL cambia
            fabric.Image.fromURL(props.src, (img) => {
                if (img) {
                    element.setSrc(img.getSrc(), function() {
                        // Mantener las dimensiones actuales o ajustarlas
                        element.set({
                            width: img.width,
                            height: img.height
                        });
                        element.scaleToWidth(element.getScaledWidth()); // Para ajustar la escala
                        element.scaleToHeight(element.getScaledHeight());
                        this.canvas.renderAll();
                    }.bind(this));
                    element.src = props.src; // Actualizar propiedad personalizada
                }
            }, { crossOrigin: 'anonymous' });
        }
        if (element.elementType === 'barcode' && (props.barcodeType !== undefined || props.src !== undefined || props.displayValue !== undefined)) {
             // Regenerar código de barras si el tipo o el contenido cambian
            const barcodeContent = props.src !== undefined ? props.src : element.src;
            const barcodeType = props.barcodeType !== undefined ? props.barcodeType : element.barcodeType;
            const displayValue = props.displayValue !== undefined ? props.displayValue : element.displayValue;

            if (BarcodeUtils.validateBarcodeValue(barcodeType, barcodeContent)) {
                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, barcodeContent, {
                    format: barcodeType,
                    displayValue: displayValue,
                    width: 2,
                    height: 80,
                    margin: 5
                });
                
                element.setSrc(barcodeCanvas.toDataURL(), function() {
                     element.set({
                        width: barcodeCanvas.width,
                        height: barcodeCanvas.height
                    });
                    this.canvas.renderAll();
                }.bind(this));
                element.set({
                    src: barcodeContent, // Actualizar la propiedad personalizada 'src' para el contenido
                    barcodeType: barcodeType,
                    displayValue: displayValue
                });
            } else {
                 console.warn(`Valor de código de barras inválido para el formato ${barcodeType}: ${barcodeContent}`);
                 // Opcional: mostrar un mensaje de error en la UI o revertir el cambio
            }
        }


        // Actualizar estilos CSS personalizados
        if (props.customStyles) {
            Object.assign(element.customStyles, props.customStyles);
            // Aplicar estilos relevantes directamente a Fabric.js object si aplica
            if (element.elementType === 'text') {
                if (props.customStyles.fontSize) element.set('fontSize', parseInt(props.customStyles.fontSize));
                if (props.customStyles.color) element.set('fill', props.customStyles.color);
                if (props.customStyles.fontFamily) element.set('fontFamily', props.customStyles.fontFamily);
                if (props.customStyles.fontWeight) element.set('fontWeight', props.customStyles.fontWeight);
                if (props.customStyles.fontStyle) element.set('fontFamily', props.customStyles.fontStyle);
                if (props.customStyles.textDecoration) element.set('textDecoration', props.customStyles.textDecoration);
                if (props.customStyles.textAlign) element.set('textAlign', props.customStyles.textAlign);
                if (props.customStyles.lineHeight) element.set('lineHeight', parseFloat(props.customStyles.lineHeight));
            }
        }

        // Si se cambia la visibilidad
        if (props.visible !== undefined) {
            element.set('visible', props.visible);
        }

        element.setCoords(); // Actualiza las coordenadas del elemento en el canvas
        this.canvas.renderAll();
        this.renderLayersPanel(); // Actualiza el panel de capas (ej: si cambia visibilidad)
        this.updatePropertiesPanel(element); // Vuelve a cargar el panel de propiedades con los nuevos valores
    }


    // Reordena los elementos en el lienzo según su zIndex y actualiza la lista
    sortAndReorderElements() {
        // Ordenar `this.elements` por `zIndex`
        this.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        // Reordenar los objetos en el canvas de Fabric.js
        this.elements.forEach((obj, index) => {
            // Asegurarse de que el zIndex en el objeto de Fabric coincida con el orden de la lista
            obj.zIndex = index;
            // Usa sendToBack/bringToFront/sendBackwards/bringForward para aplicar el orden
            // Una forma simple es remover y añadir, pero es costoso. Mejor usar Fabric.js z-index methods.
            // Para asegurar el orden, es más robusto si fabric.js lo maneja.
            // setStackingIndex es ideal, pero no está en versiones anteriores de Fabric.js.
            // Si no está disponible, un workaround es remover y añadir todos en el orden.
            // Para la mayoría de los casos, Fabric.js gestiona bien el orden con el control de apilamiento.
            // Aquí, nos aseguramos que `zIndex` de nuestro modelo coincida con su posición.
            this.canvas.remove(obj);
            this.canvas.add(obj);
        });
        this.canvas.renderAll();
    }

    // Mueve un elemento en el orden de las capas
    moveLayer(element, direction) {
        const currentIndex = this.elements.indexOf(element);
        if (currentIndex === -1) return;

        let newIndex = currentIndex;
        if (direction === 'up' && currentIndex < this.elements.length - 1) {
            newIndex++;
        } else if (direction === 'down' && currentIndex > 0) {
            newIndex--;
        }

        if (newIndex !== currentIndex) {
            // Intercambiar en el array `this.elements`
            [this.elements[currentIndex], this.elements[newIndex]] = [this.elements[newIndex], this.elements[currentIndex]];

            // Actualizar zIndex en los objetos Fabric.js para reflejar el nuevo orden
            this.elements[currentIndex].zIndex = currentIndex;
            this.elements[newIndex].zIndex = newIndex;

            // Reordenar en el canvas de Fabric.js
            this.sortAndReorderElements();
            this.renderLayersPanel();
            this.canvas.setActiveObject(element); // Mantener el elemento seleccionado
        }
    }

    // Exporta el diseño actual como JSON
    exportarDiseño() {
        const designData = this.elements.map(element => {
            // Serializar solo las propiedades necesarias y personalizadas
            const common = {
                id: element.elementId,
                type: element.elementType,
                x: element.left,
                y: element.top,
                width: element.width * element.scaleX, // Ancho real escalado
                height: element.height * element.scaleY, // Alto real escalado
                rotation: element.angle,
                zIndex: element.zIndex, // Asegurarse de guardar el zIndex
                styles: element.customStyles || {}, // Estilos personalizados
                properties: {
                    lockMovementX: !!element.lockMovementX,
                    lockMovementY: !!element.lockMovementY,
                    lockRotation: !!element.lockRotation,
                    lockScalingX: !!element.lockScalingX,
                    lockScalingY: !!element.lockScalingY,
                    visible: element.visible !== false
                }
            };

            if (element.elementType === 'text') {
                return { ...common, content: element.text };
            } else if (element.elementType === 'image') {
                return { ...common, content: element.src }; // Usar la URL original
            } else if (element.elementType === 'barcode') {
                 // Para el código de barras, guardamos el contenido y sus propiedades específicas
                return {
                    ...common,
                    content: element.src, // el "src" para el código de barras es su valor
                    properties: {
                        ...common.properties,
                        barcodeType: element.barcodeType,
                        displayValue: element.displayValue
                    }
                };
            }
            return common;
        });
        return designData;
    }

    // Exporta el canvas como imagen (PNG)
    exportCanvasAsImage(format = 'png', scaleFactor = 1) {
        return this.canvas.toDataURL({
            format: format,
            multiplier: scaleFactor // Escala para mayor resolución
        });
    }

    // Manejadores de eventos del lienzo
    setupEventListeners() {
        this.canvas.on('object:selected', (e) => {
            this.selectedElement = e.target;
            this.updatePropertiesPanel(this.selectedElement);
            this.renderLayersPanel(); // Actualiza panel de capas al seleccionar
        });

        this.canvas.on('selection:cleared', () => {
            this.selectedElement = null;
            this.updatePropertiesPanel(null); // Limpia el panel de propiedades
            this.renderLayersPanel(); // Actualiza panel de capas al deseleccionar
        });

        this.canvas.on('object:modified', (e) => {
            // Cuando un objeto es movido, escalado o rotado
            const modifiedObj = e.target;
            // Aquí puedes guardar los cambios o actualizar la UI
            // Por ejemplo, actualiza el panel de propiedades si el objeto modificado es el seleccionado
            if (this.selectedElement === modifiedObj) {
                this.updatePropertiesPanel(modifiedObj);
            }
        });

        this.canvas.on('object:moving', (e) => {
            const obj = e.target;
            if (this.snapToGrid && obj) {
                obj.set({
                    left: Math.round(obj.left / this.gridSize) * this.gridSize,
                    top: Math.round(obj.top / this.gridSize) * this.gridSize
                });
            }
        });
    }

    // --- Métodos para interactuar con los paneles de la UI ---

    // Este método debe ser implementado por la clase DisenadorPlantillas
    // para inyectar las propiedades en el DOM
    updatePropertiesPanel(element) {
        // console.log('Actualizando panel de propiedades para:', element);
        // Este método será reescrito por DisenadorPlantillas
        // para renderizar los campos de entrada de propiedades.
        // Aquí solo se muestra un placeholder.
        const propertiesContainer = document.getElementById('propiedades-elemento-container');
        const noElementMessage = document.getElementById('no-element-selected-message');
        const selectedElementInfoSpan = document.getElementById('selected-element-info');

        if (!propertiesContainer || !noElementMessage || !selectedElementInfoSpan) {
            // console.warn('Elementos del DOM de propiedades no encontrados.');
            return;
        }

        if (!element) {
            propertiesContainer.innerHTML = ''; // Limpiar
            noElementMessage.style.display = 'block';
            selectedElementInfoSpan.textContent = 'Ningún elemento seleccionado';
            return;
        }

        noElementMessage.style.display = 'none';
        selectedElementInfoSpan.textContent = `Tipo: ${element.elementType || 'Desconocido'} (ID: ${element.elementId.substring(0, 8)}...)`;

        let html = `
            <div class="mb-3">
                <label class="form-label">ID del Elemento</label>
                <input type="text" class="form-control form-control-sm" value="${element.elementId}" readonly>
            </div>
            <div class="mb-3">
                <label for="prop-x" class="form-label">Posición X</label>
                <input type="number" class="form-control form-control-sm" id="prop-x" value="${Math.round(element.left)}">
            </div>
            <div class="mb-3">
                <label for="prop-y" class="form-label">Posición Y</label>
                <input type="number" class="form-control form-control-sm" id="prop-y" value="${Math.round(element.top)}">
            </div>
            <div class="mb-3">
                <label for="prop-width" class="form-label">Ancho</label>
                <input type="number" class="form-control form-control-sm" id="prop-width" value="${Math.round(element.width * element.scaleX)}">
            </div>
            <div class="mb-3">
                <label for="prop-height" class="form-label">Alto</label>
                <input type="number" class="form-control form-control-sm" id="prop-height" value="${Math.round(element.height * element.scaleY)}">
            </div>
            <div class="mb-3">
                <label for="prop-rotation" class="form-label">Rotación (°)</label>
                <input type="number" class="form-control form-control-sm" id="prop-rotation" value="${Math.round(element.angle)}">
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-visible" ${element.visible ? 'checked' : ''}>
                <label class="form-check-label" for="prop-visible">Visible</label>
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-lock-moveX" ${element.lockMovementX ? 'checked' : ''}>
                <label class="form-check-label" for="prop-lock-moveX">Bloquear mov. X</label>
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-lock-moveY" ${element.lockMovementY ? 'checked' : ''}>
                <label class="form-check-label" for="prop-lock-moveY">Bloquear mov. Y</label>
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-lock-rot" ${element.lockRotation ? 'checked' : ''}>
                <label class="form-check-label" for="prop-lock-rot">Bloquear Rotación</label>
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-lock-scaleX" ${element.lockScalingX ? 'checked' : ''}>
                <label class="form-check-label" for="prop-lock-scaleX">Bloquear Escala X</label>
            </div>
            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="prop-lock-scaleY" ${element.lockScalingY ? 'checked' : ''}>
                <label class="form-check-label" for="prop-lock-scaleY">Bloquear Escala Y</label>
            </div>
        `;

        if (element.elementType === 'text') {
            html += `
                <hr>
                <h6>Propiedades de Texto</h6>
                <div class="mb-3">
                    <label for="prop-content" class="form-label">Contenido</label>
                    <textarea class="form-control form-control-sm" id="prop-content">${element.text}</textarea>
                </div>
                <div class="mb-3">
                    <label for="prop-font-size" class="form-label">Tamaño de Fuente</label>
                    <input type="number" class="form-control form-control-sm" id="prop-font-size" value="${element.fontSize}">
                </div>
                <div class="mb-3">
                    <label for="prop-font-family" class="form-label">Fuente</label>
                    <input type="text" class="form-control form-control-sm" id="prop-font-family" value="${element.fontFamily}">
                </div>
                <div class="mb-3">
                    <label for="prop-color" class="form-label">Color</label>
                    <input type="color" class="form-control form-control-sm form-control-color" id="prop-color" value="${element.fill}">
                </div>
                <div class="mb-3">
                    <label for="prop-font-weight" class="form-label">Grosor</label>
                    <select class="form-select form-select-sm" id="prop-font-weight">
                        <option value="normal" ${element.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="bold" ${element.fontWeight === 'bold' ? 'selected' : ''}>Negrita</option>
                        <option value="bolder" ${element.fontWeight === 'bolder' ? 'selected' : ''}>Más Negrita</option>
                        <option value="lighter" ${element.fontWeight === 'lighter' ? 'selected' : ''}>Más Ligera</option>
                        <option value="100" ${element.fontWeight === '100' ? 'selected' : ''}>100</option>
                        <option value="200" ${element.fontWeight === '200' ? 'selected' : ''}>200</option>
                        <option value="300" ${element.fontWeight === '300' ? 'selected' : ''}>300</option>
                        <option value="400" ${element.fontWeight === '400' ? 'selected' : ''}>400</option>
                        <option value="500" ${element.fontWeight === '500' ? 'selected' : ''}>500</option>
                        <option value="600" ${element.fontWeight === '600' ? 'selected' : ''}>600</option>
                        <option value="700" ${element.fontWeight === '700' ? 'selected' : ''}>700</option>
                        <option value="800" ${element.fontWeight === '800' ? 'selected' : ''}>800</option>
                        <option value="900" ${element.fontWeight === '900' ? 'selected' : ''}>900</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="prop-font-style" class="form-label">Estilo</label>
                    <select class="form-select form-select-sm" id="prop-font-style">
                        <option value="normal" ${element.fontStyle === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="italic" ${element.fontStyle === 'italic' ? 'selected' : ''}>Cursiva</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="prop-text-decoration" class="form-label">Decoración</label>
                    <select class="form-select form-select-sm" id="prop-text-decoration">
                        <option value="" ${element.textDecoration === '' ? 'selected' : ''}>Ninguna</option>
                        <option value="underline" ${element.textDecoration.includes('underline') ? 'selected' : ''}>Subrayado</option>
                        <option value="overline" ${element.textDecoration.includes('overline') ? 'selected' : ''}>Sobresaltado</option>
                        <option value="line-through" ${element.textDecoration.includes('line-through') ? 'selected' : ''}>Tachado</option>
                    </select>
                </div>
                 <div class="mb-3">
                    <label for="prop-text-align" class="form-label">Alineación</label>
                    <select class="form-select form-select-sm" id="prop-text-align">
                        <option value="left" ${element.textAlign === 'left' ? 'selected' : ''}>Izquierda</option>
                        <option value="center" ${element.textAlign === 'center' ? 'selected' : ''}>Centro</option>
                        <option value="right" ${element.textAlign === 'right' ? 'selected' : ''}>Derecha</option>
                        <option value="justify" ${element.textAlign === 'justify' ? 'selected' : ''}>Justificar</option>
                    </select>
                </div>
                 <div class="mb-3">
                    <label for="prop-line-height" class="form-label">Altura de Línea</label>
                    <input type="number" step="0.1" class="form-control form-control-sm" id="prop-line-height" value="${element.lineHeight}">
                </div>
            `;
        } else if (element.elementType === 'image') {
            html += `
                <hr>
                <h6>Propiedades de Imagen</h6>
                <div class="mb-3">
                    <label for="prop-image-src" class="form-label">URL de la Imagen</label>
                    <input type="text" class="form-control form-control-sm" id="prop-image-src" value="${element.src || ''}">
                </div>
            `;
        } else if (element.elementType === 'barcode') {
            html += `
                <hr>
                <h6>Propiedades de Código de Barras</h6>
                <div class="mb-3">
                    <label for="prop-barcode-content" class="form-label">Contenido</label>
                    <input type="text" class="form-control form-control-sm" id="prop-barcode-content" value="${element.src || ''}">
                </div>
                <div class="mb-3">
                    <label for="prop-barcode-type" class="form-label">Tipo de Código</label>
                    <select class="form-select form-select-sm" id="prop-barcode-type">
                        ${Object.entries(BarcodeUtils.formatDescriptions).map(([key, desc]) => `<option value="${key}" ${element.barcodeType === key ? 'selected' : ''}>${desc}</option>`).join('')}
                    </select>
                </div>
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="prop-barcode-display-value" ${element.displayValue ? 'checked' : ''}>
                    <label class="form-check-label" for="prop-barcode-display-value">Mostrar Valor</label>
                </div>
            `;
        }

        propertiesContainer.innerHTML = html;

        // Añadir listeners para los campos de entrada
        this.addPropertiesPanelListeners(element);
    }

    addPropertiesPanelListeners(element) {
        if (!element) return;

        const getNum = (id) => parseFloat(document.getElementById(id)?.value);
        const getStr = (id) => document.getElementById(id)?.value;
        const getBool = (id) => document.getElementById(id)?.checked;

        // Escuchar cambios en los campos de propiedades generales
        const fields = [
            { id: 'prop-x', prop: 'left', type: 'number' },
            { id: 'prop-y', prop: 'top', type: 'number' },
            { id: 'prop-rotation', prop: 'angle', type: 'number' },
            { id: 'prop-visible', prop: 'visible', type: 'boolean' },
            { id: 'prop-lock-moveX', prop: 'lockMovementX', type: 'boolean' },
            { id: 'prop-lock-moveY', prop: 'lockMovementY', type: 'boolean' },
            { id: 'prop-lock-rot', prop: 'lockRotation', type: 'boolean' },
            { id: 'prop-lock-scaleX', prop: 'lockScalingX', type: 'boolean' },
            { id: 'prop-lock-scaleY', prop: 'lockScalingY', type: 'boolean' }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                input.addEventListener('change', () => {
                    let value;
                    if (field.type === 'number') value = parseFloat(input.value);
                    else if (field.type === 'boolean') value = input.checked;
                    else value = input.value;

                    this.updateElementProperties(element, { [field.prop]: value });
                });
            }
        });

        // Manejar ancho/alto con escalado
        const propWidthInput = document.getElementById('prop-width');
        if (propWidthInput) {
            propWidthInput.addEventListener('change', () => {
                const newWidth = parseFloat(propWidthInput.value);
                if (!isNaN(newWidth) && newWidth > 0 && element.width > 0) {
                    const scaleX = newWidth / element.width;
                    this.updateElementProperties(element, { scaleX: scaleX });
                }
            });
        }

        const propHeightInput = document.getElementById('prop-height');
        if (propHeightInput) {
            propHeightInput.addEventListener('change', () => {
                const newHeight = parseFloat(propHeightInput.value);
                if (!isNaN(newHeight) && newHeight > 0 && element.height > 0) {
                    const scaleY = newHeight / element.height;
                    this.updateElementProperties(element, { scaleY: scaleY });
                }
            });
        }


        // Escuchar cambios específicos de tipo de elemento
        if (element.elementType === 'text') {
            const textFields = [
                { id: 'prop-content', prop: 'text', type: 'string' },
                { id: 'prop-font-size', prop: 'fontSize', type: 'number' },
                { id: 'prop-font-family', prop: 'fontFamily', type: 'string' },
                { id: 'prop-color', prop: 'fill', type: 'string' },
                { id: 'prop-font-weight', prop: 'fontWeight', type: 'string' },
                { id: 'prop-font-style', prop: 'fontStyle', type: 'string' },
                { id: 'prop-text-decoration', prop: 'textDecoration', type: 'string' },
                { id: 'prop-text-align', prop: 'textAlign', type: 'string' },
                { id: 'prop-line-height', prop: 'lineHeight', type: 'number' }
            ];
            textFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (input) {
                    input.addEventListener('change', () => {
                        let value;
                        if (field.type === 'number') value = parseFloat(input.value);
                        else value = input.value;
                        this.updateElementProperties(element, { [field.prop]: value, customStyles: { [field.prop]: value } });
                    });
                }
            });
        } else if (element.elementType === 'image') {
            const imageSrcInput = document.getElementById('prop-image-src');
            if (imageSrcInput) {
                imageSrcInput.addEventListener('change', () => {
                    this.updateElementProperties(element, { src: imageSrcInput.value });
                });
            }
        } else if (element.elementType === 'barcode') {
            const barcodeContentInput = document.getElementById('prop-barcode-content');
            if (barcodeContentInput) {
                barcodeContentInput.addEventListener('change', () => {
                    this.updateElementProperties(element, { src: barcodeContentInput.value });
                });
            }
            const barcodeTypeSelect = document.getElementById('prop-barcode-type');
            if (barcodeTypeSelect) {
                barcodeTypeSelect.addEventListener('change', () => {
                    this.updateElementProperties(element, { barcodeType: barcodeTypeSelect.value });
                });
            }
            const barcodeDisplayValue = document.getElementById('prop-barcode-display-value');
            if (barcodeDisplayValue) {
                barcodeDisplayValue.addEventListener('change', () => {
                    this.updateElementProperties(element, { displayValue: barcodeDisplayValue.checked });
                });
            }
        }
    }


    // Renderiza el panel de capas
    renderLayersPanel() {
        const layersPanel = document.getElementById('layers-panel');
        if (!layersPanel) return;

        layersPanel.innerHTML = ''; // Limpiar el panel
        if (this.elements.length === 0) {
            layersPanel.innerHTML = '<p class="text-muted text-center my-3">No hay elementos</p>';
            return;
        }

        // Ordenar elementos por zIndex para mostrarlos correctamente en el panel (de abajo a arriba)
        const sortedElements = [...this.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        sortedElements.forEach(element => {
            const layerItem = document.createElement('div');
            layerItem.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${this.selectedElement === element ? 'active-layer' : ''}`;
            layerItem.dataset.elementId = element.elementId;
            layerItem.style.cursor = 'pointer';

            let icon = '';
            let label = '';
            if (element.elementType === 'text') {
                icon = '<i class="fas fa-font fa-fw me-2"></i>';
                label = element.text ? element.text.substring(0, 20) + (element.text.length > 20 ? '...' : '') : 'Texto';
            } else if (element.elementType === 'image') {
                icon = '<i class="fas fa-image fa-fw me-2"></i>';
                label = 'Imagen';
            } else if (element.elementType === 'barcode') {
                icon = '<i class="fas fa-barcode fa-fw me-2"></i>';
                label = 'Código de Barras';
            } else {
                icon = '<i class="fas fa-cube fa-fw me-2"></i>';
                label = 'Elemento Desconocido';
            }

            layerItem.innerHTML = `
                <div>
                    ${icon}
                    <span>${label}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary toggle-visibility-btn me-1" title="${element.visible ? 'Ocultar' : 'Mostrar'}">
                        <i class="fas fa-eye${element.visible ? '' : '-slash'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-element-btn" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            layerItem.addEventListener('click', (event) => {
                // Prevenir que el click en los botones active la selección del elemento
                if (event.target.closest('.toggle-visibility-btn') || event.target.closest('.delete-element-btn')) {
                    return;
                }
                this.canvas.setActiveObject(element);
                this.canvas.renderAll();
            });

            // Listener para el botón de visibilidad
            const toggleVisibilityBtn = layerItem.querySelector('.toggle-visibility-btn');
            if (toggleVisibilityBtn) {
                toggleVisibilityBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evitar que se propague al item de la capa
                    this.updateElementProperties(element, { visible: !element.visible });
                });
            }

            // Listener para el botón de eliminar
            const deleteBtn = layerItem.querySelector('.delete-element-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evitar que se propague al item de la capa
                    if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
                        // Asegurarse de que el elemento a eliminar sea el que corresponde
                        if (this.selectedElement && this.selectedElement.elementId === element.elementId) {
                            this.eliminarElementoSeleccionado();
                        } else {
                            // Si no es el seleccionado, lo removemos directamente
                            this.canvas.remove(element);
                            this.elements = this.elements.filter(el => el.elementId !== element.elementId);
                            this.sortAndReorderElements(); // Reordenar después de eliminar
                            this.renderLayersPanel();
                            this.updatePropertiesPanel(null); // Limpiar panel si el eliminado era el seleccionado
                            this.canvas.renderAll();
                        }
                    }
                });
            }

            layersPanel.prepend(layerItem); // Añadir al principio para que el zIndex más alto esté arriba
        });

        // Asegurarse de que los botones de capa actúen sobre el elemento seleccionado
        const layerUpBtn = document.getElementById('layer-up-btn');
        const layerDownBtn = document.getElementById('layer-down-btn');

        if (layerUpBtn) {
            layerUpBtn.onclick = () => {
                if (this.selectedElement) {
                    this.moveLayer(this.selectedElement, 'up');
                }
            };
        }
        if (layerDownBtn) {
            layerDownBtn.onclick = () => {
                if (this.selectedElement) {
                    this.moveLayer(this.selectedElement, 'down');
                }
            };
        }
    }

    // Actualiza los elementos del lienzo internamente
    updateElements() {
        // Asegurarse de que `this.elements` esté sincronizado con `this.canvas.getObjects()`
        // Esto es útil si los objetos se añaden o remueven fuera de `agregarElemento` o `eliminarElementoSeleccionado`
        this.elements = this.canvas.getObjects().map(obj => {
             // Asegurarse de que nuestras propiedades personalizadas se mantengan
            obj.elementType = obj.elementType || 'unknown'; // Fallback
            obj.elementId = obj.elementId || `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            obj.zIndex = obj.zIndex || 0;
            obj.customStyles = obj.customStyles || {};

            // Para códigos de barras, mantener sus propiedades específicas
            if (obj.elementType === 'barcode') {
                obj.barcodeType = obj.barcodeType || 'CODE128';
                obj.displayValue = obj.displayValue !== false;
                // Si el src ha cambiado, actualizamos el contenido del barcode
                if (obj.src !== obj._src) { // _src es la url interna de fabric
                     const barcodeCanvas = document.createElement('canvas');
                     JsBarcode(barcodeCanvas, obj.src, {
                        format: obj.barcodeType,
                        displayValue: obj.displayValue,
                        width: 2,
                        height: 80,
                        margin: 5
                    });
                    obj.setSrc(barcodeCanvas.toDataURL());
                }
            }

            return obj;
        });
        this.sortAndReorderElements(); // Mantener el orden
        return this.elements;
    }
}

// Inicializar JsBarcode si aún no está disponible
if (typeof JsBarcode === 'undefined') {
    // Cargar dinámicamente JsBarcode si no está presente
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
    script.onload = () => console.log('JsBarcode cargado dinámicamente.');
    document.head.appendChild(script);
}

// Hacer que LabelDesigner esté disponible globalmente
window.LabelDesigner = LabelDesigner;