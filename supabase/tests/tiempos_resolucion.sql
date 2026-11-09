-- psql -v ON_ERROR_STOP=1 -f supabase/tests/tiempos_resolucion.sql
-- Ejecutar en una base LOCAL migrada. Los fixtures se revierten al terminar.
--
-- Prueba la cuenta de estadistica_tiempos_resolucion (Sprint 7): sólo tickets
-- cerrados con una fecha de cierre válida, el período sobre la fecha de cierre
-- con los dos bordes incluidos, el desglose por área, tipo de activo y técnico,
-- "Sin área", "Sin asignar" y el período sin datos.
--
-- Los tickets de prueba son de marzo de 2001 para que los de la base no se
-- mezclen en la cuenta.
BEGIN;
DO $$
DECLARE
    edificio BIGINT;
    tipo_esp BIGINT;
    espacio_compartido BIGINT;
    tipo_aire BIGINT;
    tipo_proyector BIGINT;
    t1 BIGINT; t2 BIGINT; t3 BIGINT;
    t_abierto BIGINT; t_antes BIGINT; t_despues BIGINT;
    t_sin_cierre BIGINT; t_finalizado BIGINT; t_al_reves BIGINT;
    ot1 BIGINT; ot2 BIGINT; ot3 BIGINT; ot_abierto BIGINT;
    r JSONB;
    fila JSONB;
    desde CONSTANT TIMESTAMPTZ := '2001-03-01T00:00:00Z';
    hasta CONSTANT TIMESTAMPTZ := '2001-03-31T00:00:00Z';
BEGIN
    -- Lugar: un espacio con dos áreas y un activo sin espacio.
    INSERT INTO public.edificio (edificio_nom) VALUES ('Prueba TR') RETURNING edificio_id INTO edificio;
    INSERT INTO public.tipo_espacio (tipo_espacio_nom) VALUES ('Prueba TR') RETURNING tipo_espacio_id INTO tipo_esp;
    INSERT INTO public.espacio (edificio_id, espacio_num, tipo_espacio_id)
    VALUES (edificio, 'TR-1', tipo_esp) RETURNING espacio_id INTO espacio_compartido;
    INSERT INTO public.area (edificio_id, espacio_id, area_nom)
    VALUES (edificio, espacio_compartido, 'Prueba TR Laboratorio'),
           (edificio, espacio_compartido, 'Prueba TR Biblioteca');

    INSERT INTO public.tipo_activo (tipo_activo_nom) VALUES ('Prueba TR Aire') RETURNING tipo_activo_id INTO tipo_aire;
    INSERT INTO public.tipo_activo (tipo_activo_nom) VALUES ('Prueba TR Proyector') RETURNING tipo_activo_id INTO tipo_proyector;
    INSERT INTO public.activo (activo_codigo, edificio_id, espacio_id, tipo_activo_id)
    VALUES ('PRUEBA-TR-1', edificio, espacio_compartido, tipo_aire),
           ('PRUEBA-TR-2', edificio, NULL, tipo_proyector);

    INSERT INTO public.autorizado (autorizado_legajo, autorizado_nom_ape) VALUES ('PRUEBA-TR', 'Autorizado TR');
    INSERT INTO public.tecnico (tecnico_legajo, tecnico_nom_ape)
    VALUES ('PRUEBA-TR-A', 'Prueba TR Técnico A'), ('PRUEBA-TR-B', 'Prueba TR Técnico B');

    -- Los tres que entran (estado 6 = Cerrado):
    -- t1: 2 días, cerrado justo en el borde "desde".
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR 1', 6, '2001-02-27T00:00:00Z', '2001-03-01T00:00:00Z') RETURNING ticket_id INTO t1;
    -- t2: 1 día, cerrado justo en el borde "hasta". Activo sin espacio, sin técnico.
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-2', 'PRUEBA-TR', 'TR 2', 6, '2001-03-30T00:00:00Z', '2001-03-31T00:00:00Z') RETURNING ticket_id INTO t2;
    -- t3: 6 horas.
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR 3', 6, '2001-03-10T00:00:00Z', '2001-03-10T06:00:00Z') RETURNING ticket_id INTO t3;

    -- Los que NO entran:
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR abierto', 4, '2001-03-05T00:00:00Z') RETURNING ticket_id INTO t_abierto;
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR un segundo antes', 6, '2001-02-01T00:00:00Z', '2001-02-28T23:59:59Z') RETURNING ticket_id INTO t_antes;
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR un segundo despues', 6, '2001-03-01T00:00:00Z', '2001-03-31T00:00:01Z') RETURNING ticket_id INTO t_despues;
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR cerrado sin fecha', 6, '2001-03-05T00:00:00Z') RETURNING ticket_id INTO t_sin_cierre;
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR finalizado', 5, '2001-03-05T00:00:00Z', '2001-03-06T00:00:00Z') RETURNING ticket_id INTO t_finalizado;
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc, ticket_estado, ticket_fecha_alta, ticket_fecha_cierre)
    VALUES ('PRUEBA-TR-1', 'PRUEBA-TR', 'TR al reves', 6, '2001-03-20T00:00:00Z', '2001-03-19T00:00:00Z') RETURNING ticket_id INTO t_al_reves;

    -- Las OT y quién trabajó en cada una.
    INSERT INTO public.orden_trabajo (ticket_id) VALUES (t1) RETURNING ot_id INTO ot1;
    INSERT INTO public.orden_trabajo (ticket_id) VALUES (t2) RETURNING ot_id INTO ot2;
    INSERT INTO public.orden_trabajo (ticket_id) VALUES (t3) RETURNING ot_id INTO ot3;
    INSERT INTO public.orden_trabajo (ticket_id) VALUES (t_abierto) RETURNING ot_id INTO ot_abierto;

    INSERT INTO public.tarea_ot (ot_id, tarea_id, tarea_desc, tarea_estado)
    VALUES (ot1, 1, 'TR', 5), (ot1, 2, 'TR', 5),
           (ot2, 1, 'TR', 5),
           (ot3, 1, 'TR', 5), (ot3, 2, 'TR', 5), (ot3, 3, 'TR cancelada', 6),
           (ot_abierto, 1, 'TR', 3);

    INSERT INTO public.tecnico_asignado_tarea_ot (tecnico_legajo, ot_id, tarea_id, tec_asig_estado)
    VALUES ('PRUEBA-TR-A', ot1, 1, 4),          -- t1: técnico A
           ('PRUEBA-TR-B', ot1, 2, 4),          -- t1: técnico B
           ('PRUEBA-TR-A', ot2, 1, 5),          -- t2: asignación cancelada -> "Sin asignar"
           ('PRUEBA-TR-A', ot3, 1, 4),          -- t3: técnico A en dos tareas, cuenta una vez
           ('PRUEBA-TR-A', ot3, 2, 4),
           ('PRUEBA-TR-B', ot3, 3, 4),          -- t3: técnico B en una tarea cancelada, no cuenta
           ('PRUEBA-TR-B', ot_abierto, 1, 3);   -- ticket abierto, no cuenta

    r := public.estadistica_tiempos_resolucion(desde, hasta);

    -- General: (172800 + 86400 + 21600) / 3 = 93600 segundos.
    IF (r->'general'->>'cantidad_tickets')::INT <> 3 OR (r->'general'->>'promedio_segundos')::BIGINT <> 93600 THEN
        RAISE EXCEPTION 'Promedio general incorrecto: %', r->'general';
    END IF;

    -- Por área: el espacio compartido cuenta para las dos áreas; el activo sin espacio, "Sin área".
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_area') f WHERE f->>'nombre' = 'Prueba TR Laboratorio';
    IF (fila->>'cantidad_tickets')::INT <> 2 OR (fila->>'promedio_segundos')::BIGINT <> 97200
        OR fila->>'edificio' <> 'Prueba TR' THEN
        RAISE EXCEPTION 'Área Laboratorio incorrecta: %', fila;
    END IF;
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_area') f WHERE f->>'nombre' = 'Prueba TR Biblioteca';
    IF (fila->>'cantidad_tickets')::INT <> 2 OR (fila->>'promedio_segundos')::BIGINT <> 97200 THEN
        RAISE EXCEPTION 'Área Biblioteca incorrecta: %', fila;
    END IF;
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_area') f WHERE f->'id' = 'null'::JSONB;
    IF fila->>'nombre' <> 'Sin área' OR (fila->>'cantidad_tickets')::INT <> 1
        OR (fila->>'promedio_segundos')::BIGINT <> 86400 THEN
        RAISE EXCEPTION '"Sin área" incorrecto: %', fila;
    END IF;
    IF jsonb_array_length(r->'por_area') <> 3 THEN
        RAISE EXCEPTION 'Sobran o faltan áreas: %', r->'por_area';
    END IF;

    -- Por tipo de activo.
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_tipo_activo') f WHERE (f->>'id')::BIGINT = tipo_aire;
    IF (fila->>'cantidad_tickets')::INT <> 2 OR (fila->>'promedio_segundos')::BIGINT <> 97200
        OR fila->>'nombre' <> 'Prueba TR Aire' THEN
        RAISE EXCEPTION 'Tipo Aire incorrecto: %', fila;
    END IF;
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_tipo_activo') f WHERE (f->>'id')::BIGINT = tipo_proyector;
    IF (fila->>'cantidad_tickets')::INT <> 1 OR (fila->>'promedio_segundos')::BIGINT <> 86400 THEN
        RAISE EXCEPTION 'Tipo Proyector incorrecto: %', fila;
    END IF;
    IF jsonb_array_length(r->'por_tipo_activo') <> 2 THEN
        RAISE EXCEPTION 'Sobran o faltan tipos de activo: %', r->'por_tipo_activo';
    END IF;

    -- Por técnico.
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_tecnico') f WHERE f->>'id' = 'PRUEBA-TR-A';
    IF (fila->>'cantidad_tickets')::INT <> 2 OR (fila->>'promedio_segundos')::BIGINT <> 97200 THEN
        RAISE EXCEPTION 'Técnico A incorrecto (cuenta t1 y t3, una vez cada uno): %', fila;
    END IF;
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_tecnico') f WHERE f->>'id' = 'PRUEBA-TR-B';
    IF (fila->>'cantidad_tickets')::INT <> 1 OR (fila->>'promedio_segundos')::BIGINT <> 172800 THEN
        RAISE EXCEPTION 'Técnico B incorrecto (sólo t1; la tarea cancelada no cuenta): %', fila;
    END IF;
    SELECT f INTO fila FROM jsonb_array_elements(r->'por_tecnico') f WHERE f->'id' = 'null'::JSONB;
    IF fila->>'nombre' <> 'Sin asignar' OR (fila->>'cantidad_tickets')::INT <> 1
        OR (fila->>'promedio_segundos')::BIGINT <> 86400 THEN
        RAISE EXCEPTION '"Sin asignar" incorrecto: %', fila;
    END IF;
    IF jsonb_array_length(r->'por_tecnico') <> 3 THEN
        RAISE EXCEPTION 'Sobran o faltan técnicos: %', r->'por_tecnico';
    END IF;

    -- Un solo día (el de t3): entra sólo t3.
    r := public.estadistica_tiempos_resolucion('2001-03-10T00:00:00Z', '2001-03-10T23:59:59.999Z');
    IF (r->'general'->>'cantidad_tickets')::INT <> 1 OR (r->'general'->>'promedio_segundos')::BIGINT <> 21600 THEN
        RAISE EXCEPTION 'Filtro de un día incorrecto: %', r->'general';
    END IF;

    -- Período sin tickets cerrados: promedio vacío (no 0) y listas vacías.
    r := public.estadistica_tiempos_resolucion('1990-01-01T00:00:00Z', '1990-12-31T23:59:59Z');
    IF (r->'general'->>'cantidad_tickets')::INT <> 0 OR r->'general'->'promedio_segundos' <> 'null'::JSONB
        OR r->'por_area' <> '[]'::JSONB OR r->'por_tipo_activo' <> '[]'::JSONB OR r->'por_tecnico' <> '[]'::JSONB THEN
        RAISE EXCEPTION 'Período vacío incorrecto: %', r;
    END IF;

    RAISE NOTICE 'tiempos_resolucion: OK';
END $$;
ROLLBACK;
