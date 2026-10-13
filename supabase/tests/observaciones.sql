-- psql -v ON_ERROR_STOP=1 -f supabase/tests/observaciones.sql
-- Ejecutar en una base LOCAL migrada. Los fixtures se revierten al terminar.
BEGIN;
DO $$
DECLARE
    edificio BIGINT;
    tipo BIGINT;
    preventivo BIGINT;
    ticket BIGINT;
    orden BIGINT;
    orden_correctiva BIGINT;
    cuenta UUID;
    primera public.tarea_observacion;
BEGIN
    INSERT INTO public.edificio (edificio_nom) VALUES ('Prueba U-23') RETURNING edificio_id INTO edificio;
    INSERT INTO public.tipo_activo (tipo_activo_nom) VALUES ('Prueba U-23') RETURNING tipo_activo_id INTO tipo;
    INSERT INTO public.activo (activo_codigo, edificio_id, tipo_activo_id)
    VALUES ('PRUEBA-U23', edificio, tipo);
    INSERT INTO public.mantenimiento_preventivo (activo_codigo, tipo_activo_id, mant_prev_nom, mant_prev_frec)
    VALUES ('PRUEBA-U23', tipo, 'Prueba U-23', 'Mensual') RETURNING mant_prev_id INTO preventivo;
    INSERT INTO public.orden_trabajo (mant_prev_id) VALUES (preventivo) RETURNING ot_id INTO orden;
    INSERT INTO public.autorizado (autorizado_legajo, autorizado_nom_ape) VALUES ('PRUEBA-U23', 'Autorizado prueba');
    INSERT INTO public.ticket (activo_codigo, autorizado_legajo, ticket_desc)
    VALUES ('PRUEBA-U23', 'PRUEBA-U23', 'Prueba') RETURNING ticket_id INTO ticket;
    INSERT INTO public.orden_trabajo (ticket_id) VALUES (ticket) RETURNING ot_id INTO orden_correctiva;
    INSERT INTO public.tarea_ot (ot_id, tarea_id, tarea_desc, tarea_estado)
    VALUES (orden, 1, 'Prueba finalizada', 5), (orden_correctiva, 1, 'Prueba correctiva', 1);
    INSERT INTO public.tecnico (tecnico_legajo, tecnico_nom_ape)
    VALUES ('PRUEBA-U23', 'Técnico de prueba'), ('PRUEBA-U23-OTRO', 'Otro técnico');
    INSERT INTO public.usuario (identificador, password_hash, rol, tecnico_legajo)
    VALUES ('PRUEBA-U23', 'no-utilizable', 2, 'PRUEBA-U23') RETURNING usuario_id INTO cuenta;
    INSERT INTO public.usuario (identificador, password_hash, rol, tecnico_legajo)
    VALUES ('PRUEBA-U23-OTRO', 'no-utilizable', 2, 'PRUEBA-U23-OTRO');
    INSERT INTO public.tecnico_asignado_tarea_ot (tecnico_legajo, ot_id, tarea_id, tec_asig_estado)
    VALUES ('PRUEBA-U23', orden, 1, 4), ('PRUEBA-U23', orden_correctiva, 1, 2);
    primera := public.registrar_observacion_tarea('PRUEBA-U23', orden, 1, 'Actividad adicional');
    PERFORM public.registrar_observacion_tarea('PRUEBA-U23', orden, 1, '<b>Texto libre</b>');
    IF primera.usuario_id <> cuenta OR primera.observacion_autor_nombre <> 'Técnico de prueba'
        OR primera.observacion_fecha <> CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Autor o fecha incorrectos';
    END IF;
    IF (SELECT count(*) FROM public.tarea_observacion WHERE ot_id = orden AND tarea_id = 1) <> 2 THEN
        RAISE EXCEPTION 'No persistieron múltiples observaciones';
    END IF;
    PERFORM public.registrar_observacion_tarea('PRUEBA-U23', orden_correctiva, 1, 'Correctiva');
    IF (SELECT count(*) FROM public.activo_historial_observacion WHERE activo_codigo = 'PRUEBA-U23') <> 3 THEN
        RAISE EXCEPTION 'Historial incompleto o duplicado';
    END IF;
    BEGIN
        PERFORM public.registrar_observacion_tarea('PRUEBA-U23-OTRO', orden, 1, 'Ajena');
        RAISE EXCEPTION 'Aceptó técnico no asignado';
    EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL;
    END;
    BEGIN
        PERFORM public.registrar_observacion_tarea('INEXISTENTE', orden, 1, 'Sin cuenta');
        RAISE EXCEPTION 'Aceptó cuenta inexistente';
    EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
    END;
    BEGIN
        PERFORM public.registrar_observacion_tarea('PRUEBA-U23', orden, 1, E' \t\n ');
        RAISE EXCEPTION 'Aceptó texto vacío';
    EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
    END;
    BEGIN
        PERFORM public.registrar_observacion_tarea('PRUEBA-U23', orden, 1, repeat('a', 501));
        RAISE EXCEPTION 'Aceptó más de 500 caracteres';
    EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
    END;
    UPDATE public.tecnico_asignado_tarea_ot SET tec_asig_estado = 5 WHERE ot_id = orden;
    BEGIN
        PERFORM public.registrar_observacion_tarea('PRUEBA-U23', orden, 1, 'Cancelada');
        RAISE EXCEPTION 'Aceptó asignación cancelada';
    EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL;
    END;
    IF has_function_privilege('anon', 'public.registrar_observacion_tarea(text,bigint,integer,text)', 'EXECUTE')
        OR has_function_privilege('authenticated', 'public.registrar_observacion_tarea(text,bigint,integer,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'RPC accesible por fuera del backend';
    END IF;
END;
$$;
ROLLBACK;
