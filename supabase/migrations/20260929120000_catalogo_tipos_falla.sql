CREATE TABLE tipo_falla (
    tipo_falla_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_falla_nom VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX tipo_falla_nom_sin_mayusculas
    ON tipo_falla (LOWER(tipo_falla_nom));

INSERT INTO tipo_falla (tipo_falla_nom)
VALUES ('Eléctrica'), ('Mecánica'), ('Estructural'), ('Sanitaria'), ('Otra');