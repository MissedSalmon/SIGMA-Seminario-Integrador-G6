-- Migración: los planes preventivos se programan por activo, no por plan
-- Fecha: 2026-11-03
-- Correcciones del Sprint 5:
--   * El plan define sólo la periodicidad. La próxima fecha se calcula para cada
--     activo: desde su última OT finalizada de ese plan, o desde que el plan le
--     aplica (la más nueva entre la alta del activo y la alta del plan).
--   * Los planes son siempre preventivos: se quita el "tipo".
--   * La OT preventiva guarda la fecha del ciclo que cubre, y un índice único
--     impide que se generen dos OT del mismo activo, plan y ciclo.
--
-- Para no perder datos, la próxima ejecución y el tipo de cada plan se copian a
-- plan_datos_previos antes de borrar las columnas.

-- 1. Respaldo de lo que se borra
CREATE TABLE IF NOT EXISTS public.plan_datos_previos (
    mant_prev_id BIGINT PRIMARY KEY,
    mant_prev_tipo_mant VARCHAR(50),
    mant_prev_fecha_prox_gen DATE
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'mantenimiento_preventivo'
          AND column_name = 'mant_prev_fecha_prox_gen'
    ) THEN
        INSERT INTO public.plan_datos_previos (mant_prev_id, mant_prev_tipo_mant, mant_prev_fecha_prox_gen)
        SELECT mant_prev_id, mant_prev_tipo_mant, mant_prev_fecha_prox_gen
        FROM public.mantenimiento_preventivo
        ON CONFLICT (mant_prev_id) DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE public.plan_datos_previos IS
    'Tipo y próxima ejecución que tenía cada plan antes del 03/11/2026. Sólo respaldo, la aplicación no la usa.';

-- 2. Desde cuándo aplica el plan. Los planes que ya existen quedan con la fecha
-- de esta migración: así los activos viejos no generan todas sus OT juntas.
ALTER TABLE public.mantenimiento_preventivo
    ADD COLUMN IF NOT EXISTS mant_prev_fecha_alta DATE NOT NULL
        DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;

COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_fecha_alta IS
    'Desde cuándo aplica el plan. Para un activo anterior al plan, el primer ciclo se cuenta desde esta fecha.';

ALTER TABLE public.mantenimiento_preventivo
    DROP COLUMN IF EXISTS mant_prev_fecha_prox_gen,
    DROP COLUMN IF EXISTS mant_prev_tipo_mant;

-- 3. Fecha del ciclo de cada OT preventiva
ALTER TABLE public.orden_trabajo
    ADD COLUMN IF NOT EXISTS ot_fecha_programada DATE;

COMMENT ON COLUMN public.orden_trabajo.ot_fecha_programada IS
    'Sólo en OT preventivas: la fecha del ciclo del plan que cubre esta OT.';

-- Las OT preventivas que ya existen toman como ciclo el día en que se generaron.
UPDATE public.orden_trabajo
SET ot_fecha_programada = (ot_fecha_alta AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
WHERE mant_prev_id IS NOT NULL
  AND ot_fecha_programada IS NULL
  AND ot_fecha_alta IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orden_trabajo_ciclo_preventivo
    ON public.orden_trabajo (mant_prev_id, activo_codigo, ot_fecha_programada)
    WHERE mant_prev_id IS NOT NULL;
