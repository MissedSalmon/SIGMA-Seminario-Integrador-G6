-- Tiempos promedio de resolución (Sprint 7, 09/11/2026).
--
-- El administrador ve cuánto se tarda en resolver un ticket, en promedio:
-- desde que se registra (ticket_fecha_alta) hasta que se cierra
-- (ticket_fecha_cierre, que se completa sola al finalizar la OT, HU-26).
--
-- La cuenta se hace acá, en la base, con AVG y GROUP BY: la API no trae los
-- tickets a memoria. Devuelve un solo JSON con el promedio general y los tres
-- desgloses (área, tipo de activo y técnico). Los tiempos van en SEGUNDOS,
-- redondeados al segundo; el formato legible lo arma la pantalla.
--
-- Reglas (ver .claude/contexto/dominio.md, decisión del 09/11/2026):
-- - Sólo entran los tickets en estado 6 = Cerrado, con fecha de alta y fecha
--   de cierre, y con el cierre igual o posterior al alta. Los demás estados y
--   los cerrados sin una fecha de cierre válida quedan afuera.
-- - El período (p_desde / p_hasta, los dos inclusive) se aplica sobre la fecha
--   de cierre. Si no se pasa un extremo, no hay tope de ese lado.
-- - Si un ticket se cerrara dos veces, ticket_fecha_cierre guarda el último
--   cierre: es el que se usa.
-- - Promedio general: cada ticket cuenta una sola vez.
-- - Por área: el área del espacio del activo (area.espacio_id), igual que en la
--   HU-34. Si el espacio tiene varias áreas, el ticket cuenta para cada una. Si
--   el activo no tiene espacio o el espacio no tiene área, va a "Sin área".
-- - Por técnico: cuenta para cada técnico con una asignación no cancelada en
--   una tarea no cancelada de la OT del ticket. Si no hay ninguno (por ejemplo,
--   lo resolvió sólo un prestador), va a "Sin asignar".

CREATE INDEX IF NOT EXISTS ticket_cerrado_fecha_cierre
    ON public.ticket (ticket_fecha_cierre)
    WHERE ticket_estado = 6;

CREATE OR REPLACE FUNCTION public.estadistica_tiempos_resolucion(
    p_desde TIMESTAMPTZ DEFAULT NULL,
    p_hasta TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH cerrados AS (
    SELECT
        t.ticket_id,
        t.activo_codigo,
        EXTRACT(EPOCH FROM (t.ticket_fecha_cierre - t.ticket_fecha_alta)) AS segundos
    FROM ticket t
    WHERE t.ticket_estado = 6
      AND t.ticket_fecha_alta IS NOT NULL
      AND t.ticket_fecha_cierre IS NOT NULL
      AND t.ticket_fecha_cierre >= t.ticket_fecha_alta
      AND (p_desde IS NULL OR t.ticket_fecha_cierre >= p_desde)
      AND (p_hasta IS NULL OR t.ticket_fecha_cierre <= p_hasta)
),
por_area AS (
    SELECT
        ar.area_id AS id,
        COALESCE(ar.area_nom, 'Sin área') AS nombre,
        ed.edificio_nom AS edificio,
        ROUND(AVG(c.segundos))::BIGINT AS promedio_segundos,
        COUNT(*) AS cantidad_tickets
    FROM cerrados c
    LEFT JOIN activo a ON a.activo_codigo = c.activo_codigo
    LEFT JOIN area ar ON ar.espacio_id = a.espacio_id
    LEFT JOIN edificio ed ON ed.edificio_id = ar.edificio_id
    GROUP BY ar.area_id, ar.area_nom, ed.edificio_nom
),
por_tipo_activo AS (
    SELECT
        ta.tipo_activo_id AS id,
        COALESCE(ta.tipo_activo_nom, 'Sin tipo') AS nombre,
        ROUND(AVG(c.segundos))::BIGINT AS promedio_segundos,
        COUNT(*) AS cantidad_tickets
    FROM cerrados c
    LEFT JOIN activo a ON a.activo_codigo = c.activo_codigo
    LEFT JOIN tipo_activo ta ON ta.tipo_activo_id = a.tipo_activo_id
    GROUP BY ta.tipo_activo_id, ta.tipo_activo_nom
),
asignados AS (
    -- Los técnicos que trabajaron en la OT de cada ticket.
    SELECT DISTINCT ot.ticket_id, asig.tecnico_legajo
    FROM orden_trabajo ot
    JOIN tarea_ot tr
      ON tr.ot_id = ot.ot_id
     AND tr.tarea_estado <> 6           -- 6 = tarea Cancelada
    JOIN tecnico_asignado_tarea_ot asig
      ON asig.ot_id = tr.ot_id
     AND asig.tarea_id = tr.tarea_id
     AND asig.tec_asig_estado <> 5      -- 5 = asignación Cancelada
    WHERE ot.ticket_id IN (SELECT ticket_id FROM cerrados)
),
por_tecnico AS (
    SELECT
        te.tecnico_legajo AS id,
        COALESCE(te.tecnico_nom_ape, 'Sin asignar') AS nombre,
        ROUND(AVG(c.segundos))::BIGINT AS promedio_segundos,
        COUNT(*) AS cantidad_tickets
    FROM cerrados c
    LEFT JOIN asignados s ON s.ticket_id = c.ticket_id
    LEFT JOIN tecnico te ON te.tecnico_legajo = s.tecnico_legajo
    GROUP BY te.tecnico_legajo, te.tecnico_nom_ape
)
SELECT jsonb_build_object(
    'general', (
        SELECT jsonb_build_object(
            'promedio_segundos', ROUND(AVG(segundos))::BIGINT,
            'cantidad_tickets', COUNT(*)
        )
        FROM cerrados
    ),
    'por_area', COALESCE((SELECT jsonb_agg(to_jsonb(f)) FROM por_area f), '[]'::JSONB),
    'por_tipo_activo', COALESCE((SELECT jsonb_agg(to_jsonb(f)) FROM por_tipo_activo f), '[]'::JSONB),
    'por_tecnico', COALESCE((SELECT jsonb_agg(to_jsonb(f)) FROM por_tecnico f), '[]'::JSONB)
);
$$;

COMMENT ON FUNCTION public.estadistica_tiempos_resolucion(TIMESTAMPTZ, TIMESTAMPTZ) IS
    'Tiempo promedio de resolución (cierre - alta, en segundos) de los tickets cerrados en el período, general y por área, tipo de activo y técnico.';

REVOKE ALL ON FUNCTION public.estadistica_tiempos_resolucion(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.estadistica_tiempos_resolucion(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
