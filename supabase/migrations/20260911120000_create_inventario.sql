-- Catalogo comun de materiales y herramientas.
CREATE TABLE InventarioTipo (
    inventarioTipoId SERIAL PRIMARY KEY,
    inventarioTipoNom VARCHAR(150) NOT NULL,
    inventarioTipoDesc TEXT,
    inventarioTipoClase VARCHAR(20) NOT NULL,
    CONSTRAINT chk_inventario_tipo_clase CHECK (inventarioTipoClase IN ('Material', 'Herramienta')),
    CONSTRAINT uq_inventario_tipo_nombre_clase UNIQUE (inventarioTipoNom, inventarioTipoClase)
);

CREATE TABLE InventarioItem (
    inventarioItemCod VARCHAR(50) PRIMARY KEY,
    inventarioItemNom VARCHAR(150) NOT NULL,
    inventarioItemDesc TEXT,
    inventarioTipoId INT NOT NULL REFERENCES InventarioTipo(inventarioTipoId),
    inventarioItemClase VARCHAR(20) NOT NULL,
    inventarioItemStockActual INT NOT NULL DEFAULT 0,
    inventarioItemStockMin INT,
    inventarioItemFechaVenc DATE,
    inventarioItemEstado VARCHAR(30) NOT NULL DEFAULT 'Disponible',
    CONSTRAINT chk_inventario_item_clase CHECK (inventarioItemClase IN ('Material', 'Herramienta')),
    CONSTRAINT chk_inventario_item_stock CHECK (inventarioItemStockActual >= 0 AND (inventarioItemStockMin IS NULL OR inventarioItemStockMin >= 0)),
    CONSTRAINT chk_inventario_item_material CHECK (
        (inventarioItemClase = 'Material' AND inventarioItemStockMin IS NOT NULL)
        OR (inventarioItemClase = 'Herramienta' AND inventarioItemStockMin IS NULL AND inventarioItemFechaVenc IS NULL AND inventarioItemEstado = 'Disponible')
    )
);

CREATE TABLE InventarioMovimiento (
    inventarioMovimientoId SERIAL PRIMARY KEY,
    inventarioItemCod VARCHAR(50) NOT NULL REFERENCES InventarioItem(inventarioItemCod),
    inventarioMovimientoTipo VARCHAR(20) NOT NULL,
    inventarioMovimientoCantidad INT NOT NULL,
    inventarioMovimientoFecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inventario_movimiento_tipo CHECK (inventarioMovimientoTipo IN ('Ingreso', 'Consumo')),
    CONSTRAINT chk_inventario_movimiento_cantidad CHECK (inventarioMovimientoCantidad > 0)
);