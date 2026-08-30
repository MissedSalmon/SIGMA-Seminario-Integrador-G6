-- HU-5: Gestion de tecnicos.
--
-- La tabla Tecnico solo tenia legajo, nombre y apellido juntos, telefono y
-- disponibilidad. La HU pide nombre y apellido por separado, DNI, CUIL, email
-- y fecha de nacimiento (el mismo modelo corregido que ya quedo documentado en
-- contexto.md como el acuerdo con la profesora). Se agregan esas columnas y se
-- da de baja tecnicoNomYApe: todavia no hay ningun tecnico cargado, asi que no
-- hay datos que migrar.
--
-- DNI y CUIL quedan UNIQUE: dos tecnicos no pueden compartir documento, y el
-- CUIL tampoco (es un identificador fiscal unico por persona, aunque la HU
-- solo pide explicitamente unicidad de legajo y DNI).

ALTER TABLE Tecnico
    DROP COLUMN tecnicoNomYApe,
    ADD COLUMN tecnicoNombre VARCHAR(100),
    ADD COLUMN tecnicoApellido VARCHAR(100),
    ADD COLUMN tecnicoDni VARCHAR(20) UNIQUE,
    ADD COLUMN tecnicoCuil VARCHAR(20) UNIQUE,
    ADD COLUMN tecnicoEmail VARCHAR(150),
    ADD COLUMN tecnicoFechaNac DATE;

-- Semilla de especialidades: HU-4 (ABM de especialidades) todavia no esta
-- implementada, pero Tecnicos la necesita para el selector de alta. Se cargan
-- las especialidades que ya menciona el glosario del proyecto (contexto.md).
INSERT INTO Especialidad (especialidadId, especialidadNom) VALUES
    (1, 'Electricista'),
    (2, 'Refrigeracion'),
    (3, 'Plomeria'),
    (4, 'Mantenimiento general'),
    (5, 'Carpinteria'),
    (6, 'Albanileria');
