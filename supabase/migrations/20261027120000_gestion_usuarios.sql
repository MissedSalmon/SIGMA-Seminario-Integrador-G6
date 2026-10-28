-- =============================================================================
-- Migración HU-32 Gestión de usuarios (Sprint 5, 27/10/2026)
-- =============================================================================
--
-- La tabla usuario ya existe desde HU-30 (Login). Esta HU no crea otra: la
-- completa para que el administrador pueda dar de alta, listar y desactivar
-- usuarios.
--
-- Por qué una sola tabla usuario y no credenciales en cada tabla de persona:
--   - Hay un solo lugar donde se inicia sesión: el login consulta una tabla.
--   - Cada usuario tiene un único rol, guardado en una sola columna.
--   - El restablecimiento de contraseña (HU-31, issue #25) también usa sólo esta tabla.
--
-- Qué agrega:
--   1. Una persona tiene como máximo un usuario (UNIQUE en cada legajo).
--   2. El rol coincide con el tipo de persona: rol 1 apunta a un administrador,
--      rol 2 a un técnico y rol 3 a un usuario autorizado.
--   3. La fecha de la última modificación (actualizado_en), que se pone sola.
--
-- La baja de un usuario es lógica (activo = false). Nunca se borra la fila.

-- 1. Una persona, un usuario como máximo.
--    En PostgreSQL varios NULL no chocan entre sí, así que cada columna sólo
--    controla las filas que la usan.
ALTER TABLE usuario ADD CONSTRAINT uq_usuario_admin_legajo UNIQUE (admin_legajo);
ALTER TABLE usuario ADD CONSTRAINT uq_usuario_tecnico_legajo UNIQUE (tecnico_legajo);
ALTER TABLE usuario ADD CONSTRAINT uq_usuario_autorizado_legajo UNIQUE (autorizado_legajo);

-- 2. El rol tiene que ser el de la persona a la que apunta.
--    El CHECK chk_usuario_perfil (HU-30) ya asegura que apunta a una sola.
ALTER TABLE usuario ADD CONSTRAINT chk_usuario_rol_perfil CHECK (
    (rol = 1 AND admin_legajo IS NOT NULL) OR
    (rol = 2 AND tecnico_legajo IS NOT NULL) OR
    (rol = 3 AND autorizado_legajo IS NOT NULL)
);

-- 3. Fecha de la última modificación.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
-- Los usuarios que ya estaban arrancan con su fecha de creación.
UPDATE usuario SET actualizado_en = COALESCE(creado_en, CURRENT_TIMESTAMP);

CREATE OR REPLACE FUNCTION usuario_marcar_actualizado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuario_actualizado ON usuario;
CREATE TRIGGER trg_usuario_actualizado
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION usuario_marcar_actualizado();

COMMENT ON COLUMN usuario.identificador IS 'Nombre de usuario con el que se inicia sesión. Único.';
COMMENT ON COLUMN usuario.activo IS 'false = usuario desactivado: no puede iniciar sesión, pero se conserva todo lo que registró.';
COMMENT ON COLUMN usuario.creado_en IS 'Fecha de creación del usuario.';
COMMENT ON COLUMN usuario.actualizado_en IS 'Fecha de la última modificación del usuario (se pone sola).';
