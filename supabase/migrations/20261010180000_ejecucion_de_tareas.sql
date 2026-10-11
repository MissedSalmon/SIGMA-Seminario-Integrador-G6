-- Ejecucion de las tareas por el tecnico (HU-22) y cierre automatico (HU-26).
--
-- 1. El ticket guarda cuando se cerro. Lo pide la HU-26: al finalizarse la OT,
--    el ticket pasa solo a "Cerrado" y queda la fecha.
--
-- 2. registrar_consumo_tarea: el tecnico registra los materiales que uso en
--    una tarea y el stock se descuenta en el mismo momento.
--
--    Va en una funcion de la base, y no en varias consultas desde la API, para
--    que sea todo o nada y para que dos tecnicos no puedan llevarse las mismas
--    ultimas unidades. El descuento es un solo UPDATE que exige que alcance el
--    stock (mat_stock_actual >= cantidad): si no alcanza, no descuenta nada y
--    la funcion corta con el aviso. Como corre en una transaccion, si falla un
--    material no queda descontado ninguno de los anteriores.
--
--    Por cada material:
--      - se descuenta el stock;
--      - se suma a lo que la tarea ya tenia de ese material
--        (tarea_ot_consume_material, una fila por tarea y material);
--      - queda un movimiento "Consumo" en el historial del deposito, con el
--        legajo de quien lo registro.
--
--    Las cantidades son enteras, igual que en los ingresos por remito.

ALTER TABLE ticket ADD COLUMN IF NOT EXISTS ticket_fecha_cierre TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION registrar_consumo_tarea(
    p_ot_id BIGINT,
    p_tarea_id INT,
    p_items JSONB,
    p_usuario TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_renglon JSONB;
    v_codigo VARCHAR(50);
    v_cantidad INT;
    v_nombre TEXT;
    v_stock NUMERIC;
    v_estado_tarea INT;
BEGIN
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Hay que cargar al menos un material.';
    END IF;

    IF (
        SELECT COUNT(DISTINCT renglon->>'codigo')
        FROM jsonb_array_elements(p_items) AS renglon
    ) <> jsonb_array_length(p_items) THEN
        RAISE EXCEPTION 'Hay un material repetido. Cargá una sola línea por material, con la cantidad total.';
    END IF;

    -- La tarea tiene que estar en ejecucion (3 = En ejecución). Se bloquea la
    -- fila para que nadie la finalice mientras se registra el consumo.
    SELECT tarea_estado INTO v_estado_tarea
    FROM tarea_ot
    WHERE ot_id = p_ot_id AND tarea_id = p_tarea_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La tarea % de la orden de trabajo % no existe.', p_tarea_id, p_ot_id;
    END IF;

    IF v_estado_tarea <> 3 THEN
        RAISE EXCEPTION 'Los materiales se registran mientras la tarea está en ejecución.';
    END IF;

    FOR v_renglon IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_codigo := btrim(COALESCE(v_renglon->>'codigo', ''));

        BEGIN
            v_cantidad := (v_renglon->>'cantidad')::INT;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'La cantidad de "%" tiene que ser un número entero.', v_codigo;
        END;

        IF v_codigo = '' THEN
            RAISE EXCEPTION 'Hay un renglón sin material elegido.';
        END IF;

        IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad de "%" tiene que ser mayor que cero.', v_codigo;
        END IF;

        UPDATE material
        SET mat_stock_actual = mat_stock_actual - v_cantidad
        WHERE mat_cod = v_codigo
          AND COALESCE(mat_stock_actual, 0) >= v_cantidad;

        IF NOT FOUND THEN
            SELECT mat_nom, COALESCE(mat_stock_actual, 0) INTO v_nombre, v_stock
            FROM material
            WHERE mat_cod = v_codigo;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'El material "%" no está en el depósito.', v_codigo;
            END IF;

            RAISE EXCEPTION 'No hay stock suficiente de "%": quedan % y querés registrar %.',
                v_nombre, v_stock, v_cantidad;
        END IF;

        INSERT INTO tarea_ot_consume_material (ot_id, tarea_id, mat_cod, tamat_cant, tamat_fecha_cons)
        VALUES (p_ot_id, p_tarea_id, v_codigo, v_cantidad, NOW())
        ON CONFLICT (ot_id, tarea_id, mat_cod)
        DO UPDATE SET
            tamat_cant = tarea_ot_consume_material.tamat_cant + EXCLUDED.tamat_cant,
            tamat_fecha_cons = EXCLUDED.tamat_fecha_cons;

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
            'Consumo',
            v_cantidad,
            NOW(),
            NULL,
            NULLIF(btrim(COALESCE(p_usuario, '')), '')
        );
    END LOOP;
END;
$$;
