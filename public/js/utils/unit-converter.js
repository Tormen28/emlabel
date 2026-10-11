/**
 * Utilidad para manejar conversiones entre diferentes unidades de medida
 */
class UnitConverter {
    // DPI estándar para conversiones (puede ser configurado)
    static DPI = 96; // Puntos por pulgada estándar para pantallas
    static MM_PER_INCH = 25.4;
    
    /**
     * Convierte píxeles a milímetros
     * @param {number} pixels - Valor en píxeles
     * @param {number} [dpi=this.DPI] - Resolución en píxeles por pulgada
     * @returns {number} Valor en milímetros
     */
    static pixelsToMm(pixels, dpi = this.DPI) {
        const inches = pixels / dpi;
        return inches * this.MM_PER_INCH;
    }
    
    /**
     * Convierte milímetros a píxeles
     * @param {number} mm - Valor en milímetros
     * @param {number} [dpi=this.DPI] - Resolución en píxeles por pulgada
     * @returns {number} Valor en píxeles
     */
    static mmToPixels(mm, dpi = this.DPI) {
        const inches = mm / this.MM_PER_INCH;
        return inches * dpi;
    }
    
    /**
     * Convierte píxeles a pulgadas
     * @param {number} pixels - Valor en píxeles
     * @param {number} [dpi=this.DPI] - Resolución en píxeles por pulgada
     * @returns {number} Valor en pulgadas
     */
    static pixelsToInches(pixels, dpi = this.DPI) {
        return pixels / dpi;
    }
    
    /**
     * Convierte pulgadas a píxeles
     * @param {number} inches - Valor en pulgadas
     * @param {number} [dpi=this.DPI] - Resolución en píxeles por pulgada
     * @returns {number} Valor en píxeles
     */
    static inchesToPixels(inches, dpi = this.DPI) {
        return inches * dpi;
    }
    
    /**
     * Convierte entre unidades soportadas
     * @param {number} value - Valor a convertir
     * @param {string} fromUnit - Unidad de origen ('px', 'mm', 'in')
     * @param {string} toUnit - Unidad de destino ('px', 'mm', 'in')
     * @param {number} [dpi=this.DPI] - Resolución en píxeles por pulgada
     * @returns {number} Valor convertido
     */
    static convert(value, fromUnit, toUnit, dpi = this.DPI) {
        // Si las unidades son iguales, retornar el valor sin cambios
        if (fromUnit === toUnit) return value;
        
        // Convertir primero a píxeles (unidad intermedia)
        let pixels;
        switch (fromUnit) {
            case 'px':
                pixels = value;
                break;
            case 'mm':
                pixels = this.mmToPixels(value, dpi);
                break;
            case 'in':
                pixels = this.inchesToPixels(value, dpi);
                break;
            default:
                throw new Error(`Unidad de origen no soportada: ${fromUnit}`);
        }
        
        // Luego convertir a la unidad de destino
        switch (toUnit) {
            case 'px':
                return pixels;
            case 'mm':
                return this.pixelsToMm(pixels, dpi);
            case 'in':
                return this.pixelsToInches(pixels, dpi);
            default:
                throw new Error(`Unidad de destino no soportada: ${toUnit}`);
        }
    }
    
    /**
     * Formatea un valor numérico con unidades
     * @param {number} value - Valor a formatear
     * @param {string} unit - Unidad de medida ('px', 'mm', 'in')
     * @param {number} [decimals=2] - Número de decimales a mostrar
     * @returns {string} Valor formateado con unidades
     */
    static format(value, unit, decimals = 2) {
        const rounded = Number(value).toFixed(decimals);
        return `${rounded} ${unit}`;
    }
}

// Hacer la clase disponible globalmente
window.UnitConverter = UnitConverter;
