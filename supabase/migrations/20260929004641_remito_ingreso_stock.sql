-- HU-16: registrar el ingreso de materiales y herramientas por remito.
--
-- El remito es el comprobante con el que el deposito recibe la mercaderia. Al
-- confirmarlo, el stock de cada item sube en la cantidad que entro y queda
-- anotado el movimiento, para poder reconstruir despues como llego el stock al
-- numero que muestra hoy.
--
-- QUE SE REUTILIZA Y QUE SE AGREGA
--
-- La tabla de movimientos NO se crea aca: ya existe desde HU-13
-- (20260911120000_create_inventario.sql) con su tipo, su cantidad y su fecha.
-- Lo unico que le falta es de donde viene el movimiento, asi que se le agregan
-- dos columnas. El tipo sigue siendo 'Ingreso' o 'Consumo': 'Consumo' es el
-- egreso que va a registrar la tarea de la OT cuando se gaste un material, asi
-- que la tabla queda servida para las dos cosas. No se agrega 'Ajuste' porque
-- todavia no hay ninguna historia que lo pida.
--
-- El catalogo es inventarioitem, el de HU-13. Las tablas material y
-- herramienta del refactor del 13/09 quedaron sin uso en el codigo.
--
-- EL PROVEEDOR VA COMO TEXTO
--
-- La tabla proveedor existe desde el refactor, pero esta vacia, no tiene
-- pantalla de alta y no hay ninguna HU que la cargue (ver contexto.md, 13.3:
-- "Proveedores + Compras: el modelo los tiene pero no hay HU"). Con una clave
-- foranea el administrador no podria elegir ninguno. Se guarda el nombre
-- escrito a mano; el dia que exista el ABM de proveedores, se migra la columna.
--
-- TAMPOCO SE USA compra / linea_compra
--
-- Son del circuito de compras, que esta fuera del alcance del prototipo
-- (contexto.md, 3.4). El remito es solo el comprobante de que la mercaderia
-- entro: no lleva montos ni numero de factura.
--
-- SIN RLS
--
-- Ninguna tabla del proyecto tiene politicas de seguridad a nivel de fila, ni
-- siquiera las de HU-13. El backend entra siempre con la SERVICE_ROLE_KEY, que
-- las saltea. Estas tablas quedan igual que el resto.

-- ---------------------------------------------------------------------------
-- 1. El remito
-- ---------------------------------------------------------------------------

CREATE TABLE remito (
    remito_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    remito_proveedor TEXT NOT NULL,
    -- El numero que trae el papel. Es opcional: no todos los remitos lo traen.
    remito_num VARCHAR(50),
    remito_fecha_recepcion DATE NOT NULL,
    remito_obs TEXT,
    -- Quien lo cargo. Queda anulable a proposito: el sistema todavia no tiene
    -- login, asi que por ahora no hay a quien anotar.
    remito_creado_por VARCHAR(50),
    -- Cuando se cargo en SIGMA, que no es lo mismo que cuando llego la
    -- mercaderia: un remito de la semana pasada se puede cargar hoy.
    remito_creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_remito_proveedor CHECK (btrim(remito_proveedor) <> '')
);

-- ---------------------------------------------------------------------------
-- 2. Los renglones del remito
-- ---------------------------------------------------------------------------
--
-- La clave primaria es (remito, item), asi que el mismo item no puede entrar
-- dos veces en el mismo remito. Se eligio rechazarlo y no sumar las dos
-- cantidades en silencio: el remito es un comprobante y tiene que poder
-- compararse renglon por renglon contra el papel. Si el papel trae el item
-- repetido, se carga una sola linea con la suma.

CREATE TABLE remito_item (
    remito_id BIGINT NOT NULL REFERENCES remito(remito_id) ON DELETE CASCADE,
    inventarioitemcod VARCHAR(50) NOT NULL REFERENCES InventarioItem(inventarioItemCod),
    remito_item_cant INT NOT NULL,
    PRIMARY KEY (remito_id, inventarioitemcod),
    CONSTRAINT chk_remito_item_cant CHECK (remito_item_cant > 0)
);

-- ---------------------------------------------------------------------------
-- 3. De donde viene cada movimiento
-- ---------------------------------------------------------------------------

ALTER TABLE InventarioMovimiento
    -- Anulable: un consumo de una tarea de OT no viene de ningun remito.
    ADD COLUMN IF NOT EXISTS remito_id BIGINT REFERENCES remito(remito_id),
    ADD COLUMN IF NOT EXISTS inventarioMovimientoUsuario VARCHAR(50);

-- El historial de un item se pide siempre por item y ordenado por fecha.
CREATE INDEX IF NOT EXISTS idx_inventariomovimiento_item_fecha
    ON InventarioMovimiento (inventarioItemCod, inventarioMovimientoFecha DESC);

-- ---------------------------------------------------------------------------
-- 4. Confirmar el remito, todo junto o nada
-- ---------------------------------------------------------------------------
--
-- Confirmar un remito son cuatro escrituras: la cabecera, los renglones, los
-- movimientos y el stock de cada item. Si se cortaran por la mitad, el stock
-- quedaria mintiendo. El cliente de Supabase no maneja transacciones, asi que
-- el trabajo se hace aca adentro: una funcion de Postgres es una transaccion,
-- y si algo falla se deshace todo solo.
--
-- Los items llegan en un JSON, que es la unica forma de pasarle una lista de
-- largo variable a una funcion desde el cliente de Supabase:
--
--   [{ "codigo": "CA-111", "cantidad": 10 }, { "codigo": "TO-201", "cantidad": 50 }]
--
-- Las validaciones tambien estan en el backend, con mensajes mas cuidados.
-- Las de aca son la ultima linea: valen aunque alguien llame a la funcion por
-- afuera del backend.

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

    -- El mismo item dos veces: lo atajaria la clave primaria de remito_item,
    -- pero el mensaje que da Postgres no se entiende. Mejor decirlo asi.
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

        -- El remito NO da de alta items: si no esta en el catalogo, se corta.
        IF NOT EXISTS (
            SELECT 1 FROM inventarioitem WHERE inventarioitemcod = v_codigo
        ) THEN
            RAISE EXCEPTION 'El código "%" no está en el catálogo del depósito. Hay que darlo de alta antes de cargar el remito.', v_codigo;
        END IF;

        INSERT INTO remito_item (remito_id, inventarioitemcod, remito_item_cant)
        VALUES (v_remito_id, v_codigo, v_cantidad);

        -- La fecha del movimiento es la de recepcion: es cuando la mercaderia
        -- entro de verdad al deposito, no cuando se cargo la pantalla.
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

        UPDATE inventarioitem
        SET inventarioitemstockactual = inventarioitemstockactual + v_cantidad
        WHERE inventarioitemcod = v_codigo;
    END LOOP;

    RETURN v_remito_id;
END;
$$;

COMMENT ON FUNCTION registrar_remito IS
    'HU-16: registra un remito con sus items, anota los movimientos de ingreso y sube el stock. Todo en una transaccion.';
