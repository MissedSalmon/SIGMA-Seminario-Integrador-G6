-- Guarda la auditoría sin conservar la contraseña provisoria ni su hash.
CREATE TABLE public.historial_restablecimiento_contrasena (
    restablecimiento_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id UUID REFERENCES public.usuario(usuario_id) ON DELETE SET NULL,
    usuario_identificador TEXT NOT NULL,
    administrador_usuario_id UUID REFERENCES public.usuario(usuario_id) ON DELETE SET NULL,
    administrador_identificador TEXT NOT NULL,
    restablecido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX historial_restablecimiento_usuario_fecha
    ON public.historial_restablecimiento_contrasena
    (usuario_id, restablecido_en DESC);

ALTER TABLE public.historial_restablecimiento_contrasena ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.historial_restablecimiento_contrasena FROM PUBLIC, anon, authenticated;

-- El cambio de hash, la marca de cambio obligatorio y la auditoría son atómicos.
CREATE FUNCTION public.restablecer_contrasena_usuario(
    p_usuario_id UUID,
    p_password_hash TEXT,
    p_administrador_usuario_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_identificador TEXT;
    v_administrador_identificador TEXT;
BEGIN
    IF p_password_hash IS NULL OR p_password_hash = '' THEN
        RAISE EXCEPTION 'El hash de la contraseña es obligatorio.' USING ERRCODE = '22023';
    END IF;

    SELECT identificador
    INTO v_administrador_identificador
    FROM public.usuario
    WHERE usuario_id = p_administrador_usuario_id
      AND rol = 1
      AND activo
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solo un administrador activo puede restablecer contraseñas.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.usuario
    SET password_hash = p_password_hash,
        require_password_change = TRUE
    WHERE usuario_id = p_usuario_id
    RETURNING identificador INTO v_usuario_identificador;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cuenta de usuario no existe.' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.historial_restablecimiento_contrasena (
        usuario_id,
        usuario_identificador,
        administrador_usuario_id,
        administrador_identificador
    )
    VALUES (
        p_usuario_id,
        v_usuario_identificador,
        p_administrador_usuario_id,
        v_administrador_identificador
    );
END;
$$;

REVOKE ALL ON FUNCTION public.restablecer_contrasena_usuario(UUID, TEXT, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restablecer_contrasena_usuario(UUID, TEXT, UUID)
    TO service_role;