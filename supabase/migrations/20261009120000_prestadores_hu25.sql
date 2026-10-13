-- Prestadores de servicio (HU-25).
--
-- 1. Datos que pide el alta y que la tabla no tenia: email y garantia.
--    La garantia es texto libre ("6 meses en mano de obra"): el relevamiento
--    no dice que forma tiene, asi que no se la ata a un numero.
--
-- 2. Un prestador puede tener UNO O MAS tipos (criterio de aceptacion de la
--    HU-25). La HU-24 le habia dado una sola columna tipo_prestador_id; se
--    cambia por una tabla intermedia. Los tipos que ya estuvieran cargados en
--    esa columna se pasan a la tabla nueva antes de borrarla.
--
-- 3. El CUIL queda UNIQUE: es un identificador fiscal, no puede haber dos
--    prestadores con el mismo.

ALTER TABLE prestador_servicio
    ADD COLUMN prestador_serv_email VARCHAR(150),
    ADD COLUMN prestador_serv_garantia VARCHAR(200);

ALTER TABLE prestador_servicio
    ADD CONSTRAINT prestador_serv_cuil_unico UNIQUE (prestador_serv_cuil);

-- Si se borra el prestador se van sus tipos con el. Un tipo, en cambio, no se
-- puede borrar mientras haya prestadores que lo tengan.
CREATE TABLE prestador_tipo_prestador (
    prestador_serv_id BIGINT REFERENCES prestador_servicio(prestador_serv_id) ON DELETE CASCADE,
    tipo_prestador_id BIGINT REFERENCES tipo_prestador(tipo_prestador_id),
    PRIMARY KEY (prestador_serv_id, tipo_prestador_id)
);

INSERT INTO prestador_tipo_prestador (prestador_serv_id, tipo_prestador_id)
    SELECT prestador_serv_id, tipo_prestador_id
    FROM prestador_servicio
    WHERE tipo_prestador_id IS NOT NULL;

ALTER TABLE prestador_servicio
    DROP COLUMN tipo_prestador_id;
