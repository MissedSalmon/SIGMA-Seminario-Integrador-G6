-- Datos personales del usuario autorizado.
--
-- La tabla autorizado quedo con tres columnas despues del refactor del modelo
-- (20260913100300_refactor_modelo_mantenimiento.sql): legajo, nombre y apellido
-- juntos, y telefono. El alta de un usuario autorizado pide ademas DNI, CUIL,
-- email y fecha de nacimiento, asi que se suman esas cuatro columnas.
--
-- El nombre y el apellido se dejan juntos en autorizado_nom_ape, como quedaron
-- en el refactor y como esta tecnico: es un solo campo "Nombre y apellido" en
-- todo el sistema.
--
-- El area de la que el usuario es responsable NO se guarda aca: ya existe
-- area.autorizado_legajo para eso, que es la relacion del modelo corregido.
-- Guardarla tambien en esta tabla seria tener el mismo dato en dos lugares.
--
-- DNI y CUIL quedan UNIQUE: dos personas no pueden compartir documento, y el
-- CUIL tampoco (es un identificador fiscal unico por persona).
--
-- Las cuatro columnas admiten nulos: los usuarios autorizados que ya estan
-- cargados no los tienen, y la regla de que el legajo, el nombre y el area son
-- obligatorios la aplica el servicio (backend/src/servicios/autorizados.servicio.js).

ALTER TABLE autorizado
    ADD COLUMN autorizado_dni VARCHAR(20) UNIQUE,
    ADD COLUMN autorizado_cuil VARCHAR(20) UNIQUE,
    ADD COLUMN autorizado_email VARCHAR(150),
    ADD COLUMN autorizado_fecha_nac DATE;
