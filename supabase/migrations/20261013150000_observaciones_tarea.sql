-- U-23. Registros inmutables; conserva el nombre al momento de crear la nota.
CREATE TABLE public.tarea_observacion (
    observacion_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ot_id BIGINT NOT NULL,
    tarea_id INT NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuario(usuario_id) ON DELETE RESTRICT,
    observacion_autor_nombre TEXT NOT NULL,
    observacion_texto TEXT NOT NULL CHECK (
        char_length(observacion_texto) BETWEEN 1 AND 500 AND
        observacion_texto ~ '[^[:space:]]'
    ),
    observacion_fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ot_id, tarea_id) REFERENCES public.tarea_ot(ot_id, tarea_id) ON DELETE RESTRICT
);
CREATE INDEX tarea_observacion_tarea_fecha ON public.tarea_observacion
    (ot_id, tarea_id, observacion_fecha, observacion_id);
ALTER TABLE public.tarea_observacion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tarea_observacion FROM anon, authenticated;

CREATE FUNCTION public.registrar_observacion_tarea(
    p_identificador TEXT, p_ot_id BIGINT, p_tarea_id INT, p_texto TEXT
) RETURNS public.tarea_observacion
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    autor RECORD;
    observacion public.tarea_observacion;
BEGIN
    IF p_texto IS NULL OR p_texto !~ '[^[:space:]]' OR char_length(p_texto) > 500 THEN
        RAISE EXCEPTION 'La observación debe contener texto y admitir hasta 500 caracteres.' USING ERRCODE = '22023';
    END IF;
    SELECT u.usuario_id, u.tecnico_legajo, t.tecnico_nom_ape INTO autor
    FROM usuario u JOIN tecnico t USING (tecnico_legajo)
    WHERE u.identificador = p_identificador AND u.rol = 2 AND u.activo
    FOR SHARE OF u, t;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario técnico inválido.' USING ERRCODE = '42501';
    END IF;
    -- Bloquea la asignación durante la inserción para evitar revocaciones concurrentes.
    PERFORM 1 FROM tecnico_asignado_tarea_ot
    WHERE ot_id = p_ot_id AND tarea_id = p_tarea_id
        AND tecnico_legajo = autor.tecnico_legajo AND tec_asig_estado <> 5
    FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No tenés asignada esa tarea.' USING ERRCODE = 'P0002';
    END IF;
    INSERT INTO tarea_observacion (ot_id, tarea_id, usuario_id, observacion_autor_nombre, observacion_texto)
    VALUES (p_ot_id, p_tarea_id, autor.usuario_id, autor.tecnico_nom_ape, btrim(p_texto))
    RETURNING * INTO observacion;
    RETURN observacion;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_observacion_tarea(TEXT, BIGINT, INT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_observacion_tarea(TEXT, BIGINT, INT, TEXT) TO service_role;

-- No copia registros: resuelve el activo desde la OT correctiva o preventiva.
CREATE VIEW public.activo_historial_observacion WITH (security_invoker = true) AS
SELECT o.*, COALESCE(t.activo_codigo, mp.activo_codigo) AS activo_codigo
FROM public.tarea_observacion o
JOIN public.orden_trabajo ot ON ot.ot_id = o.ot_id
LEFT JOIN public.ticket t ON t.ticket_id = ot.ticket_id
LEFT JOIN public.mantenimiento_preventivo mp ON mp.mant_prev_id = ot.mant_prev_id;
REVOKE ALL ON public.activo_historial_observacion FROM anon, authenticated;
