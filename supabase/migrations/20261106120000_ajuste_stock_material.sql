-- Ajustes de stock de un material (06/11/2026).
--
-- Hasta ahora el stock sólo subía con un remito o una factura y sólo bajaba con
-- el consumo en una tarea. Faltaba poder corregirlo a mano: agregar unidades
-- que no vienen de una compra y descontar las que se pierden, se rompen o se
-- vencen sin usarse en una tarea.
--
-- Decisiones del equipo (06/11/2026):
--   - El ajuste no lleva motivo: es una entrada o una salida, con cantidad,
--     fecha, quién lo registró y una observación opcional.
--   - Sólo para materiales. Una herramienta no tiene stock: si se rompe o se
--     pierde se da de baja y queda fuera de servicio, como hasta ahora.
--   - La fecha puede ser de hoy o anterior, pero no anterior al último
--     movimiento del material, para que el historial no quede con el stock en
--     negativo en el medio.
--
-- El ajuste es un movimiento más del historial (inventariomovimiento), así
-- que no hace falta una tabla nueva. Los movimientos que ya están cargados son
-- todos Ingreso o Consumo y no cambian.

ALTER TABLE inventariomovimiento
    ADD COLUMN IF NOT EXISTS inventariomovimientoobs VARCHAR(500);

ALTER TABLE inventariomovimiento DROP CONSTRAINT IF EXISTS chk_inventario_movimiento_tipo;
ALTER TABLE inventariomovimiento
    ADD CONSTRAINT chk_inventario_movimiento_tipo
    CHECK (inventariomovimientotipo IN ('Ingreso', 'Consumo', 'Ingreso manual', 'Egreso manual'));

-- El stock de un material no puede quedar en negativo, venga de donde venga
-- el descuento. Al 06/11/2026 no había ningún material con stock negativo.
ALTER TABLE material DROP CONSTRAINT IF EXISTS chk_material_stock_no_negativo;
ALTER TABLE material
    ADD CONSTRAINT chk_material_stock_no_negativo CHECK (mat_stock_actual >= 0);

-- El ajuste son dos escrituras (el stock y el movimiento) y tienen que pasar
-- las dos o ninguna, igual que el remito y el consumo. Por eso es una función:
-- corre en una transacción y bloquea la fila del material mientras calcula,
-- así dos descuentos al mismo tiempo no se llevan las mismas unidades.
CREATE OR REPLACE FUNCTION registrar_ajuste_stock(
    p_codigo TEXT,
    p_tipo TEXT,
    p_cantidad INT,
    p_fecha DATE,
    p_obs TEXT DEFAULT NULL,
    p_usuario TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo VARCHAR(50) := btrim(COALESCE(p_codigo, ''));
    v_nombre TEXT;
    v_stock NUMERIC;
    v_ultima TIMESTAMP;
    v_fecha TIMESTAMP;
    v_obs TEXT := NULLIF(btrim(COALESCE(p_obs, '')), '');
    v_id INT;
BEGIN
    IF p_tipo IS NULL OR p_tipo NOT IN ('Entrada', 'Salida') THEN
        RAISE EXCEPTION 'El ajuste tiene que ser una entrada o una salida.';
    END IF;

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad tiene que ser mayor que cero.';
    END IF;

    IF p_fecha IS NULL THEN
        RAISE EXCEPTION 'Hay que indicar la fecha del ajuste.';
    END IF;

    IF p_fecha > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha del ajuste no puede ser posterior a hoy.';
    END IF;

    IF length(v_obs) > 500 THEN
        RAISE EXCEPTION 'La observación puede tener hasta 500 caracteres.';
    END IF;

    SELECT mat_nom, COALESCE(mat_stock_actual, 0) INTO v_nombre, v_stock
    FROM material
    WHERE mat_cod = v_codigo
    FOR UPDATE;

    IF NOT FOUND THEN
        IF EXISTS (SELECT 1 FROM herramienta WHERE herr_cod = v_codigo) THEN
            RAISE EXCEPTION 'Una herramienta no tiene stock: si se rompe o se pierde, se da de baja y queda fuera de servicio.';
        END IF;
        RAISE EXCEPTION 'El material "%" no está en el depósito.', v_codigo;
    END IF;

    SELECT MAX(inventariomovimientofecha) INTO v_ultima
    FROM inventariomovimiento
    WHERE inventarioitemcod = v_codigo;

    IF v_ultima IS NOT NULL AND p_fecha < v_ultima::DATE THEN
        RAISE EXCEPTION 'La fecha no puede ser anterior al último movimiento del material (%).',
            to_char(v_ultima, 'DD/MM/YYYY');
    END IF;

    IF p_tipo = 'Salida' AND v_stock < p_cantidad THEN
        RAISE EXCEPTION 'No hay stock suficiente de "%": quedan % y querés descontar %.',
            v_nombre, trim_scale(v_stock), p_cantidad;
    END IF;

    UPDATE material
    SET mat_stock_actual = COALESCE(mat_stock_actual, 0)
        + CASE WHEN p_tipo = 'Entrada' THEN p_cantidad ELSE -p_cantidad END
    WHERE mat_cod = v_codigo;

    -- Si el ajuste es de hoy lleva la hora; si es de otro día, ese día. Nunca
    -- queda antes del último movimiento, así el historial se lee en el orden en
    -- que pasaron las cosas.
    v_fecha := CASE WHEN p_fecha = CURRENT_DATE THEN LOCALTIMESTAMP ELSE p_fecha::TIMESTAMP END;
    IF v_ultima IS NOT NULL AND v_fecha < v_ultima THEN
        v_fecha := v_ultima;
    END IF;

    INSERT INTO inventariomovimiento (
        inventarioitemcod,
        inventariomovimientotipo,
        inventariomovimientocantidad,
        inventariomovimientofecha,
        remito_id,
        inventariomovimientousuario,
        inventariomovimientoobs
    )
    VALUES (
        v_codigo,
        CASE WHEN p_tipo = 'Entrada' THEN 'Ingreso manual' ELSE 'Egreso manual' END,
        p_cantidad,
        v_fecha,
        NULL,
        NULLIF(btrim(COALESCE(p_usuario, '')), ''),
        v_obs
    )
    RETURNING inventariomovimientoid INTO v_id;

    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION registrar_ajuste_stock IS
    'Ajuste de stock de un material: entrada o salida que no viene de un remito ni de una tarea. Mueve el stock y anota el movimiento, todo junto.';
