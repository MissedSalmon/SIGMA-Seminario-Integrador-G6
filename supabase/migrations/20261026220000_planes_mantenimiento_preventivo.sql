-- Migración: Planes de Mantenimiento Preventivo (Sprint 5)
-- Fecha: 2026-10-26
-- Descripción:
-- 1. Permite que mantenimiento_preventivo no requiera un activo específico (aplica a nivel de tipo_activo).
-- 2. Agrega campos para tipo de mantenimiento, estado activo/baja lógica, próxima fecha de generación y periodicidad estructurada.
-- 3. Crea tabla mant_prev_tecnico para asignar técnicos autorizados a planes preventivos.
-- 4. Agrega columna activo_codigo a orden_trabajo para vincular directamente la OT preventiva a su activo físico.

-- 1. Flexibilizar activo_codigo en mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo
    ALTER COLUMN activo_codigo DROP NOT NULL;

-- 2. Nuevos atributos en mantenimiento_preventivo
ALTER TABLE public.mantenimiento_preventivo
    ADD COLUMN IF NOT EXISTS mant_prev_tipo_mant VARCHAR(50) NOT NULL DEFAULT 'Preventivo',
    ADD COLUMN IF NOT EXISTS mant_prev_activo BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS mant_prev_fecha_baja TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS mant_prev_fecha_prox_gen DATE,
    ADD COLUMN IF NOT EXISTS mant_prev_intervalo INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS mant_prev_unidad_frec VARCHAR(20) NOT NULL DEFAULT 'meses';

-- 3. Vincular activo directamente a orden_trabajo (especialmente para órdenes preventivas)
ALTER TABLE public.orden_trabajo
    ADD COLUMN IF NOT EXISTS activo_codigo VARCHAR(50) REFERENCES public.activo(activo_codigo);

-- 4. Tabla de técnicos asignados al plan preventivo
CREATE TABLE IF NOT EXISTS public.mant_prev_tecnico (
    mant_prev_id BIGINT NOT NULL REFERENCES public.mantenimiento_preventivo(mant_prev_id) ON DELETE CASCADE,
    tecnico_legajo VARCHAR(50) NOT NULL REFERENCES public.tecnico(tecnico_legajo) ON DELETE RESTRICT,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (mant_prev_id, tecnico_legajo)
);

COMMENT ON TABLE public.mant_prev_tecnico IS 'Técnicos asignados a un plan de mantenimiento preventivo';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_tipo_mant IS 'Tipo o clasificación de mantenimiento (ej: Preventivo, Predictivo)';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_activo IS 'Estado lógico del plan: true si está activo, false si está dado de baja';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_fecha_baja IS 'Fecha y hora en que se dio de baja lógica el plan';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_fecha_prox_gen IS 'Próxima fecha programada para la generación de órdenes de trabajo';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_intervalo IS 'Valor numérico del intervalo de frecuencia (ej: 6)';
COMMENT ON COLUMN public.mantenimiento_preventivo.mant_prev_unidad_frec IS 'Unidad de tiempo del intervalo (días, semanas, meses, años)';
COMMENT ON COLUMN public.orden_trabajo.activo_codigo IS 'Código del activo afectado en la orden de trabajo (indispensable para OTs preventivas)';
