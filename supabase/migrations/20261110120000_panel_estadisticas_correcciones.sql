-- Correcciones de cálculo del panel de estadísticas (10/11/2026).
--
-- - Stock mínimo: un material está bajo el mínimo sólo si su stock es MENOR al
--   mínimo. Igual al mínimo no cuenta, como la alerta de la campana (HU-33).
-- - OT por prioridad: las OT sin prioridad cargada van en la fila «Sin prioridad»,
--   así la distribución suma el total de OT no canceladas.
-- - Evolución de tickets:
--   · sin fecha «desde» toma todo el historial (antes, sólo los últimos 6 meses);
--   · los meses se arman en la hora de Argentina (antes, en UTC: un ticket del
--     31/10 a las 22 h caía en noviembre);
--   · el nombre del mes va en español y no depende del idioma del servidor.

DROP INDEX IF EXISTS public.idx_material_stock_critico;
CREATE INDEX IF NOT EXISTS idx_material_stock_critico
    ON public.material (mat_cod)
    WHERE mat_stock_actual < mat_stock_min;

-- 1. Resumen general (M-01, M-07, M-15, M-16)
CREATE OR REPLACE FUNCTION public.estadistica_resumen_general()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
activos AS (
    SELECT
        COUNT(*) FILTER (WHERE activo_estado = 1) AS operativos,
        COUNT(*) FILTER (WHERE activo_estado IN (1, 2, 3)) AS en_servicio,
        COUNT(*) FILTER (WHERE activo_estado = 4) AS retirados,
        COUNT(*) AS total_activos
    FROM activo
),
preventivos AS (
    SELECT
        COUNT(DISTINCT p.tipo_activo_id) FILTER (WHERE p.mant_prev_activo = true) AS tipos_con_plan,
        (SELECT COUNT(*) FROM tipo_activo) AS total_tipos,
        (
            SELECT COUNT(*)
            FROM activo a
            WHERE a.activo_estado IN (1, 2, 3)
              AND a.tipo_activo_id IN (
                  SELECT DISTINCT mp.tipo_activo_id
                  FROM mantenimiento_preventivo mp
                  WHERE mp.mant_prev_activo = true
              )
        ) AS activos_cubiertos,
        (SELECT COUNT(*) FROM activo WHERE activo_estado IN (1, 2, 3)) AS total_activos_en_servicio
    FROM mantenimiento_preventivo p
),
tecnicos AS (
    SELECT
        COUNT(*) FILTER (WHERE tecnico_disponibilidad = true) AS disponibles,
        COUNT(*) AS total_tecnicos
    FROM tecnico
),
materiales AS (
    SELECT
        COUNT(*) FILTER (WHERE mat_stock_actual < mat_stock_min) AS bajo_minimo,
        COUNT(*) AS total_materiales
    FROM material
),
materiales_detalle AS (
    SELECT jsonb_agg(
        jsonb_build_object(
            'codigo', m.mat_cod,
            'nombre', m.mat_nom,
            'stockActual', m.mat_stock_actual,
            'stockMinimo', m.mat_stock_min,
            'faltante', m.mat_stock_min - m.mat_stock_actual
        ) ORDER BY (m.mat_stock_min - m.mat_stock_actual) DESC, m.mat_nom ASC
    ) AS items
    FROM material m
    WHERE m.mat_stock_actual < m.mat_stock_min
)
SELECT jsonb_build_object(
    'operatividad', jsonb_build_object(
        'operativos', (SELECT operativos FROM activos),
        'enServicio', (SELECT en_servicio FROM activos),
        'retirados', (SELECT retirados FROM activos),
        'totalActivos', (SELECT total_activos FROM activos),
        'porcentaje', CASE
            WHEN (SELECT en_servicio FROM activos) > 0
            THEN ROUND(((SELECT operativos::numeric FROM activos) / (SELECT en_servicio FROM activos) * 100), 1)
            ELSE 0
        END
    ),
    'coberturaPreventiva', jsonb_build_object(
        'tiposConPlan', (SELECT tipos_con_plan FROM preventivos),
        'totalTipos', (SELECT total_tipos FROM preventivos),
        'porcentajeTipos', CASE
            WHEN (SELECT total_tipos FROM preventivos) > 0
            THEN ROUND(((SELECT tipos_con_plan::numeric FROM preventivos) / (SELECT total_tipos FROM preventivos) * 100), 1)
            ELSE 0
        END,
        'activosCubiertos', (SELECT activos_cubiertos FROM preventivos),
        'totalActivosEnServicio', (SELECT total_activos_en_servicio FROM preventivos),
        'porcentajeActivos', CASE
            WHEN (SELECT total_activos_en_servicio FROM preventivos) > 0
            THEN ROUND(((SELECT activos_cubiertos::numeric FROM preventivos) / (SELECT total_activos_en_servicio FROM preventivos) * 100), 1)
            ELSE 0
        END
    ),
    'disponibilidadTecnicos', jsonb_build_object(
        'disponibles', (SELECT disponibles FROM tecnicos),
        'totalTecnicos', (SELECT total_tecnicos FROM tecnicos),
        'porcentaje', CASE
            WHEN (SELECT total_tecnicos FROM tecnicos) > 0
            THEN ROUND(((SELECT disponibles::numeric FROM tecnicos) / (SELECT total_tecnicos FROM tecnicos) * 100), 1)
            ELSE 0
        END
    ),
    'materialesBajoMinimo', jsonb_build_object(
        'bajoMinimo', (SELECT bajo_minimo FROM materiales),
        'totalMateriales', (SELECT total_materiales FROM materiales),
        'porcentaje', CASE
            WHEN (SELECT total_materiales FROM materiales) > 0
            THEN ROUND(((SELECT bajo_minimo::numeric FROM materiales) / (SELECT total_materiales FROM materiales) * 100), 1)
            ELSE 0
        END,
        'items', COALESCE((SELECT items FROM materiales_detalle), '[]'::jsonb)
    )
);
$$;

-- 2. Órdenes de trabajo por origen, estado, prioridad y tareas (M-08, M-09, M-10, M-12)
CREATE OR REPLACE FUNCTION public.estadistica_ordenes_trabajo(
    p_desde TIMESTAMPTZ DEFAULT NULL,
    p_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
ots_filtradas AS (
    SELECT
        ot.ot_id,
        ot.ticket_id,
        ot.mant_prev_id,
        ot.ot_estado,
        ot.ot_prioridad
    FROM orden_trabajo ot
    WHERE (p_desde IS NULL OR ot.ot_fecha_alta >= p_desde)
      AND (p_hasta IS NULL OR ot.ot_fecha_alta <= p_hasta)
),
totales AS (
    SELECT
        COUNT(*) AS total_ot,
        COUNT(*) FILTER (WHERE ot_estado <> 5) AS total_no_canceladas,
        COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS correctivas,
        COUNT(*) FILTER (WHERE mant_prev_id IS NOT NULL) AS preventivas
    FROM ots_filtradas
),
estados_ot_base AS (
    SELECT unnest(ARRAY[1, 2, 3, 4, 5]) AS id,
           unnest(ARRAY['Creada', 'Asignada', 'En ejecución', 'Finalizada', 'Cancelada']) AS nombre
),
por_estado AS (
    SELECT
        eob.id,
        eob.nombre,
        COUNT(ot.ot_id) AS cantidad,
        CASE
            WHEN (SELECT total_ot FROM totales) > 0
            THEN ROUND((COUNT(ot.ot_id)::numeric / (SELECT total_ot FROM totales) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM estados_ot_base eob
    LEFT JOIN ots_filtradas ot ON ot.ot_estado = eob.id
    GROUP BY eob.id, eob.nombre
),
prioridades_base AS (
    SELECT * FROM (VALUES
        (1, 'Alta', 1),
        (2, 'Media', 2),
        (3, 'Baja', 3),
        (NULL::INT, 'Sin prioridad', 4)
    ) AS v(id, nombre, orden)
),
por_prioridad AS (
    SELECT
        pb.id,
        pb.nombre,
        pb.orden,
        COUNT(ot.ot_id) AS cantidad,
        CASE
            WHEN (SELECT total_no_canceladas FROM totales) > 0
            THEN ROUND((COUNT(ot.ot_id)::numeric / (SELECT total_no_canceladas FROM totales) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM prioridades_base pb
    LEFT JOIN ots_filtradas ot
      ON ot.ot_prioridad IS NOT DISTINCT FROM pb.id
     AND ot.ot_estado <> 5
    GROUP BY pb.id, pb.nombre, pb.orden
),
tareas_filtradas AS (
    SELECT t.tarea_estado
    FROM tarea_ot t
    WHERE t.ot_id IN (SELECT ot_id FROM ots_filtradas)
),
total_tareas AS (
    SELECT COUNT(*) AS total FROM tareas_filtradas
),
estados_tarea_base AS (
    SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6]) AS id,
           unnest(ARRAY['Creada', 'Asignada', 'En ejecución', 'Pendiente', 'Finalizada', 'Cancelada']) AS nombre
),
cumplimiento_tareas AS (
    SELECT
        etb.id,
        etb.nombre,
        COUNT(tf.tarea_estado) AS cantidad,
        CASE
            WHEN (SELECT total FROM total_tareas) > 0
            THEN ROUND((COUNT(tf.tarea_estado)::numeric / (SELECT total FROM total_tareas) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM estados_tarea_base etb
    LEFT JOIN tareas_filtradas tf ON tf.tarea_estado = etb.id
    GROUP BY etb.id, etb.nombre
)
SELECT jsonb_build_object(
    'porOrigen', jsonb_build_object(
        'correctivas', (SELECT correctivas FROM totales),
        'preventivas', (SELECT preventivas FROM totales),
        'total', (SELECT total_ot FROM totales),
        'porcentajeCorrectivas', CASE
            WHEN (SELECT total_ot FROM totales) > 0
            THEN ROUND(((SELECT correctivas::numeric FROM totales) / (SELECT total_ot FROM totales) * 100), 1)
            ELSE 0
        END,
        'porcentajePreventivas', CASE
            WHEN (SELECT total_ot FROM totales) > 0
            THEN ROUND(((SELECT preventivas::numeric FROM totales) / (SELECT total_ot FROM totales) * 100), 1)
            ELSE 0
        END
    ),
    'porEstado', (
        SELECT jsonb_agg(
            jsonb_build_object('id', pe.id, 'nombre', pe.nombre, 'cantidad', pe.cantidad, 'porcentaje', pe.porcentaje)
            ORDER BY pe.id
        ) FROM por_estado pe
    ),
    'porPrioridad', (
        SELECT jsonb_agg(
            jsonb_build_object('id', pp.id, 'nombre', pp.nombre, 'cantidad', pp.cantidad, 'porcentaje', pp.porcentaje)
            ORDER BY pp.orden
        ) FROM por_prioridad pp
    ),
    'cumplimientoTareas', (
        SELECT jsonb_agg(
            jsonb_build_object('id', ct.id, 'nombre', ct.nombre, 'cantidad', ct.cantidad, 'porcentaje', ct.porcentaje)
            ORDER BY ct.id
        ) FROM cumplimiento_tareas ct
    ),
    'totalOt', (SELECT total_ot FROM totales),
    'totalNoCanceladas', (SELECT total_no_canceladas FROM totales),
    'totalTareas', (SELECT total FROM total_tareas)
);
$$;

-- 3. Evolución mensual de tickets (M-11) y tickets por estado (M-05)
CREATE OR REPLACE FUNCTION public.estadistica_evolucion_tickets(
    p_desde TIMESTAMPTZ DEFAULT NULL,
    p_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
rango AS (
    -- Sin «desde», el período arranca con el primer ticket registrado.
    SELECT
        COALESCE(p_desde, (SELECT MIN(ticket_fecha_alta) FROM ticket), now()) AS desde,
        COALESCE(p_hasta, now()) AS hasta
),
meses AS (
    -- Meses en la hora de Argentina (timestamp sin zona).
    SELECT generate_series(
        date_trunc('month', (SELECT desde FROM rango) AT TIME ZONE 'America/Argentina/Buenos_Aires'),
        date_trunc('month', (SELECT hasta FROM rango) AT TIME ZONE 'America/Argentina/Buenos_Aires'),
        interval '1 month'
    ) AS mes
),
altas AS (
    SELECT
        date_trunc('month', t.ticket_fecha_alta AT TIME ZONE 'America/Argentina/Buenos_Aires') AS mes,
        COUNT(*) AS cantidad
    FROM ticket t
    WHERE t.ticket_fecha_alta >= (SELECT desde FROM rango)
      AND t.ticket_fecha_alta <= (SELECT hasta FROM rango)
    GROUP BY 1
),
cierres AS (
    SELECT
        date_trunc('month', t.ticket_fecha_cierre AT TIME ZONE 'America/Argentina/Buenos_Aires') AS mes,
        COUNT(*) AS cantidad
    FROM ticket t
    WHERE t.ticket_estado = 6
      AND t.ticket_fecha_cierre >= (SELECT desde FROM rango)
      AND t.ticket_fecha_cierre <= (SELECT hasta FROM rango)
    GROUP BY 1
),
mes_actual AS (
    SELECT date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires') AS mes
),
evolucion AS (
    SELECT
        m.mes,
        to_char(m.mes, 'YYYY-MM') AS periodo,
        (ARRAY['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'])[EXTRACT(MONTH FROM m.mes)::INT]
            || ' ' || to_char(m.mes, 'YYYY')
            || CASE WHEN m.mes = (SELECT mes FROM mes_actual) THEN ' (parcial)' ELSE '' END AS mes_rotulo,
        COALESCE(a.cantidad, 0) AS tickets_creados,
        COALESCE(c.cantidad, 0) AS tickets_cerrados,
        (m.mes = (SELECT mes FROM mes_actual)) AS es_parcial
    FROM meses m
    LEFT JOIN altas a ON a.mes = m.mes
    LEFT JOIN cierres c ON c.mes = m.mes
),
tickets_periodo AS (
    SELECT t.ticket_estado
    FROM ticket t
    WHERE t.ticket_fecha_alta >= (SELECT desde FROM rango)
      AND t.ticket_fecha_alta <= (SELECT hasta FROM rango)
),
total_tickets AS (
    SELECT COUNT(*) AS total FROM tickets_periodo
),
estados_ticket_base AS (
    SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) AS id,
           unnest(ARRAY['Creado', 'Validado', 'Asignado', 'En ejecución', 'Finalizado', 'Cerrado', 'Rechazado']) AS nombre
),
por_estado AS (
    SELECT
        etb.id,
        etb.nombre,
        COUNT(tp.ticket_estado) AS cantidad,
        CASE
            WHEN (SELECT total FROM total_tickets) > 0
            THEN ROUND((COUNT(tp.ticket_estado)::numeric / (SELECT total FROM total_tickets) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM estados_ticket_base etb
    LEFT JOIN tickets_periodo tp ON tp.ticket_estado = etb.id
    GROUP BY etb.id, etb.nombre
)
SELECT jsonb_build_object(
    'evolucion', COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'periodo', ev.periodo,
                'mesRotulo', ev.mes_rotulo,
                'ticketsCreados', ev.tickets_creados,
                'ticketsCerrados', ev.tickets_cerrados,
                'esParcial', ev.es_parcial
            )
            ORDER BY ev.mes
        ) FROM evolucion ev
    ), '[]'::jsonb),
    'porEstado', (
        SELECT jsonb_agg(
            jsonb_build_object('id', pe.id, 'nombre', pe.nombre, 'cantidad', pe.cantidad, 'porcentaje', pe.porcentaje)
            ORDER BY pe.id
        ) FROM por_estado pe
    ),
    'totalTicketsPeriodo', (SELECT total FROM total_tickets)
);
$$;
