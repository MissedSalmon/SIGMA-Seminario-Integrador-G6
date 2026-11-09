-- Migración: Funciones SQL y optimizaciones para el Panel de Estadísticas del Administrador
-- Sprint 7 - Noviembre 2026
-- Principios Anti-Sesgo: S1 (cobertura), S4 (denominador visible), S6 (vacíos en 0), S8 (sin recortes), S11 (escalas honestas)

-- Índices de soporte para consultas analíticas del panel
CREATE INDEX IF NOT EXISTS idx_ot_fecha_alta_origen
    ON public.orden_trabajo (ot_fecha_alta);

CREATE INDEX IF NOT EXISTS idx_ticket_fecha_alta
    ON public.ticket (ticket_fecha_alta);

CREATE INDEX IF NOT EXISTS idx_material_stock_critico
    ON public.material (mat_cod)
    WHERE mat_stock_actual <= mat_stock_min;

-- 1. Resumen General (KPIs instantáneos M-01, M-07, M-15, M-16)
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
        COUNT(*) FILTER (WHERE mat_stock_actual <= mat_stock_min) AS bajo_minimo,
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
            'faltante', GREATEST(0, m.mat_stock_min - m.mat_stock_actual)
        ) ORDER BY (m.mat_stock_min - m.mat_stock_actual) DESC, m.mat_nom ASC
    ) AS items
    FROM material m
    WHERE m.mat_stock_actual <= m.mat_stock_min
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

-- 2. Distribución de activos (M-02 por estado, M-03 por edificio)
CREATE OR REPLACE FUNCTION public.estadistica_distribucion_activos()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
total_act AS (
    SELECT COUNT(*) AS total FROM activo
),
total_en_servicio AS (
    SELECT COUNT(*) AS total FROM activo WHERE activo_estado IN (1, 2, 3)
),
estados_base AS (
    SELECT unnest(ARRAY[1, 2, 3, 4]) AS id,
           unnest(ARRAY['Operativo', 'En mantenimiento', 'Fuera de servicio', 'Retirado']) AS nombre
),
por_estado AS (
    SELECT
        eb.id,
        eb.nombre,
        COUNT(a.activo_codigo) AS cantidad,
        CASE
            WHEN (SELECT total FROM total_act) > 0
            THEN ROUND((COUNT(a.activo_codigo)::numeric / (SELECT total FROM total_act) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM estados_base eb
    LEFT JOIN activo a ON a.activo_estado = eb.id
    GROUP BY eb.id, eb.nombre
    ORDER BY eb.id ASC
),
por_edificio AS (
    SELECT
        ed.edificio_id AS id,
        COALESCE(ed.edificio_nom, 'Sin espacio asignado') AS nombre,
        COUNT(a.activo_codigo) AS cantidad,
        CASE
            WHEN (SELECT total FROM total_en_servicio) > 0
            THEN ROUND((COUNT(a.activo_codigo)::numeric / (SELECT total FROM total_en_servicio) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM activo a
    LEFT JOIN espacio e ON e.espacio_id = a.espacio_id
    LEFT JOIN edificio ed ON ed.edificio_id = e.edificio_id
    WHERE a.activo_estado IN (1, 2, 3)
    GROUP BY ed.edificio_id, ed.edificio_nom
    ORDER BY
        (ed.edificio_id IS NULL) ASC,
        COUNT(a.activo_codigo) DESC,
        ed.edificio_nom ASC
)
SELECT jsonb_build_object(
    'porEstado', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', pe.id,
                'nombre', pe.nombre,
                'cantidad', pe.cantidad,
                'porcentaje', pe.porcentaje
            )
        ) FROM por_estado pe
    ),
    'porEdificio', COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ped.id,
                'nombre', ped.nombre,
                'cantidad', ped.cantidad,
                'porcentaje', ped.porcentaje
            )
        ) FROM por_edificio ped
    ), '[]'::jsonb),
    'totalActivos', (SELECT total FROM total_act),
    'totalEnServicio', (SELECT total FROM total_en_servicio)
);
$$;

-- 3. Órdenes de Trabajo por origen, estado, prioridad y cumplimiento de tareas (M-08, M-09, M-10, M-12)
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
    ORDER BY eob.id ASC
),
prioridades_base AS (
    SELECT unnest(ARRAY[1, 2, 3]) AS id,
           unnest(ARRAY['Alta', 'Media', 'Baja']) AS nombre
),
por_prioridad AS (
    SELECT
        pb.id,
        pb.nombre,
        COUNT(ot.ot_id) AS cantidad,
        CASE
            WHEN (SELECT total_no_canceladas FROM totales) > 0
            THEN ROUND((COUNT(ot.ot_id)::numeric / (SELECT total_no_canceladas FROM totales) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM prioridades_base pb
    LEFT JOIN ots_filtradas ot ON ot.ot_prioridad = pb.id AND ot.ot_estado <> 5
    GROUP BY pb.id, pb.nombre
    ORDER BY pb.id ASC
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
    ORDER BY etb.id ASC
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
            jsonb_build_object(
                'id', pe.id,
                'nombre', pe.nombre,
                'cantidad', pe.cantidad,
                'porcentaje', pe.porcentaje
            )
        ) FROM por_estado pe
    ),
    'porPrioridad', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', pp.id,
                'nombre', pp.nombre,
                'cantidad', pp.cantidad,
                'porcentaje', pp.porcentaje
            )
        ) FROM por_prioridad pp
    ),
    'cumplimientoTareas', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ct.id,
                'nombre', ct.nombre,
                'cantidad', ct.cantidad,
                'porcentaje', ct.porcentaje
            )
        ) FROM cumplimiento_tareas ct
    ),
    'totalOt', (SELECT total_ot FROM totales),
    'totalTareas', (SELECT total FROM total_tareas)
);
$$;

-- 4. Evolución mensual de tickets (M-11) y distribución por estado (M-05)
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
    SELECT
        COALESCE(
            p_desde,
            date_trunc('month', (now() AT TIME ZONE 'America/Argentina/Buenos_Aires') - interval '5 months')
        ) AS desde,
        COALESCE(
            p_hasta,
            (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        ) AS hasta
),
meses AS (
    SELECT generate_series(
        date_trunc('month', (SELECT desde FROM rango)),
        date_trunc('month', (SELECT hasta FROM rango)),
        '1 month'::interval
    ) AS mes
),
altas AS (
    SELECT
        date_trunc('month', t.ticket_fecha_alta) AS mes,
        COUNT(*) AS cantidad
    FROM ticket t
    WHERE t.ticket_fecha_alta >= (SELECT desde FROM rango)
      AND t.ticket_fecha_alta <= (SELECT hasta FROM rango)
    GROUP BY 1
),
cierres AS (
    SELECT
        date_trunc('month', t.ticket_fecha_cierre) AS mes,
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
        to_char(m.mes, 'YYYY-MM') AS periodo,
        CASE
            WHEN m.mes = (SELECT mes FROM mes_actual)
            THEN to_char(m.mes, 'TMMon YYYY') || ' * (parcial)'
            ELSE to_char(m.mes, 'TMMon YYYY')
        END AS mes_rotulo,
        COALESCE(a.cantidad, 0) AS tickets_creados,
        COALESCE(c.cantidad, 0) AS tickets_cerrados,
        (m.mes = (SELECT mes FROM mes_actual)) AS es_parcial
    FROM meses m
    LEFT JOIN altas a ON a.mes = m.mes
    LEFT JOIN cierres c ON c.mes = m.mes
    ORDER BY m.mes ASC
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
    ORDER BY etb.id ASC
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
        ) FROM evolucion ev
    ), '[]'::jsonb),
    'porEstado', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', pe.id,
                'nombre', pe.nombre,
                'cantidad', pe.cantidad,
                'porcentaje', pe.porcentaje
            )
        ) FROM por_estado pe
    ),
    'totalTicketsPeriodo', (SELECT total FROM total_tickets)
);
$$;

-- 5. Carga de trabajo activa por técnico (M-14)
CREATE OR REPLACE FUNCTION public.estadistica_carga_tecnicos()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
asignaciones_activas AS (
    SELECT
        tat.tecnico_legajo,
        tat.ot_id,
        tat.tarea_id
    FROM tecnico_asignado_tarea_ot tat
    JOIN tarea_ot t ON t.ot_id = tat.ot_id AND t.tarea_id = tat.tarea_id
    WHERE tat.tec_asig_estado IN (1, 2, 3)
      AND t.tarea_estado NOT IN (5, 6)
),
total_activas AS (
    SELECT COUNT(*) AS total FROM asignaciones_activas
),
carga_por_tecnico AS (
    SELECT
        tec.tecnico_legajo AS legajo,
        tec.tecnico_nom_ape AS nombre,
        tec.tecnico_disponibilidad AS disponible,
        COUNT(aa.tarea_id) AS tareas_activas,
        CASE
            WHEN (SELECT total FROM total_activas) > 0
            THEN ROUND((COUNT(aa.tarea_id)::numeric / (SELECT total FROM total_activas) * 100), 1)
            ELSE 0
        END AS porcentaje
    FROM tecnico tec
    LEFT JOIN asignaciones_activas aa ON aa.tecnico_legajo = tec.tecnico_legajo
    GROUP BY tec.tecnico_legajo, tec.tecnico_nom_ape, tec.tecnico_disponibilidad
    ORDER BY COUNT(aa.tarea_id) DESC, tec.tecnico_nom_ape ASC
),
sin_asignar AS (
    SELECT COUNT(*) AS total
    FROM tarea_ot t
    JOIN orden_trabajo ot ON ot.ot_id = t.ot_id
    WHERE t.tarea_estado IN (1, 2, 4)
      AND NOT EXISTS (
          SELECT 1
          FROM tecnico_asignado_tarea_ot tat
          WHERE tat.ot_id = t.ot_id AND tat.tarea_id = t.tarea_id AND tat.tec_asig_estado IN (1, 2, 3)
      )
)
SELECT jsonb_build_object(
    'porTecnico', COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'legajo', ct.legajo,
                'nombre', ct.nombre,
                'disponible', ct.disponible,
                'tareasActivas', ct.tareas_activas,
                'porcentaje', ct.porcentaje
            )
        ) FROM carga_por_tecnico ct
    ), '[]'::jsonb),
    'sinAsignar', (SELECT total FROM sin_asignar),
    'totalTareasActivas', (SELECT total FROM total_activas)
);
$$;
