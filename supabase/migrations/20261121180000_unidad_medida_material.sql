-- Unidades disponibles para expresar las cantidades de cada material.
ALTER TABLE public.material
    ADD COLUMN IF NOT EXISTS mat_unidad_medida VARCHAR(40) NOT NULL DEFAULT 'unidad';

ALTER TABLE public.material
    DROP CONSTRAINT IF EXISTS chk_material_unidad_medida;

ALTER TABLE public.material
    ADD CONSTRAINT chk_material_unidad_medida
    CHECK (mat_unidad_medida IN (
        'par',
        'unidad',
        'metro',
        'pulgada',
        'kilogramo',
        'litro',
        'metro cuadrado'
    ));
