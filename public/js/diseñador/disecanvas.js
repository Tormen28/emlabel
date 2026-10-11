// disecanvas.js - Módulo para el manejo del canvas

// Verificar si ya se ha cargado este módulo
if (window.disecanvasLoaded) {
    console.warn('disecanvas.js ya fue cargado');
} else {
    window.disecanvasLoaded = true;
    
    console.log('disecanvas.js cargado correctamente');
    
    // Objeto para utilidades del canvas
    window.diseCanvasUtils = window.diseCanvasUtils || {
        limpiarSeleccion: function() {
            if (window.labelDesigner && window.labelDesigner.canvas) {
                window.labelDesigner.canvas.discardActiveObject();
                window.labelDesigner.canvas.requestRenderAll();
            }
        }
    };
}

// Comentar o eliminar la inicialización redundante si ya se maneja en diseñador.js
// if (!window.location.pathname.includes('diseñador') && !window.location.pathname.includes('disenador')) {
//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', inicializarControlesCanvas);
//     } else {
//         inicializarControlesCanvas();
//     }

//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', inicializarAplicacion);
//     } else {
//         inicializarAplicacion();
//     }
// }
// La mayor parte de la lógica de este archivo ha sido absorbida por
// `diseñador.js` y `diselabel-designer.js`.
// Si este archivo contenía funciones que *solo* se usaban en otras páginas
// y no en el diseñador, entonces su lógica debería mantenerse separada,
// pero por el contexto de esta solicitud, asumimos que es parte del diseñador.

// Si todavía hay alguna función específica de `disecanvas.js` que no se ha movido
// y que es crucial, se puede reinstaurar o integrar.
// Por ahora, este archivo se convierte principalmente en un marcador.