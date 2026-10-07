-- Tipos de prestador de servicio (HU-24).
-- Es la clase de servicio que da una empresa o un profesional de afuera.
-- Al cargar un prestador (HU-33) se elige de esta lista.

CREATE TABLE tipo_prestador (
    tipo_prestador_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_prestador_nom VARCHAR(100) NOT NULL,
    tipo_prestador_desc VARCHAR(300)
);

-- No puede haber dos tipos con el mismo nombre, sin importar mayúsculas.
CREATE UNIQUE INDEX tipo_prestador_nom_sin_mayusculas
    ON tipo_prestador (LOWER(tipo_prestador_nom));

-- Cada prestador puede tener un tipo. Queda opcional porque los prestadores
-- que ya están cargados no lo tienen.
ALTER TABLE prestador_servicio
    ADD COLUMN tipo_prestador_id BIGINT REFERENCES tipo_prestador(tipo_prestador_id);
