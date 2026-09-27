-- HU-15: cada material y cada herramienta lleva una descripcion.
ALTER TABLE material ADD COLUMN IF NOT EXISTS mat_desc TEXT;
ALTER TABLE herramienta ADD COLUMN IF NOT EXISTS herr_desc TEXT;
