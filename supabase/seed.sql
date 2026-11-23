-- =============================================================================
-- SIGMA · Script 1: Seed de Datos y Usuarios Ficticios
-- =============================================================================
-- Rellena la base de datos entera con datos realistas y usuarios ficticios
-- respetando estrictamente la estructura relacional, los enumerados del
-- diccionario de datos, las restricciones XOR y las reglas de negocio.
--
-- REGLAS CRÍTICAS RESPETADAS:
--   1. NO se elimina ni se sobrescribe el usuario Admin ni su contraseña.
--   2. Tanto los usuarios Solicitantes (Autorizados, rol = 3) como los Técnicos
--      (rol = 2) se crean con `identificador = legajo`, su contraseña inicial
--      es su propio legajo cifrado con bcrypt ($2a$, factor 10) mediante
--      `pgcrypto`, y `require_password_change = true` para solicitar el cambio
--      de contraseña en su primer inicio de sesión.
-- =============================================================================

BEGIN;

-- Extensión para generar hashes bcrypt ($2a$) compatibles con bcryptjs del backend
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =============================================================================
-- 1. CATÁLOGO DE TIPOS DE FALLA
-- =============================================================================
INSERT INTO public.tipo_falla (tipo_falla_id, tipo_falla_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Eléctrica'),
    (2, 'Mecánica'),
    (3, 'Estructural'),
    (4, 'Sanitaria'),
    (5, 'Electrónica'),
    (6, 'Otra')
ON CONFLICT (LOWER(tipo_falla_nom)) DO NOTHING;

SELECT setval('public.tipo_falla_tipo_falla_id_seq', COALESCE((SELECT MAX(tipo_falla_id) FROM public.tipo_falla), 1), true);

-- =============================================================================
-- 2. ESPECIALIDADES TÉCNICAS
-- =============================================================================
INSERT INTO public.especialidad (especialidad_id, especialidad_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Electricidad'),
    (2, 'Refrigeración'),
    (3, 'Plomería'),
    (4, 'Mantenimiento general'),
    (5, 'Carpintería'),
    (6, 'Albañilería'),
    (7, 'Electrónica y Audiovisual'),
    (8, 'Cerrajería')
ON CONFLICT (especialidad_nom) DO NOTHING;

SELECT setval('public.especialidad_especialidad_id_seq', COALESCE((SELECT MAX(especialidad_id) FROM public.especialidad), 1), true);

-- =============================================================================
-- 3. EDIFICIOS Y TIPOS DE ESPACIO
-- =============================================================================
-- Nota: La seed cuenta únicamente con los 2 edificios del sistema:
--   1 = Edificio Central
--   2 = Anexo
INSERT INTO public.edificio (edificio_id, edificio_nom, edificio_dir)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Edificio Central', 'French 414, Resistencia, Chaco'),
    (2, 'Anexo',            'Av. Laprida 550, Resistencia, Chaco')
ON CONFLICT (edificio_id) DO NOTHING;

SELECT setval('public.edificio_edificio_id_seq', COALESCE((SELECT MAX(edificio_id) FROM public.edificio), 1), true);

INSERT INTO public.tipo_espacio (tipo_espacio_id, tipo_espacio_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Aula'),
    (2, 'Laboratorio'),
    (3, 'Oficina'),
    (4, 'Taller'),
    (5, 'Auditorio'),
    (6, 'Sanitario'),
    (7, 'Sala de Servidores'),
    (8, 'Biblioteca')
ON CONFLICT (tipo_espacio_nom) DO NOTHING;

SELECT setval('public.tipo_espacio_tipo_espacio_id_seq', COALESCE((SELECT MAX(tipo_espacio_id) FROM public.tipo_espacio), 1), true);

-- =============================================================================
-- 4. SOLICITANTES (AUTORIZADOS) Y SUS CUENTAS DE USUARIO
-- =============================================================================
-- Nota: El usuario Administrador ('Admin', rol = 1) y su perfil en
-- `administrador` se conservan intactos sin ninguna modificación.
-- Regla para Solicitantes: Su legajo es su usuario y su contraseña inicial, y
-- solicita cambio (`require_password_change = true`). Todos los CUILs tienen
-- dígito verificador módulo 11 válido y teléfonos normalizados de 10 dígitos.
INSERT INTO public.autorizado (
    autorizado_legajo,
    autorizado_nom_ape,
    autorizado_dni,
    autorizado_cuil,
    autorizado_email,
    autorizado_tel,
    autorizado_fecha_nac
) VALUES
    ('2001', 'Laura Beatriz Gómez',     '30123456', '27-30123456-8', 'laura.gomez@frre.utn.edu.ar',     '362 4210001', '1983-04-15'),
    ('2002', 'Roberto Carlos Sánchez',  '28654321', '20-28654321-3', 'roberto.sanchez@frre.utn.edu.ar', '362 4210002', '1981-08-22'),
    ('2003', 'Mariana Soledad Díaz',    '33987654', '27-33987654-4', 'mariana.diaz@frre.utn.edu.ar',    '362 4210003', '1988-11-03'),
    ('2004', 'Fernando Gabriel López',  '25111222', '20-25111222-3', 'fernando.lopez@frre.utn.edu.ar',  '362 4210004', '1976-02-19'),
    ('2005', 'Silvina Andrea Ruiz',     '31222333', '27-31222333-0', 'silvina.ruiz@frre.utn.edu.ar',    '362 4210005', '1985-07-30'),
    ('2006', 'Gustavo Adolfo Herrera',  '29444555', '20-29444555-3', 'gustavo.herrera@frre.utn.edu.ar', '362 4210006', '1982-12-10')
ON CONFLICT (autorizado_legajo) DO NOTHING;

-- Crear usuarios para cada autorizado (rol = 3, contraseña inicial = legajo, require_password_change = true)
INSERT INTO public.usuario (
    identificador,
    password_hash,
    rol,
    require_password_change,
    activo,
    autorizado_legajo
)
SELECT
    a.autorizado_legajo,
    extensions.crypt(a.autorizado_legajo, extensions.gen_salt('bf', 10)),
    3,
    true,
    true,
    a.autorizado_legajo
FROM public.autorizado a
WHERE NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.autorizado_legajo = a.autorizado_legajo)
  AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.identificador = a.autorizado_legajo);

-- =============================================================================
-- 5. ÁREAS Y ESPACIOS FÍSICOS
-- =============================================================================
-- Nota: Cada área tiene un único responsable (`autorizado_legajo` UNIQUE) y
-- cada espacio apunta a su área (`espacio.area_id`). El piso es '0', '1' o '2'.
INSERT INTO public.area (area_id, autorizado_legajo, area_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, '2001', 'Departamento de Ingeniería en Sistemas de Información'),
    (2, '2002', 'Departamento de Ciencias Básicas'),
    (3, '2003', 'Secretaría Académica y Bedelía'),
    (4, '2004', 'Departamento de Ingeniería Electromecánica'),
    (5, '2005', 'Biblioteca y Centro de Documentación'),
    (6, '2006', 'Centro de Cómputos y Redes')
ON CONFLICT (area_id) DO NOTHING;

SELECT setval('public.area_area_id_seq', COALESCE((SELECT MAX(area_id) FROM public.area), 1), true);

INSERT INTO public.espacio (espacio_id, edificio_id, espacio_num, tipo_espacio_id, espacio_piso, espacio_dim, area_id)
OVERRIDING SYSTEM VALUE
VALUES
    -- Edificio Central (edificio_id = 1)
    (1,  1, '101', 1, '1', 48.00, 1),
    (2,  1, '102', 1, '1', 48.00, 2),
    (3,  1, 'LAB-1', 2, '1', 64.00, 1),
    (4,  1, 'LAB-2', 2, '2', 60.00, 1),
    (5,  1, 'OF-01', 3, '0', 25.00, 3),
    (6,  1, 'AUD-1', 5, '0', 150.00, 3),
    (7,  1, 'BIB-1', 8, '0', 120.00, 5),
    (8,  1, 'SRV-1', 7, '1', 20.00, 6),
    (9,  1, 'SAN-PB', 6, '0', 18.00, NULL),
    -- Anexo (edificio_id = 2)
    (10, 2, '201', 1, '1', 52.00, 2),
    (11, 2, '202', 1, '2', 52.00, 2),
    (12, 2, 'LAB-FIS', 2, '0', 70.00, 2),
    (13, 2, 'TAL-EM1', 4, '0', 110.00, 4),
    (14, 2, 'TAL-EM2', 4, '0', 95.00, 4),
    (15, 2, 'OF-EM', 3, '1', 24.00, 4)
ON CONFLICT (espacio_id) DO NOTHING;

SELECT setval('public.espacio_espacio_id_seq', COALESCE((SELECT MAX(espacio_id) FROM public.espacio), 1), true);

-- =============================================================================
-- 6. TÉCNICOS, SUS ESPECIALIDADES Y SUS CUENTAS DE USUARIO
-- =============================================================================
-- Regla: El legajo del técnico es numérico (guardado en VARCHAR), es su usuario
-- y su contraseña inicial con `require_password_change = true` (rol = 2).
-- Incluye sus datos personales completos (`tecnico_dni`, `tecnico_cuil`,
-- `tecnico_email`, `tecnico_fecha_nac`) para el modelo actual de «Mi perfil».
INSERT INTO public.tecnico (
    tecnico_legajo,
    tecnico_nom_ape,
    tecnico_dni,
    tecnico_cuil,
    tecnico_email,
    tecnico_tel,
    tecnico_fecha_nac,
    tecnico_disponibilidad
) VALUES
    ('1001', 'Carlos Alberto Méndez',  '27345678', '20-27345678-0', 'carlos.mendez@frre.utn.edu.ar',  '362 4310001', '1979-03-12', true),
    ('1002', 'Diego Armando Peralta',  '31456789', '20-31456789-3', 'diego.peralta@frre.utn.edu.ar',  '362 4310002', '1985-06-24', true),
    ('1003', 'Jorge Luis Villalba',    '26789012', '20-26789012-4', 'jorge.villalba@frre.utn.edu.ar', '362 4310003', '1978-09-08', true),
    ('1004', 'Martín Ezequiel Acosta', '34567890', '20-34567890-1', 'martin.acosta@frre.utn.edu.ar',  '362 4310004', '1990-01-17', true),
    ('1005', 'Pablo Sebastián Romero', '36123456', '20-36123456-7', 'pablo.romero@frre.utn.edu.ar',   '362 4310005', '1992-05-29', true),
    ('1006', 'Héctor Fabián Benítez',  '24890123', '20-24890123-6', 'hector.benitez@frre.utn.edu.ar', '362 4310006', '1975-11-21', false)
ON CONFLICT (tecnico_legajo) DO NOTHING;

INSERT INTO public.tecnico_especialidad (tecnico_legajo, especialidad_id)
VALUES
    ('1001', 1), -- Electricidad
    ('1001', 7), -- Electrónica y Audiovisual
    ('1002', 2), -- Refrigeración
    ('1002', 1), -- Electricidad
    ('1003', 3), -- Plomería
    ('1003', 6), -- Albañilería
    ('1004', 4), -- Mantenimiento general
    ('1004', 5), -- Carpintería
    ('1004', 8), -- Cerrajería
    ('1005', 1), -- Electricidad
    ('1005', 2), -- Refrigeración
    ('1006', 5), -- Carpintería
    ('1006', 6)  -- Albañilería
ON CONFLICT (tecnico_legajo, especialidad_id) DO NOTHING;

-- Crear usuarios para cada técnico (rol = 2, contraseña inicial = legajo, require_password_change = true)
INSERT INTO public.usuario (
    identificador,
    password_hash,
    rol,
    require_password_change,
    activo,
    tecnico_legajo
)
SELECT
    t.tecnico_legajo,
    extensions.crypt(t.tecnico_legajo, extensions.gen_salt('bf', 10)),
    2,
    true,
    true,
    t.tecnico_legajo
FROM public.tecnico t
WHERE NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.tecnico_legajo = t.tecnico_legajo)
  AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.identificador = t.tecnico_legajo);

-- =============================================================================
-- 7. PRESTADORES DE SERVICIO EXTERNOS Y SUS TIPOS/ESPECIALIDADES
-- =============================================================================
INSERT INTO public.tipo_prestador (tipo_prestador_id, tipo_prestador_nom, tipo_prestador_desc)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Climatización Industrial', 'Instalación y reparación de equipos centrales y splits de refrigeración'),
    (2, 'Instalaciones Eléctricas de Media y Baja Tensión', 'Mantenimiento de tableros generales, grupos electrógenos y cableado estructurado'),
    (3, 'Obras Civiles e Impermeabilización', 'Trabajos en altura, reparación de cubiertas, mampostería y pintura'),
    (4, 'Redes Sanitarias y Bombas de Agua', 'Desobstrucciones mayores, reparación de cisternas y bombas centrífugas')
ON CONFLICT (LOWER(tipo_prestador_nom)) DO NOTHING;

SELECT setval('public.tipo_prestador_tipo_prestador_id_seq', COALESCE((SELECT MAX(tipo_prestador_id) FROM public.tipo_prestador), 1), true);

INSERT INTO public.prestador_servicio (
    prestador_serv_id,
    prestador_serv_nom,
    prestador_serv_cuil,
    prestador_serv_tel,
    prestador_serv_email,
    prestador_serv_garantia,
    prestador_serv_cuenta_bco
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'ClimaNEA S.R.L.',              '30-71234567-1', '362 4450001', 'contacto@climanea.com.ar',      '6 meses en mano de obra y 12 meses en compresores', 'CBU 0110444220044400123451'),
    (2, 'ElectroChaco Ingeniería S.A.', '30-65432198-2', '362 4450002', 'servicios@electrochaco.com.ar', '12 meses sobre tableros e instalaciones',          'CBU 0110444220044400654322'),
    (3, 'Constructora Litoral S.R.L.',  '30-58963214-5', '362 4450003', 'obras@conslitoral.com.ar',      '18 meses en impermeabilización de cubiertas',       'CBU 0110444220044400987653')
ON CONFLICT (prestador_serv_id) DO NOTHING;

SELECT setval('public.prestador_servicio_prestador_serv_id_seq', COALESCE((SELECT MAX(prestador_serv_id) FROM public.prestador_servicio), 1), true);

INSERT INTO public.prestador_tipo_prestador (prestador_serv_id, tipo_prestador_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3),
    (3, 4)
ON CONFLICT (prestador_serv_id, tipo_prestador_id) DO NOTHING;

INSERT INTO public.prestador_especialidad (prestador_serv_id, especialidad_id, pe_costo)
VALUES
    (1, 2, 45000.00),
    (2, 1, 52000.00),
    (3, 6, 48000.00),
    (3, 3, 40000.00)
ON CONFLICT (prestador_serv_id, especialidad_id) DO NOTHING;

-- =============================================================================
-- 8. TIPOS DE ACTIVO Y ACTIVOS FÍSICOS
-- =============================================================================
-- Estados de activo (ENUM_ESTADO_ACTIVO):
--   1 = Operativo, 2 = En mantenimiento, 3 = Fuera de servicio, 4 = Retirado
INSERT INTO public.tipo_activo (tipo_activo_id, tipo_activo_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Aire Acondicionado'),
    (2, 'Proyector Multimedia'),
    (3, 'Tablero Eléctrico'),
    (4, 'Luminaria LED'),
    (5, 'Mobiliario Áulico'),
    (6, 'Bomba de Agua'),
    (7, 'Equipamiento Informático y Servidores'),
    (8, 'Sanitarios y Grifería')
ON CONFLICT (tipo_activo_id) DO NOTHING;

SELECT setval('public.tipo_activo_tipo_activo_id_seq', COALESCE((SELECT MAX(tipo_activo_id) FROM public.tipo_activo), 1), true);

INSERT INTO public.activo (
    activo_codigo,
    edificio_id,
    espacio_id,
    tipo_activo_id,
    activo_desc,
    activo_fecha_alta,
    activo_fecha_inst,
    activo_fecha_baja,
    activo_fecha_ult_maint,
    activo_estado
) VALUES
    ('AA-101',  1, 1,  1, 'Aire Acondicionado Split Surrey 6000 Frigorías - Aula 101',          '2026-03-10 09:00:00-03', '2024-11-15', NULL, '2026-10-15 16:00:00-03', 1),
    ('AA-102',  1, 2,  1, 'Aire Acondicionado Split Carrier 6000 Frigorías - Aula 102',         '2026-03-10 09:30:00-03', '2024-11-15', NULL, '2026-09-20 12:00:00-03', 1),
    ('AA-LAB1', 1, 3,  1, 'Aire Acondicionado Split BGH 9000 Frigorías - Laboratorio 1',        '2026-03-12 10:00:00-03', '2023-05-20', NULL, NULL,                     2), -- En mantenimiento (OT 3 en ejecución)
    ('AA-SRV1', 1, 8,  1, 'Aire Acondicionado Precisión Liebert 12000 Frigorías - Sala Server', '2026-02-01 08:00:00-03', '2022-03-10', NULL, '2026-11-05 11:30:00-03', 1),
    ('PR-101',  1, 1,  2, 'Proyector Epson PowerLite X49 3600 Lúmenes - Aula 101',              '2026-04-01 10:00:00-03', '2025-02-20', NULL, '2026-10-22 18:00:00-03', 1),
    ('PR-AUD1', 1, 6,  2, 'Proyector Láser Epson Full HD 5000 Lúmenes - Auditorio Central',     '2026-04-05 11:00:00-03', '2025-03-01', NULL, NULL,                     1),
    ('TE-PB01', 1, 5,  3, 'Tablero Eléctrico Seccional Planta Baja - Secretaría Académica',     '2026-02-15 09:00:00-03', '2021-08-10', NULL, '2026-10-08 14:00:00-03', 1),
    ('TE-TAL1', 2, 13, 3, 'Tablero Trifásico Principal 380V - Taller Electromecánica 1',        '2026-02-20 09:00:00-03', '2020-06-15', NULL, '2026-11-10 17:00:00-03', 1),
    ('LU-201',  2, 10, 4, 'Paneles Luminosos LED 60x60 48W (Lote 8 unidades) - Aula 201',       '2026-05-10 08:30:00-03', '2025-04-12', NULL, '2026-11-02 10:30:00-03', 1),
    ('LU-BIB1', 1, 7,  4, 'Sistema de Iluminación Lineal LED - Sala de Lectura Biblioteca',     '2026-05-12 09:00:00-03', '2025-05-01', NULL, NULL,                     1),
    ('MB-202',  2, 11, 5, 'Conjunto de Pupitres Bipersonales y Pizarrón Acrílico - Aula 202',   '2026-03-01 08:00:00-03', '2023-03-01', NULL, NULL,                     1),
    ('BA-TAL2', 2, 14, 6, 'Bomba Centrífuga Pedrollo 2HP Circuito de Enfriamiento - Taller 2',  '2026-03-18 10:00:00-03', '2022-09-10', NULL, NULL,                     3), -- Fuera de servicio
    ('SV-RACK', 1, 8,  7, 'Rack Principal y UPS APC Smart-UPS 3000VA - Centro de Cómputos',     '2026-02-01 08:30:00-03', '2023-01-15', NULL, '2026-11-12 15:00:00-03', 1),
    ('SN-SAN1', 1, 9,  8, 'Batería de Lavatorios y Válvulas Automáticas - Sanitario PB',        '2026-03-25 09:00:00-03', '2022-11-01', NULL, NULL,                     1),
    ('PR-RET1', 1, 3,  2, 'Proyector BenQ MS527 (Lámpara y placa madre agotadas)',              '2026-01-15 09:00:00-03', '2018-04-10', '2026-09-01 12:00:00-03', NULL, 4)  -- Retirado
ON CONFLICT (activo_codigo) DO NOTHING;

-- =============================================================================
-- 9. PLANTILLAS DE TAREAS ESTÁNDAR Y PLANES DE MANTENIMIENTO PREVENTIVO
-- =============================================================================
INSERT INTO public.plantilla_de_tarea (tarea_plan_id, especialidad_id, tarea_plan_nom, tarea_plan_desc)
OVERRIDING SYSTEM VALUE
VALUES
    (1,  2, 'Limpieza de filtros y control de gas refrigerante',   'Desarme de carcasa, lavado de filtros, limpieza de serpentina y medición de presión R410A'),
    (2,  2, 'Revisión de compresor, capacitor y drenaje de split', 'Medición de consumo de arranque, reemplazo de capacitor si corresponde y destape de manguera de condensado'),
    (3,  1, 'Revisión termográfica y ajuste de borneras',          'Control de temperatura en llaves térmicas y disyuntores, reapriete de bornes y medición de puesta a tierra'),
    (4,  1, 'Reemplazo de paneles o tubos LED y drivers',          'Sustitución de luminarias agotadas o drivers quemados y verificación de encendido'),
    (5,  7, 'Limpieza óptica y control de lámpara de proyector',   'Sopleteado de filtros de aire, limpieza de lente y verificación de horas de lámpara y conectores HDMI'),
    (6,  7, 'Test de autonomía de baterías UPS y ventilación',     'Prueba de descarga controlada de banco de baterías y limpieza de coolers del rack'),
    (7,  3, 'Reparación de pérdidas de agua y cambio de válvulas', 'Sustitución de flexibles, cabezales o mecanismos de descarga y control de estanqueidad'),
    (8,  5, 'Reparación y ajuste de mobiliario y aberturas',       'Encolado, atornillado, cambio de bisagras o nivelación de pupitres, puertas y pizarrones'),
    (9,  6, 'Reparación de humedad, revoque y pintura',            'Picado de sector afectado, aplicación de hidrófugo, enduido y dos manos de pintura látex'),
    (10, 4, 'Inspección general y lubricación de bomba de agua',   'Control de sello mecánico, rodamientos, presión de trabajo y purgado de cañería')
ON CONFLICT (tarea_plan_id) DO NOTHING;

SELECT setval('public.plantilla_de_tarea_tarea_plan_id_seq', COALESCE((SELECT MAX(tarea_plan_id) FROM public.plantilla_de_tarea), 1), true);

INSERT INTO public.mantenimiento_preventivo (
    mant_prev_id,
    activo_codigo,
    tipo_activo_id,
    mant_prev_nom,
    mant_prev_desc,
    mant_prev_frec,
    mant_prev_intervalo,
    mant_prev_unidad_frec,
    mant_prev_fecha_alta,
    mant_prev_activo,
    mant_prev_fecha_baja
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, NULL, 1, 'Plan Preventivo Trimestral de Aires Acondicionados',
        'Limpieza integral de filtros, control de drenaje y verificación de presiones en equipos de climatización.',
        'Trimestral', 3, 'meses', '2026-08-01', true, NULL),
    (2, NULL, 3, 'Plan Preventivo Semestral de Tableros Eléctricos',
        'Ajuste de borneras, prueba de disyuntores diferenciales y control termográfico en tableros seccionales.',
        'Semestral', 6, 'meses', '2026-08-01', true, NULL),
    (3, NULL, 2, 'Plan Preventivo Cuatrimestral de Proyectores',
        'Limpieza de filtros de polvo y sistema óptico de proyectores en aulas y auditorio.',
        'Cuatrimestral', 4, 'meses', '2026-08-15', true, NULL),
    (4, 'SV-RACK', 7, 'Plan Preventivo Mensual de Rack y UPS Centro de Cómputos',
        'Verificación mensual de autonomía de UPS y refrigeración del rack principal.',
        'Mensual', 1, 'meses', '2026-09-01', true, NULL),
    (5, NULL, 5, 'Plan Anual de Revisión de Mobiliario (Histórico)',
        'Revisión general de bancos y pizarrones antes del inicio del ciclo lectivo.',
        'Anual', 1, 'anios', '2026-03-01', false, '2026-10-01 10:00:00-03')
ON CONFLICT (mant_prev_id) DO NOTHING;

SELECT setval('public.mantenimiento_preventivo_mant_prev_id_seq', COALESCE((SELECT MAX(mant_prev_id) FROM public.mantenimiento_preventivo), 1), true);

INSERT INTO public.mant_prev_tarea (mant_prev_id, tarea_plan_id)
VALUES
    (1, 1),
    (1, 2),
    (2, 3),
    (3, 5),
    (4, 6),
    (5, 8)
ON CONFLICT (mant_prev_id, tarea_plan_id) DO NOTHING;

-- =============================================================================
-- 10. CATÁLOGO DE INVENTARIO (TIPOS, MATERIALES Y HERRAMIENTAS)
-- =============================================================================
-- Unidades de medida permitidas en material:
--   'par', 'unidad', 'metro', 'pulgada', 'kilogramo', 'litro', 'metro cuadrado'
-- Estados de herramienta (ENUM_ESTADO_HERRAMIENTA):
--   1 = Disponible, 2 = En uso, 3 = Fuera de servicio
INSERT INTO public.inventariotipo (inventariotipoid, inventariotiponom, inventariotipodesc, inventariotipoclase)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Insumos Eléctricos',        'Cables, llaves térmicas, disyuntores, luminarias y cintas aisladoras', 'Material'),
    (2, 'Insumos de Refrigeración',  'Gases refrigerantes, capacitores, caños de cobre y aislantes',         'Material'),
    (3, 'Insumos de Plomería',       'Caños, flexibles, válvulas, selladores y grifería',                    'Material'),
    (4, 'Insumos de Albañilería y Pintura', 'Pinturas, enduidos, cemento, selladores e impermeabilizantes',  'Material'),
    (5, 'Herramientas Eléctricas',   'Taladros, amoladoras, rotomartillos y soldadoras',                     'Herramienta'),
    (6, 'Instrumentos de Medición',  'Multímetros, pinzas amperométricas, manómetros y termómetros',         'Herramienta'),
    (7, 'Herramientas Manuales',     'Juegos de llaves, destornilladores, escaleras y prensas',              'Herramienta')
ON CONFLICT (inventariotiponom, inventariotipoclase) DO NOTHING;

SELECT setval('public.inventariotipo_inventariotipoid_seq', COALESCE((SELECT MAX(inventariotipoid) FROM public.inventariotipo), 1), true);

INSERT INTO public.material (
    mat_cod,
    mat_nom,
    mat_desc,
    mat_unidad_medida,
    inventariotipoid,
    mat_stock_actual,
    mat_stock_min
) VALUES
    ('MAT-EL01', 'Panel LED 60x60 48W Luz Fría',          'Panel LED embutir/aplicar para aulas y oficinas',              'unidad',    1, 18, 10),
    ('MAT-EL02', 'Llave Térmica Bipolar 2x20A Schneider', 'Interruptor termomagnético curva C para tableros seccionales', 'unidad',    1, 12, 6),
    ('MAT-EL03', 'Cable Unipolar 2.5 mm² Normalizado',    'Rollo de cable antiflama para circuitos de tomacorrientes',    'metro',     1, 140, 100),
    ('MAT-RF01', 'Capacitor de Marcha 45 uF 450V',        'Capacitor para motocompresor de aire acondicionado split',     'unidad',    2, 3,  8),  -- BAJO STOCK MÍNIMO (genera alerta en campana)
    ('MAT-RF02', 'Gas Refrigerante Ecológico R410A',      'Carga de gas refrigerante para equipos split inverter y fijos','kilogramo', 2, 4,  10), -- BAJO STOCK MÍNIMO (genera alerta en campana)
    ('MAT-PL01', 'Flexible Mallado Acero 1/2 Pulgada',    'Flexible de conexión para lavatorios y cisternas',             'unidad',    3, 15, 5),
    ('MAT-PL02', 'Kit Válvula de Descarga Automática',    'Repuesto completo de válvula para mingitorios y lavatorios',   'unidad',    3, 2,  5),  -- BAJO STOCK MÍNIMO (genera alerta en campana)
    ('MAT-AL01', 'Pintura Látex Interior Blanco Mate',    'Pintura lavable de alta resistencia para aulas y pasillos',    'litro',     4, 40, 20),
    ('MAT-AL02', 'Guantes Dielectricos de Seguridad',     'Guantes aislantes certificados hasta 1000V',                   'par',       1, 6,  4)
ON CONFLICT (mat_cod) DO NOTHING;

INSERT INTO public.herramienta (
    herr_cod,
    herr_nom,
    herr_desc,
    inventariotipoid,
    herr_estado
) VALUES
    ('HER-ME01', 'Pinza Amperométrica Digital Fluke 302+', 'Medidor de corriente alterna, tensión y continuidad',         6, 2), -- 2 = En uso (tiene préstamo abierto)
    ('HER-ME02', 'Manómetro Manifold R410A/R22 con Mangueras', 'Juego de manómetros de alta y baja presión para splits', 6, 2), -- 2 = En uso (tiene préstamo abierto)
    ('HER-EL01', 'Taladro Percutor Inalámbrico Bosch 18V', 'Taladro percutor con dos baterías de litio y maletín',        5, 1), -- 1 = Disponible
    ('HER-EL02', 'Amoladora Angular DeWalt 115mm 900W',    'Amoladora de mano con protector y llave de ajuste',           5, 1), -- 1 = Disponible
    ('HER-MA01', 'Escalera Tijera fibra de vidrio 8 escalones', 'Escalera dieléctrica reforzada para trabajos en altura', 7, 1), -- 1 = Disponible
    ('HER-MA02', 'Caja de Herramientas Mecánicas Bahco 94 pzas', 'Juego completo de tubos, llaves crique y puntas',       7, 1), -- 1 = Disponible
    ('HER-EL03', 'Rotomartillo SDS Plus Makita 800W',      'Con bobinado en revisión por desgaste de carbones',           5, 3)  -- 3 = Fuera de servicio
ON CONFLICT (herr_cod) DO NOTHING;

-- =============================================================================
-- 11. PROVEEDORES, COMPRAS, REMITOS E HISTORIAL DE MOVIMIENTOS DE DEPÓSITO
-- =============================================================================
INSERT INTO public.proveedor (proveedor_id, proveedor_nom, proveedor_cuil, proveedor_tel, proveedor_dir, proveedor_rubro)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Distribuidora Eléctrica Norte S.A.', '30-54321987-9', '362 4412300', 'Av. 25 de Mayo 1420, Resistencia', 'Materiales Eléctricos e Iluminación'),
    (2, 'FríoRepuestos Chaco S.R.L.',         '30-61234987-4', '362 4428900', 'Av. Ávalos 680, Resistencia',      'Refrigeración y Herramientas')
ON CONFLICT (proveedor_id) DO NOTHING;

SELECT setval('public.proveedor_proveedor_id_seq', COALESCE((SELECT MAX(proveedor_id) FROM public.proveedor), 1), true);

INSERT INTO public.compra (compra_id, proveedor_id, compra_fecha, compra_tipo_fac, compra_num_fac, compra_obs)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 1, '2026-09-10 10:00:00-03', 'A', '0003-00045120', 'Compra trimestral de insumos eléctricos'),
    (2, 2, '2026-09-25 11:30:00-03', 'A', '0001-00018932', 'Adquisición de insumos de refrigeración e instrumental')
ON CONFLICT (compra_id) DO NOTHING;

SELECT setval('public.compra_compra_id_seq', COALESCE((SELECT MAX(compra_id) FROM public.compra), 1), true);

INSERT INTO public.linea_compra (compra_id, linea_id, herr_cod, mat_cod, linea_monto, linea_desc, linea_cant)
VALUES
    (1, 1, NULL,       'MAT-EL01', 480000.00, 'Paneles LED 60x60 48W', 24),
    (1, 2, NULL,       'MAT-EL02', 180000.00, 'Llaves térmicas 2x20A', 15),
    (2, 1, NULL,       'MAT-RF01', 90000.00,  'Capacitores 45 uF',     6),
    (2, 2, 'HER-ME01', NULL,       210000.00, 'Pinza Amperométrica Fluke 302+', 1)
ON CONFLICT (compra_id, linea_id) DO NOTHING;

INSERT INTO public.remito (
    remito_id,
    remito_tipo_comprobante,
    remito_proveedor,
    remito_num,
    remito_fecha_recepcion,
    remito_obs,
    remito_creado_por,
    remito_creado_en
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Remito',  'Distribuidora Eléctrica Norte S.A.', '0001-00045102', '2026-09-12', 'Recepción conforme en depósito central', 'Admin', '2026-09-12 09:30:00-03'),
    (2, 'Factura', 'FríoRepuestos Chaco S.R.L.',         '0002-00019840', '2026-09-26', 'Entrega de capacitores, gas y herramientas de medición', 'Admin', '2026-09-26 11:00:00-03'),
    (3, 'Remito',  'Ferretería Industrial Sarmiento',    '0004-00088210', '2026-10-14', 'Reposición de insumos sanitarios y pintura', 'Admin', '2026-10-14 10:15:00-03')
ON CONFLICT (remito_id) DO NOTHING;

SELECT setval('public.remito_remito_id_seq', COALESCE((SELECT MAX(remito_id) FROM public.remito), 1), true);

INSERT INTO public.remito_item (remito_id, inventarioitemcod, remito_item_cant)
VALUES
    (1, 'MAT-EL01', 24),
    (1, 'MAT-EL02', 15),
    (1, 'MAT-EL03', 150),
    (1, 'MAT-AL02', 6),
    (2, 'MAT-RF01', 6),
    (2, 'MAT-RF02', 6),
    (2, 'HER-ME01', 1),
    (2, 'HER-ME02', 1),
    (3, 'MAT-PL01', 16),
    (3, 'MAT-PL02', 4),
    (3, 'MAT-AL01', 40)
ON CONFLICT (remito_id, inventarioitemcod) DO NOTHING;

-- =============================================================================
-- 12. TICKETS (EN TODOS LOS ESTADOS DEL CICLO DE VIDA)
-- =============================================================================
-- Estados de ticket (ENUM_ESTADO_TICKET):
--   1 = Creado, 2 = Validado, 3 = Asignado, 4 = En ejecución,
--   5 = Finalizado, 6 = Cerrado, 7 = Rechazado
INSERT INTO public.ticket (
    ticket_id,
    activo_codigo,
    autorizado_legajo,
    ticket_fecha_alta,
    ticket_fecha_cierre,
    ticket_desc,
    ticket_estado,
    ticket_evidencia
)
OVERRIDING SYSTEM VALUE
VALUES
    -- Tickets Cerrados (estado = 6, con fecha de cierre para alimentar KPIs y evolución mensual)
    (1, 'AA-101',  '2001', '2026-09-14 08:30:00-03', '2026-09-15 14:30:00-03',
        'El aire acondicionado del Aula 101 enciende la turbina pero no enfría el ambiente.', 6, NULL),
    (2, 'TE-PB01', '2003', '2026-10-06 09:00:00-03', '2026-10-08 14:00:00-03',
        'Salta la llave térmica del circuito de tomacorrientes en Secretaría Académica cuando se conectan las impresoras.', 6, NULL),
    (3, 'PR-101',  '2001', '2026-10-21 14:00:00-03', '2026-10-22 18:00:00-03',
        'El proyector del Aula 101 muestra imagen con tonalidad amarillenta y aviso de temperatura elevada.', 6, NULL),
    (4, 'LU-201',  '2002', '2026-11-01 08:00:00-03', '2026-11-02 10:30:00-03',
        'Cuatro paneles LED de la primera fila del Aula 201 parpadean constantemente o no encienden.', 6, NULL),
    (5, 'TE-TAL1', '2004', '2026-11-08 10:00:00-03', '2026-11-10 17:00:00-03',
        'Recalentamiento detectado en seccionador trifásico principal del Taller de Electromecánica 1.', 6, NULL),
    -- Ticket En ejecución (estado = 4)
    (6, 'AA-LAB1', '2001', '2026-11-18 09:15:00-03', NULL,
        'Pérdida de agua por la unidad interior del split del Laboratorio 1 y baja capacidad de enfriamiento.', 4, NULL),
    -- Ticket Asignado (estado = 3)
    (7, 'SN-SAN1', '2003', '2026-11-19 11:00:00-03', NULL,
        'Dos lavatorios del sanitario de planta baja presentan pérdida continua en la válvula automática y un flexible fisurado.', 3, NULL),
    -- Ticket Validado con OT creada aún sin asignar (estado = 2)
    (8, 'BA-TAL2', '2004', '2026-11-20 08:45:00-03', NULL,
        'La bomba centrífuga del Taller 2 hace ruido metálico en el eje y pierde presión de impulsión.', 2, NULL),
    -- Tickets Creados pendientes de validación del administrador (estado = 1)
    (9, 'LU-BIB1', '2005', '2026-11-21 09:00:00-03', NULL,
        'Un tramo de la iluminación lineal sobre las mesas de lectura de la Biblioteca quedó apagado.', 1, NULL),
    (10, 'MB-202', '2002', '2026-11-21 10:30:00-03', NULL,
        'El pizarrón acrílico del Aula 202 tiene flojo el soporte derecho y tres pupitres requieren ajuste.', 1, NULL),
    -- Ticket Rechazado con motivo (estado = 7)
    (11, 'PR-AUD1', '2003', '2026-10-18 16:00:00-03', NULL,
        'El proyector del Auditorio no detecta la notebook al conectar el cable.' || E'\n\n--- MOTIVO DE RECHAZO ---\n' ||
        'Se verificó en el lugar que el equipo funciona correctamente; el inconveniente era el adaptador HDMI externo del docente.', 7, NULL)
ON CONFLICT (ticket_id) DO NOTHING;

SELECT setval('public.ticket_ticket_id_seq', COALESCE((SELECT MAX(ticket_id) FROM public.ticket), 1), true);

-- =============================================================================
-- 13. ÓRDENES DE TRABAJO (CORRECTIVAS Y PREVENTIVAS)
-- =============================================================================
-- Regla XOR (`chk_ot_origen`): ticket_id IS NOT NULL XOR mant_prev_id IS NOT NULL
-- Estados de OT (ENUM_ESTADO_OT):
--   1 = Creada, 2 = Asignada, 3 = En ejecución, 4 = Finalizada, 5 = Cancelada
-- Prioridades (ENUM_PRIORIDAD):
--   1 = Alta, 2 = Media, 3 = Baja
INSERT INTO public.orden_trabajo (
    ot_id,
    ticket_id,
    mant_prev_id,
    activo_codigo,
    ot_fecha_alta,
    ot_fecha_programada,
    ot_fecha_cierre,
    ot_estado,
    ot_prioridad,
    ot_desc
)
OVERRIDING SYSTEM VALUE
VALUES
    -- OTs Correctivas Finalizadas (estado = 4)
    (1,  1, NULL, 'AA-101',  '2026-09-14 09:00:00-03', NULL, '2026-09-15 14:30:00-03', 4, 1,
         'Reparación de sistema de arranque de compresor y recarga parcial de gas en split Aula 101.'),
    (2,  2, NULL, 'TE-PB01', '2026-10-06 10:00:00-03', NULL, '2026-10-08 14:00:00-03', 4, 1,
         'Reemplazo de llave térmica fatigada y redistribución de cargas en tablero de Secretaría Académica.'),
    (3,  3, NULL, 'PR-101',  '2026-10-21 15:00:00-03', NULL, '2026-10-22 18:00:00-03', 4, 2,
         'Mantenimiento óptico y desobstrucción de ventilación de proyector Epson Aula 101.'),
    (4,  4, NULL, 'LU-201',  '2026-11-01 09:00:00-03', NULL, '2026-11-02 10:30:00-03', 4, 2,
         'Sustitución de 4 paneles LED 60x60 agotados en Aula 201.'),
    (5,  5, NULL, 'TE-TAL1', '2026-11-08 11:00:00-03', NULL, '2026-11-10 17:00:00-03', 4, 1,
         'Intervención especializada sobre seccionador trifásico de 380V en Taller Electromecánica 1.'),
    -- OT Correctiva En ejecución (estado = 3)
    (6,  6, NULL, 'AA-LAB1', '2026-11-18 10:00:00-03', NULL, NULL,                     3, 1,
         'Destape de bandeja de condensado, cambio de capacitor y control de carga de gas en Laboratorio 1.'),
    -- OT Correctiva Asignada (estado = 2)
    (7,  7, NULL, 'SN-SAN1', '2026-11-19 12:00:00-03', NULL, NULL,                     2, 2,
         'Cambio de válvulas automáticas y reemplazo de flexible en Sanitario PB.'),
    -- OT Correctiva Creada (estado = 1, pendiente de asignación)
    (8,  8, NULL, 'BA-TAL2', '2026-11-20 09:30:00-03', NULL, NULL,                     1, 1,
         'Diagnóstico y reparación mecánica de bomba centrífuga en Taller 2.'),
    -- OTs Preventivas (mant_prev_id IS NOT NULL, ticket_id IS NULL)
    (9,  NULL, 1, 'AA-SRV1', '2026-11-04 08:00:00-03', '2026-11-05', '2026-11-05 11:30:00-03', 4, 1,
         'Plan Preventivo Trimestral de Aires Acondicionados - Sala de Servidores'),
    (10, NULL, 4, 'SV-RACK', '2026-11-11 08:00:00-03', '2026-11-12', '2026-11-12 15:00:00-03', 4, 2,
         'Plan Preventivo Mensual de Rack y UPS Centro de Cómputos'),
    (11, NULL, 1, 'AA-102',  '2026-11-20 08:00:00-03', '2026-11-22', NULL,                     2, 2,
         'Plan Preventivo Trimestral de Aires Acondicionados - Aula 102')
ON CONFLICT (ot_id) DO NOTHING;

SELECT setval('public.orden_trabajo_ot_id_seq', COALESCE((SELECT MAX(ot_id) FROM public.orden_trabajo), 1), true);

-- =============================================================================
-- 14. TAREAS DE LAS ÓRDENES DE TRABAJO Y ASIGNACIÓN DE TÉCNICOS
-- =============================================================================
-- Estados de tarea (ENUM_ESTADO_TAREA):
--   1 = Creada, 2 = Asignada, 3 = En ejecución, 4 = Pendiente, 5 = Finalizada, 6 = Cancelada
-- Estados de asignación de técnico (ENUM_ESTADO_ASIGNACION_TECNICO):
--   1 = Pendiente, 2 = Asignada, 3 = En curso, 4 = Finalizada, 5 = Cancelada
INSERT INTO public.tarea_ot (
    ot_id,
    tarea_id,
    tarea_plan_id,
    prestador_serv_id,
    tarea_hom,
    tarea_desc,
    tarea_estado,
    tarea_prioridad,
    tarea_fecha_ini,
    tarea_fecha_fin
) VALUES
    -- OT 1 (Finalizada)
    (1,  1, 2, NULL, 2.50, 'Reemplazo de capacitor de arranque de 45 uF y prueba de compresor.', 5, 1, '2026-09-15 08:00:00-03', '2026-09-15 11:00:00-03'),
    (1,  2, 1, NULL, 1.50, 'Limpieza de filtros y compensación de carga de gas R410A.',          5, 2, '2026-09-15 11:30:00-03', '2026-09-15 14:30:00-03'),
    -- OT 2 (Finalizada)
    (2,  1, 3, NULL, 3.00, 'Reemplazo de llave térmica 2x20A, peinado de cables y reapriete.',   5, 1, '2026-10-08 09:00:00-03', '2026-10-08 14:00:00-03'),
    -- OT 3 (Finalizada)
    (3,  1, 5, NULL, 2.00, 'Desarme y limpieza óptica y de turbina de enfriamiento de proyector.', 5, 2, '2026-10-22 15:00:00-03', '2026-10-22 18:00:00-03'),
    -- OT 4 (Finalizada)
    (4,  1, 4, NULL, 2.00, 'Desmontaje de paneles agotados e instalación de 4 paneles LED nuevos.', 5, 2, '2026-11-02 08:00:00-03', '2026-11-02 10:30:00-03'),
    -- OT 5 (Finalizada - realizada por Prestador Externo ElectroChaco S.A.)
    (5,  1, 3, 2,    6.00, 'Revisión termográfica y recambio de contactos de potencia en tablero 380V por prestador especializado.', 5, 1, '2026-11-10 08:00:00-03', '2026-11-10 17:00:00-03'),
    -- OT 6 (En ejecución)
    (6,  1, 2, NULL, 2.50, 'Desobstrucción de drenaje, cambio de capacitor y control eléctrico en split Lab 1.', 3, 1, '2026-11-21 08:00:00-03', '2026-11-22 18:00:00-03'),
    (6,  2, 1, NULL, 1.50, 'Limpieza profunda de unidad interior/exterior y control de presiones.',              2, 2, '2026-11-22 08:00:00-03', '2026-11-23 18:00:00-03'),
    -- OT 7 (Asignada)
    (7,  1, 7, NULL, 3.00, 'Reemplazo de dos válvulas de descarga y un flexible mallado en sanitario PB.',       2, 2, '2026-11-22 08:00:00-03', '2026-11-24 18:00:00-03'),
    -- OT 8 (Creada - tarea sin responsable aún)
    (8,  1, 10, NULL, 4.00, 'Desarme de cabezal hidráulico, revisión de rodamientos y sello mecánico.',          1, 1, '2026-11-23 08:00:00-03', '2026-11-25 18:00:00-03'),
    -- OT 9 (Preventiva Finalizada)
    (9,  1, 1, NULL, 2.00, 'Limpieza de filtros y control de gas refrigerante en equipo de Sala de Servidores.', 5, 1, '2026-11-05 08:30:00-03', '2026-11-05 11:30:00-03'),
    -- OT 10 (Preventiva Finalizada)
    (10, 1, 6, NULL, 2.00, 'Test de autonomía de baterías UPS y limpieza de ventilación del rack principal.',   5, 2, '2026-11-12 13:00:00-03', '2026-11-12 15:00:00-03'),
    -- OT 11 (Preventiva Asignada)
    (11, 1, 1, NULL, 1.50, 'Limpieza de filtros y control de gas refrigerante - Split Aula 102.',                2, 2, '2026-11-22 08:00:00-03', '2026-11-24 18:00:00-03'),
    (11, 2, 2, NULL, 1.50, 'Revisión de compresor, capacitor y drenaje de split - Aula 102.',                    2, 2, '2026-11-22 08:00:00-03', '2026-11-24 18:00:00-03')
ON CONFLICT (ot_id, tarea_id) DO NOTHING;

INSERT INTO public.tecnico_asignado_tarea_ot (
    tecnico_legajo,
    ot_id,
    tarea_id,
    tec_asig_fecha_asig,
    tec_asig_estado
) VALUES
    ('1002', 1,  1, '2026-09-14 09:30:00-03', 4), -- Finalizada
    ('1002', 1,  2, '2026-09-14 09:30:00-03', 4), -- Finalizada
    ('1001', 2,  1, '2026-10-06 10:30:00-03', 4), -- Finalizada
    ('1001', 3,  1, '2026-10-21 15:30:00-03', 4), -- Finalizada
    ('1005', 4,  1, '2026-11-01 09:30:00-03', 4), -- Finalizada
    ('1002', 6,  1, '2026-11-18 10:30:00-03', 3), -- En curso (tarea en ejecución)
    ('1005', 6,  2, '2026-11-18 10:30:00-03', 2), -- Asignada
    ('1003', 7,  1, '2026-11-19 12:30:00-03', 2), -- Asignada
    ('1002', 9,  1, '2026-11-04 09:00:00-03', 4), -- Finalizada
    ('1001', 10, 1, '2026-11-11 09:00:00-03', 4), -- Finalizada
    ('1005', 11, 1, '2026-11-20 09:00:00-03', 2), -- Asignada
    ('1005', 11, 2, '2026-11-20 09:00:00-03', 2)  -- Asignada
ON CONFLICT (tecnico_legajo, ot_id, tarea_id) DO NOTHING;

-- =============================================================================
-- 15. REGISTRO DE FALLAS DIAGNOSTICADAS EN TAREAS
-- =============================================================================
INSERT INTO public.falla (
    falla_id,
    ot_id,
    tarea_id,
    activo_codigo,
    falla_tipo,
    falla_desc,
    falla_fecha
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 1, 1, 'AA-101',  'Eléctrica',   'Capacitor de marcha de 45 uF desvalorizado que impedía el arranque del motocompresor.', '2026-09-15 10:30:00-03'),
    (2, 1, 2, 'AA-101',  'Mecánica',    'Merma parcial de presión en circuito de gas R410A por microfuga en tuerca flare.',      '2026-09-15 14:00:00-03'),
    (3, 2, 1, 'TE-PB01', 'Eléctrica',   'Llave termomagnética 2x20A con contactos internos carbonizados por sobrecarga.',         '2026-10-08 13:00:00-03'),
    (4, 3, 1, 'PR-101',  'Electrónica', 'Obstrucción severa de filtro de admisión de aire que disparaba el sensor térmico.',      '2026-10-22 17:30:00-03'),
    (5, 4, 1, 'LU-201',  'Eléctrica',   'Drivers electrónicos quemados por fluctuación de tensión en cuatro paneles LED.',        '2026-11-02 10:00:00-03'),
    (6, 5, 1, 'TE-TAL1', 'Eléctrica',   'Falso contacto y sulfatación en bornes de entrada del seccionador trifásico principal.', '2026-11-10 16:30:00-03'),
    (7, 6, 1, 'AA-LAB1', 'Sanitaria',   'Manguera de desagüe de condensado obstruida con sedimento y capacitor fatigado.',        '2026-11-21 10:00:00-03')
ON CONFLICT (ot_id, tarea_id) DO NOTHING;

SELECT setval('public.falla_falla_id_seq', COALESCE((SELECT MAX(falla_id) FROM public.falla), 1), true);

-- =============================================================================
-- 16. CONSUMOS DE MATERIALES EN TAREAS Y MOVIMIENTOS DE INVENTARIO
-- =============================================================================
INSERT INTO public.tarea_ot_consume_material (ot_id, tarea_id, mat_cod, tamat_fecha_cons, tamat_cant)
VALUES
    (1, 1, 'MAT-RF01', '2026-09-15 10:45:00-03', 1),
    (1, 2, 'MAT-RF02', '2026-09-15 14:15:00-03', 1),
    (2, 1, 'MAT-EL02', '2026-10-08 13:30:00-03', 3),
    (2, 1, 'MAT-EL03', '2026-10-08 13:35:00-03', 10),
    (4, 1, 'MAT-EL01', '2026-11-02 10:15:00-03', 6),
    (6, 1, 'MAT-RF01', '2026-11-21 10:30:00-03', 2),
    (9, 1, 'MAT-RF02', '2026-11-05 11:00:00-03', 1)
ON CONFLICT (ot_id, tarea_id, mat_cod) DO NOTHING;

-- Movimientos de inventario (Ingresos por remito + Consumos en tareas + Ajuste manual)
INSERT INTO public.inventariomovimiento (
    inventariomovimientoid,
    inventarioitemcod,
    inventariomovimientotipo,
    inventariomovimientocantidad,
    inventariomovimientofecha,
    remito_id,
    inventariomovimientousuario,
    inventariomovimientoobs
)
OVERRIDING SYSTEM VALUE
VALUES
    -- Ingresos del Remito 1 (2026-09-12)
    (1,  'MAT-EL01', 'Ingreso', 24,  '2026-09-12 00:00:00', 1, 'Admin', NULL),
    (2,  'MAT-EL02', 'Ingreso', 15,  '2026-09-12 00:00:00', 1, 'Admin', NULL),
    (3,  'MAT-EL03', 'Ingreso', 150, '2026-09-12 00:00:00', 1, 'Admin', NULL),
    (4,  'MAT-AL02', 'Ingreso', 6,   '2026-09-12 00:00:00', 1, 'Admin', NULL),
    -- Ingresos del Remito 2 (2026-09-26)
    (5,  'MAT-RF01', 'Ingreso', 6,   '2026-09-26 00:00:00', 2, 'Admin', NULL),
    (6,  'MAT-RF02', 'Ingreso', 6,   '2026-09-26 00:00:00', 2, 'Admin', NULL),
    (7,  'HER-ME01', 'Ingreso', 1,   '2026-09-26 00:00:00', 2, 'Admin', NULL),
    (8,  'HER-ME02', 'Ingreso', 1,   '2026-09-26 00:00:00', 2, 'Admin', NULL),
    -- Ingresos del Remito 3 (2026-10-14)
    (9,  'MAT-PL01', 'Ingreso', 16,  '2026-10-14 00:00:00', 3, 'Admin', NULL),
    (10, 'MAT-PL02', 'Ingreso', 4,   '2026-10-14 00:00:00', 3, 'Admin', NULL),
    (11, 'MAT-AL01', 'Ingreso', 40,  '2026-10-14 00:00:00', 3, 'Admin', NULL),
    -- Consumos en tareas
    (12, 'MAT-RF01', 'Consumo', 1,   '2026-09-15 10:45:00', NULL, '1002', NULL),
    (13, 'MAT-RF02', 'Consumo', 1,   '2026-09-15 14:15:00', NULL, '1002', NULL),
    (14, 'MAT-EL02', 'Consumo', 3,   '2026-10-08 13:30:00', NULL, '1001', NULL),
    (15, 'MAT-EL03', 'Consumo', 10,  '2026-10-08 13:35:00', NULL, '1001', NULL),
    (16, 'MAT-EL01', 'Consumo', 6,   '2026-11-02 10:15:00', NULL, '1005', NULL),
    (17, 'MAT-RF02', 'Consumo', 1,   '2026-11-05 11:00:00', NULL, '1002', NULL),
    (18, 'MAT-RF01', 'Consumo', 2,   '2026-11-21 10:30:00', NULL, '1002', NULL),
    -- Ajustes manuales de stock
    (19, 'MAT-PL02', 'Egreso manual', 2, '2026-11-15 11:00:00', NULL, 'Admin', 'Dos kits descartados por sello de goma reseco en control de depósito'),
    (20, 'MAT-PL01', 'Egreso manual', 1, '2026-11-15 11:15:00', NULL, 'Admin', 'Ajuste por conteo físico de inventario mensual')
ON CONFLICT (inventariomovimientoid) DO NOTHING;

SELECT setval('public.inventariomovimiento_inventariomovimientoid_seq', COALESCE((SELECT MAX(inventariomovimientoid) FROM public.inventariomovimiento), 1), true);

-- =============================================================================
-- 17. PRÉSTAMOS Y USO DE HERRAMIENTAS POR TÉCNICOS
-- =============================================================================
-- Nota: El índice parcial `uq_herramienta_un_prestamo_abierto` permite varios
-- préstamos históricos cerrados, pero sólo uno abierto (`tec_herr_fecha_dev IS NULL`)
-- por herramienta, coincidiendo con `herr_estado = 2` (En uso).
INSERT INTO public.tecnico_utiliza_herramienta (
    tecnico_legajo,
    herr_cod,
    tec_herr_fecha_prest,
    tec_herr_fecha_dev,
    ot_id,
    tarea_id
) VALUES
    -- Préstamos históricos ya devueltos
    ('1002', 'HER-ME02', '2026-09-15 08:15:00-03', '2026-09-15 14:40:00-03', 1,  2),
    ('1001', 'HER-ME01', '2026-10-08 09:10:00-03', '2026-10-08 14:15:00-03', 2,  1),
    ('1005', 'HER-MA01', '2026-11-02 08:05:00-03', '2026-11-02 10:40:00-03', 4,  1),
    -- Préstamos actualmente abiertos (herramientas 'HER-ME01' y 'HER-ME02' en estado 2 = En uso)
    ('1002', 'HER-ME02', '2026-11-21 08:30:00-03', NULL,                     6,  1),
    ('1001', 'HER-ME01', '2026-11-21 09:00:00-03', NULL,                     NULL, NULL)
ON CONFLICT (tecnico_legajo, herr_cod, tec_herr_fecha_prest) DO NOTHING;

-- =============================================================================
-- 18. OBSERVACIONES EN TAREAS (TRAZABILIDAD DEL HISTORIAL DEL ACTIVO)
-- =============================================================================
INSERT INTO public.tarea_observacion (
    ot_id,
    tarea_id,
    usuario_id,
    observacion_autor_nombre,
    observacion_texto,
    observacion_fecha
)
SELECT
    v.ot_id,
    v.tarea_id,
    u.usuario_id,
    t.tecnico_nom_ape,
    v.texto,
    v.fecha
FROM (
    VALUES
        (1::BIGINT,  1, '1002', 'Se reemplazó el capacitor de 45 uF y se verificó que el consumo de corriente del compresor quedó estable en 6.4 A.', '2026-09-15 10:50:00-03'::TIMESTAMPTZ),
        (1::BIGINT,  2, '1002', 'Se reapretó la tuerca flare de la válvula de servicio y se completó carga con R410A hasta 125 PSI en baja.',          '2026-09-15 14:20:00-03'::TIMESTAMPTZ),
        (2::BIGINT,  1, '1001', 'Se instaló térmica Schneider 2x20A nueva y se separó la línea de impresoras láser en un circuito independiente.',     '2026-10-08 13:50:00-03'::TIMESTAMPTZ),
        (3::BIGINT,  1, '1001', 'Se limpió el filtro de aire y el prisma óptico; la lámpara registra 1420 horas de uso sobre 6000 estimadas.',          '2026-10-22 17:45:00-03'::TIMESTAMPTZ),
        (4::BIGINT,  1, '1005', 'Se reemplazaron los 4 paneles de la primera fila y otros 2 del fondo que presentaban desgaste de driver.',            '2026-11-02 10:25:00-03'::TIMESTAMPTZ),
        (6::BIGINT,  1, '1002', 'Se destapó la manguera de drenaje con nitrógeno a baja presión y se colocó capacitor nuevo; queda en prueba.',        '2026-11-21 11:00:00-03'::TIMESTAMPTZ),
        (9::BIGINT,  1, '1002', 'Equipo de precisión de Sala de Servidores operando en parámetros normales a 20 °C constantes.',                       '2026-11-05 11:20:00-03'::TIMESTAMPTZ),
        (10::BIGINT, 1, '1001', 'Prueba de corte eléctrico superada: el banco de baterías de la UPS mantuvo carga durante 25 minutos al 65%.',         '2026-11-12 14:50:00-03'::TIMESTAMPTZ)
) AS v(ot_id, tarea_id, legajo, texto, fecha)
JOIN public.tecnico t ON t.tecnico_legajo = v.legajo
JOIN public.usuario u ON u.tecnico_legajo = t.tecnico_legajo
WHERE NOT EXISTS (
    SELECT 1 FROM public.tarea_observacion o
    WHERE o.ot_id = v.ot_id AND o.tarea_id = v.tarea_id AND o.observacion_fecha = v.fecha
);

COMMIT;
