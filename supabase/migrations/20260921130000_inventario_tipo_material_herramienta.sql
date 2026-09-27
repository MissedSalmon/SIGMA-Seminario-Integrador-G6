-- HU-15: los materiales y las herramientas se clasifican por tipo.
-- La tabla de tipos ya existia (20260911120000); el CREATE es por si falta.
CREATE TABLE IF NOT EXISTS InventarioTipo (
    inventarioTipoId SERIAL PRIMARY KEY,
    inventarioTipoNom VARCHAR(150) NOT NULL,
    inventarioTipoDesc TEXT,
    inventarioTipoClase VARCHAR(20) NOT NULL,
    CONSTRAINT chk_inventario_tipo_clase CHECK (inventarioTipoClase IN ('Material', 'Herramienta')),
    CONSTRAINT uq_inventario_tipo_nombre_clase UNIQUE (inventarioTipoNom, inventarioTipoClase)
);

ALTER TABLE material ADD COLUMN IF NOT EXISTS inventariotipoid INT REFERENCES InventarioTipo(inventarioTipoId);
ALTER TABLE herramienta ADD COLUMN IF NOT EXISTS inventariotipoid INT REFERENCES InventarioTipo(inventarioTipoId);
