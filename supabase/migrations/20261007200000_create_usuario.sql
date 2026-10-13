-- =============================================================================
-- Migración HU-30: Autenticación y Sesiones
-- Ajustado al estándar snake_case del proyecto
-- =============================================================================

-- Limpiar tablas si existían con otro esquema (ej. camelCase sin comillas)
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;
DROP TABLE IF EXISTS administrador CASCADE;
DROP TABLE IF EXISTS "Administrador" CASCADE;

-- 1. Crear tabla administrador (Omitida accidentalmente en el refactor previo)
CREATE TABLE IF NOT EXISTS administrador (
    admin_legajo VARCHAR(50) PRIMARY KEY,
    admin_nom_ape VARCHAR(150),
    admin_tel VARCHAR(50),
    admin_fecha_asun DATE
);

-- 2. Crear tabla usuario con Integridad Referencial Estricta
CREATE TABLE IF NOT EXISTS usuario (
    usuario_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identificador VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'tecnico', 'autorizado')),
    require_password_change BOOLEAN NOT NULL DEFAULT true,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- LLAVES FORÁNEAS
    admin_legajo VARCHAR(50) REFERENCES administrador(admin_legajo) ON DELETE CASCADE,
    tecnico_legajo VARCHAR(50) REFERENCES tecnico(tecnico_legajo) ON DELETE CASCADE,
    autorizado_legajo VARCHAR(50) REFERENCES autorizado(autorizado_legajo) ON DELETE CASCADE,

    -- Arco Exclusivo (XOR): Asegura que cada usuario pertenezca a un solo perfil físico
    CONSTRAINT chk_usuario_perfil CHECK (
        ( (admin_legajo IS NOT NULL)::integer + 
          (tecnico_legajo IS NOT NULL)::integer + 
          (autorizado_legajo IS NOT NULL)::integer 
        ) = 1
    )
);

-- 3. Insertar el Administrador Inicial para mantener la integridad referencial
INSERT INTO administrador (admin_legajo, admin_nom_ape, admin_tel, admin_fecha_asun) 
VALUES ('Admin', 'Administrador del Sistema', '-', CURRENT_DATE)
ON CONFLICT (admin_legajo) DO NOTHING;

-- 4. Actualizar usuario Admin (Si existía)
UPDATE usuario SET admin_legajo = 'Admin' WHERE identificador = 'Admin' AND rol = 'administrador';

