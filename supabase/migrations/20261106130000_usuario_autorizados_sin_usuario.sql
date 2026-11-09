-- =============================================================================
-- Usuario para los autorizados que no lo tienen (06/11/2026)
-- =============================================================================
--
-- Desde ahora el alta de un usuario autorizado le crea su usuario, igual que la
-- de un técnico: el nombre de usuario y la contraseña provisoria son el legajo,
-- y tiene que cambiarla la primera vez que entra. Los autorizados cargados
-- antes pueden haber quedado sin usuario: esta migración se lo crea.
--
-- Se saltea al autorizado cuyo legajo ya es el nombre de otro usuario (el login
-- no sabría a quién dejar entrar): a ése hay que resolverlo a mano.
-- Se puede correr más de una vez: no crea un usuario que ya existe.

-- pgcrypto arma el mismo hash bcrypt ($2a$) que usa el backend con bcryptjs.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

INSERT INTO usuario (identificador, password_hash, rol, require_password_change, activo, autorizado_legajo)
SELECT
    a.autorizado_legajo,
    extensions.crypt(a.autorizado_legajo, extensions.gen_salt('bf', 10)),
    3,
    true,
    true,
    a.autorizado_legajo
FROM autorizado a
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.autorizado_legajo = a.autorizado_legajo)
  AND NOT EXISTS (SELECT 1 FROM usuario u WHERE u.identificador = a.autorizado_legajo);
