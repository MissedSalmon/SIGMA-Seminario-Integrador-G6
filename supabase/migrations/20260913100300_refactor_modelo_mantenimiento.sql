-- =============================================================================
-- 1. LIMPIEZA DEL ESQUEMA ANTERIOR (DROP)
-- Elimina las tablas viejas y nuevas para garantizar una instalación limpia.
-- =============================================================================
DROP TABLE IF EXISTS
        "Edificio", "Area", "Espacio", "TipoEspacio", "Autorizado",
        "Activo", "TipoActivo", "Falla", "Ticket",
        "OrdenesTrabajo", "OrdenTrabajo", "TareasOT", "TareaOT", "PlantillaDeTareas",
        "PlantillaDeTarea", "MantenimientoPreventivo", "MantPrev_Plantilla", "MantPrev_Tarea",
        "Tecnico", "Especialidad", "Tecnico_Especialidad", "PrestadorServicio",
        "Prestador_Especialidad", "Tecnico_asignado_TareaOT", "Tecnico_utiliza_Herramienta",
        "Material", "Herramienta", "TareaOT_consume_Material", "Proveedor", "Compra",
        "LineaCompra",
        -- Nombres en snake_case por si ya existen
        edificio, area, espacio, tipo_espacio, autorizado, activo, tipo_activo, falla, ticket,
        orden_trabajo, tarea_ot, plantilla_de_tarea, mantenimiento_preventivo,
        mant_prev_tarea, tecnico, especialidad, tecnico_especialidad, prestador_servicio,
        prestador_especialidad, tecnico_asignado_tarea_ot, tecnico_utiliza_herramienta,
        material, herramienta, tarea_ot_consume_material, proveedor, compra, linea_compra
CASCADE;

-- =============================================================================
-- 2. CREACIÓN DEL NUEVO ESQUEMA OPTIMIZADO (SNAKE_CASE)
-- =============================================================================

-- Habilitar extensión UUID si se requiere a futuro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tablas Base de Infraestructura
CREATE TABLE edificio (
    edificio_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    edificio_nom TEXT NOT NULL,
    edificio_dir TEXT
);

CREATE TABLE tipo_espacio (
    tipo_espacio_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_espacio_nom VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE espacio (
    espacio_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    edificio_id BIGINT NOT NULL REFERENCES edificio(edificio_id) ON DELETE CASCADE,
    espacio_num VARCHAR(20) NOT NULL,
    tipo_espacio_id BIGINT NOT NULL REFERENCES tipo_espacio(tipo_espacio_id),
    espacio_piso VARCHAR(20),
    espacio_dim NUMERIC(8,2),
    CONSTRAINT uq_espacio_edificio UNIQUE (edificio_id, espacio_num)
);

CREATE TABLE autorizado (
    autorizado_legajo VARCHAR(50) PRIMARY KEY,
    autorizado_nom_ape TEXT NOT NULL,
    autorizado_tel VARCHAR(30)
);

CREATE TABLE area (
    area_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    edificio_id BIGINT NOT NULL REFERENCES edificio(edificio_id),
    espacio_id BIGINT REFERENCES espacio(espacio_id),
    autorizado_legajo VARCHAR(50) REFERENCES autorizado(autorizado_legajo),
    area_nom TEXT NOT NULL
);

-- 2. Tablas de Activos y Mantenimiento Preventivo
CREATE TABLE tipo_activo (
    tipo_activo_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_activo_nom VARCHAR(100) NOT NULL
);

CREATE TABLE activo (
    activo_codigo VARCHAR(50) PRIMARY KEY,
    edificio_id BIGINT NOT NULL REFERENCES edificio(edificio_id),
    espacio_id BIGINT REFERENCES espacio(espacio_id),
    tipo_activo_id BIGINT NOT NULL REFERENCES tipo_activo(tipo_activo_id),
    activo_fecha_alta TIMESTAMPTZ DEFAULT NOW(),
    activo_fecha_baja TIMESTAMPTZ,
    activo_fecha_ult_maint TIMESTAMPTZ,
    activo_estado VARCHAR(50) DEFAULT 'OPERATIVO'
);

CREATE TABLE plantilla_de_tarea (
    tarea_plan_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_activo_id BIGINT NOT NULL REFERENCES tipo_activo(tipo_activo_id),
    tarea_plan_nom TEXT NOT NULL,
    tarea_plan_desc TEXT
);

CREATE TABLE mantenimiento_preventivo (
    mant_prev_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activo_codigo VARCHAR(50) NOT NULL REFERENCES activo(activo_codigo),
    tipo_activo_id BIGINT NOT NULL REFERENCES tipo_activo(tipo_activo_id),
    mant_prev_nom TEXT NOT NULL,
    mant_prev_desc TEXT,
    mant_prev_frec VARCHAR(50) NOT NULL
);

CREATE TABLE mant_prev_tarea (
    mant_prev_id BIGINT REFERENCES mantenimiento_preventivo(mant_prev_id) ON DELETE CASCADE,
    tarea_plan_id BIGINT REFERENCES plantilla_de_tarea(tarea_plan_id) ON DELETE CASCADE,
    PRIMARY KEY (mant_prev_id, tarea_plan_id)
);

-- 3. Tickets y Órdenes de Trabajo
CREATE TABLE ticket (
    ticket_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activo_codigo VARCHAR(50) NOT NULL REFERENCES activo(activo_codigo),
    autorizado_legajo VARCHAR(50) NOT NULL REFERENCES autorizado(autorizado_legajo),
    ticket_fecha_alta TIMESTAMPTZ DEFAULT NOW(),
    ticket_desc TEXT NOT NULL,
    ticket_estado VARCHAR(50) DEFAULT 'ABIERTO',
    ticket_evidencia TEXT
);

CREATE TABLE orden_trabajo (
    ot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id BIGINT REFERENCES ticket(ticket_id),
    mant_prev_id BIGINT REFERENCES mantenimiento_preventivo(mant_prev_id),
    ot_fecha_alta TIMESTAMPTZ DEFAULT NOW(),
    ot_fecha_cierre TIMESTAMPTZ,
    ot_estado VARCHAR(50) DEFAULT 'PENDIENTE',
    ot_desc TEXT,
    CONSTRAINT chk_ot_origen CHECK (
        (ticket_id IS NOT NULL AND mant_prev_id IS NULL) OR
        (ticket_id IS NULL AND mant_prev_id IS NOT NULL)
    )
);

CREATE TABLE falla (
    falla_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ot_id BIGINT NOT NULL REFERENCES orden_trabajo(ot_id) ON DELETE CASCADE,
    falla_tipo VARCHAR(100),
    falla_desc TEXT NOT NULL,
    falla_fecha TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prestador_servicio (
    prestador_serv_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prestador_serv_nom TEXT NOT NULL,
    prestador_serv_cuil VARCHAR(20),
    prestador_serv_tel VARCHAR(30),
    prestador_serv_cuenta_bco VARCHAR(50)
);

CREATE TABLE tarea_ot (
    ot_id BIGINT REFERENCES orden_trabajo(ot_id) ON DELETE CASCADE,
    tarea_id INT NOT NULL,
    tarea_plan_id BIGINT REFERENCES plantilla_de_tarea(tarea_plan_id),
    prestador_serv_id BIGINT REFERENCES prestador_servicio(prestador_serv_id),
    tarea_hom NUMERIC(5,2),
    tarea_desc TEXT NOT NULL,
    tarea_estado VARCHAR(50) DEFAULT 'PENDIENTE',
    tarea_prioridad VARCHAR(20) DEFAULT 'MEDIA',
    tarea_fecha_ini TIMESTAMPTZ,
    tarea_fecha_fin TIMESTAMPTZ,
    PRIMARY KEY (ot_id, tarea_id)
);

-- 4. Materiales, Herramientas y Compras
CREATE TABLE material (
    mat_cod VARCHAR(50) PRIMARY KEY,
    mat_nom TEXT NOT NULL,
    mat_stock_actual NUMERIC(10,2) DEFAULT 0,
    mat_stock_min NUMERIC(10,2) DEFAULT 0,
    mat_fecha_venc DATE
);

CREATE TABLE herramienta (
    herr_cod VARCHAR(50) PRIMARY KEY,
    herr_nom TEXT NOT NULL,
    herr_estado VARCHAR(50) DEFAULT 'DISPONIBLE'
);

CREATE TABLE tarea_ot_consume_material (
    ot_id BIGINT,
    tarea_id INT,
    mat_cod VARCHAR(50) REFERENCES material(mat_cod),
    tamat_fecha_cons TIMESTAMPTZ DEFAULT NOW(),
    tamat_cant NUMERIC(10,2) NOT NULL DEFAULT 1,
    PRIMARY KEY (ot_id, tarea_id, mat_cod),
    FOREIGN KEY (ot_id, tarea_id) REFERENCES tarea_ot(ot_id, tarea_id) ON DELETE CASCADE
);

CREATE TABLE proveedor (
    proveedor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_nom TEXT NOT NULL,
    proveedor_cuil VARCHAR(20),
    proveedor_tel VARCHAR(30),
    proveedor_dir TEXT,
    proveedor_rubro VARCHAR(100)
);

CREATE TABLE compra (
    compra_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor_id BIGINT NOT NULL REFERENCES proveedor(proveedor_id),
    compra_fecha TIMESTAMPTZ DEFAULT NOW(),
    compra_tipo_fac VARCHAR(10),
    compra_num_fac VARCHAR(50),
    compra_obs TEXT
);

CREATE TABLE linea_compra (
    compra_id BIGINT REFERENCES compra(compra_id) ON DELETE CASCADE,
    linea_id INT NOT NULL,
    herr_cod VARCHAR(50) REFERENCES herramienta(herr_cod),
    mat_cod VARCHAR(50) REFERENCES material(mat_cod),
    linea_monto NUMERIC(12,2) NOT NULL,
    linea_desc TEXT,
    linea_cant NUMERIC(10,2) NOT NULL DEFAULT 1,
    PRIMARY KEY (compra_id, linea_id),
    CONSTRAINT chk_linea_compra_item CHECK (
        (herr_cod IS NOT NULL AND mat_cod IS NULL) OR
        (herr_cod IS NULL AND mat_cod IS NOT NULL)
    )
);

-- 5. Personal Técnico, Especialidades y Asignaciones
CREATE TABLE tecnico (
    tecnico_legajo VARCHAR(50) PRIMARY KEY,
    tecnico_nom_ape TEXT NOT NULL,
    tecnico_tel VARCHAR(30),
    tecnico_disponibilidad BOOLEAN DEFAULT TRUE
);

CREATE TABLE especialidad (
    especialidad_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    especialidad_nom VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tecnico_especialidad (
    tecnico_legajo VARCHAR(50) REFERENCES tecnico(tecnico_legajo) ON DELETE CASCADE,
    especialidad_id BIGINT REFERENCES especialidad(especialidad_id) ON DELETE CASCADE,
    PRIMARY KEY (tecnico_legajo, especialidad_id)
);

CREATE TABLE prestador_especialidad (
    prestador_serv_id BIGINT REFERENCES prestador_servicio(prestador_serv_id) ON DELETE CASCADE,
    especialidad_id BIGINT REFERENCES especialidad(especialidad_id) ON DELETE CASCADE,
    pe_costo NUMERIC(12,2),
    PRIMARY KEY (prestador_serv_id, especialidad_id)
);

CREATE TABLE tecnico_asignado_tarea_ot (
    tecnico_legajo VARCHAR(50) REFERENCES tecnico(tecnico_legajo),
    ot_id BIGINT,
    tarea_id INT,
    tec_asig_fecha_asig TIMESTAMPTZ DEFAULT NOW(),
    tec_asig_estado VARCHAR(50) DEFAULT 'ASIGNADO',
    PRIMARY KEY (tecnico_legajo, ot_id, tarea_id),
    FOREIGN KEY (ot_id, tarea_id) REFERENCES tarea_ot(ot_id, tarea_id) ON DELETE CASCADE
);

CREATE TABLE tecnico_utiliza_herramienta (
    tecnico_legajo VARCHAR(50) REFERENCES tecnico(tecnico_legajo),
    herr_cod VARCHAR(50) REFERENCES herramienta(herr_cod),
    tec_herr_fecha_prest TIMESTAMPTZ DEFAULT NOW(),
    tec_herr_fecha_dev TIMESTAMPTZ,
    PRIMARY KEY (tecnico_legajo, herr_cod, tec_herr_fecha_prest)
);
