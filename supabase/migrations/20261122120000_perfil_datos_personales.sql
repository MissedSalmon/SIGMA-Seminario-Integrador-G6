-- Mi perfil con los mismos datos para los tres roles (22/11/2026).
--
-- En «Mi perfil» cada persona ve y corrige sus datos: legajo, nombre y
-- apellido, DNI, CUIL, fecha de nacimiento, email y telefono, mas el rol que
-- ocupa. El legajo y el rol no se pueden cambiar desde ahi.
--
-- La tabla autorizado ya tiene esos datos
-- (20260913150000_add_autorizado_datos_personales.sql). A tecnico y a
-- administrador les faltan DNI, CUIL, email y fecha de nacimiento: el refactor
-- del modelo (20260913100300) rehizo tecnico solo con legajo, nombre,
-- telefono y disponibilidad, y administrador nacio con legajo, nombre,
-- telefono y fecha de asuncion (20261007200000).
--
-- Mismo criterio que autorizado: DNI y CUIL UNIQUE dentro de cada tabla, y las
-- cuatro columnas admiten nulos porque las personas ya cargadas no los tienen.

ALTER TABLE tecnico
    ADD COLUMN IF NOT EXISTS tecnico_dni VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS tecnico_cuil VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS tecnico_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tecnico_fecha_nac DATE;

ALTER TABLE administrador
    ADD COLUMN IF NOT EXISTS admin_dni VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS admin_cuil VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS admin_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS admin_fecha_nac DATE;
