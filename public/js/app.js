// Configuración global
const API_BASE_URL = window.location.origin + '/modulo/app/api';
const URLROOT = window.location.origin + '/modulo';

// Función para mostrar notificaciones
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.alerts-container');
    if (container) {
        container.appendChild(alertDiv);
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
}

// Función para cargar una vista dinámicamente
async function loadView(url, containerId = 'main-content') {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar la vista');
        
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            // Crear un documento temporal para analizar el HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraer y eliminar los scripts del documento temporal
            const scripts = Array.from(doc.getElementsByTagName('script'));
            scripts.forEach(script => script.remove());
            
            // Insertar el HTML sin los scripts
            container.innerHTML = doc.body.innerHTML;
            
            // Cargar los scripts de forma segura
            await Promise.all(scripts.map(script => {
                return new Promise((resolve) => {
                    const newScript = document.createElement('script');
                    
                    // Copiar atributos del script original
                    Array.from(script.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    // Manejar scripts con src
                    if (script.src) {
                        newScript.onload = resolve;
                        newScript.onerror = resolve; // Continuar incluso si falla un script
                        newScript.src = script.src;
                    } 
                    // Manejar scripts inline
                    else if (script.textContent.trim()) {
                        try {
                            // Usar Function constructor en lugar de eval
                            const code = `(function() { ${script.textContent} })();`;
                            // Crear un blob con el código y cargarlo como un módulo
                            const blob = new Blob([code], { type: 'application/javascript' });
                            const url = URL.createObjectURL(blob);
                            newScript.src = url;
                            newScript.onload = () => {
                                URL.revokeObjectURL(url);
                                resolve();
                            };
                            newScript.onerror = resolve;
                        } catch (e) {
                            console.error('Error al ejecutar script inline:', e);
                            resolve();
                        }
                    } else {
                        resolve();
                        return; // No hacer nada si no hay contenido
                    }
                    
                    // Insertar el script en el documento
                    document.body.appendChild(newScript);
                });
            }));
        }
    } catch (error) {
        console.error('Error al cargar la vista:', error);
        showAlert('Error al cargar el contenido', 'danger');
    }
}

// Función para hacer peticiones a la API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Error en la petición');
        }
        
        return responseData;
    } catch (error) {
        console.error('Error en la petición a la API:', error);
        throw error;
    }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Manejar enlaces con data-route
    document.addEventListener('click', function(e) {
        const link = e.target.closest('[data-route]');
        if (link) {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            loadView(route);
            
            // Actualizar la URL sin recargar la página
            history.pushState(null, '', `${URLROOT}${route}`);
            
            // Marcar el enlace activo
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            link.classList.add('active');
        }
    });
    
    // Manejar el botón de retroceso/avance del navegador
    window.addEventListener('popstate', function() {
        loadView(window.location.pathname.replace(URLROOT, ''));
    });
    
    // Mostrar mensajes flash si existen
    const flashMessage = document.querySelector('.flash-message');
    if (flashMessage) {
        const type = flashMessage.dataset.type || 'info';
        showAlert(flashMessage.textContent, type);
    }
    
    // Inicializar el menú de usuario si existe
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.nextElementSibling;
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        });
        
        // Cerrar el menú al hacer clic fuera de él
        document.addEventListener('click', function(e) {
            if (!userMenu.contains(e.target) && !userMenu.nextElementSibling.contains(e.target)) {
                userMenu.nextElementSibling.style.display = 'none';
            }
        });
    }
});

// Exportar funciones globales
window.App = {
    loadView,
    apiRequest,
    showAlert,
    URLROOT,
    API_BASE_URL
};
