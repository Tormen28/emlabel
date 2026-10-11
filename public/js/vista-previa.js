/**
 * Módulo de vista previa para el diseñador de etiquetas
 * Maneja la visualización previa y exportación a PDF
 */
class PreviewManager {
    // Configuración de calidad de PDF
    static PDF_QUALITY = {
        LOW: { scale: 1, dpi: 96 },
        MEDIUM: { scale: 2, dpi: 150 },
        HIGH: { scale: 3, dpi: 300 }
    };
    
    // Plantillas predefinidas
    static TEMPLATES = {
        A4: { width: 210, height: 297, unit: 'mm' },
        LETTER: { width: 8.5, height: 11, unit: 'in' },
        LABEL_4X6: { width: 4, height: 6, unit: 'in' }
    };

    /**
     * Crea una instancia del gestor de vista previa
     * @param {HTMLElement} canvas - Elemento canvas principal del diseñador
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.previewCanvas = document.getElementById('preview-canvas');
        this.modal = new bootstrap.Modal(document.getElementById('previewModal'));
        this.exportButton = document.getElementById('btn-confirm-export');
        this.resetViewButton = document.getElementById('btn-reset-view');
        this.exportStatus = document.getElementById('export-status');
        this.exportProgress = document.getElementById('export-progress');
        this.canvasDimensions = document.getElementById('canvas-dimensions');
        this.zoomLevelDisplay = document.getElementById('zoom-level');
        
        // Configuración de exportación y unidades
        this.quality = PreviewManager.PDF_QUALITY.MEDIUM;
        this.currentTemplate = null; // Se inicializará con el template por defecto en updateExportUI
        this.margins = { top: 10, right: 10, bottom: 10, left: 10 }; // en mm
        this.cropMarks = true;
        this.dpi = 300; // DPI para impresión
        this.internalUnit = 'px'; // Unidad interna de trabajo
        this.displayUnit = 'mm';  // Unidad para mostrar al usuario
        
        // Estado para el zoom y pan
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 5;
        this.zoomStep = 0.1;
        this.pan = { x: 0, y: 0 }; // Posición de pan en coordenadas del contenedor
        this.isPanning = false;
        this.lastPos = { x: 0, y: 0 };
        
        // Inicializar dimensiones del canvas
        this.updateCanvasDimensions();
        
        if (!this.previewCanvas) {
            console.error('No se encontró el elemento de vista previa');
            return;
        }
        
        this.setupEventListeners();
    }

    /**
     * Convierte un valor entre unidades
     * @param {number} value - Valor a convertir
     * @param {string} fromUnit - Unidad de origen ('px', 'mm', 'in')
     * @param {string} toUnit - Unidad de destino ('px', 'mm', 'in')
     * @returns {number} Valor convertido
     */
    convertUnit(value, fromUnit, toUnit) {
        return UnitConverter.convert(value, fromUnit, toUnit, this.dpi);
    }

    /**
     * Convierte un valor de la unidad interna a la unidad de visualización
     * @param {number} value - Valor en la unidad interna
     * @returns {number} Valor en la unidad de visualización
     */
    toDisplayUnit(value) {
        return this.convertUnit(value, this.internalUnit, this.displayUnit);
    }

    /**
     * Convierte un valor de la unidad de visualización a la unidad interna
     * @param {number} value - Valor en la unidad de visualización
     * @returns {number} Valor en la unidad interna
     */
    fromDisplayUnit(value) {
        return this.convertUnit(value, this.displayUnit, this.internalUnit);
    }

    /**
     * Formatea un valor con su unidad de visualización
     * @param {number} value - Valor a formatear
     * @param {number} [decimals=2] - Número de decimales
     * @returns {string} Valor formateado con unidades
     */
    formatValue(value, decimals = 2) {
        return UnitConverter.format(this.toDisplayUnit(value), this.displayUnit, decimals);
    }

    /**
     * Actualiza la interfaz de usuario con las dimensiones actuales
     */
    updateDimensionsUI() {
        if (!this.canvas || !this.canvasDimensions) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Convertir a unidades de visualización
        const displayWidth = this.toDisplayUnit(width);
        const displayHeight = this.toDisplayUnit(height);
        
        // Mostrar en el formato: "Ancho x Alto (unidad)"
        this.canvasDimensions.textContent = 
            `${displayWidth.toFixed(2)} × ${displayHeight.toFixed(2)} ${this.displayUnit}`;
    }

    /**
     * Actualiza el zoom en la interfaz de usuario
     */
    updateZoomUI() {
        if (!this.zoomLevelDisplay) return;
        this.zoomLevelDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    /**
     * Configura los manejadores de eventos
     */
    setupEventListeners() {
        // Configurar el botón de exportación en el modal
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => this.onExportClick());
        }
        
        // Configurar el botón de restablecer vista
        if (this.resetViewButton) {
            this.resetViewButton.addEventListener('click', () => this.fitToScreen());
        }
        
        // Configurar el botón de exportación en la barra de herramientas
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.onToolbarExportClick());
        }
        
        // Configurar eventos de zoom y pan
        this.setupZoomAndPan();
        
        // Manejar eventos del modal
        this.modal._element.addEventListener('show.bs.modal', () => {
            // Ajustar el canvas de preview al tamaño de su contenedor antes de mostrar la vista previa
            this.resizePreviewCanvasToContainer();
            // Luego, ajustar la vista para que el contenido quepa
            this.fitToScreen();
            this.updateCanvasDimensions(); // Asegurarse de que las dimensiones se muestren correctamente
        });
        
        // Manejar redimensionamiento de la ventana
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (this.modal._element.classList.contains('show')) {
                    // Reajustar el canvas de preview y luego el contenido
                    this.resizePreviewCanvasToContainer();
                    this.fitToScreen();
                }
            }, 250);
        });
    }

    /**
     * Redimensiona el canvas de vista previa para que coincida con el tamaño de su contenedor.
     */
    resizePreviewCanvasToContainer() {
        if (!this.previewCanvas) return;
        const container = this.previewCanvas.closest('.preview-container');
        if (container) {
            this.previewCanvas.width = container.clientWidth;
            this.previewCanvas.height = container.clientHeight;
            this.updatePreview(); // Re-dibujar con las nuevas dimensiones del canvas de preview
        }
    }
    
    /**
     * Configura los eventos de zoom y pan para el canvas de vista previa
     */
    setupZoomAndPan() {
        if (!this.previewCanvas) return;
        
        const container = this.previewCanvas.closest('.preview-container');
        if (!container) return;
        
        // Agregar controles de zoom (verificar si ya existen para evitar duplicados)
        let zoomControls = container.querySelector('.zoom-controls');
        if (!zoomControls) {
            zoomControls = document.createElement('div');
            zoomControls.className = 'zoom-controls';
            
            const zoomInBtn = document.createElement('button');
            zoomInBtn.className = 'zoom-btn';
            zoomInBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
            zoomInBtn.title = 'Acercar (Ctrl + +)';
            
            const zoomOutBtn = document.createElement('button');
            zoomOutBtn.className = 'zoom-btn';
            zoomOutBtn.innerHTML = '<i class="bi bi-dash-lg"></i>';
            zoomOutBtn.title = 'Alejar (Ctrl + -)';
            
            const zoomResetBtn = document.createElement('button');
            zoomResetBtn.className = 'zoom-btn';
            zoomResetBtn.innerHTML = '<i class="bi">1:1</i>';
            zoomResetBtn.title = 'Tamaño real (Ctrl + 0)';
            
            const zoomLevel = document.createElement('div');
            zoomLevel.className = 'zoom-level';
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
            
            zoomControls.appendChild(zoomInBtn);
            zoomControls.appendChild(zoomOutBtn);
            zoomControls.appendChild(zoomResetBtn);
            zoomControls.appendChild(zoomLevel);
            
            container.style.position = 'relative';
            container.appendChild(zoomControls);
            
            // Manejadores de eventos para los botones de zoom
            zoomInBtn.addEventListener('click', () => this.setZoom(this.zoom + this.zoomStep));
            zoomOutBtn.addEventListener('click', () => this.setZoom(this.zoom - this.zoomStep));
            zoomResetBtn.addEventListener('click', () => this.resetZoom());
        }
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.setZoom(this.zoom + this.zoomStep);
                } else if (e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    this.setZoom(this.zoom - this.zoomStep);
                } else if (e.key === '0') {
                    e.preventDefault();
                    this.resetZoom();
                }
            }
        });
        
        // Eventos de rueda del ratón para zoom
        container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
                // Obtener las coordenadas relativas al canvas de preview para un zoom centrado
                const rect = this.previewCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                this.setZoom(this.zoom + delta, mouseX, mouseY);
            }
        }, { passive: false });
        
        // Eventos de arrastre para pan
        container.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Botón izquierdo
                this.isPanning = true;
                // Calcular la posición inicial del pan relativa al contenedor
                this.lastPos = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
                container.style.cursor = 'grabbing';
            }
        });
        
        container.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.pan.x = e.clientX - this.lastPos.x;
                this.pan.y = e.clientY - this.lastPos.y;
                this.updatePreview();
            }
        });
        
        const endPan = () => {
            this.isPanning = false;
            container.style.cursor = 'grab';
        };
        
        container.addEventListener('mouseup', endPan);
        container.addEventListener('mouseleave', endPan);
        
        // Actualizar el cursor
        container.style.cursor = 'grab';
    }
    
    /**
     * Establece el nivel de zoom
     * @param {number} newZoom - Nuevo nivel de zoom
     * @param {number} [mouseX] - Coordenada X del ratón en el canvas de preview para zoom centrado
     * @param {number} [mouseY] - Coordenada Y del ratón en el canvas de preview para zoom centrado
     */
    setZoom(newZoom, mouseX, mouseY) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        
        // Actualizar la posición para hacer zoom centrado en el ratón
        if (mouseX !== undefined && mouseY !== undefined) {
            // Ajustar pan para zoom centrado
            // mouseX e mouseY son coordenadas relativas al canvas de preview
            // Necesitamos transformar esas coordenadas a coordenadas del canvas original sin zoom/pan
            const imgX = (mouseX - this.pan.x) / oldZoom;
            const imgY = (mouseY - this.pan.y) / oldZoom;

            // Calcular el nuevo pan para que la imagenX, imagenY sigan bajo el cursor mouseX, mouseY con el nuevo zoom
            this.pan.x = mouseX - imgX * this.zoom;
            this.pan.y = mouseY - imgY * this.zoom;
        }
        
        this.updatePreview();
        this.updateZoomDisplay(true); // Pasar true para mostrar temporalmente
    }
    
    /**
     * Restablece el zoom al 100% y centra la vista
     */
    resetZoom() {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.fitToScreen(); // Mejor usar fitToScreen para centrar y ajustar automáticamente
        // this.updatePreview(); // Ya se llama dentro de fitToScreen
        this.updateZoomDisplay(true); // Mostrar el indicador de zoom temporalmente
    }
    
    /**
     * Actualiza las dimensiones del canvas mostradas en la interfaz
     */
    updateCanvasDimensions() {
        if (this.canvasDimensions) {
            this.canvasDimensions.textContent = `${this.canvas.width} × ${this.canvas.height} px`;
        }
    }
    
    /**
     * Ajusta el zoom para que el canvas quepa en la pantalla, centrado.
     */
    fitToScreen() {
        if (!this.previewCanvas) return;
        
        const container = this.previewCanvas.closest('.preview-container');
        if (!container) return;
        
        // Asegurarse de que el canvas de preview tiene el tamaño de su contenedor
        this.resizePreviewCanvasToContainer();

        const previewCanvasWidth = this.previewCanvas.width;
        const previewCanvasHeight = this.previewCanvas.height;

        const originalCanvasWidth = this.canvas.width;
        const originalCanvasHeight = this.canvas.height;

        // Calcular la escala para que el contenido quepa con un pequeño margen
        const padding = 0.95; // 95% del espacio disponible
        const scaleX = (previewCanvasWidth * padding) / originalCanvasWidth;
        const scaleY = (previewCanvasHeight * padding) / originalCanvasHeight;
        
        // Usar la escala más pequeña para que todo el contenido sea visible
        let newZoom = Math.min(scaleX, scaleY);
        
        // Limitar el zoom mínimo y máximo
        newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        
        this.zoom = newZoom;
        
        // Calcular las dimensiones actuales del canvas original escalado con el nuevo zoom
        const scaledContentWidth = originalCanvasWidth * this.zoom;
        const scaledContentHeight = originalCanvasHeight * this.zoom;

        // Calcular el desplazamiento necesario para centrar la imagen dentro del canvas de preview
        this.pan.x = (previewCanvasWidth - scaledContentWidth) / 2;
        this.pan.y = (previewCanvasHeight - scaledContentHeight) / 2;
        
        // Actualizar la interfaz
        this.updatePreview();
        this.updateZoomDisplay(true); // Mostrar el indicador de zoom temporalmente
    }
    
    /**
     * Actualiza el indicador de nivel de zoom
     * @param {boolean} temporaryShow - Si el indicador debe mostrarse temporalmente
     */
    updateZoomDisplay(temporaryShow = false) {
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
            if (temporaryShow) {
                zoomLevel.style.opacity = '1';
                clearTimeout(this.zoomTimeout);
                this.zoomTimeout = setTimeout(() => {
                    zoomLevel.style.opacity = '0';
                }, 1500);
            } else {
                zoomLevel.style.opacity = '1'; // Mantener visible si no es temporal
            }
        }
        // La sección de this.zoomLevelDisplay podría eliminarse si solo se usa el nuevo control
        if (this.zoomLevelDisplay) { // Para la versión anterior de display si aún se usa
            this.zoomLevelDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }
    
    /**
     * Actualiza la vista previa con la configuración actual de zoom y pan
     */
    updatePreview() {
        if (!this.previewCanvas || !this.canvas) return; // Asegurarse de que el canvas original esté disponible
        
        const ctx = this.previewCanvas.getContext('2d');
        
        // Limpiar el canvas de vista previa por completo
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reiniciar la transformación antes de limpiar
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        ctx.save(); // Guardar el estado inicial del contexto
        
        // Aplicar transformaciones: traslación (pan) y luego escalado (zoom)
        // El pan es relativo al canvas de preview
        ctx.translate(this.pan.x, this.pan.y);
        ctx.scale(this.zoom, this.zoom);
        
        // Dibujar el contenido del canvas original en el canvas de vista previa
        // El tamaño de la imagen se dibuja con las dimensiones originales del canvas
        // Las transformaciones de escala y traslación ya se han aplicado al contexto
        ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
        
        // Mostrar marcas de recorte si están habilitadas
        if (this.cropMarks) {
            // Las marcas de recorte se dibujan en las coordenadas del canvas original,
            // ya que el contexto tiene el zoom y pan aplicados.
            this.drawCropMarks(ctx);
        }
        
        ctx.restore(); // Restaurar el estado del contexto a antes de las transformaciones
        
        // Actualizar el indicador de zoom
        this.updateZoomDisplay();
    }
    
    /**
     * Muestra la vista previa del diseño actual con opciones de exportación
     */
    async showPreview() {
        if (!this.previewCanvas) return;
        
        try {
            // Actualizar la interfaz de usuario con las opciones de exportación
            this.updateExportUI();
            
            // Mostrar el modal de vista previa
            this.modal.show();
            
            // La lógica de redimensionamiento y fitToScreen ahora está en el evento 'show.bs.modal'
            
        } catch (error) {
            console.error('Error al generar la vista previa:', error);
            this.showToast('Error', 'No se pudo generar la vista previa', 'danger');
        }
    }
    
    /**
     * Maneja el clic en el botón de exportación del modal
     */
    async onExportClick() {
        // Mostrar estado de exportación
        this.exportStatus.classList.add('d-none');
        this.exportProgress.classList.remove('d-none');
        
        try {
            // Validar que jsPDF esté disponible
            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                throw new Error('La biblioteca jsPDF no está cargada correctamente. Asegúrese de que todos los scripts se hayan cargado correctamente.');
            }
            
            // Crear un nuevo PDF
            const { jsPDF } = window.jspdf;
            
            // Validar que jsPDF se haya cargado correctamente
            if (typeof jsPDF !== 'function') {
                throw new Error('No se pudo inicializar la biblioteca de generación de PDF. Por favor, recargue la página e intente nuevamente.');
            }
            
            // Obtener el formato de la plantilla actual o usar 'a4' si no hay una seleccionada
            let pdfFormat = 'a4';
            let pdfUnit = 'mm';
            let customWidth = null;
            let customHeight = null;
            let currentDocTitle = 'etiqueta personalizada'; // Título por defecto
            
            // Validar que el canvas exista y tenga contenido
            if (!this.canvas || !this.canvas.width || !this.canvas.height) {
                throw new Error('El lienzo de diseño no está correctamente inicializado.');
            }

            if (this.currentTemplate) {
                try {
                    const templateSelect = document.getElementById('export-template');
                    currentDocTitle = templateSelect?.selectedOptions?.[0]?.textContent || 'etiqueta personalizada';

                    if (this.currentTemplate.unit === 'mm') {
                        pdfFormat = [this.currentTemplate.width, this.currentTemplate.height];
                        pdfUnit = 'mm';
                    } else if (this.currentTemplate.unit === 'in') {
                        // Convertir pulgadas a mm para jsPDF si el formato es personalizado
                        pdfFormat = [this.currentTemplate.width * 25.4, this.currentTemplate.height * 25.4];
                        pdfUnit = 'mm'; // Siempre usar 'mm' para dimensiones personalizadas en jsPDF
                    } else {
                        console.warn(`Unidad de plantilla no reconocida: ${this.currentTemplate.unit}. Usando A4 por defecto.`);
                        pdfFormat = 'a4';
                    }
                } catch (error) {
                    console.error('Error al procesar la plantilla:', error);
                    throw new Error('Error al configurar el formato de la plantilla. Por favor, verifique la configuración.');
                }
            } else {
                // Si es personalizado y no hay plantilla, obtener de los inputs
                const widthInput = document.getElementById('custom-width');
                const heightInput = document.getElementById('custom-height');
                const widthUnitElement = document.getElementById('width-unit'); // Obtener el elemento de unidad
                const currentUnit = (widthUnitElement && widthUnitElement.textContent) ? 
                                  widthUnitElement.textContent.trim().toLowerCase() : 'mm'; // Obtener unidad actual, por defecto 'mm'
                
                // Validar que los inputs existan y tengan valores válidos
                if (!widthInput || !heightInput) {
                    throw new Error("No se encontraron los controles de dimensiones personalizadas.");
                }

                // Obtener valores y validar que sean números positivos
                customWidth = parseFloat(widthInput.value);
                customHeight = parseFloat(heightInput.value);

                if (isNaN(customWidth) || isNaN(customHeight) || customWidth <= 0 || customHeight <= 0) {
                    console.error('Dimensiones inválidas:', { width: widthInput.value, height: heightInput.value });
                    throw new Error("Por favor ingrese dimensiones válidas (números mayores a 0).");
                }

                // Convertir a mm si es necesario
                if (currentUnit === 'in') {
                    // Convertir a mm si la unidad es pulgadas para jspdf
                    customWidth *= 25.4; // 1 pulgada = 25.4 mm
                    customHeight *= 25.4;
                } else if (currentUnit !== 'mm') {
                    console.warn(`Unidad no reconocida: ${currentUnit}. Usando mm por defecto.`);
                }

                // Validar dimensiones máximas (1000mm x 1000mm para evitar PDFs demasiado grandes)
                const MAX_DIMENSION_MM = 1000;
                if (customWidth > MAX_DIMENSION_MM || customHeight > MAX_DIMENSION_MM) {
                    throw new Error(`Las dimensiones no pueden ser mayores a ${MAX_DIMENSION_MM}mm.`);
                }

                pdfFormat = [customWidth, customHeight];
                pdfUnit = 'mm'; // Siempre usar 'mm' para dimensiones personalizadas en jsPDF
            }
            
            // Validar las dimensiones antes de crear el PDF
            const maxDimension = 1000; // 1000mm es un tamaño razonablemente grande
            
            if (Array.isArray(pdfFormat)) {
                const [width, height] = pdfFormat;
                if (width <= 0 || height <= 0 || width > maxDimension || height > maxDimension) {
                    throw new Error(`Las dimensiones del documento (${width}x${height} ${pdfUnit}) no son válidas.`);
                }
            }
            
            let pdf;
            try {
                const orientation = Array.isArray(pdfFormat) && pdfFormat[0] > pdfFormat[1] ? 'l' : 'p';
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: pdfUnit,
                    format: pdfFormat
                });
            } catch (pdfError) {
                console.error('Error al crear el documento PDF:', pdfError);
                throw new Error('No se pudo crear el documento PDF. Verifique las dimensiones e intente nuevamente.');
            }
            
            // Convertir el canvas a una imagen con la calidad adecuada
            const originalCanvasWidth = this.canvas.width;
            const originalCanvasHeight = this.canvas.height;
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = originalCanvasWidth * this.quality.scale;
            tempCanvas.height = originalCanvasHeight * this.quality.scale;
            
            // Dibujar el contenido del canvas original en el canvas temporal con la escala
            tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);

            // Si las marcas de recorte están activadas, dibujarlas en el canvas temporal antes de exportar
            if (this.cropMarks) {
                tempCtx.save();
                // Las marcas de recorte deben escalarse con la misma escala de calidad para verse bien en el PDF
                tempCtx.scale(this.quality.scale, this.quality.scale); 
                this.drawCropMarks(tempCtx);
                tempCtx.restore();
            }

            const imgData = tempCanvas.toDataURL('image/png', 1.0); // 1.0 para máxima calidad
            
            // Calcular dimensiones manteniendo la relación de aspecto
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            
            // Calcular las dimensiones de la imagen para que encaje dentro de los márgenes
            let imgWidth = pageWidth - (this.margins.left + this.margins.right);
            let imgHeight = imgWidth / imgRatio;
            
            // Ajustar si la altura calculada es mayor que el espacio disponible
            if (imgHeight > pageHeight - (this.margins.top + this.margins.bottom)) {
                imgHeight = pageHeight - (this.margins.top + this.margins.bottom);
                imgWidth = imgHeight * imgRatio;
            }
            
            // Centrar la imagen en la página
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            // Agregar metadatos al PDF
            pdf.setProperties({
                title: `${currentDocTitle} - Exportado desde el Diseñador de Etiquetas`,
                subject: 'Diseño de etiqueta',
                author: 'Sistema de Etiquetas',
                keywords: 'etiqueta, diseño, exportación',
                creator: 'Diseñador de Etiquetas'
            });
            
            // Agregar la imagen al PDF
            pdf.addImage(
                imgData,
                'PNG',
                x,
                y,
                imgWidth,
                imgHeight,
                undefined,
                'FAST'
            );
            
            // Agregar pie de página con información
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                
                // Pie de página
                pdf.setFontSize(8);
                pdf.setTextColor(150);
                pdf.text(
                    `Página ${i} de ${pageCount} • ${currentDocTitle} • ${new Date().toLocaleDateString()}`,
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
            }
            
            // Guardar el PDF
            pdf.save(`${currentDocTitle.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Mostrar notificación de éxito
            this.showToast('¡Éxito!', 'El PDF se ha generado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            
            // Mensajes de error más amigables
            let errorMessage = 'No se pudo exportar el PDF';
            const errorLower = error.message.toLowerCase();
            
            if (errorLower.includes('dimension') || errorLower.includes('size') || errorLower.includes('tamaño')) {
                errorMessage = 'Las dimensiones del documento no son válidas. Por favor, verifique los valores ingresados.';
            } else if (errorLower.includes('jsPDF') || errorLower.includes('pdf')) {
                errorMessage = 'Error al generar el PDF. Por favor, intente nuevamente o recargue la página.';
            } else if (errorLower.includes('canvas') || errorLower.includes('lienzo')) {
                errorMessage = 'Error en el lienzo de diseño. Por favor, verifique que el diseño sea válido.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showToast('Error', errorMessage, 'danger');
            
            // Mostrar detalles completos en la consola para depuración
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        } finally {
            // Restaurar la interfaz de usuario
            this.exportStatus.classList.remove('d-none');
            this.exportProgress.classList.add('d-none');
        }
    }
    
    /**
     * Maneja el clic en el botón de exportación de la barra de herramientas
     */
    onToolbarExportClick() {
        if (typeof window.labelDesigner !== 'undefined') {
            window.labelDesigner.showPreview();
        } else {
            console.error('No se encontró la instancia del diseñador de etiquetas');
            this.showToast('Error', 'No se pudo encontrar el diseñador de etiquetas', 'danger');
        }
    }
    
    /**
     * Actualiza la interfaz de usuario con las opciones de exportación
     */
    updateExportUI() {
        const container = document.getElementById('export-options-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="mb-3">
                <label class="form-label small fw-semibold mb-2">Tamaño del Documento</label>
                <select class="form-select form-select-sm mb-3" id="export-template">
                    <option value="">Personalizado</option>
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="LETTER">Carta (8.5 × 11 in)</option>
                    <option value="LABEL_4X6">Etiqueta 4 × 6 in</option>
                </select>
                
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text">Ancho</span>
                            <input type="number" class="form-control" id="custom-width" placeholder="Ancho" step="0.1">
                            <span class="input-group-text" id="width-unit">mm</span>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text">Alto</span>
                            <input type="number" class="form-control" id="custom-height" placeholder="Alto" step="0.1">
                            <span class="input-group-text" id="height-unit">mm</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" id="show-crop-marks" ${this.cropMarks ? 'checked' : ''}>
                    <label class="form-check-label small" for="show-crop-marks">Mostrar marcas de recorte</label>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold mb-2">Calidad de Exportación</label>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="export-quality" id="quality-low" value="low" ${this.quality === PreviewManager.PDF_QUALITY.LOW ? 'checked' : ''}>
                        <label class="form-check-label small w-100 d-flex justify-content-between" for="quality-low">
                            <span>Baja (96 DPI)</span>
                            <small class="text-muted">Tamaño reducido</small>
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="export-quality" id="quality-medium" value="medium" ${this.quality === PreviewManager.PDF_QUALITY.MEDIUM ? 'checked' : ''}>
                        <label class="form-check-label small w-100 d-flex justify-content-between" for="quality-medium">
                            <span>Media (150 DPI)</span>
                            <small class="text-muted">Recomendado</small>
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="export-quality" id="quality-high" value="high" ${this.quality === PreviewManager.PDF_QUALITY.HIGH ? 'checked' : ''}>
                        <label class="form-check-label small w-100 d-flex justify-content-between" for="quality-high">
                            <span>Alta (300 DPI)</span>
                            <small class="text-muted">Alta resolución</small>
                        </label>
                    </div>
                </div>
                
                <div class="alert alert-info small p-2 mb-0">
                    <i class="bi bi-info-circle me-1"></i>
                    <small>La calidad afecta el tamaño del archivo y la nitidez de la imagen.</small>
                </div>
            </div>
        `;
        
        // Obtener referencias a los elementos después de que el HTML haya sido insertado
        const qualityRadios = document.querySelectorAll('input[name="export-quality"]');
        const templateSelect = document.getElementById('export-template');
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        const widthUnit = document.getElementById('width-unit');
        const heightUnit = document.getElementById('height-unit');
        const showCropMarksToggle = document.getElementById('show-crop-marks');

        // Configurar manejadores de eventos
        qualityRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.quality = PreviewManager.PDF_QUALITY[e.target.value.toUpperCase()] || PreviewManager.PDF_QUALITY.MEDIUM;
                this.updatePreview(); // Re-renderizar la vista previa con la nueva calidad
            });
        });
        
        templateSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            const template = PreviewManager.TEMPLATES[selectedValue];
            if (template) {
                widthInput.value = template.width;
                heightInput.value = template.height;
                widthUnit.textContent = template.unit;
                heightUnit.textContent = template.unit;
                this.currentTemplate = template;
                // Deshabilitar inputs personalizados si se selecciona una plantilla predefinida
                widthInput.disabled = true;
                heightInput.disabled = true;
            } else {
                widthInput.value = '';
                heightInput.value = '';
                widthUnit.textContent = 'mm'; // Por defecto a mm para personalizado
                heightUnit.textContent = 'mm'; // Por defecto a mm para personalizado
                this.currentTemplate = null;
                // Habilitar inputs personalizados
                widthInput.disabled = false;
                heightInput.disabled = false;
            }
            // Después de cambiar la plantilla, ajustar la vista para que el nuevo "documento" quepa
            this.fitToScreen(); 
        });
        
        // Actualizar dimensiones personalizadas
        const updateCustomDimensions = () => {
            const width = parseFloat(widthInput.value);
            const height = parseFloat(heightInput.value);
            const unit = widthUnit.textContent; // La unidad actual mostrada
            if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                this.currentTemplate = {
                    width,
                    height,
                    unit // Usar la unidad actual
                };
            } else {
                this.currentTemplate = null; // Si los inputs están vacíos o inválidos, se considera personalizado sin plantilla
            }
            // Después de cambiar dimensiones personalizadas, ajustar la vista
            this.fitToScreen();
        };
        
        widthInput.addEventListener('input', updateCustomDimensions); 
        heightInput.addEventListener('input', updateCustomDimensions);
        
        showCropMarksToggle.addEventListener('change', (e) => {
            this.cropMarks = e.target.checked;
            this.updatePreview();
        });
        
        // Seleccionar la calidad y plantilla iniciales al cargar la UI
        const currentQualityKey = Object.keys(PreviewManager.PDF_QUALITY).find(key => 
            PreviewManager.PDF_QUALITY[key] === this.quality
        );
        if (currentQualityKey) {
            document.getElementById(`quality-${currentQualityKey.toLowerCase()}`).checked = true;
        }

        // Establecer la plantilla inicial a "Personalizado" si currentTemplate es null o no es una plantilla predefinida
        // O seleccionar la plantilla predefinida si this.currentTemplate coincide
        const initialTemplateValue = Object.keys(PreviewManager.TEMPLATES).find(key => 
            this.currentTemplate && 
            this.currentTemplate.width === PreviewManager.TEMPLATES[key].width &&
            this.currentTemplate.height === PreviewManager.TEMPLATES[key].height &&
            this.currentTemplate.unit === PreviewManager.TEMPLATES[key].unit
        );

        if (initialTemplateValue) {
            templateSelect.value = initialTemplateValue;
            widthInput.disabled = true;
            heightInput.disabled = true;
        } else {
            templateSelect.value = ''; // Seleccionar "Personalizado"
            widthInput.disabled = false;
            heightInput.disabled = false;
            // Si es personalizado, establecer los valores si currentTemplate tiene datos
            if (this.currentTemplate) {
                widthInput.value = this.currentTemplate.width;
                heightInput.value = this.currentTemplate.height;
                widthUnit.textContent = this.currentTemplate.unit;
                heightUnit.textContent = this.currentTemplate.unit;
            }
        }
    }
    
    /**
     * Dibuja marcas de recorte en el canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    drawCropMarks(ctx) {
        const width = this.canvas.width; // Usar las dimensiones originales del canvas
        const height = this.canvas.height; // Usar las dimensiones originales del canvas
        const markLength = 20; // Longitud de las líneas de la marca
        const margin = 5; // Margen desde el borde del canvas

        ctx.save();
        ctx.strokeStyle = '#FF0000'; // Color rojo para las marcas
        ctx.lineWidth = 1 / this.zoom; // Asegurar que el ancho de línea sea constante visualmente
                                     // Esto es crucial para que las líneas no se vean gruesas con el zoom

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(margin, margin + markLength);
        ctx.lineTo(margin, margin);
        ctx.lineTo(margin + markLength, margin);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(width - margin, margin + markLength);
        ctx.lineTo(width - margin, margin);
        ctx.lineTo(width - margin - markLength, margin);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(margin, height - margin - markLength);
        ctx.lineTo(margin, height - margin);
        ctx.lineTo(margin + markLength, height - margin);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(width - margin, height - margin - markLength);
        ctx.lineTo(width - margin, height - margin);
        ctx.lineTo(width - margin - markLength, height - margin);
        ctx.stroke();

        ctx.restore();
    }
    
    /**
     * Muestra una notificación toast
     * @param {string} title - Título de la notificación
     * @param {string} message - Mensaje de la notificación
     * @param {string} type - Tipo de notificación (success, danger, warning, info)
     */
    showToast(title, message, type = 'info') {
        // Crear el contenedor de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Crear el toast
        const toast = document.createElement('div');
        toast.className = `toast show bg-${type} text-white rounded p-3`;
        toast.setAttribute('role', 'alert');
        
        // Contenido del toast
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <strong>${title}</strong><br>${message}
                </div>
                <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        // Agregar el toast al contenedor
        toastContainer.appendChild(toast);
        
        // Configurar la eliminación automática después de 5 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }
}

// Inicializar el gestor de vista previa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('label-canvas');
    if (canvas) {
        window.previewManager = new PreviewManager(canvas);
    }
});