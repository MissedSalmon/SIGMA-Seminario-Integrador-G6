-- Migración: Conversión de usuario.rol de VARCHAR a número entero (Enumerado).
-- Siguiendo el estándar de datos enumerados de 20261010120000_datos_enumerados.sql.
--
-- El rol del usuario deja de guardarse como texto libre ('administrador', 'tecnico', 'autorizado')
-- y pasa a guardarse como número entero (1, 2, 3):
--   1 = Administrador
--   2 = Técnico
--   3 = Autorizado
--
-- La columna acepta solo los valores del diccionario (CHECK) y lleva un
-- comentario con lo que significa cada número.
--
-- La traducción número <-> texto vive en backend/src/utiles/enumerados.js (ENUM_ROL).
-- La API sigue hablando en texto hacia el frontend y JWT, manteniendo la compatibilidad
-- y respetando la arquitectura de datos enumerados del proyecto.

-- 1. Eliminar cualquier CHECK previo sobre la columna rol en la tabla usuario
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'usuario'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%rol%'
    ) LOOP
        EXECUTE 'ALTER TABLE usuario DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Modificar el tipo de columna usando mapeo seguro (conserva números ya migrados,
--    ignora mayúsculas/minúsculas y tildes).
ALTER TABLE usuario ALTER COLUMN rol DROP DEFAULT;
ALTER TABLE usuario ALTER COLUMN rol TYPE INT USING (
    CASE
        WHEN rol IS NULL THEN NULL
        WHEN btrim(rol::text) ~ '^[0-9]+$' THEN btrim(rol::text)::INT
        WHEN upper(translate(btrim(rol::text), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ADMINISTRADOR' THEN 1
        WHEN upper(translate(btrim(rol::text), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'TECNICO' THEN 2
        WHEN upper(translate(btrim(rol::text), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'AUTORIZADO' THEN 3
    END
);

-- 3. Restricción NOT NULL, CHECK y Comentario de documentación
ALTER TABLE usuario ALTER COLUMN rol SET NOT NULL;
ALTER TABLE usuario ADD CONSTRAINT chk_usuario_rol CHECK (rol BETWEEN 1 AND 3);
COMMENT ON COLUMN usuario.rol IS
    '1=administrador, 2=tecnico, 3=autorizado';
