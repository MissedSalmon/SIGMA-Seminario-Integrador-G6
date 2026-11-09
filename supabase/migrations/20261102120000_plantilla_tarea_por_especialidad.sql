-- Migración: las plantillas de tareas pasan de tipo de activo a especialidad
-- Fecha: 2026-11-02
-- Corrección del Sprint 5 pedida por los profesores: una tarea estándar se asocia
-- a la especialidad que la hace, no al tipo de activo. Con eso se pueden buscar
-- los técnicos de esa especialidad para asignarlos.
--
-- Para no perder datos:
--   1. El tipo de activo de cada plantilla se copia a plantilla_tipo_activo_previo
--      antes de borrar la columna.
--   2. La especialidad se completa sola con las reglas de abajo. Lo que ninguna
--      regla reconoce queda en NULL y se completa desde "Plantillas de tareas".
-- Las reglas buscan la especialidad por nombre, sin mayúsculas ni tildes, y no
-- crean ninguna: si el nombre no existe, la plantilla queda en NULL.

-- 1. Respaldo del vínculo anterior
CREATE TABLE IF NOT EXISTS public.plantilla_tipo_activo_previo (
    tarea_plan_id BIGINT PRIMARY KEY,
    tipo_activo_id BIGINT
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'plantilla_de_tarea' AND column_name = 'tipo_activo_id'
    ) THEN
        INSERT INTO public.plantilla_tipo_activo_previo (tarea_plan_id, tipo_activo_id)
        SELECT tarea_plan_id, tipo_activo_id FROM public.plantilla_de_tarea
        ON CONFLICT (tarea_plan_id) DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE public.plantilla_tipo_activo_previo IS
    'Tipo de activo que tenía cada plantilla de tarea antes del 02/11/2026. Sólo respaldo, la aplicación no la usa.';

-- 2. Nueva columna
ALTER TABLE public.plantilla_de_tarea
    ADD COLUMN IF NOT EXISTS especialidad_id BIGINT REFERENCES public.especialidad(especialidad_id);

CREATE INDEX IF NOT EXISTS idx_plantilla_de_tarea_especialidad
    ON public.plantilla_de_tarea (especialidad_id);

COMMENT ON COLUMN public.plantilla_de_tarea.especialidad_id IS
    'Especialidad que realiza la tarea. NULL sólo en plantillas anteriores al 02/11/2026 que las reglas de la migración no reconocieron.';

-- 3. Nombres de especialidad parejos: son áreas de trabajo, no personas. Los
-- técnicos que las tienen no pierden nada, porque se cambia sólo el nombre. Si
-- ya existe una con el nombre nuevo, no se toca.
UPDATE public.especialidad SET especialidad_nom = 'Electricidad'
WHERE especialidad_nom = 'Electricista'
  AND NOT EXISTS (SELECT 1 FROM public.especialidad WHERE especialidad_nom = 'Electricidad');

UPDATE public.especialidad SET especialidad_nom = 'Gas'
WHERE especialidad_nom = 'Gasista'
  AND NOT EXISTS (SELECT 1 FROM public.especialidad WHERE especialidad_nom = 'Gas');

-- 4. Completar la especialidad de las plantillas que ya existen
-- Reglas en orden de prioridad. "donde" dice si el patrón se busca en el nombre
-- de la tarea o en el del tipo de activo. Gana la primera que coincide. Los
-- patrones van sin mayúsculas ni tildes.
--   Ejemplos:
--     "Cableado", "Cambiar foco"          -> Electricidad
--     "Limpiar filtros", "Cambio de gas"  -> Refrigeracion
--     "Limpieza profunda" de un aire      -> Refrigeracion (lo dice el tipo de activo)
--     "pintar", "Humedad"                 -> Albañilería
--     "limpiar" en un aula                -> Mantenimiento general (regla de último recurso)
WITH reglas (prioridad, donde, patron, especialidad) AS (
    VALUES
        (1, 'tarea', 'cabl|foco|lampar|luminar|luz|enchuf|tomacorr|electric|tablero|interruptor', 'Electricidad'),
        (2, 'tarea', 'filtro|gas|refriger|compresor|split|climatiz', 'Refrigeracion'),
        (3, 'tarea', 'humedad|pint|revoque|mamposter|pared|techo|fisura|cielorraso', 'Albañilería'),
        (4, 'tarea', 'canill|caneria|agua|inodoro|desag|cloaca|plom|bacha|pileta', 'Plomeria'),
        (5, 'tarea', 'puerta|ventana|madera|mueble|carpint|cerradur|bisagra|banco|pizarr', 'Carpinteria'),
        (6, 'tipo',  'aire|split|heladera|freezer|dispenser', 'Refrigeracion'),
        (7, 'tipo',  'luminaria|televisor|proyector|electr|tablero', 'Electricidad'),
        (8, 'tarea', 'limpi|mantenimiento|revision|revisar|inspecc', 'Mantenimiento general')
),
candidatas AS (
    SELECT
        p.tarea_plan_id,
        r.prioridad,
        e.especialidad_id
    FROM public.plantilla_de_tarea p
    LEFT JOIN public.plantilla_tipo_activo_previo previo ON previo.tarea_plan_id = p.tarea_plan_id
    LEFT JOIN public.tipo_activo ta ON ta.tipo_activo_id = previo.tipo_activo_id
    JOIN reglas r ON translate(lower(
        CASE r.donde WHEN 'tarea' THEN p.tarea_plan_nom ELSE COALESCE(ta.tipo_activo_nom, '') END
    ), 'áéíóúüñ', 'aeiouun') ~ r.patron
    JOIN public.especialidad e ON translate(lower(e.especialidad_nom), 'áéíóúüñ', 'aeiouun')
        = translate(lower(r.especialidad), 'áéíóúüñ', 'aeiouun')
    WHERE p.especialidad_id IS NULL
),
elegidas AS (
    SELECT DISTINCT ON (tarea_plan_id) tarea_plan_id, especialidad_id
    FROM candidatas
    ORDER BY tarea_plan_id, prioridad
)
UPDATE public.plantilla_de_tarea p
SET especialidad_id = elegidas.especialidad_id
FROM elegidas
WHERE p.tarea_plan_id = elegidas.tarea_plan_id;

-- 5. Quitar el vínculo con el tipo de activo (ya está respaldado arriba)
ALTER TABLE public.plantilla_de_tarea
    DROP COLUMN IF EXISTS tipo_activo_id;
