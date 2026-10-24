# emlabel — módulo de gestión

Aplicación PHP con arquitectura por módulos (front controller + capa de acceso a datos) para la gestión de etiquetas y registros.

## Estructura

```
modulo/
├── index.php            # entrada
├── app/
│   ├── bootstrap.php · init.php
│   ├── config/          # configuración
│   ├── core/            # núcleo (router, request, response)
│   ├── controllers/ · models/ · views/ · templates/
│   ├── api/             # endpoints
│   ├── helpers/
│   └── modules/         # módulos de negocio
├── public/              # css, js, img (raíz web)
├── emlabel_app.sql      # esquema de base de datos
├── uploads/             # archivos subidos (no versionados)
└── logs/
```

## Puesta en marcha

1. Importar `emlabel_app.sql` en MySQL/MariaDB.
2. Ajustar credenciales en `app/config/`.
3. Apuntar el servidor web a `public/`.

Los archivos volcados en `uploads/` y `logs/` no se versionan.

## Contexto

Proyecto de práctica inicial de PHP + MySQL sobre XAMPP: aplicación por módulos con front controller.


## ⚙️ Instalación

Este proyecto **no trae credenciales**. Los datos de conexión viven en `app/config/config.local.php`,
que está en `.gitignore` y nunca se sube al repositorio.

```bash
# 1. Copia el ejemplo
copy app\config\config.example.php app\config\config.local.php

# 2. Edita app/config/config.local.php con tus datos de MySQL

# 3. Importa emlabel_app.sql en phpMyAdmin

# 4. Abre http://localhost/emlabel/
```
