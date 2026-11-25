DO $$
DECLARE
    v_cantidad INT;
BEGIN
    SELECT COUNT(*) INTO v_cantidad FROM herramienta;
    IF v_cantidad > 1000 THEN
        RAISE EXCEPTION 'Hay % unidades de herramienta y el formato HE-000 a HE-999 admite hasta 1000.', v_cantidad;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM generate_series(0, 999) AS codigos(numero)
        JOIN material ON material.mat_cod = 'HE-' || lpad(codigos.numero::TEXT, 3, '0')
    ) OR EXISTS (
        SELECT 1
        FROM generate_series(0, 999) AS codigos(numero)
        JOIN herramienta_modelo
          ON herramienta_modelo.herr_modelo_cod = 'HE-' || lpad(codigos.numero::TEXT, 3, '0')
    ) THEN
        RAISE EXCEPTION 'Hay códigos HE reservados ya usados por materiales o modelos. Resolvelos antes de migrar las unidades.';
    END IF;
END;
$$;

ALTER TABLE linea_compra
    DROP CONSTRAINT linea_compra_herr_cod_fkey,
    ADD CONSTRAINT linea_compra_herr_cod_fkey
        FOREIGN KEY (herr_cod) REFERENCES herramienta(herr_cod) ON UPDATE CASCADE;

ALTER TABLE tecnico_utiliza_herramienta
    DROP CONSTRAINT tecnico_utiliza_herramienta_herr_cod_fkey,
    ADD CONSTRAINT tecnico_utiliza_herramienta_herr_cod_fkey
        FOREIGN KEY (herr_cod) REFERENCES herramienta(herr_cod) ON UPDATE CASCADE;

CREATE TEMP TABLE herramienta_codigos_migracion ON COMMIT DROP AS
SELECT
    herr_cod AS codigo_anterior,
    'MIGRANDO-' || gen_random_uuid()::TEXT AS codigo_temporal,
    'HE-' || lpad((row_number() OVER (ORDER BY herr_cod) - 1)::TEXT, 3, '0') AS codigo_nuevo
FROM herramienta;

UPDATE herramienta AS unidad
SET herr_cod = mapeo.codigo_temporal
FROM herramienta_codigos_migracion AS mapeo
WHERE unidad.herr_cod = mapeo.codigo_anterior;

UPDATE herramienta AS unidad
SET herr_cod = mapeo.codigo_nuevo
FROM herramienta_codigos_migracion AS mapeo
WHERE unidad.herr_cod = mapeo.codigo_temporal;

ALTER TABLE material
    ADD CONSTRAINT material_codigo_no_reservado_herramienta
        CHECK (mat_cod !~ '^HE-[0-9]{3}$');

ALTER TABLE herramienta_modelo
    ADD CONSTRAINT herramienta_modelo_codigo_no_reservado_unidad
        CHECK (herr_modelo_cod !~ '^HE-[0-9]{3}$');

ALTER TABLE herramienta
    ADD CONSTRAINT herramienta_codigo_formato
        CHECK (herr_cod ~ '^HE-[0-9]{3}$');

CREATE OR REPLACE FUNCTION generar_codigo_herramienta()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
DECLARE
    v_siguiente INT;
BEGIN
    PERFORM pg_advisory_xact_lock(681234567890::BIGINT);

    SELECT COALESCE(MAX(substring(herr_cod FROM 4)::INT), -1) + 1
    INTO v_siguiente
    FROM herramienta
    WHERE herr_cod ~ '^HE-[0-9]{3}$';

    IF v_siguiente > 999 THEN
        RAISE EXCEPTION 'Se agotaron los códigos de herramienta disponibles (HE-000 a HE-999).';
    END IF;

    RETURN 'HE-' || lpad(v_siguiente::TEXT, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION registrar_remito(
    p_proveedor TEXT,
    p_fecha_recepcion DATE,
    p_items JSONB,
    p_num TEXT DEFAULT NULL,
    p_obs TEXT DEFAULT NULL,
    p_usuario TEXT DEFAULT NULL,
    p_tipo_comprobante TEXT DEFAULT 'Remito'
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_remito_id BIGINT;
    v_renglon JSONB;
    v_codigo VARCHAR(50);
    v_codigo_unidad VARCHAR(6);
    v_cantidad INT;
    v_es_material BOOLEAN;
    v_nombre TEXT;
    v_tipo_id INT;
    v_descripcion TEXT;
    v_indice INT;
BEGIN
    IF p_tipo_comprobante IS NULL OR p_tipo_comprobante NOT IN ('Remito', 'Factura') THEN
        RAISE EXCEPTION 'El comprobante tiene que ser un remito o una factura.';
    END IF;
    IF p_proveedor IS NULL OR btrim(p_proveedor) = '' THEN
        RAISE EXCEPTION 'Hay que indicar el proveedor que entregó la mercadería.';
    END IF;
    IF p_fecha_recepcion IS NULL OR p_fecha_recepcion > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de recepción no puede ser posterior a hoy.';
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'El remito tiene que tener al menos un ítem.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El remito tiene que tener al menos un ítem.';
    END IF;
    IF (
        SELECT COUNT(DISTINCT renglon->>'codigo')
        FROM jsonb_array_elements(p_items) AS renglon
    ) <> jsonb_array_length(p_items) THEN
        RAISE EXCEPTION 'Hay un ítem repetido. Cargá una sola línea por ítem, con la cantidad total.';
    END IF;

    INSERT INTO remito (
        remito_tipo_comprobante, remito_proveedor, remito_num,
        remito_fecha_recepcion, remito_obs, remito_creado_por
    )
    VALUES (
        p_tipo_comprobante, btrim(p_proveedor),
        NULLIF(btrim(COALESCE(p_num, '')), ''), p_fecha_recepcion,
        NULLIF(btrim(COALESCE(p_obs, '')), ''),
        NULLIF(btrim(COALESCE(p_usuario, '')), '')
    )
    RETURNING remito_id INTO v_remito_id;

    FOR v_renglon IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF v_renglon ? 'unidades' THEN
            RAISE EXCEPTION 'Los códigos de las unidades de herramienta se generan automáticamente.';
        END IF;

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

        v_es_material := EXISTS (SELECT 1 FROM material WHERE mat_cod = v_codigo);
        IF v_es_material THEN
            NULL;
        ELSE
            SELECT herr_modelo_nom, inventariotipoid, herr_modelo_desc
            INTO v_nombre, v_tipo_id, v_descripcion
            FROM herramienta_modelo
            WHERE herr_modelo_cod = v_codigo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'El código "%" no está en el catálogo del depósito. Hay que darlo de alta antes de cargar el ingreso.', v_codigo;
            END IF;
        END IF;

        INSERT INTO remito_item (remito_id, inventarioitemcod, remito_item_cant)
        VALUES (v_remito_id, v_codigo, v_cantidad);
        INSERT INTO inventariomovimiento (
            inventarioitemcod, inventariomovimientotipo,
            inventariomovimientocantidad, inventariomovimientofecha,
            remito_id, inventariomovimientousuario
        )
        VALUES (
            v_codigo, 'Ingreso', v_cantidad, p_fecha_recepcion::TIMESTAMP,
            v_remito_id, NULLIF(btrim(COALESCE(p_usuario, '')), '')
        );

        IF v_es_material THEN
            UPDATE material
            SET mat_stock_actual = COALESCE(mat_stock_actual, 0) + v_cantidad
            WHERE mat_cod = v_codigo;
        ELSE
            FOR v_indice IN 1..v_cantidad
            LOOP
                v_codigo_unidad := generar_codigo_herramienta();
                INSERT INTO herramienta (
                    herr_cod, herr_nom, herr_desc, inventariotipoid,
                    herr_estado, herr_modelo_cod, herr_fecha_alta, remito_id
                )
                VALUES (
                    v_codigo_unidad, v_nombre, v_descripcion, v_tipo_id,
                    1, v_codigo, p_fecha_recepcion, v_remito_id
                );
            END LOOP;
        END IF;
    END LOOP;

    RETURN v_remito_id;
END;
$$;

DROP FUNCTION IF EXISTS registrar_ingreso_herramienta_manual(VARCHAR, DATE, JSONB);

CREATE FUNCTION registrar_ingreso_herramienta_manual(
    p_modelo_cod VARCHAR(50),
    p_fecha DATE,
    p_cantidad INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_modelo herramienta_modelo%ROWTYPE;
    v_codigo_unidad VARCHAR(6);
    v_indice INT;
BEGIN
    SELECT * INTO v_modelo
    FROM herramienta_modelo
    WHERE herr_modelo_cod = p_modelo_cod;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el modelo de herramienta "%".', p_modelo_cod;
    END IF;
    IF p_fecha IS NULL OR p_fecha > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de ingreso no puede ser posterior a hoy.';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad tiene que ser un número entero mayor que cero.';
    END IF;

    FOR v_indice IN 1..p_cantidad
    LOOP
        v_codigo_unidad := generar_codigo_herramienta();
        INSERT INTO herramienta (
            herr_cod, herr_nom, herr_desc, inventariotipoid,
            herr_estado, herr_modelo_cod, herr_fecha_alta
        )
        VALUES (
            v_codigo_unidad, v_modelo.herr_modelo_nom, v_modelo.herr_modelo_desc,
            v_modelo.inventariotipoid, 1, p_modelo_cod, p_fecha
        );
    END LOOP;
END;
$$;
