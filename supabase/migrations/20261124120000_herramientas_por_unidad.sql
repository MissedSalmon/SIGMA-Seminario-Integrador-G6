-- Separa el modelo de herramienta de cada unidad fisica.
CREATE TABLE herramienta_modelo (
    herr_modelo_cod VARCHAR(50) PRIMARY KEY,
    herr_modelo_nom TEXT NOT NULL,
    herr_modelo_desc TEXT,
    inventariotipoid INT NOT NULL REFERENCES inventariotipo(inventariotipoid)
);

ALTER TABLE herramienta
    ADD COLUMN herr_modelo_cod VARCHAR(50),
    ADD COLUMN herr_fecha_alta DATE,
    ADD COLUMN remito_id BIGINT REFERENCES remito(remito_id);

CREATE TEMP TABLE herramienta_modelos_migrados AS
SELECT
    herr_nom,
    herr_desc,
    inventariotipoid,
    'LEGACY-' || gen_random_uuid() AS codigo
FROM (
    SELECT DISTINCT herr_nom, herr_desc, inventariotipoid
    FROM herramienta
) AS existentes;

UPDATE herramienta_modelos_migrados AS modelo
SET codigo = 'LEGACY-' || gen_random_uuid()
WHERE EXISTS (SELECT 1 FROM material WHERE mat_cod = modelo.codigo)
   OR EXISTS (SELECT 1 FROM herramienta WHERE herr_cod = modelo.codigo);

INSERT INTO herramienta_modelo (herr_modelo_cod, herr_modelo_nom, herr_modelo_desc, inventariotipoid)
SELECT codigo, herr_nom, herr_desc, inventariotipoid
FROM herramienta_modelos_migrados;

UPDATE herramienta AS unidad
SET herr_modelo_cod = modelos.codigo
FROM herramienta_modelos_migrados AS modelos
WHERE unidad.herr_nom = modelos.herr_nom
  AND unidad.inventariotipoid = modelos.inventariotipoid
  AND unidad.herr_desc IS NOT DISTINCT FROM modelos.herr_desc;

DROP TABLE herramienta_modelos_migrados;

UPDATE herramienta AS unidad
SET
    herr_fecha_alta = (
        SELECT movimiento.inventariomovimientofecha::DATE
        FROM inventariomovimiento AS movimiento
        WHERE movimiento.inventarioitemcod = unidad.herr_cod
          AND movimiento.inventariomovimientotipo = 'Ingreso'
        ORDER BY movimiento.inventariomovimientofecha, movimiento.inventariomovimientoid
        LIMIT 1
    ),
    remito_id = (
        SELECT movimiento.remito_id
        FROM inventariomovimiento AS movimiento
        WHERE movimiento.inventarioitemcod = unidad.herr_cod
          AND movimiento.inventariomovimientotipo = 'Ingreso'
        ORDER BY movimiento.inventariomovimientofecha, movimiento.inventariomovimientoid
        LIMIT 1
    );

CREATE TEMP TABLE remito_items_herramienta_migrados AS
SELECT
    renglon.remito_id,
    unidad.herr_modelo_cod AS codigo_modelo,
    SUM(renglon.remito_item_cant)::INT AS cantidad
FROM remito_item AS renglon
JOIN herramienta AS unidad ON unidad.herr_cod = renglon.inventarioitemcod
GROUP BY renglon.remito_id, unidad.herr_modelo_cod;

UPDATE inventariomovimiento AS movimiento
SET inventarioitemcod = unidad.herr_modelo_cod
FROM herramienta AS unidad
WHERE movimiento.inventarioitemcod = unidad.herr_cod;

DELETE FROM remito_item AS renglon
USING herramienta AS unidad
WHERE renglon.inventarioitemcod = unidad.herr_cod;

INSERT INTO remito_item (remito_id, inventarioitemcod, remito_item_cant)
SELECT remito_id, codigo_modelo, cantidad
FROM remito_items_herramienta_migrados
ON CONFLICT (remito_id, inventarioitemcod)
DO UPDATE SET remito_item_cant = remito_item.remito_item_cant + EXCLUDED.remito_item_cant;

DROP TABLE remito_items_herramienta_migrados;

ALTER TABLE herramienta
    ALTER COLUMN herr_modelo_cod SET NOT NULL,
    ADD CONSTRAINT herramienta_modelo_fkey
        FOREIGN KEY (herr_modelo_cod) REFERENCES herramienta_modelo(herr_modelo_cod);

CREATE INDEX herramienta_modelo_idx ON herramienta (herr_modelo_cod);

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
    v_serie JSONB;
    v_codigo VARCHAR(50);
    v_serie_codigo VARCHAR(50);
    v_cantidad INT;
    v_es_material BOOLEAN;
    v_nombre TEXT;
    v_tipo_id INT;
    v_descripcion TEXT;
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
    IF (
        SELECT COUNT(*) <> COUNT(DISTINCT btrim(unidad->>'serie'))
        FROM jsonb_array_elements(p_items) AS renglon
        CROSS JOIN LATERAL jsonb_array_elements(
            CASE
                WHEN jsonb_typeof(renglon->'unidades') = 'array' THEN renglon->'unidades'
                ELSE '[]'::JSONB
            END
        ) AS unidades(unidad)
    ) THEN
        RAISE EXCEPTION 'Hay números de serie repetidos en el ingreso.';
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
            IF COALESCE(v_renglon->'unidades', '[]'::JSONB) <> '[]'::JSONB THEN
                RAISE EXCEPTION 'Los números de serie solo se cargan para herramientas.';
            END IF;
        ELSE
            SELECT herr_modelo_nom, inventariotipoid, herr_modelo_desc
            INTO v_nombre, v_tipo_id, v_descripcion
            FROM herramienta_modelo
            WHERE herr_modelo_cod = v_codigo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'El código "%" no está en el catálogo del depósito. Hay que darlo de alta antes de cargar el ingreso.', v_codigo;
            END IF;
            IF COALESCE(jsonb_typeof(v_renglon->'unidades'), '') <> 'array' THEN
                RAISE EXCEPTION 'Cargá un número de serie distinto por cada unidad de "%".', v_nombre;
            END IF;
            IF jsonb_array_length(v_renglon->'unidades') <> v_cantidad THEN
                RAISE EXCEPTION 'Cargá un número de serie distinto por cada unidad de "%".', v_nombre;
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
            FOR v_serie IN SELECT * FROM jsonb_array_elements(v_renglon->'unidades')
            LOOP
                v_serie_codigo := btrim(COALESCE(v_serie->>'serie', ''));
                IF v_serie_codigo = '' THEN
                    RAISE EXCEPTION 'Cada unidad de "%" necesita un número de serie o inventario.', v_nombre;
                END IF;
                IF length(v_serie_codigo) > 50 THEN
                    RAISE EXCEPTION 'El número de serie o inventario puede tener hasta 50 caracteres.';
                END IF;
                IF EXISTS (SELECT 1 FROM material WHERE mat_cod = v_serie_codigo) THEN
                    RAISE EXCEPTION 'El identificador "%" ya pertenece a un material.', v_serie_codigo;
                END IF;
                IF EXISTS (SELECT 1 FROM herramienta_modelo WHERE herr_modelo_cod = v_serie_codigo) THEN
                    RAISE EXCEPTION 'El identificador "%" ya pertenece a un modelo de herramienta.', v_serie_codigo;
                END IF;
                IF EXISTS (SELECT 1 FROM herramienta WHERE herr_cod = v_serie_codigo) THEN
                    RAISE EXCEPTION 'El identificador "%" ya está registrado.', v_serie_codigo;
                END IF;
                INSERT INTO herramienta (
                    herr_cod, herr_nom, herr_desc, inventariotipoid,
                    herr_estado, herr_modelo_cod, herr_fecha_alta, remito_id
                )
                VALUES (
                    v_serie_codigo, v_nombre, v_descripcion, v_tipo_id,
                    1, v_codigo, p_fecha_recepcion, v_remito_id
                );
            END LOOP;
        END IF;
    END LOOP;

    RETURN v_remito_id;
END;
$$;

CREATE OR REPLACE FUNCTION registrar_ingreso_herramienta_manual(
    p_modelo_cod VARCHAR(50),
    p_fecha DATE,
    p_series JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_serie JSONB;
    v_codigo VARCHAR(50);
    v_modelo herramienta_modelo%ROWTYPE;
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
    IF p_series IS NULL OR jsonb_typeof(p_series) <> 'array' THEN
        RAISE EXCEPTION 'Cargá al menos un número de serie o inventario.';
    END IF;
    IF jsonb_array_length(p_series) = 0 THEN
        RAISE EXCEPTION 'Cargá al menos un número de serie o inventario.';
    END IF;
    IF (
        SELECT COUNT(DISTINCT btrim(unidad->>'serie'))
        FROM jsonb_array_elements(p_series) AS unidades(unidad)
    ) <> jsonb_array_length(p_series) THEN
        RAISE EXCEPTION 'Hay números de serie repetidos en el ingreso.';
    END IF;

    FOR v_serie IN SELECT * FROM jsonb_array_elements(p_series)
    LOOP
        v_codigo := btrim(COALESCE(v_serie->>'serie', ''));
        IF v_codigo = '' THEN
            RAISE EXCEPTION 'Cada unidad necesita un número de serie o inventario.';
        END IF;
        IF length(v_codigo) > 50 THEN
            RAISE EXCEPTION 'El número de serie o inventario puede tener hasta 50 caracteres.';
        END IF;
        IF EXISTS (SELECT 1 FROM material WHERE mat_cod = v_codigo) THEN
            RAISE EXCEPTION 'El identificador "%" ya pertenece a un material.', v_codigo;
        END IF;
        IF EXISTS (SELECT 1 FROM herramienta_modelo WHERE herr_modelo_cod = v_codigo) THEN
            RAISE EXCEPTION 'El identificador "%" ya pertenece a un modelo de herramienta.', v_codigo;
        END IF;
        IF EXISTS (SELECT 1 FROM herramienta WHERE herr_cod = v_codigo) THEN
            RAISE EXCEPTION 'El identificador "%" ya está registrado.', v_codigo;
        END IF;
        INSERT INTO herramienta (
            herr_cod, herr_nom, herr_desc, inventariotipoid,
            herr_estado, herr_modelo_cod, herr_fecha_alta
        )
        VALUES (
            v_codigo, v_modelo.herr_modelo_nom, v_modelo.herr_modelo_desc,
            v_modelo.inventariotipoid, 1, p_modelo_cod, p_fecha
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION actualizar_modelo_herramienta(
    p_codigo VARCHAR(50),
    p_nombre TEXT,
    p_descripcion TEXT,
    p_tipo_id INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE herramienta_modelo
    SET herr_modelo_nom = p_nombre,
        herr_modelo_desc = p_descripcion,
        inventariotipoid = p_tipo_id
    WHERE herr_modelo_cod = p_codigo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el modelo de herramienta "%".', p_codigo;
    END IF;

    UPDATE herramienta
    SET herr_nom = p_nombre,
        herr_desc = p_descripcion,
        inventariotipoid = p_tipo_id
    WHERE herr_modelo_cod = p_codigo;
END;
$$;
