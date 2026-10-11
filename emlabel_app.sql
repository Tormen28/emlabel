-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-06-2025 a las 00:18:41
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `emlabel_app`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones_impresion`
--

CREATE TABLE `configuraciones_impresion` (
  `id` int(11) NOT NULL,
  `plantilla_id` int(11) NOT NULL,
  `impresora_id` int(11) DEFAULT NULL,
  `nombre_configuracion` varchar(255) NOT NULL,
  `configuracion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuracion`)),
  `predeterminada` tinyint(1) DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `elementos_plantilla`
--

CREATE TABLE `elementos_plantilla` (
  `id` int(11) NOT NULL,
  `plantilla_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `contenido` text DEFAULT NULL,
  `posicion_x` int(11) DEFAULT NULL,
  `posicion_y` int(11) DEFAULT NULL,
  `ancho` int(11) DEFAULT NULL,
  `alto` int(11) DEFAULT NULL,
  `rotacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `impresoras`
--

CREATE TABLE `impresoras` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `driver` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plantillas`
--

CREATE TABLE `plantillas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ancho` int(11) NOT NULL,
  `alto` int(11) NOT NULL,
  `unidad_medida` enum('mm','cm','in','px') NOT NULL DEFAULT 'mm',
  `es_activo` tinyint(1) NOT NULL DEFAULT 1,
  `es_predeterminada` tinyint(1) NOT NULL DEFAULT 0,
  `elementos_json` longtext DEFAULT NULL COMMENT 'JSON con la información de los elementos del diseño de la plantilla',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `session_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `plantillas`
--

INSERT INTO `plantillas` (`id`, `nombre`, `descripcion`, `ancho`, `alto`, `unidad_medida`, `es_activo`, `es_predeterminada`, `elementos_json`, `fecha_creacion`, `fecha_actualizacion`, `session_id`) VALUES
(3, 'hgfg', 'fggf', 800, 600, 'mm', 1, 0, '[{\"id\":1750971066962,\"type\":\"barcode\",\"x\":153.2534637451172,\"y\":100.03819274902344,\"width\":100,\"height\":50,\"opacity\":1,\"rotation\":0,\"selected\":true,\"lineColor\":\"#000000\",\"background\":\"#FFFFFF\",\"displayValue\":true,\"value\":\"1234567890\"}]', '2025-06-26 16:51:16', NULL, NULL),
(4, 'jjjjjj', '', 800, 600, 'mm', 1, 0, '[{\"id\":1750971807591,\"type\":\"barcode\",\"x\":95.25346374511719,\"y\":102.704833984375,\"width\":100,\"height\":50,\"opacity\":1,\"rotation\":0,\"selected\":true,\"lineColor\":\"#000000\",\"background\":\"#FFFFFF\",\"displayValue\":true,\"value\":\"1234567890\"}]', '2025-06-26 17:03:32', NULL, NULL),
(5, 'jhghg', '', 1800, 600, 'mm', 1, 0, '[]', '2025-06-26 17:03:51', NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `configuraciones_impresion`
--
ALTER TABLE `configuraciones_impresion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plantilla_id` (`plantilla_id`),
  ADD KEY `impresora_id` (`impresora_id`);

--
-- Indices de la tabla `elementos_plantilla`
--
ALTER TABLE `elementos_plantilla`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plantilla_id` (`plantilla_id`);

--
-- Indices de la tabla `impresoras`
--
ALTER TABLE `impresoras`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `plantillas`
--
ALTER TABLE `plantillas`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `configuraciones_impresion`
--
ALTER TABLE `configuraciones_impresion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `elementos_plantilla`
--
ALTER TABLE `elementos_plantilla`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `impresoras`
--
ALTER TABLE `impresoras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `plantillas`
--
ALTER TABLE `plantillas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `configuraciones_impresion`
--
ALTER TABLE `configuraciones_impresion`
  ADD CONSTRAINT `configuraciones_impresion_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `configuraciones_impresion_ibfk_2` FOREIGN KEY (`impresora_id`) REFERENCES `impresoras` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `elementos_plantilla`
--
ALTER TABLE `elementos_plantilla`
  ADD CONSTRAINT `elementos_plantilla_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
