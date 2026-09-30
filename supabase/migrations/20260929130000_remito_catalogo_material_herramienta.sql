-- HU-16: el remito usa el catalogo real, que son las tablas material y herramienta.
--
-- La migracion 20260929004641 validaba y sumaba stock contra inventarioitem, pero
-- el catalogo que se carga desde la pantalla (HU-15) vive en material y
-- herramienta. Resultado: cualquier codigo daba "no esta en el catalogo".
--
-- Como el codigo es unico entre las dos tablas y no hay una clave foranea que
-- apunte a las dos a la vez, se sacan las claves hacia inventarioitem y la
-- funcion pasa a buscar el codigo en cada tabla.
--
-- Las herramientas no llevan stock (se prestan una por una): el remito anota el
-- renglon y el movimiento, pero no toca ningun numero.

ALTER TABLE remito_item DROP CONSTRAINT IF EXISTS remito_item_inventarioitemcod_fkey;
ALTER TABLE inventariomovimiento DROP CONSTRAINT IF EXISTS inventariomovimiento_inventarioitemcod_fkey;

CREATE OR REPLACE FUNCTION registrar_remito(
    p_proveedor TEXT,
    p_fecha_recepcion DATE,
    p_items JSONB,
    p_num TEXT DEFAULT NULL,
    p_obs TEXT DEFAULT NULL,
    p_usuario TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_remito_id BIGINT;
    v_renglon JSONB;
    v_codigo VARCHAR(50);
    v_cantidad INT;
    v_es_material BOOLEAN;
BEGIN
    IF p_proveedor IS NULL OR btrim(p_proveedor) = '' THEN
        RAISE EXCEPTION 'Hay que indicar el proveedor que entregó la mercadería.';
    END IF;

    IF p_fecha_recepcion IS NULL THEN
        RAISE EXCEPTION 'Hay que indicar la fecha de recepción del remito.';
    END IF;

    IF p_fecha_recepcion > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de recepción no puede ser posterior a hoy.';
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El remito tiene que tener al menos un ítem.';
    END IF;

    IF (
        SELECT COUNT(DISTINCT renglon->>'codigo')
        FROM jsonb_array_elements(p_items) AS renglon
    ) <> jsonb_array_length(p_items) THEN
        RAISE EXCEPTION 'Hay un ítem repetido en el remito. Cargá una sola línea por ítem, con la cantidad total.';
    END IF;

    INSERT INTO remito (
        remito_proveedor,
        remito_num,
        remito_fecha_recepcion,
        remito_obs,
        remito_creado_por
    )
    VALUES (
        btrim(p_proveedor),
        NULLIF(btrim(COALESCE(p_num, '')), ''),
        p_fecha_recepcion,
        NULLIF(btrim(COALESCE(p_obs, '')), ''),
        NULLIF(btrim(COALESCE(p_usuario, '')), '')
    )
    RETURNING remito_id INTO v_remito_id;

    FOR v_renglon IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_codigo := btrim(COALESCE(v_renglon->>'codigo', ''));

        BEGIN
            v_cantidad := (v_renglon->>'cantidad')::INT;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'La cantidad de "%" tiene que ser un número entero.', v_codigo;
        END;

        IF v_codigo = '' THEN
            RAISE EXCEPTION 'Hay un renglón sin ítem elegido.';
        END IF;

        IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad de "%" tiene que ser mayor que cero.', v_codigo;
        END IF;

        -- El remito NO da de alta items: el codigo tiene que estar en material
        -- o en herramienta.
        v_es_material := EXISTS (SELECT 1 FROM material WHERE mat_cod = v_codigo);

        IF NOT v_es_material AND NOT EXISTS (SELECT 1 FROM herramienta WHERE herr_cod = v_codigo) THEN
            RAISE EXCEPTION 'El código "%" no está en el catálogo del depósito. Hay que darlo de alta antes de cargar el remito.', v_codigo;
        END IF;

        INSERT INTO remito_item (remito_id, inventarioitemcod, remito_item_cant)
        VALUES (v_remito_id, v_codigo, v_cantidad);

        INSERT INTO inventariomovimiento (
            inventarioitemcod,
            inventariomovimientotipo,
            inventariomovimientocantidad,
            inventariomovimientofecha,
            remito_id,
            inventariomovimientousuario
        )
        VALUES (
            v_codigo,
            'Ingreso',
            v_cantidad,
            p_fecha_recepcion::TIMESTAMP,
            v_remito_id,
            NULLIF(btrim(COALESCE(p_usuario, '')), '')
        );

        IF v_es_material THEN
            UPDATE material
            SET mat_stock_actual = COALESCE(mat_stock_actual, 0) + v_cantidad
            WHERE mat_cod = v_codigo;
        END IF;
    END LOOP;

    RETURN v_remito_id;
END;
$$;
