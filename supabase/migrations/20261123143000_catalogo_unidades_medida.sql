-- Catalogo de unidades de medida de los materiales (23/11/2026).
-- Permite agregar unidades nuevas desde el formulario de material sin quedar
-- atado a una lista fija en un CHECK.
CREATE TABLE IF NOT EXISTS public.unidad_medida (
    unidad_medida_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unidad_medida_nom VARCHAR(40) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unidad_medida_nom_sin_mayusculas
    ON public.unidad_medida (LOWER(unidad_medida_nom));

INSERT INTO public.unidad_medida (unidad_medida_nom)
VALUES
    ('par'),
    ('unidad'),
    ('metro'),
    ('pulgada'),
    ('kilogramo'),
    ('litro'),
    ('metro cuadrado')
ON CONFLICT (LOWER(unidad_medida_nom)) DO NOTHING;

ALTER TABLE public.material
    DROP CONSTRAINT IF EXISTS chk_material_unidad_medida;

ALTER TABLE public.material
    ADD CONSTRAINT chk_material_unidad_medida
    CHECK (LENGTH(BTRIM(mat_unidad_medida)) > 0);
