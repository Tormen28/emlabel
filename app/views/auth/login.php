<?php
// Establecer el título de la página
$title = 'Iniciar Sesión';
?>

<div class="container">
    <div class="row justify-content-center mt-5">
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <h2 class="h4">Iniciar Sesión</h2>
                        <p class="text-muted">Ingresa tus credenciales para continuar</p>
                    </div>
                    
                    <?php if (has_flash('error')): ?>
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="bi bi-exclamation-triangle me-2"></i><?= get_flash('error') ?>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
                        </div>
                    <?php endif; ?>
                    
                    <form action="/modulo/home/login" method="POST">
                        <input type="hidden" name="csrf_token" value="<?= generarTokenCSRF(); ?>">
                        
                        <div class="mb-3">
                            <label for="email" class="form-label">Correo electrónico</label>
                            <input type="email" class="form-control" id="email" name="email" 
                                   value="<?= htmlspecialchars($email ?? '') ?>" required 
                                   placeholder="usuario@ejemplo.com">
                        </div>
                        
                        <div class="mb-3">
                            <label for="password" class="form-label">Contraseña</label>
                            <input type="password" class="form-control" id="password" 
                                   name="password" required placeholder="••••••••">
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
                            </button>
                        </div>
                    </form>
                    
                    <div class="text-center mt-3">
                        <a href="/modulo/home/recuperar" class="text-decoration-none">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-3">
                <p class="text-muted">
                    ¿No tienes una cuenta? 
                    <a href="/modulo/home/registro" class="text-decoration-none">Regístrate</a>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Script para manejar la validación del formulario -->
<script>
$(document).ready(function() {
    // Validación del formulario
    $('form').validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            email: {
                required: "Por favor ingresa tu correo electrónico",
                email: "Por favor ingresa un correo electrónico válido"
            },
            password: {
                required: "Por favor ingresa tu contraseña",
                minlength: "La contraseña debe tener al menos 6 caracteres"
            }
        },
        errorElement: 'div',
        errorPlacement: function(error, element) {
            error.addClass('invalid-feedback');
            element.closest('.mb-3').append(error);
        },
        highlight: function(element, errorClass, validClass) {
            $(element).addClass('is-invalid');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass('is-invalid');
        }
    });
});
</script>
