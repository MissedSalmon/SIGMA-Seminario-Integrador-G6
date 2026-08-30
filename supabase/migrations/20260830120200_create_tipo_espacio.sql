CREATE TABLE TipoEspacio (
    tipoEspacioId INT PRIMARY KEY,
    tipoEspacioNom VARCHAR(100)
);

ALTER TABLE Espacio ADD COLUMN tipoEspacioId INT;
ALTER TABLE Espacio ADD CONSTRAINT fk_espacio_tipoespacio FOREIGN KEY (tipoEspacioId) REFERENCES TipoEspacio(tipoEspacioId);
