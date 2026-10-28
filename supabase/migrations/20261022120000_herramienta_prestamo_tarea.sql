-- Herramientas utilizadas: de qué tarea salió cada préstamo (22/10/2026).
--
-- Cuando el técnico toma una herramienta desde una tarea en ejecución, el
-- préstamo guarda esa OT y esa tarea, así el historial puede mostrar en qué
-- OT se usó.
--
-- Las dos columnas son opcionales: los préstamos viejos no las tienen, y el
-- administrador también asigna herramientas desde el depósito sin tarea.
-- Van las dos juntas o ninguna. Si se borra la tarea, el préstamo queda sin
-- tarea pero no se pierde.
ALTER TABLE public.tecnico_utiliza_herramienta
    ADD COLUMN ot_id BIGINT,
    ADD COLUMN tarea_id INT,
    ADD CONSTRAINT tecnico_utiliza_herramienta_tarea_fkey
        FOREIGN KEY (ot_id, tarea_id) REFERENCES public.tarea_ot (ot_id, tarea_id) ON DELETE SET NULL,
    ADD CONSTRAINT tecnico_utiliza_herramienta_tarea_completa
        CHECK ((ot_id IS NULL) = (tarea_id IS NULL));
