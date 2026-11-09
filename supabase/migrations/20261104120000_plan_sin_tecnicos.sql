-- Migración: el plan preventivo deja de tener técnicos autorizados
-- Fecha: 2026-11-04
-- Las OT que genera un plan nacen con sus tareas sin responsable, y los
-- técnicos se les asignan después, como a cualquier OT. La tabla que guardaba
-- los técnicos de cada plan ya no se usa; antes de borrarla se copia a
-- plan_tecnicos_previos para no perder el dato.

CREATE TABLE IF NOT EXISTS public.plan_tecnicos_previos (
    mant_prev_id BIGINT NOT NULL,
    tecnico_legajo VARCHAR(50) NOT NULL,
    fecha_asignacion TIMESTAMPTZ,
    PRIMARY KEY (mant_prev_id, tecnico_legajo)
);

DO $$
BEGIN
    IF to_regclass('public.mant_prev_tecnico') IS NOT NULL THEN
        INSERT INTO public.plan_tecnicos_previos (mant_prev_id, tecnico_legajo, fecha_asignacion)
        SELECT mant_prev_id, tecnico_legajo, fecha_asignacion FROM public.mant_prev_tecnico
        ON CONFLICT (mant_prev_id, tecnico_legajo) DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE public.plan_tecnicos_previos IS
    'Técnicos que tenía autorizados cada plan antes del 04/11/2026. Sólo respaldo, la aplicación no la usa.';

DROP TABLE IF EXISTS public.mant_prev_tecnico;
