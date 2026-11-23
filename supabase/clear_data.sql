-- =============================================================================
-- SIGMA · Script 2: Limpieza completa de datos de la base de datos
-- =============================================================================
-- Vacía todas las filas de las tablas de la base de datos manteniendo intactas
-- las estructuras, restricciones, funciones, vistas y relaciones del modelo
-- actual (incluyendo datos personales de perfiles, unidades de medida de
-- materiales y relación espacio -> área).
--
-- RESTRICCIÓN CRÍTICA:
--   Se preserva de forma estricta el registro del Administrador ('Admin') en la
--   tabla `administrador` y su cuenta de acceso y contraseña en `usuario`
--   (identificador = 'Admin' / rol = 1).
-- =============================================================================

BEGIN;

-- 1. Ejecución, auditoría, observaciones y consumos de tareas
DELETE FROM public.tarea_observacion;
DELETE FROM public.falla;
DELETE FROM public.tarea_ot_consume_material;
DELETE FROM public.tecnico_asignado_tarea_ot;
DELETE FROM public.tecnico_utiliza_herramienta;

-- 2. Tareas y Órdenes de Trabajo
DELETE FROM public.tarea_ot;
DELETE FROM public.orden_trabajo;

-- 3. Planes de mantenimiento preventivo y plantillas de tareas
DELETE FROM public.mant_prev_tarea;
DELETE FROM public.mantenimiento_preventivo;
DELETE FROM public.plantilla_de_tarea;
DELETE FROM public.plantilla_tipo_activo_previo;
DELETE FROM public.plan_datos_previos;
DELETE FROM public.plan_tecnicos_previos;

-- 4. Tickets y Solicitudes
DELETE FROM public.ticket;

-- 5. Movimientos de depósito, remitos, compras e inventario
DELETE FROM public.inventariomovimiento;
DELETE FROM public.remito_item;
DELETE FROM public.remito;
DELETE FROM public.linea_compra;
DELETE FROM public.compra;
DELETE FROM public.proveedor;
DELETE FROM public.material;
DELETE FROM public.herramienta;
DELETE FROM public.inventarioitem;
DELETE FROM public.inventariotipo;

-- 6. Activos, espacios, áreas, edificios y catálogos físicos
DELETE FROM public.activo;
DELETE FROM public.tipo_activo;
DELETE FROM public.espacio;
DELETE FROM public.area;
DELETE FROM public.tipo_espacio;
DELETE FROM public.edificio;
DELETE FROM public.tipo_falla;

-- 7. Prestadores externos y especialidades
DELETE FROM public.prestador_tipo_prestador;
DELETE FROM public.prestador_especialidad;
DELETE FROM public.tecnico_especialidad;
DELETE FROM public.prestador_servicio;
DELETE FROM public.tipo_prestador;
DELETE FROM public.especialidad;

-- 8. Notificaciones, historial de contraseñas, usuarios y perfiles (PRESERVANDO AL ADMIN)
DELETE FROM public.notificacion_usuario;
DELETE FROM public.historial_restablecimiento_contrasena;

-- Eliminar únicamente usuarios que NO sean el administrador (identificador 'Admin' / rol = 1)
DELETE FROM public.usuario
WHERE rol <> 1
  AND LOWER(identificador) <> 'admin'
  AND (admin_legajo IS NULL OR LOWER(admin_legajo) <> 'admin');

-- Eliminar todos los técnicos y solicitantes (autorizados)
DELETE FROM public.tecnico;
DELETE FROM public.autorizado;

-- Eliminar cualquier otro perfil en administrador que no sea el Admin principal
DELETE FROM public.administrador
WHERE LOWER(admin_legajo) <> 'admin'
  AND admin_legajo NOT IN (
      SELECT admin_legajo FROM public.usuario WHERE admin_legajo IS NOT NULL
  );

-- 9. Reiniciar las secuencias de identidad (GENERATED ALWAYS AS IDENTITY / SERIAL)
--    para que los próximos registros comiencen nuevamente desde 1.
ALTER SEQUENCE IF EXISTS public.edificio_edificio_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tipo_espacio_tipo_espacio_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.espacio_espacio_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.area_area_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tipo_activo_tipo_activo_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.plantilla_de_tarea_tarea_plan_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.mantenimiento_preventivo_mant_prev_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.ticket_ticket_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.orden_trabajo_ot_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.falla_falla_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tipo_falla_tipo_falla_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.prestador_servicio_prestador_serv_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tipo_prestador_tipo_prestador_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.proveedor_proveedor_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.compra_compra_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.especialidad_especialidad_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.remito_remito_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.tarea_observacion_observacion_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.historial_restablecimiento_contrasena_restablecimiento_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.inventariotipo_inventariotipoid_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.inventariomovimiento_inventariomovimientoid_seq RESTART WITH 1;

COMMIT;
