-- Cada espacio pertenece a un área como máximo, y un área puede tener muchos
-- espacios, incluso en varios edificios (decisión del 21/11/2026, sobre la
-- propuesta del 18/11/2026: Propuesta-areas-y-espacios.pdf).
--
-- Antes el área apuntaba a un solo espacio (area.espacio_id). Ahora es al
-- revés: el espacio guarda su área (espacio.area_id). El activo no cambia:
-- está en un espacio, y de ahí sale su área. Un espacio sin área (un pasillo,
-- un baño) sigue contando como "Sin área".
--
-- El solicitante de un área carga tickets de los activos de todos sus espacios.

ALTER TABLE public.espacio
    ADD COLUMN area_id BIGINT REFERENCES public.area (area_id) ON DELETE SET NULL;

CREATE INDEX espacio_area ON public.espacio (area_id);

-- Pasa los datos de hoy. Si un espacio tuviera dos áreas, queda con la más
-- vieja (al 21/11/2026 no había ninguno así).
UPDATE public.espacio e
SET area_id = a.area_id
FROM (
    SELECT DISTINCT ON (espacio_id) espacio_id, area_id
    FROM public.area
    WHERE espacio_id IS NOT NULL
    ORDER BY espacio_id, area_id
) a
WHERE a.espacio_id = e.espacio_id;

-- El edificio del área sale de sus espacios: guardarlo aparte podía quedar contradictorio.
ALTER TABLE public.area
    DROP COLUMN espacio_id,
    DROP COLUMN edificio_id;

-- Un solicitante es responsable de un área como máximo. Hasta ahora lo controlaba sólo el backend.
ALTER TABLE public.area
    ADD CONSTRAINT uq_area_autorizado UNIQUE (autorizado_legajo);

-- Tiempos de resolución por área: el área ahora sale del espacio del activo.
-- Como cada espacio tiene un área como máximo, cada ticket cuenta una sola vez.
-- "edificio" son los edificios de los espacios del área, separados por " / ".
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
edificios_del_area AS (
    SELECT
        es.area_id,
        string_agg(DISTINCT ed.edificio_nom, ' / ' ORDER BY ed.edificio_nom) AS edificio
    FROM espacio es
    JOIN edificio ed ON ed.edificio_id = es.edificio_id
    WHERE es.area_id IS NOT NULL
    GROUP BY es.area_id
),
por_area AS (
    SELECT
        ar.area_id AS id,
        COALESCE(ar.area_nom, 'Sin área') AS nombre,
        ea.edificio,
        ROUND(AVG(c.segundos))::BIGINT AS promedio_segundos,
        COUNT(*) AS cantidad_tickets
    FROM cerrados c
    LEFT JOIN activo a ON a.activo_codigo = c.activo_codigo
    LEFT JOIN espacio es ON es.espacio_id = a.espacio_id
    LEFT JOIN area ar ON ar.area_id = es.area_id
    LEFT JOIN edificios_del_area ea ON ea.area_id = ar.area_id
    GROUP BY ar.area_id, ar.area_nom, ea.edificio
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
