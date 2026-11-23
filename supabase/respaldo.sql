-- =============================================================================
-- SIGMA · Respaldo completo de datos actuales de la base de datos (respaldo.sql)
-- =============================================================================
-- Generado el: 2026-11-23
-- Contiene la instantánea exacta de todas las tablas del sistema conforme al
-- modelo actual (incluyendo datos personales de perfiles, unidades de medida
-- de materiales, relación espacio -> área, planes preventivos, inventario,
-- tickets, órdenes de trabajo, tareas, consumos, préstamos y observaciones).
--
-- Para restaurar sobre una base limpia, ejecutar primero `clear_data.sql`
-- y a continuación este script `respaldo.sql`.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Tabla: public.tipo_falla (5 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_falla (tipo_falla_id, tipo_falla_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Eléctrica'),
    (2, 'Mecánica'),
    (3, 'Estructural'),
    (4, 'Sanitaria'),
    (5, 'Otra')
ON CONFLICT (tipo_falla_id) DO NOTHING;

SELECT setval('public.tipo_falla_tipo_falla_id_seq', COALESCE((SELECT MAX(tipo_falla_id) FROM public.tipo_falla), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.especialidad (8 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.especialidad (especialidad_id, especialidad_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Electricidad'),
    (2, 'Refrigeración'),
    (3, 'Plomería'),
    (4, 'Mantenimiento general'),
    (5, 'Carpintería'),
    (6, 'Albañilería'),
    (7, 'Gas'),
    (8, 'Informática')
ON CONFLICT (especialidad_id) DO NOTHING;

SELECT setval('public.especialidad_especialidad_id_seq', COALESCE((SELECT MAX(especialidad_id) FROM public.especialidad), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.edificio (2 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.edificio (edificio_id, edificio_nom, edificio_dir)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Edificio Central', 'French 414'),
    (2, 'Anexo I', 'Laprida 11')
ON CONFLICT (edificio_id) DO NOTHING;

SELECT setval('public.edificio_edificio_id_seq', COALESCE((SELECT MAX(edificio_id) FROM public.edificio), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.tipo_espacio (5 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_espacio (tipo_espacio_id, tipo_espacio_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Laboratorio'),
    (2, 'Aula'),
    (3, 'Oficina'),
    (4, 'Playón'),
    (5, 'Extra')
ON CONFLICT (tipo_espacio_id) DO NOTHING;

SELECT setval('public.tipo_espacio_tipo_espacio_id_seq', COALESCE((SELECT MAX(tipo_espacio_id) FROM public.tipo_espacio), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.administrador (1 registros)
-- Nota: Se usa DO NOTHING para conservar intacto al Administrador si ya existe.
-- -----------------------------------------------------------------------------
INSERT INTO public.administrador (admin_legajo, admin_nom_ape, admin_tel, admin_fecha_asun, admin_dni, admin_cuil, admin_email, admin_fecha_nac)
VALUES
    ('Admin', 'Administrador del Sistema', '-', '2026-10-07', NULL, NULL, NULL, NULL)
ON CONFLICT (admin_legajo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.autorizado (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.autorizado (autorizado_legajo, autorizado_nom_ape, autorizado_tel, autorizado_dni, autorizado_cuil, autorizado_email, autorizado_fecha_nac)
VALUES
    ('0000', 'Sistema', NULL, NULL, NULL, NULL, NULL),
    ('1234', 'Martin Guimenez', '2323 232312', '20345678', '20-20345678-7', 'mg@gmail.com', '1999-11-11'),
    ('1235', 'Maria Paz', '1234567891', '12354565', '12312312311', 'mp@gmail.com', '2008-08-15'),
    ('2020', 'Mariana Gonzalez', '362 4555555', '22222222', '20-22222222-3', 'mariangonz@gmail.com', '1998-08-06'),
    ('2363', 'Leandro Maldonado', '36251233234', '41607652', '23416076529', 'leandroarian2@gmail.com', '1999-06-11'),
    ('23680', 'Alegre Juan', NULL, '12345678', '10-12345678-0', 'aljuan@gmail.com', '1999-11-11'),
    ('7001', 'Bedelía Prueba', '362 4000001', '30111222', '27-30111222-5', 'bedelia.prueba@example.com', '1990-05-10')
ON CONFLICT (autorizado_legajo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.tecnico (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tecnico (tecnico_legajo, tecnico_nom_ape, tecnico_tel, tecnico_disponibilidad, tecnico_dni, tecnico_cuil, tecnico_email, tecnico_fecha_nac)
VALUES
    ('1025', 'Carlos Perez', '362 4134555', true, NULL, NULL, NULL, NULL),
    ('1040', 'Lucía Romero', '362 4417820', true, NULL, NULL, NULL, NULL),
    ('1111', 'Martincito', '1234 567810', true, NULL, NULL, NULL, NULL),
    ('1520', 'Maria', '362 4585858', true, NULL, NULL, NULL, NULL),
    ('2030', 'German Gaona', '36251233234', true, NULL, NULL, NULL, NULL),
    ('2222', 'Juancito', '1234 567810', true, NULL, NULL, NULL, NULL),
    ('9999', 'pedritoprueba', '6767 676767', true, NULL, NULL, NULL, NULL)
ON CONFLICT (tecnico_legajo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.usuario (15 registros)
-- Nota: Se usa ON CONFLICT (identificador) DO NOTHING para conservar intacto
-- al usuario Admin (y su contraseña/UUID actual) sin sobrescribirlo.
-- -----------------------------------------------------------------------------
INSERT INTO public.usuario (usuario_id, identificador, password_hash, rol, require_password_change, activo, creado_en, admin_legajo, tecnico_legajo, autorizado_legajo, actualizado_en)
VALUES
    ('19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '$2b$10$eJdS6HLGHo1QPsp.1bIrV.33a1mm5l/xOpHp2z5RL/eMJqxuFLhXi', 1, false, true, '2026-10-07T23:45:59.283625+00:00', 'Admin', NULL, NULL, '2026-10-07T23:45:59.283625+00:00'),
    ('1bfb548b-d4ed-47cb-bccf-03e75d035be7', '1234', '$2b$10$.7nj5iu0BCMWvGJ6ca/xEuqiQ9Ne2ubLQBItgBy2qVJb577uYrTku', 3, true, true, '2026-10-10T16:55:15.052843+00:00', NULL, NULL, '1234', '2026-10-10T16:55:15.052843+00:00'),
    ('5999ae5f-a9b7-4736-a6a9-05dfe1076772', '2363', '$2b$10$DpQQ3llzke9N259v4cUo5eimAuO2LryQBHgrDpEf1KHveueMiXKgC', 3, true, true, '2026-10-10T16:55:15.773736+00:00', NULL, NULL, '2363', '2026-10-10T16:55:15.773736+00:00'),
    ('5e073660-74cb-4de7-9d23-f85c50904f6e', '1111', '$2b$10$1mIcmiVbXumrzqW6RLy1VexT4dmo/v9x.mny5BgIFCs14.yVaAFgS', 2, false, true, '2026-11-21T22:46:45.217246+00:00', NULL, '1111', NULL, '2026-11-21T22:56:41.871374+00:00'),
    ('6ff69eae-5b24-4f7b-946a-1754fb94dbca', '2020', '$2b$10$DP7esMtynjxmurvAsyDQq.tVr8li8Xfkzn.CpMX8jqI8bxGtZtlu2', 3, false, true, '2026-11-20T23:13:23.620541+00:00', NULL, NULL, '2020', '2026-11-20T23:13:57.560943+00:00'),
    ('a7eeeb73-5e35-4ebe-9737-a2ec14e0f03b', '23680', '$2b$10$bC57DGSdxKF8IyK4e8i/eOxVIC023ElQEynEFnF2RcxRSi.o1pyrW', 3, false, true, '2026-10-12T19:03:38.037632+00:00', NULL, NULL, '23680', '2026-11-11T02:23:38.737381+00:00'),
    ('b53689da-dbd6-45d5-9fd4-2258a67c3439', '1040', '$2b$10$peApZfqiYcoL2.aZf7ffEOCztGL/ExiQ1h7te.MY0umm8lwwngvfS', 2, false, true, '2026-11-03T11:50:28.60909+00:00', NULL, '1040', NULL, '2026-11-22T22:00:23.974785+00:00'),
    ('bbe8f4cd-9261-49c5-b345-b368285c446e', '2222', '$2b$10$y/idcVkxhQuORfGqQjVlAurYMEif52mKzz1UB0dGzMXZlTbivKrpe', 2, false, true, '2026-11-21T22:16:18.127408+00:00', NULL, '2222', NULL, '2026-11-21T22:16:55.691626+00:00'),
    ('bfb6394e-d3cb-472a-b957-82f1bf2f78c6', '7001', '$2b$10$ml0btMip/cnX1zcSvArotOKDqB9OpttScIw5jIzZunkY5sMPiZem6', 3, false, true, '2026-11-21T21:44:39.067629+00:00', NULL, NULL, '7001', '2026-11-21T21:48:06.839093+00:00'),
    ('c2fcdded-ed65-49b4-b93c-eb44e1283d31', '0000', '$2b$10$HcYV.qdbqWiiDvsE8poGSuqfz/jyzVIzeaU7RmiwMatSeM3qlnHEW', 3, false, true, '2026-10-10T16:55:14.457301+00:00', NULL, NULL, '0000', '2026-10-10T16:55:14.457301+00:00'),
    ('d08bb12f-6a9b-4e00-a0dc-879406857a6f', '1235', '$2b$10$6vZ1/8PtE4ETL8JhhWfqi.rpOfFq6ylJcIsosye/RVfEi6anK0uLG', 3, false, true, '2026-10-10T16:55:16.308417+00:00', NULL, NULL, '1235', '2026-11-21T00:12:06.474781+00:00'),
    ('d337de65-5e6f-4730-b3d0-9c7979086b9a', '1025', '$2b$10$4rlAH4G53DgQwhY7r69Vzu1f/HVIq2T0SBEUWNFgzHsm9nFXRkN3u', 2, false, true, '2026-10-10T16:55:13.497057+00:00', NULL, '1025', NULL, '2026-10-28T02:42:59.604275+00:00'),
    ('dc545412-46f3-42ec-a3fb-34a8f085d12a', '9999', '$2b$10$aqZ2GO3DJdJ2bpy3CXO.L.wFrtn0L1/9QJ9WEh5MAUhN1DxCK9XcO', 2, false, true, '2026-11-06T19:50:39.75025+00:00', NULL, '9999', NULL, '2026-11-06T19:51:53.848044+00:00'),
    ('dd7aae5a-597e-4fcc-a7d5-ab068b4de675', '2030', '$2b$10$Ql1fVYhxuM/KTWQfUj93IuQ6DvPrBZ3AX9mHLoFyKDCBM8oSPqLyy', 2, false, true, '2026-10-10T16:55:12.891256+00:00', NULL, '2030', NULL, '2026-10-28T02:43:35.148297+00:00'),
    ('f9fb1bcf-384c-4a8b-bbe3-bf4eee02c3bc', '1520', '$2b$10$573Ad4TMYP5YaQEpXkr25urU7c.qTsvg1MINf31vyA5R5.kf5.a1u', 2, true, true, '2026-10-28T02:32:18.256557+00:00', NULL, '1520', NULL, '2026-10-28T02:39:19.013789+00:00')
ON CONFLICT (identificador) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.historial_restablecimiento_contrasena (5 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.historial_restablecimiento_contrasena (restablecimiento_id, usuario_id, usuario_identificador, administrador_usuario_id, administrador_identificador, restablecido_en)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'd08bb12f-6a9b-4e00-a0dc-879406857a6f', '1235', '19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '2026-10-28T18:41:35.362892+00:00'),
    (2, 'a7eeeb73-5e35-4ebe-9737-a2ec14e0f03b', '23680', '19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '2026-11-11T02:23:15.560485+00:00'),
    (3, 'd08bb12f-6a9b-4e00-a0dc-879406857a6f', '1235', '19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '2026-11-21T00:11:27.232685+00:00'),
    (4, 'd08bb12f-6a9b-4e00-a0dc-879406857a6f', '1235', '19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '2026-11-21T00:11:40.923045+00:00'),
    (5, 'b53689da-dbd6-45d5-9fd4-2258a67c3439', '1040', '19ec4f15-c764-4658-8304-1b7eaa8b4811', 'Admin', '2026-11-22T21:59:55.275737+00:00')
ON CONFLICT (restablecimiento_id) DO NOTHING;

SELECT setval('public.historial_restablecimiento_contrasena_restablecimiento_id_seq', COALESCE((SELECT MAX(restablecimiento_id) FROM public.historial_restablecimiento_contrasena), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.area (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.area (area_id, autorizado_legajo, area_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, '1235', 'Departamento de Ingeniería en Sistemas de Información'),
    (2, '0000', 'Departamento de Ingeniería Química'),
    (3, '1234', 'Departamento de Ingeniería Electromecánica'),
    (4, '2363', 'Secretaría de Asuntos Universitarios'),
    (5, '23680', 'Laboratorio de Física'),
    (6, '2020', 'Laboratorio de Química'),
    (7, '7001', 'Bedelía')
ON CONFLICT (area_id) DO NOTHING;

SELECT setval('public.area_area_id_seq', COALESCE((SELECT MAX(area_id) FROM public.area), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.espacio (12 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.espacio (espacio_id, edificio_id, espacio_num, tipo_espacio_id, espacio_piso, espacio_dim, area_id)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 1, '0.1', 3, '0', 12, 2),
    (2, 1, '0.2', 3, '0', 40, 4),
    (3, 1, '1.1', 2, '1', 60, 7),
    (4, 1, '1.2', 1, '1', 48, 1),
    (5, 2, '0.2', 2, '0', 70, 7),
    (6, 2, '0.1', 3, '0', 20, NULL),
    (7, 2, '1.1', 1, '1', 80, 5),
    (8, 1, '0.3', 4, '0', 600, NULL),
    (9, 1, '1.6', 2, '1', 60, 7),
    (10, 2, '1.2', 1, '1', 60, 6),
    (11, 1, '00', 4, '1', NULL, NULL),
    (12, 1, '1.0', 5, '1', NULL, NULL)
ON CONFLICT (espacio_id) DO NOTHING;

SELECT setval('public.espacio_espacio_id_seq', COALESCE((SELECT MAX(espacio_id) FROM public.espacio), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.tecnico_especialidad (13 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tecnico_especialidad (tecnico_legajo, especialidad_id)
VALUES
    ('1025', 1),
    ('1025', 2),
    ('1025', 3),
    ('1025', 4),
    ('1025', 5),
    ('1025', 6),
    ('1025', 7),
    ('1040', 4),
    ('1111', 3),
    ('1520', 5),
    ('2030', 2),
    ('2222', 8),
    ('9999', 8)
ON CONFLICT (tecnico_legajo, especialidad_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.tipo_prestador (3 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_prestador (tipo_prestador_id, tipo_prestador_nom, tipo_prestador_desc)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Arquitecto', 'Remodelaciones de edificios y aulas.'),
    (2, 'Infraestructura', 'Instalaciones eléctricas, climatización, redes e internet.'),
    (3, 'Cloacas', 'Desagües cloacales y destapaciones.')
ON CONFLICT (tipo_prestador_id) DO NOTHING;

SELECT setval('public.tipo_prestador_tipo_prestador_id_seq', COALESCE((SELECT MAX(tipo_prestador_id) FROM public.tipo_prestador), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.prestador_servicio (2 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.prestador_servicio (prestador_serv_id, prestador_serv_nom, prestador_serv_cuil, prestador_serv_tel, prestador_serv_cuenta_bco, prestador_serv_email, prestador_serv_garantia)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Frío Sur Climatización', '30-71548236-9', '362 4115588', NULL, 'contacto@friosur.com.ar', '3 meses en mano de obra'),
    (2, 'ECOM', '22-22222222-6', '362 4222222', NULL, 'ecom@gmail.com', '1 año')
ON CONFLICT (prestador_serv_id) DO NOTHING;

SELECT setval('public.prestador_servicio_prestador_serv_id_seq', COALESCE((SELECT MAX(prestador_serv_id) FROM public.prestador_servicio), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.prestador_tipo_prestador (2 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.prestador_tipo_prestador (prestador_serv_id, tipo_prestador_id)
VALUES
    (1, 2),
    (2, 2)
ON CONFLICT (prestador_serv_id, tipo_prestador_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.prestador_especialidad (0 registros)
-- -----------------------------------------------------------------------------
-- (Sin registros actuales en public.prestador_especialidad)

-- -----------------------------------------------------------------------------
-- Tabla: public.tipo_activo (8 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tipo_activo (tipo_activo_id, tipo_activo_nom)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Aires acondicionados'),
    (2, 'Luminarias'),
    (3, 'Mobiliario'),
    (4, 'Equipos de red'),
    (5, 'Proyectores'),
    (6, 'Televisores'),
    (7, 'Computadoras'),
    (8, 'Instalaciones edilicias')
ON CONFLICT (tipo_activo_id) DO NOTHING;

SELECT setval('public.tipo_activo_tipo_activo_id_seq', COALESCE((SELECT MAX(tipo_activo_id) FROM public.tipo_activo), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.activo (25 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.activo (activo_codigo, edificio_id, espacio_id, tipo_activo_id, activo_fecha_alta, activo_fecha_baja, activo_fecha_ult_maint, activo_estado, activo_desc, activo_fecha_inst)
VALUES
    ('AC-001', 1, 3, 1, '2026-08-30T00:00:00+00:00', NULL, NULL, 2, 'Aire acondicionado split de 4500 frigorías, frío/calor.', NULL),
    ('AC-002', 1, 4, 1, '2026-08-30T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 3000 frigorías.', NULL),
    ('AC-003', 1, 4, 1, '2026-08-30T00:00:00+00:00', NULL, NULL, 3, 'Aire acondicionado split de 3000 frigorías.', NULL),
    ('AC-004', 1, 2, 1, '2026-09-29T00:00:00+00:00', NULL, NULL, 2, 'Aire acondicionado split de 2250 frigorías.', NULL),
    ('AC-005', 1, 2, 1, '2026-09-29T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 2250 frigorías.', NULL),
    ('AC-006', 1, 3, 1, '2026-09-29T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 6000 frigorías, fondo del aula.', NULL),
    ('AC-007', 2, 5, 1, '2026-09-30T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 6000 frigorías.', NULL),
    ('AC-008', 2, 5, 1, '2026-09-30T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 6000 frigorías.', NULL),
    ('AC-009', 1, 2, 1, '2026-02-02T00:00:00+00:00', NULL, NULL, 2, 'Aire acondicionado split de 3000 frigorías.', NULL),
    ('AC-010', 2, 7, 1, '2026-11-10T00:00:00+00:00', NULL, NULL, 1, 'Aire acondicionado split de 4500 frigorías.', NULL),
    ('EDI-001', 1, 3, 8, '2026-09-14T00:00:00+00:00', NULL, NULL, 1, 'Paredes y cielorraso del Aula 1.1.', NULL),
    ('LUM-001', 1, 3, 2, '2026-08-30T00:00:00+00:00', NULL, NULL, 1, 'Luminaria LED doble sobre el pizarrón.', NULL),
    ('LUM-002', 1, 3, 2, '2026-08-30T00:00:00+00:00', NULL, NULL, 3, 'Luminaria LED doble, fondo del aula.', NULL),
    ('LUM-003', 1, 4, 2, '2026-08-30T00:00:00+00:00', NULL, NULL, 1, 'Panel LED de 60 × 60 cm.', NULL),
    ('LUM-004', 1, 8, 2, '2026-09-23T00:00:00+00:00', NULL, NULL, 1, 'Reflector LED de 100 W.', NULL),
    ('MOB-001', 1, 4, 3, '2026-08-30T00:00:00+00:00', NULL, NULL, 4, 'Mesa de trabajo de 1,80 m.', NULL),
    ('PC-001', 1, 2, 7, '2026-08-30T00:00:00+00:00', NULL, NULL, 1, 'PC de escritorio de la Secretaría.', NULL),
    ('PC-002', 1, 2, 7, '2026-09-13T00:00:00+00:00', NULL, NULL, 1, 'PC de atención al público de la Secretaría.', NULL),
    ('PC-003', 1, 4, 7, '2026-05-08T00:00:00+00:00', NULL, NULL, 3, 'PC del Laboratorio de Informática, puesto 1.', NULL),
    ('PC-004', 1, 4, 7, '2026-08-31T00:00:00+00:00', NULL, NULL, 1, 'PC del Laboratorio de Informática, puesto 2.', NULL),
    ('PC-005', 1, 9, 7, '2026-04-11T00:00:00+00:00', NULL, NULL, 1, 'PC del escritorio docente.', NULL),
    ('PROY-001', 1, 3, 5, '2026-08-30T00:00:00+00:00', NULL, NULL, 2, 'Proyector multimedia de 3500 lúmenes, de techo.', NULL),
    ('TV-001', 2, 7, 6, '2026-09-02T00:00:00+00:00', NULL, NULL, 1, 'Televisor LED de 50 pulgadas.', NULL),
    ('TV-002', 1, 3, 6, '2026-09-29T00:00:00+00:00', NULL, NULL, 1, 'Televisor LED de 43 pulgadas.', NULL),
    ('TV-003', 1, 2, 6, '2026-09-29T00:00:00+00:00', NULL, NULL, 1, 'Televisor LED de 32 pulgadas de la sala de espera.', NULL)
ON CONFLICT (activo_codigo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.plantilla_de_tarea (18 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.plantilla_de_tarea (tarea_plan_id, tarea_plan_nom, tarea_plan_desc, especialidad_id)
OVERRIDING SYSTEM VALUE
VALUES
    (4, 'Revisión del cableado', 'Control y reemplazo de cables de señal y de alimentación.', 1),
    (5, 'Mantenimiento general de PC', 'Control de funcionamiento, limpieza externa y ajuste de conexiones.', 4),
    (6, 'Limpieza de filtros', 'Lavado y secado de los filtros de la unidad interior.', 2),
    (7, 'Recarga de gas refrigerante', 'Carga de gas refrigerante hasta la presión que indica el fabricante.', 2),
    (8, 'Reemplazo de lámparas', 'Cambio de lámparas y portalámparas dañados.', 1),
    (9, 'Limpieza general del aula', 'Limpieza de pisos, bancos y paredes del espacio.', 4),
    (10, 'Pintura de paredes', 'Preparación de la superficie y pintura con látex.', 6),
    (11, 'Limpieza profunda de aire acondicionado', 'Limpieza de serpentinas, turbina, bandeja y desagüe.', 2),
    (12, 'Tratamiento de humedad en paredes', 'Sellado de la filtración y aplicación de tratamiento antihumedad.', 6),
    (13, 'Reparación de pérdida de gas', 'Búsqueda y reparación de la pérdida en caños y uniones.', 2),
    (14, 'Limpieza interna y cambio de pasta térmica', 'Limpieza del interior del gabinete y cambio de la pasta térmica del procesador.', 4),
    (15, 'Revisión de fuente y cableado', 'Control de la fuente de alimentación y de los cables del equipo.', 1),
    (16, 'Actualización del sistema y antivirus', 'Instalación de las actualizaciones del sistema operativo y del antivirus.', 8),
    (17, 'Limpieza de serpentinas y bandeja de condensado', 'Limpieza de serpentinas y bandeja con producto específico.', 2),
    (18, 'Control de presión del gas refrigerante', 'Medición de las presiones de trabajo con manómetros.', 2),
    (19, 'Revisión de conexiones eléctricas del equipo', 'Ajuste de bornes y control de cables y protecciones.', 1),
    (20, 'Revisión general', 'Diagnóstico del equipo para encontrar la falla.', 1),
    (21, 'Limpieza de periféricos', 'Limpieza de teclado, mouse y monitor.', 4)
ON CONFLICT (tarea_plan_id) DO NOTHING;

SELECT setval('public.plantilla_de_tarea_tarea_plan_id_seq', COALESCE((SELECT MAX(tarea_plan_id) FROM public.plantilla_de_tarea), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.mantenimiento_preventivo (5 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.mantenimiento_preventivo (mant_prev_id, activo_codigo, tipo_activo_id, mant_prev_nom, mant_prev_desc, mant_prev_frec, mant_prev_activo, mant_prev_fecha_baja, mant_prev_intervalo, mant_prev_unidad_frec, mant_prev_fecha_alta)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'AC-009', 1, 'Limpieza semestral de aires acondicionados', 'Plan anterior de limpieza de aires. Lo reemplazó el mantenimiento semestral.', 'Semestral', false, '2026-10-27T01:41:05.115+00:00', 6, 'meses', '2026-01-15'),
    (3, NULL, 8, 'Pintura anual de aulas', 'Limpieza, tratamiento de humedad y pintura de paredes antes del inicio de clases.', 'Anual', true, NULL, 1, 'anios', '2026-11-03'),
    (5, NULL, 7, 'Mantenimiento semestral de PC', 'Mantenimiento preventivo de las computadoras: limpieza, revisión eléctrica y software.', 'Semestral', true, NULL, 6, 'meses', '2026-03-01'),
    (6, NULL, 1, 'Mantenimiento semestral de aires acondicionados', 'Limpieza de filtros y serpentinas, control del gas refrigerante y revisión eléctrica de cada equipo.', 'Semestral', true, NULL, 6, 'meses', '2026-02-01'),
    (8, NULL, 7, 'Limpieza y control de periféricos', 'Limpieza de teclado, mouse y monitor, y control general del equipo.', 'Semestral', true, NULL, 6, 'meses', '2026-11-04')
ON CONFLICT (mant_prev_id) DO NOTHING;

SELECT setval('public.mantenimiento_preventivo_mant_prev_id_seq', COALESCE((SELECT MAX(mant_prev_id) FROM public.mantenimiento_preventivo), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.mant_prev_tarea (12 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.mant_prev_tarea (mant_prev_id, tarea_plan_id)
VALUES
    (3, 9),
    (3, 10),
    (3, 12),
    (5, 14),
    (5, 15),
    (5, 16),
    (6, 6),
    (6, 17),
    (6, 18),
    (6, 19),
    (8, 5),
    (8, 21)
ON CONFLICT (mant_prev_id, tarea_plan_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.plantilla_tipo_activo_previo (10 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.plantilla_tipo_activo_previo (tarea_plan_id, tipo_activo_id)
VALUES
    (4, 6),
    (5, 7),
    (6, 1),
    (7, 1),
    (8, 2),
    (9, 8),
    (10, 8),
    (11, 1),
    (12, 8),
    (13, 1)
ON CONFLICT (tarea_plan_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.plan_datos_previos (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.plan_datos_previos (mant_prev_id, mant_prev_tipo_mant, mant_prev_fecha_prox_gen)
VALUES
    (1, 'Preventivo', NULL),
    (2, 'Preventivo', '2026-10-27'),
    (3, 'Preventivo', '2027-10-27'),
    (4, 'Preventivo', '2026-10-28'),
    (5, 'Preventivo', '2027-04-27'),
    (6, 'Rutinario', '2027-04-27'),
    (7, 'Preventivo', '2026-10-29')
ON CONFLICT (mant_prev_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.plan_tecnicos_previos (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.plan_tecnicos_previos (mant_prev_id, tecnico_legajo, fecha_asignacion)
VALUES
    (3, '1025', '2026-10-27T12:33:56.740427+00:00'),
    (5, '1025', '2026-11-03T11:50:31.944057+00:00'),
    (5, '1040', '2026-11-03T11:50:31.944057+00:00'),
    (6, '1025', '2026-11-03T12:20:40.138677+00:00'),
    (6, '2030', '2026-11-03T12:20:40.138677+00:00'),
    (8, '1040', '2026-11-04T19:24:27.78142+00:00'),
    (8, '2030', '2026-11-04T19:24:27.78142+00:00')
ON CONFLICT (mant_prev_id, tecnico_legajo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.inventariotipo (4 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventariotipo (inventariotipoid, inventariotiponom, inventariotipodesc, inventariotipoclase)
OVERRIDING SYSTEM VALUE
VALUES
    (5, 'Materiales eléctricos', 'Cables, lámparas, disyuntores y accesorios eléctricos.', 'Material'),
    (6, 'Ferretería y construcción', 'Tornillos, selladores, caños y pinturas.', 'Material'),
    (7, 'Herramientas manuales', 'Herramientas de mano y escaleras.', 'Herramienta'),
    (8, 'Herramientas eléctricas y de medición', 'Herramientas con motor e instrumentos de medición.', 'Herramienta')
ON CONFLICT (inventariotipoid) DO NOTHING;

SELECT setval('public.inventariotipo_inventariotipoid_seq', COALESCE((SELECT MAX(inventariotipoid) FROM public.inventariotipo), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.material (11 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.material (mat_cod, mat_nom, mat_stock_actual, mat_stock_min, mat_desc, inventariotipoid, mat_unidad_medida)
VALUES
    ('MAT-001', 'Cable unipolar 2,5 mm²', 3, 10, 'Se mide por metro.', 5, 'metro cuadrado'),
    ('MAT-002', 'Tornillo autoperforante 6x1"', 0, 15, 'Caja de 200 unidades.', 6, 'kilogramo'),
    ('MAT-003', 'Cinta aisladora', 1, 12, 'Rollo de 20 m.', 5, 'metro'),
    ('MAT-004', 'Sellador de silicona', 25, 6, 'Cartucho de 280 ml.', 6, 'metro'),
    ('MAT-005', 'Caño de PVC 40 mm', 18, 5, 'Barra de 4 m.', 6, 'metro'),
    ('MAT-006', 'Cable coaxil RG6', 16, 4, 'Se mide por metro.', 5, 'metro'),
    ('MAT-007', 'Tornillo fix 8 mm', 60, 20, 'Bolsa de 100 unidades.', 6, 'kilogramo'),
    ('MAT-008', 'Ficha tomacorriente 10 A', 14, 15, 'Ficha macho de dos patas planas con tierra.', 5, 'pulgada'),
    ('MAT-009', 'Pintura látex blanca', 23, 20, 'Lata de 20 L.', 6, 'litro'),
    ('MAT-010', 'Lámpara LED 12 W', 29, 25, 'Rosca E27.', 5, 'par'),
    ('MAT-011', 'Disyuntor 2x25 A', 1, 3, 'Disyuntor diferencial bipolar.', 5, 'pulgada')
ON CONFLICT (mat_cod) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.herramienta (7 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.herramienta (herr_cod, herr_nom, herr_estado, herr_desc, inventariotipoid)
VALUES
    ('HER-001', 'Taladro percutor', 2, 'Taladro de 750 W con maletín.', 8),
    ('HER-003', 'Amoladora angular', 3, 'Disco de 115 mm.', 8),
    ('HER-004', 'Escalera telescópica', 3, 'Aluminio, 4 m.', 7),
    ('HER-005', 'Pinza amperométrica', 2, 'Uso eléctrico.', 8),
    ('HER-006', 'Nivel láser', 1, 'Nivel láser de líneas cruzadas.', 8),
    ('HER-007', 'Martillo demoledor', 1, 'Martillo demoledor eléctrico de 1500 W.', 8),
    ('HER-008', 'Juego de llaves combinadas', 1, 'Medidas de 8 a 22 mm.', 7)
ON CONFLICT (herr_cod) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.proveedor (0 registros)
-- -----------------------------------------------------------------------------
-- (Sin registros actuales en public.proveedor)

-- -----------------------------------------------------------------------------
-- Tabla: public.compra (0 registros)
-- -----------------------------------------------------------------------------
-- (Sin registros actuales en public.compra)

-- -----------------------------------------------------------------------------
-- Tabla: public.linea_compra (0 registros)
-- -----------------------------------------------------------------------------
-- (Sin registros actuales en public.linea_compra)

-- -----------------------------------------------------------------------------
-- Tabla: public.remito (4 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.remito (remito_id, remito_proveedor, remito_num, remito_fecha_recepcion, remito_obs, remito_creado_por, remito_creado_en, remito_tipo_comprobante)
OVERRIDING SYSTEM VALUE
VALUES
    (2, 'Eléctrica del Nordeste S.A.', '0003-00012458', '2026-09-29', NULL, NULL, '2026-09-30T02:47:20.583102+00:00', 'Remito'),
    (3, 'ECOM CHACO S.A', '0002-00034567', '2026-09-29', NULL, NULL, '2026-09-30T20:09:41.721437+00:00', 'Remito'),
    (4, 'Pinturerías del Centro', '0001-00008731', '2026-10-28', NULL, NULL, '2026-10-28T18:35:02.421453+00:00', 'Remito'),
    (5, 'ECOM', '1238112837127', '2026-11-21', NULL, NULL, '2026-11-21T21:07:45.659319+00:00', 'Factura')
ON CONFLICT (remito_id) DO NOTHING;

SELECT setval('public.remito_remito_id_seq', COALESCE((SELECT MAX(remito_id) FROM public.remito), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.remito_item (5 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.remito_item (remito_id, inventarioitemcod, remito_item_cant)
VALUES
    (2, 'MAT-001', 4),
    (3, 'HER-007', 3),
    (3, 'MAT-010', 1),
    (4, 'MAT-009', 20),
    (5, 'HER-003', 1)
ON CONFLICT (remito_id, inventarioitemcod) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.inventariomovimiento (16 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventariomovimiento (inventariomovimientoid, inventarioitemcod, inventariomovimientotipo, inventariomovimientocantidad, inventariomovimientofecha, remito_id, inventariomovimientousuario, inventariomovimientoobs)
OVERRIDING SYSTEM VALUE
VALUES
    (2, 'MAT-001', 'Ingreso', 4, '2026-09-29T00:00:00', 2, NULL, NULL),
    (3, 'HER-007', 'Ingreso', 3, '2026-09-29T00:00:00', 3, NULL, NULL),
    (4, 'MAT-010', 'Ingreso', 1, '2026-09-29T00:00:00', 3, NULL, NULL),
    (5, 'MAT-001', 'Consumo', 8, '2026-10-10T23:00:20.071428', NULL, '1025', NULL),
    (6, 'MAT-009', 'Consumo', 2, '2026-10-11T20:01:48.076157', NULL, '1025', NULL),
    (7, 'MAT-003', 'Consumo', 1, '2026-10-12T00:20:50.907558', NULL, '2030', NULL),
    (8, 'MAT-010', 'Consumo', 2, '2026-10-14T19:50:04.333558', NULL, '2030', NULL),
    (9, 'MAT-003', 'Consumo', 1, '2026-10-15T14:01:35.884845', NULL, '2030', NULL),
    (10, 'MAT-009', 'Ingreso', 20, '2026-10-28T00:00:00', 4, NULL, NULL),
    (11, 'MAT-006', 'Ingreso manual', 3, '2026-11-06T19:36:29.471311', NULL, 'Admin', NULL),
    (12, 'MAT-006', 'Egreso manual', 1, '2026-11-06T19:36:47.924455', NULL, 'Admin', NULL),
    (13, 'MAT-006', 'Egreso manual', 3, '2026-11-07T11:40:28.43875', NULL, 'Admin', NULL),
    (14, 'MAT-006', 'Ingreso manual', 15, '2026-11-10T00:00:00', NULL, 'Admin', NULL),
    (15, 'MAT-001', 'Consumo', 1, '2026-11-19T16:41:32.908913', NULL, '1025', NULL),
    (16, 'HER-003', 'Ingreso', 1, '2026-11-21T00:00:00', 5, NULL, NULL),
    (17, 'MAT-002', 'Consumo', 40, '2026-11-22T22:19:15.894188', NULL, '2030', NULL)
ON CONFLICT (inventariomovimientoid) DO NOTHING;

SELECT setval('public.inventariomovimiento_inventariomovimientoid_seq', COALESCE((SELECT MAX(inventariomovimientoid) FROM public.inventariomovimiento), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.ticket (43 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.ticket (ticket_id, activo_codigo, autorizado_legajo, ticket_fecha_alta, ticket_desc, ticket_estado, ticket_evidencia, ticket_fecha_cierre)
OVERRIDING SYSTEM VALUE
VALUES
    (2, 'AC-001', '1234', '2026-09-13T16:35:58.94899+00:00', 'Se escucha un golpeteo en la unidad interior del aire acondicionado cuando arranca.', 1, NULL, NULL),
    (3, 'AC-001', '1234', '2026-09-13T16:36:19.712714+00:00', 'El aire acondicionado no enfría y la unidad exterior tiene una mancha de aceite en la conexión de los caños.', 4, NULL, NULL),
    (4, 'PC-001', '2363', '2026-09-01T16:00:00+00:00', 'La PC no enciende: al apretar el botón no se prende ninguna luz.', 1, NULL, NULL),
    (5, 'PC-002', '2363', '2026-09-05T12:30:00+00:00', 'El ventilador de la PC de atención al público hace mucho ruido.', 2, NULL, NULL),
    (6, 'LUM-002', '1234', '2026-09-08T19:45:00+00:00', E'La luminaria del fondo del aula no enciende.\n\n--- MOTIVO DE RECHAZO ---\nLa luminaria ya está fuera de servicio y su reemplazo está previsto en la próxima compra de equipos LED.', 7, NULL, NULL),
    (7, 'TV-001', '23680', '2026-09-10T14:15:00+00:00', 'El televisor enciende pero no muestra imagen.', 6, NULL, '2026-10-22T22:16:07.087+00:00'),
    (8, 'PC-001', '2363', '2026-09-12T11:00:00+00:00', E'La PC se reinicia sola varias veces por día.\n\n--- MOTIVO DE RECHAZO ---\nNo es una falla del equipo: los reinicios son por las actualizaciones automáticas del sistema operativo.', 7, NULL, NULL),
    (9, 'LUM-003', '1235', '2026-09-14T13:25:30.01601+00:00', 'El panel LED del fondo del laboratorio parpadea y se apaga solo.', 2, NULL, NULL),
    (10, 'EDI-001', '1234', '2026-09-14T21:50:30.529323+00:00', 'Hay grafitis escritos con marcador en las paredes del aula.', 2, NULL, NULL),
    (11, 'EDI-001', '1234', '2026-09-16T18:09:42.01702+00:00', 'Las paredes quedaron manchadas después de la filtración de agua del techo.', 6, NULL, '2026-11-11T01:14:56.173+00:00'),
    (12, 'EDI-001', '1234', '2026-09-16T18:32:24.582048+00:00', 'Hay una mancha de humedad grande en la pared lateral del aula.', 3, NULL, NULL),
    (13, 'AC-001', '1234', '2026-09-16T18:36:05.509933+00:00', E'El aire acondicionado sigue sin enfriar.\n\n--- MOTIVO DE RECHAZO ---\nYa hay un ticket abierto por esta falla (#3) y el trabajo está en curso.', 7, NULL, NULL),
    (14, 'EDI-001', '1234', '2026-09-16T20:03:30.486572+00:00', 'Quedaron restos de pintura y polvo en el piso después de la obra de la ventana.', 2, NULL, NULL),
    (15, 'TV-001', '23680', '2026-09-16T20:05:48.390647+00:00', E'La imagen del televisor titila.\n\n--- MOTIVO DE RECHAZO ---\nEl reclamo se cargó dos veces. Se sigue en el ticket #16.', 7, NULL, NULL),
    (16, 'TV-001', '23680', '2026-09-16T20:07:13.645149+00:00', 'La imagen del televisor titila y por momentos se pone en negro.', 6, NULL, '2026-11-21T22:03:09.071+00:00'),
    (17, 'PROY-001', '1234', '2026-09-18T22:52:31.860801+00:00', 'El proyector no enciende: la luz de encendido no se prende.', 4, NULL, NULL),
    (18, 'LUM-001', '1234', '2026-09-22T13:06:20.949009+00:00', 'La luminaria del pizarrón hace un zumbido constante.', 2, NULL, NULL),
    (19, 'AC-004', '2363', '2026-09-29T21:07:06.445832+00:00', 'El aire acondicionado dejó de enfriar y se escucha un silbido en la unidad exterior.', 4, NULL, NULL),
    (20, 'AC-006', '1234', '2026-09-30T19:38:54.443603+00:00', 'El aire acondicionado del fondo del aula no enfría y tiene escarcha en los caños.', 2, NULL, NULL),
    (21, 'EDI-001', '1234', '2026-09-30T19:44:15.708635+00:00', 'La pintura de las paredes está gastada y descascarada.', 3, NULL, NULL),
    (22, 'PC-001', '2363', '2026-10-03T13:34:47.839973+00:00', 'La PC pierde la conexión a internet varias veces por día.', 2, NULL, NULL),
    (23, 'AC-002', '1235', '2026-10-09T13:39:18.666117+00:00', 'El aire acondicionado del laboratorio enfría poco y tarda mucho en llegar a la temperatura.', 2, NULL, NULL),
    (24, 'LUM-001', '1234', '2026-10-14T12:37:02.559028+00:00', 'La luminaria del pizarrón no enciende.', 6, NULL, '2026-10-14T19:50:27.058+00:00'),
    (25, 'EDI-001', '1234', '2026-10-14T19:34:22.513639+00:00', 'Se está desprendiendo el revoque del cielorraso cerca de la puerta.', 2, NULL, NULL),
    (26, 'AC-005', '2363', '2026-10-15T13:58:45.549172+00:00', 'El aire acondicionado gotea y pierde agua por la manguera de desagüe.', 6, NULL, '2026-10-15T14:01:45.625+00:00'),
    (27, 'AC-004', '2363', '2026-10-22T21:59:10.026201+00:00', 'El aire acondicionado gotea sobre el escritorio cuando está encendido.', 1, NULL, NULL),
    (28, 'AC-009', '2363', '2026-03-10T12:00:00+00:00', 'El aire acondicionado no enfría: tira aire caliente.', 6, NULL, '2026-03-12T18:30:00+00:00'),
    (29, 'AC-009', '2363', '2026-07-20T14:00:00+00:00', 'Gotea agua sobre el escritorio.', 6, NULL, '2026-07-23T19:00:00+00:00'),
    (30, 'AC-009', '2363', '2026-09-15T12:30:00+00:00', 'Salta la térmica cada vez que se enciende.', 6, NULL, '2026-09-18T20:00:00+00:00'),
    (31, 'AC-009', '2363', '2026-10-20T13:00:00+00:00', 'Hace un ruido fuerte al arrancar.', 4, NULL, NULL),
    (32, 'AC-009', '2363', '2026-10-24T12:00:00+00:00', 'El control remoto no responde.', 6, NULL, '2026-11-11T02:14:12.754+00:00'),
    (33, 'AC-010', '23680', '2026-11-11T02:25:23.371899+00:00', 'El aire acondicionado del laboratorio no enfría.', 6, NULL, '2026-11-11T02:28:01.368+00:00'),
    (34, 'PROY-001', '1234', '2026-11-11T19:23:22.043129+00:00', 'La imagen del proyector se ve borrosa aunque se ajuste el foco.', 6, NULL, '2026-11-22T20:48:54.993+00:00'),
    (37, 'TV-003', '2363', '2026-11-19T16:32:14.095937+00:00', 'El televisor de la sala de espera no detecta la señal por HDMI.', 6, NULL, '2026-11-19T16:42:22.56+00:00'),
    (38, 'PROY-001', '1234', '2026-11-19T16:34:00.52115+00:00', 'El lente del proyector tiene una rajadura.', 1, NULL, NULL),
    (39, 'TV-001', '23680', '2026-11-19T16:58:55.346147+00:00', 'La entrada HDMI 1 del televisor no detecta la notebook.', 6, NULL, '2026-11-21T20:36:54.244+00:00'),
    (41, 'AC-001', '1235', '2026-11-21T00:18:07.239533+00:00', 'MUERIO', 6, 'https://agayydinmimmqoyuybbi.supabase.co/storage/v1/object/public/evidencias/1795220288057-47031868740c39ca37a692aeb27156b9.jpg', '2026-11-21T20:09:23.062+00:00'),
    (42, 'AC-005', '1235', '2026-11-21T00:19:35.156565+00:00', 'asd', 1, NULL, NULL),
    (43, 'AC-007', '7001', '2026-11-21T21:45:05.975018+00:00', 'Prueba Bedelía: el aire del Aula 0.2 del Anexo I no enfría.', 6, NULL, '2026-11-21T22:19:00.266+00:00'),
    (44, 'PC-003', '1235', '2026-11-21T22:17:14.9203+00:00', 'No se conecta a internet', 6, NULL, '2026-11-22T20:51:14.979+00:00'),
    (45, 'AC-003', '1235', '2026-11-22T22:12:29.512607+00:00', 'PRUEBA A: el aire del Laboratorio 1.2 no enfria y gotea agua.', 6, NULL, '2026-11-22T22:21:15.025+00:00'),
    (46, 'AC-008', '7001', '2026-11-22T22:24:45.214127+00:00', 'PRUEBA B: el aire del Aula 0.2 hace ruido y no enfria.', 6, NULL, '2026-11-22T22:31:53.216+00:00'),
    (47, 'PC-004', '1235', '2026-11-22T22:33:25.069924+00:00', 'PRUEBA C: la PC no prende (ticket para rechazar).', 1, NULL, NULL)
ON CONFLICT (ticket_id) DO NOTHING;

SELECT setval('public.ticket_ticket_id_seq', COALESCE((SELECT MAX(ticket_id) FROM public.ticket), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.orden_trabajo (41 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.orden_trabajo (ot_id, ticket_id, mant_prev_id, ot_fecha_alta, ot_fecha_cierre, ot_estado, ot_desc, ot_prioridad, activo_codigo, ot_fecha_programada)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 5, NULL, '2026-09-14T01:57:28.710032+00:00', NULL, 1, 'Revisar y limpiar el ventilador de la PC de atención al público', NULL, NULL, NULL),
    (2, 7, NULL, '2026-09-14T01:57:28.710032+00:00', '2026-10-22T22:16:07.087+00:00', 4, 'Revisar la conexión de video del televisor del Laboratorio de Física', NULL, NULL, NULL),
    (3, 17, NULL, '2026-09-21T22:25:55.783667+00:00', NULL, 3, 'Reparar el encendido del proyector del Aula 1.1', NULL, NULL, NULL),
    (4, 16, NULL, '2026-09-22T12:50:25.975024+00:00', '2026-11-21T22:03:09.071+00:00', 4, 'Revisar la fuente y el cableado del televisor del Laboratorio de Física', NULL, NULL, NULL),
    (5, 18, NULL, '2026-09-22T13:06:45.912874+00:00', NULL, 1, 'Revisar el zumbido de la luminaria del pizarrón del Aula 1.1', NULL, NULL, NULL),
    (6, 14, NULL, '2026-09-23T18:11:14.357096+00:00', NULL, 1, 'Limpiar el Aula 1.1 después de la obra de la ventana', NULL, NULL, NULL),
    (7, 9, NULL, '2026-09-23T19:55:05.572764+00:00', NULL, 1, 'Revisar el panel LED del Laboratorio de Informática', NULL, NULL, NULL),
    (8, 10, NULL, '2026-09-23T20:06:53.632728+00:00', NULL, 1, 'Limpiar los grafitis y repintar las paredes del Aula 1.1', NULL, NULL, NULL),
    (9, 3, NULL, '2026-09-23T20:08:39.425415+00:00', NULL, 3, 'Reparar la pérdida de gas del aire acondicionado del Aula 1.1', NULL, NULL, NULL),
    (10, 12, NULL, '2026-09-29T13:19:43.455303+00:00', NULL, 2, 'Tratar la humedad de la pared lateral del Aula 1.1', NULL, NULL, NULL),
    (11, 11, NULL, '2026-09-29T18:50:17.996591+00:00', '2026-11-11T01:14:56.173+00:00', 4, 'Pintar el Aula 1.1 después de la filtración del techo', NULL, NULL, NULL),
    (13, 19, NULL, '2026-09-29T21:09:49.957167+00:00', NULL, 3, 'Reparar la pérdida de gas del aire acondicionado de la Secretaría', NULL, NULL, NULL),
    (14, 20, NULL, '2026-09-30T19:39:49.447152+00:00', NULL, 1, 'Revisar la pérdida de gas del aire acondicionado del fondo del Aula 1.1', NULL, NULL, NULL),
    (15, 21, NULL, '2026-09-30T19:44:57.314442+00:00', NULL, 2, 'Pintar de blanco las paredes del Aula 1.1', NULL, NULL, NULL),
    (16, 22, NULL, '2026-10-03T13:35:25.769612+00:00', NULL, 1, 'Revisar la conexión de red de la PC de la Secretaría', NULL, NULL, NULL),
    (17, 23, NULL, '2026-10-09T13:40:10.694814+00:00', NULL, 1, 'Revisar la carga de gas del aire acondicionado del Laboratorio de Informática', 2, NULL, NULL),
    (18, 25, NULL, '2026-10-14T19:35:13.190801+00:00', NULL, 1, 'Reparar el revoque del cielorraso del Aula 1.1', NULL, NULL, NULL),
    (19, 24, NULL, '2026-10-14T19:38:26.841286+00:00', '2026-10-14T19:50:27.058+00:00', 4, 'Reemplazar las lámparas de la luminaria del pizarrón del Aula 1.1', NULL, NULL, NULL),
    (20, 26, NULL, '2026-10-15T13:59:52.095647+00:00', '2026-10-15T14:01:45.625+00:00', 4, 'Destapar el desagüe del aire acondicionado de la Secretaría', 2, NULL, NULL),
    (21, 28, NULL, '2026-03-10T13:00:00+00:00', '2026-03-12T18:30:00+00:00', 4, 'Reparar el aire acondicionado de la Secretaría, que no enfría', NULL, NULL, NULL),
    (22, NULL, 1, '2026-05-04T11:00:00+00:00', '2026-05-04T15:20:00+00:00', 4, 'Limpieza semestral del aire acondicionado de la Secretaría', NULL, NULL, '2026-05-04'),
    (23, 29, NULL, '2026-07-20T15:00:00+00:00', '2026-07-23T19:00:00+00:00', 4, 'Reparar el desagüe del aire acondicionado de la Secretaría', NULL, NULL, NULL),
    (24, 30, NULL, '2026-09-15T13:00:00+00:00', '2026-09-18T20:00:00+00:00', 4, 'Revisar la instalación eléctrica del aire acondicionado de la Secretaría', NULL, NULL, NULL),
    (25, 31, NULL, '2026-10-20T14:00:00+00:00', NULL, 3, 'Reparar el ruido al arrancar del aire acondicionado de la Secretaría', NULL, NULL, NULL),
    (26, 32, NULL, '2026-10-24T12:30:00+00:00', '2026-11-11T02:14:12.754+00:00', 4, 'Revisar el control remoto del aire acondicionado de la Secretaría', NULL, NULL, NULL),
    (28, NULL, 5, '2026-10-27T22:55:16.214+00:00', '2026-10-27T23:02:57.049+00:00', 4, 'Mantenimiento semestral de PC', NULL, 'PC-002', '2026-10-27'),
    (40, NULL, 5, '2026-11-03T11:50:37.155+00:00', '2026-11-22T22:00:47.361+00:00', 4, 'Mantenimiento semestral de PC', NULL, 'PC-003', '2026-11-08'),
    (41, NULL, 6, '2026-04-29T12:00:00+00:00', '2026-05-06T15:30:00+00:00', 4, 'Mantenimiento semestral de aires acondicionados', NULL, 'AC-009', '2026-05-06'),
    (42, NULL, 6, '2026-11-03T12:05:32.93+00:00', '2026-11-21T22:31:49.322+00:00', 4, 'Mantenimiento semestral de aires acondicionados', NULL, 'AC-009', '2026-11-06'),
    (43, NULL, 5, '2026-11-06T17:14:00.432+00:00', NULL, 1, 'Mantenimiento semestral de PC', NULL, 'PC-005', '2026-10-11'),
    (44, NULL, 8, '2026-11-06T17:31:46.289+00:00', NULL, 1, 'Limpieza y control de periféricos', NULL, 'PC-005', '2026-10-11'),
    (45, NULL, 8, '2026-11-07T11:30:55.156+00:00', NULL, 1, 'Limpieza y control de periféricos', NULL, 'PC-003', '2026-11-08'),
    (46, 33, NULL, '2026-11-11T02:25:38.884359+00:00', '2026-11-11T02:28:01.368+00:00', 4, 'Reparar el aire acondicionado del Laboratorio de Física, que no enfría', NULL, NULL, NULL),
    (47, 34, NULL, '2026-11-11T19:23:39.733246+00:00', '2026-11-22T20:48:54.993+00:00', 4, 'Revisar el enfoque del proyector del Aula 1.1', NULL, NULL, NULL),
    (48, 37, NULL, '2026-11-19T16:34:58.419048+00:00', '2026-11-19T16:42:22.56+00:00', 4, 'Revisar la entrada HDMI del televisor de la sala de espera', NULL, NULL, NULL),
    (49, 39, NULL, '2026-11-19T16:59:40.739517+00:00', '2026-11-21T20:36:54.244+00:00', 4, 'Revisar la entrada HDMI 1 del televisor del Laboratorio de Física', NULL, NULL, NULL),
    (50, 41, NULL, '2026-11-21T00:25:54.15969+00:00', '2026-11-21T20:09:23.062+00:00', 4, 'MUERIO', NULL, NULL, NULL),
    (51, 43, NULL, '2026-11-21T22:10:37.753211+00:00', '2026-11-21T22:19:00.266+00:00', 4, 'Prueba Bedelía: el aire del Aula 0.2 del Anexo I no enfría.', NULL, NULL, NULL),
    (52, 44, NULL, '2026-11-22T20:49:24.103891+00:00', '2026-11-22T20:51:14.979+00:00', 4, 'No se conecta a internet', NULL, NULL, NULL),
    (53, 45, NULL, '2026-11-22T22:13:55.586438+00:00', '2026-11-22T22:21:15.025+00:00', 4, 'PRUEBA A: el aire del Laboratorio 1.2 no enfria y gotea agua.', NULL, NULL, NULL),
    (54, 46, NULL, '2026-11-22T22:25:29.955864+00:00', '2026-11-22T22:31:53.216+00:00', 4, 'PRUEBA B: el aire del Aula 0.2 hace ruido y no enfria.', NULL, NULL, NULL)
ON CONFLICT (ot_id) DO NOTHING;

SELECT setval('public.orden_trabajo_ot_id_seq', COALESCE((SELECT MAX(ot_id) FROM public.orden_trabajo), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.tarea_ot (66 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tarea_ot (ot_id, tarea_id, tarea_plan_id, prestador_serv_id, tarea_hom, tarea_desc, tarea_estado, tarea_prioridad, tarea_fecha_ini, tarea_fecha_fin)
VALUES
    (1, 1, 5, NULL, NULL, 'Limpieza interna y revisión del ventilador', 4, 2, NULL, NULL),
    (2, 1, 4, NULL, 0.25, 'Reemplazo del cable HDMI', 5, 3, '2026-09-10T00:00:00+00:00', '2026-09-10T00:00:00+00:00'),
    (3, 1, 15, NULL, 0.5, 'Reemplazo del interruptor y del cable de alimentación', 5, 1, '2026-10-02T00:00:00+00:00', '2026-10-02T00:00:00+00:00'),
    (3, 2, 20, NULL, 0.08, 'Prueba de funcionamiento del proyector', 2, 3, '2026-10-07T00:00:00+00:00', '2026-10-22T00:00:00+00:00'),
    (4, 1, 15, NULL, NULL, 'Revisión de fuente y cableado', 5, 2, '2026-11-12T00:00:00+00:00', NULL),
    (6, 1, 9, NULL, NULL, 'Limpieza general del aula', 4, 2, NULL, NULL),
    (8, 1, 9, NULL, NULL, 'Limpieza de los grafitis con solvente', 4, 2, NULL, NULL),
    (8, 2, 10, NULL, NULL, 'Repintado de las zonas manchadas', 4, 3, NULL, NULL),
    (8, 3, 9, NULL, NULL, 'Limpieza final del aula', 4, 3, NULL, NULL),
    (9, 1, 7, NULL, NULL, 'Recarga de gas refrigerante', 4, 2, NULL, NULL),
    (9, 2, 6, NULL, NULL, 'Reemplazo del filtro de aire dañado', 4, 1, NULL, NULL),
    (9, 3, 9, NULL, NULL, 'Limpieza del sector al terminar', 4, 3, NULL, NULL),
    (9, 4, 18, NULL, NULL, 'Control de presión del gas refrigerante', 4, 3, NULL, NULL),
    (9, 5, 13, NULL, 2, 'Reparación de la pérdida en la unidad exterior', 5, 2, '2026-09-29T00:00:00+00:00', '2026-09-29T00:00:00+00:00'),
    (10, 1, 12, NULL, 8, 'Tratamiento de la humedad en la pared lateral', 2, 2, '2026-10-12T00:00:00+00:00', '2026-10-13T00:00:00+00:00'),
    (11, 1, 10, NULL, 10, 'Pintura de paredes con látex blanco', 5, 2, '2026-09-30T00:00:00+00:00', NULL),
    (13, 1, 13, NULL, 2, 'Reparación de la pérdida de gas', 5, 2, '2026-09-29T00:00:00+00:00', NULL),
    (13, 2, 7, NULL, NULL, 'Recarga de gas refrigerante', 4, 2, NULL, NULL),
    (15, 1, 10, NULL, 3, 'Pintura de paredes con látex blanco', 2, 2, '2026-10-04T00:00:00+00:00', '2026-10-05T00:00:00+00:00'),
    (15, 2, 9, NULL, 1, 'Limpieza del aula al terminar', 2, 2, '2026-10-04T00:00:00+00:00', '2026-10-05T00:00:00+00:00'),
    (17, 1, 7, 1, 0.33, 'Recarga de gas refrigerante', 2, 2, NULL, NULL),
    (17, 2, 18, NULL, NULL, 'Control de presión del gas refrigerante', 4, 2, NULL, NULL),
    (19, 1, 8, NULL, 1.5, 'Reemplazo de lámparas y portalámparas', 5, 3, '2026-10-15T00:00:00+00:00', '2026-10-16T00:00:00+00:00'),
    (20, 1, 11, NULL, 2, 'Limpieza profunda y destapado de la manguera de desagüe', 5, 1, '2026-10-15T00:00:00+00:00', '2026-10-15T00:00:00+00:00'),
    (21, 1, 7, NULL, NULL, 'Recarga de gas refrigerante', 5, 2, NULL, NULL),
    (21, 2, 6, NULL, NULL, 'Limpieza de filtros', 5, 2, NULL, NULL),
    (22, 1, 11, NULL, NULL, 'Limpieza profunda del equipo', 5, 2, NULL, NULL),
    (23, 1, 11, NULL, NULL, 'Limpieza profunda y destapar el desagüe', 5, 2, NULL, NULL),
    (23, 2, 7, NULL, NULL, 'Recarga de gas refrigerante', 6, 2, NULL, NULL),
    (24, 1, 13, 2, NULL, 'Revisión del tablero y cambio de disyuntor', 5, 2, NULL, NULL),
    (24, 2, 20, NULL, NULL, 'Prueba de funcionamiento', 5, 2, NULL, NULL),
    (25, 1, 13, NULL, NULL, 'Revisar la turbina de la unidad interior', 5, 2, NULL, NULL),
    (25, 2, 6, NULL, NULL, 'Limpieza de filtros', 2, 2, NULL, NULL),
    (26, 1, 20, NULL, NULL, 'Revisión del control remoto', 5, 2, '2026-11-11T00:00:00+00:00', NULL),
    (28, 1, 5, NULL, NULL, 'Mantenimiento general de PC', 5, 2, '2026-10-27T00:00:00+00:00', NULL),
    (40, 1, 14, NULL, NULL, 'Limpieza interna y cambio de pasta térmica', 5, 2, '2026-11-08T00:00:00+00:00', NULL),
    (40, 2, 15, NULL, NULL, 'Revisión de fuente y cableado', 5, 2, '2026-11-08T00:00:00+00:00', NULL),
    (40, 3, 16, 2, NULL, 'Actualización del sistema y antivirus', 5, 2, '2026-11-08T00:00:00+00:00', NULL),
    (41, 1, 6, NULL, NULL, 'Limpieza de filtros', 5, 2, '2026-05-06T12:00:00+00:00', '2026-05-06T15:30:00+00:00'),
    (41, 2, 17, NULL, NULL, 'Limpieza de serpentinas y bandeja de condensado', 5, 2, '2026-05-06T12:00:00+00:00', '2026-05-06T15:30:00+00:00'),
    (41, 3, 18, NULL, NULL, 'Control de presión del gas refrigerante', 5, 2, '2026-05-06T12:00:00+00:00', '2026-05-06T15:30:00+00:00'),
    (41, 4, 19, NULL, NULL, 'Revisión de conexiones eléctricas del equipo', 5, 2, '2026-05-06T12:00:00+00:00', '2026-05-06T15:30:00+00:00'),
    (42, 1, 6, NULL, NULL, 'Limpieza de filtros', 5, 2, '2026-11-06T00:00:00+00:00', NULL),
    (42, 2, 17, NULL, NULL, 'Limpieza de serpentinas y bandeja de condensado', 5, 2, '2026-11-06T00:00:00+00:00', NULL),
    (42, 3, 18, NULL, NULL, 'Control de presión del gas refrigerante', 5, 2, '2026-11-06T00:00:00+00:00', NULL),
    (42, 4, 19, NULL, NULL, 'Revisión de conexiones eléctricas del equipo', 5, 2, '2026-11-06T00:00:00+00:00', NULL),
    (43, 1, 14, NULL, NULL, 'Limpieza interna y cambio de pasta térmica', 1, 2, '2026-10-11T00:00:00+00:00', NULL),
    (43, 2, 15, NULL, NULL, 'Revisión de fuente y cableado', 1, 2, '2026-10-11T00:00:00+00:00', NULL),
    (43, 3, 16, NULL, NULL, 'Actualización del sistema y antivirus', 1, 2, '2026-10-11T00:00:00+00:00', NULL),
    (44, 1, 5, NULL, NULL, 'Mantenimiento general de PC', 1, 2, '2026-10-11T00:00:00+00:00', NULL),
    (44, 2, 21, NULL, NULL, 'Limpieza de periféricos', 1, 2, '2026-10-11T00:00:00+00:00', NULL),
    (45, 1, 5, 2, NULL, 'Mantenimiento general de PC', 2, 2, '2026-11-08T00:00:00+00:00', NULL),
    (45, 2, 21, NULL, NULL, 'Limpieza de periféricos', 1, 2, '2026-11-08T00:00:00+00:00', NULL),
    (46, 1, 18, NULL, NULL, 'Control de presión del gas refrigerante', 5, 2, '2026-11-11T00:00:00+00:00', NULL),
    (47, 1, 6, 1, NULL, 'Limpieza de filtros', 5, 2, NULL, NULL),
    (47, 2, 18, 1, NULL, 'Control de presión del gas refrigerante', 5, 2, NULL, NULL),
    (48, 1, 20, NULL, NULL, 'Revisión de la entrada HDMI y del cable', 5, 2, NULL, NULL),
    (49, 1, 15, NULL, NULL, 'Revisión de las entradas HDMI y del cableado', 5, 3, NULL, NULL),
    (50, 1, 18, 1, 1, 'Control de presión del gas refrigerante', 5, 1, '2026-11-21T00:00:00+00:00', NULL),
    (50, 2, 6, NULL, 0.5, 'Limpieza de filtros', 5, 1, '2026-11-21T00:00:00+00:00', NULL),
    (51, 1, 6, NULL, 0.5, 'Limpieza de filtros', 5, 2, '2026-11-21T00:00:00+00:00', NULL),
    (52, 1, 15, NULL, NULL, 'Revisión de fuente y cableado', 5, 2, NULL, NULL),
    (53, 1, 6, NULL, NULL, 'Limpieza de filtros', 5, 2, NULL, NULL),
    (54, 1, 6, NULL, NULL, 'Limpieza de filtros', 5, 1, NULL, NULL),
    (54, 2, 9, NULL, NULL, 'Limpieza general del aula', 5, 2, NULL, NULL),
    (54, 3, 7, 1, NULL, 'Recarga de gas refrigerante', 5, 2, NULL, NULL)
ON CONFLICT (ot_id, tarea_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.tecnico_asignado_tarea_ot (41 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tecnico_asignado_tarea_ot (tecnico_legajo, ot_id, tarea_id, tec_asig_fecha_asig, tec_asig_estado)
VALUES
    ('1025', 3, 1, '2026-09-21T22:26:58.205822+00:00', 4),
    ('1025', 3, 2, '2026-09-21T22:28:28.571188+00:00', 2),
    ('1025', 4, 1, '2026-11-11T19:17:53.556307+00:00', 4),
    ('1025', 10, 1, '2026-09-29T13:22:31.289586+00:00', 2),
    ('1025', 11, 1, '2026-09-29T20:01:48.536742+00:00', 4),
    ('1025', 13, 1, '2026-09-29T21:12:18.914497+00:00', 4),
    ('1025', 15, 1, '2026-09-30T19:51:53.494318+00:00', 2),
    ('1025', 15, 2, '2026-09-30T19:49:39.348855+00:00', 2),
    ('1025', 21, 2, '2026-03-10T13:00:00+00:00', 4),
    ('1025', 22, 1, '2026-05-04T11:00:00+00:00', 4),
    ('1025', 23, 2, '2026-07-20T15:00:00+00:00', 5),
    ('1025', 25, 2, '2026-10-20T14:00:00+00:00', 2),
    ('1025', 26, 1, '2026-11-11T02:12:40.016191+00:00', 4),
    ('1025', 40, 2, '2026-11-03T11:50:37.521+00:00', 4),
    ('1025', 41, 4, '2026-04-29T12:00:00+00:00', 4),
    ('1025', 42, 4, '2026-11-03T12:05:33.296+00:00', 4),
    ('1025', 48, 1, '2026-11-19T16:36:35.929093+00:00', 4),
    ('1025', 49, 1, '2026-11-19T17:00:32.390266+00:00', 4),
    ('1025', 52, 1, '2026-11-22T20:49:53.961223+00:00', 4),
    ('1040', 40, 1, '2026-11-03T11:50:37.521+00:00', 4),
    ('1040', 54, 2, '2026-11-22T22:25:51.501193+00:00', 4),
    ('2030', 2, 1, '2026-09-21T22:27:17.800607+00:00', 4),
    ('2030', 9, 5, '2026-09-29T13:23:33.997879+00:00', 4),
    ('2030', 19, 1, '2026-10-14T19:43:28.307025+00:00', 4),
    ('2030', 20, 1, '2026-10-15T14:00:32.892692+00:00', 4),
    ('2030', 21, 1, '2026-03-10T13:00:00+00:00', 4),
    ('2030', 23, 1, '2026-07-20T15:00:00+00:00', 4),
    ('2030', 24, 2, '2026-09-15T13:00:00+00:00', 4),
    ('2030', 25, 1, '2026-10-20T14:00:00+00:00', 4),
    ('2030', 28, 1, '2026-10-27T22:55:16.613+00:00', 4),
    ('2030', 41, 1, '2026-04-29T12:00:00+00:00', 4),
    ('2030', 41, 2, '2026-04-29T12:00:00+00:00', 4),
    ('2030', 41, 3, '2026-04-29T12:00:00+00:00', 4),
    ('2030', 42, 1, '2026-11-03T12:05:33.296+00:00', 4),
    ('2030', 42, 2, '2026-11-03T12:05:33.296+00:00', 4),
    ('2030', 42, 3, '2026-11-03T12:05:33.296+00:00', 4),
    ('2030', 46, 1, '2026-11-11T02:26:05.080831+00:00', 4),
    ('2030', 50, 2, '2026-11-21T00:37:08.518077+00:00', 4),
    ('2030', 51, 1, '2026-11-21T22:11:36.886288+00:00', 4),
    ('2030', 53, 1, '2026-11-22T22:16:00.208952+00:00', 4),
    ('2030', 54, 1, '2026-11-22T22:25:48.290414+00:00', 4)
ON CONFLICT (tecnico_legajo, ot_id, tarea_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.falla (14 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.falla (falla_id, ot_id, falla_tipo, falla_desc, falla_fecha, tarea_id, activo_codigo)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 9, 'Mecánica', 'Filtro de aire roto. Hay que reemplazarlo.', '2026-09-29T13:24:14.214879+00:00', 2, 'AC-001'),
    (2, 11, 'Estructural', 'Humedad en la base de la pared. Se trató antes de pintar.', '2026-09-29T18:51:15.221337+00:00', 1, 'EDI-001'),
    (3, 13, 'Mecánica', 'Caño de cobre fisurado en la unidad exterior.', '2026-09-29T21:13:11.414131+00:00', 1, 'AC-004'),
    (4, 15, 'Estructural', 'Humedad en la base de la pared. Hay que tratarla antes de pintar.', '2026-09-30T19:54:55.973774+00:00', 1, 'EDI-001'),
    (5, 21, 'Mecánica', 'Pérdida en la unión del caño de cobre de la unidad exterior.', '2026-03-10T13:00:00+00:00', 1, 'AC-009'),
    (6, 23, 'Sanitaria', 'Desagüe tapado y caño de drenaje partido.', '2026-07-20T15:00:00+00:00', 1, 'AC-009'),
    (7, 24, 'Eléctrica', 'Disyuntor dañado y cable recalentado.', '2026-09-15T13:00:00+00:00', 1, 'AC-009'),
    (8, 25, 'Mecánica', 'Turbina desbalanceada.', '2026-10-20T14:00:00+00:00', 1, 'AC-009'),
    (11, 42, 'Mecánica', 'Filtro de aire roto. Se reemplazó.', '2026-11-11T02:05:20.458241+00:00', 1, 'AC-009'),
    (12, 26, 'Eléctrica', 'El control remoto no tenía pilas.', '2026-11-11T02:14:00.819991+00:00', 1, 'AC-009'),
    (13, 46, 'Mecánica', 'Pérdida de gas en el caño de cobre de la unidad exterior.', '2026-11-11T02:27:23.472351+00:00', 1, 'AC-010'),
    (14, 40, 'Eléctrica', 'Cable de alimentación dañado. Se reemplazó.', '2026-11-11T19:19:25.020055+00:00', 2, 'PC-003'),
    (15, 48, 'Eléctrica', 'Cable HDMI cortado. Se reemplazó.', '2026-11-19T16:42:14.925171+00:00', 1, 'TV-003'),
    (16, 53, 'Mecánica', 'PRUEBA A: filtro tapado y bandeja de condensado obstruida.', '2026-11-22T22:20:11.789914+00:00', 1, 'AC-003')
ON CONFLICT (falla_id) DO NOTHING;

SELECT setval('public.falla_falla_id_seq', COALESCE((SELECT MAX(falla_id) FROM public.falla), 1), true);

-- -----------------------------------------------------------------------------
-- Tabla: public.tarea_ot_consume_material (13 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tarea_ot_consume_material (ot_id, tarea_id, mat_cod, tamat_fecha_cons, tamat_cant)
VALUES
    (3, 1, 'MAT-001', '2026-10-10T23:00:20.071428+00:00', 8),
    (3, 1, 'MAT-009', '2026-10-11T20:01:48.076157+00:00', 2),
    (9, 5, 'MAT-003', '2026-10-12T00:20:50.907558+00:00', 1),
    (19, 1, 'MAT-010', '2026-10-14T19:50:04.333558+00:00', 2),
    (20, 1, 'MAT-003', '2026-10-15T14:01:35.884845+00:00', 1),
    (21, 1, 'MAT-003', '2026-03-12T18:30:00+00:00', 1),
    (21, 1, 'MAT-004', '2026-03-12T18:30:00+00:00', 1),
    (23, 1, 'MAT-004', '2026-07-23T19:00:00+00:00', 1),
    (23, 1, 'MAT-005', '2026-07-23T19:00:00+00:00', 1),
    (24, 1, 'MAT-001', '2026-09-18T20:00:00+00:00', 3),
    (24, 1, 'MAT-011', '2026-09-18T20:00:00+00:00', 1),
    (48, 1, 'MAT-001', '2026-11-19T16:41:32.908913+00:00', 1),
    (53, 1, 'MAT-002', '2026-11-22T22:19:15.894188+00:00', 40)
ON CONFLICT (ot_id, tarea_id, mat_cod) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.tecnico_utiliza_herramienta (15 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tecnico_utiliza_herramienta (tecnico_legajo, herr_cod, tec_herr_fecha_prest, tec_herr_fecha_dev, ot_id, tarea_id)
VALUES
    ('1025', 'HER-001', '2026-11-21T21:58:42.879361+00:00', NULL, 4, 1),
    ('1025', 'HER-004', '2026-10-03T14:33:52.270406+00:00', '2026-10-03T14:34:06.678+00:00', NULL, NULL),
    ('1025', 'HER-005', '2026-10-26T01:09:57.405972+00:00', '2026-11-19T16:41:42.114+00:00', 3, 1),
    ('1025', 'HER-006', '2026-10-03T15:30:49.890559+00:00', '2026-11-19T16:41:45.708+00:00', NULL, NULL),
    ('2030', 'HER-001', '2026-09-21T19:54:23.011215+00:00', '2026-10-03T14:14:45.706+00:00', NULL, NULL),
    ('2030', 'HER-004', '2026-10-03T14:11:18.630168+00:00', '2026-10-03T14:11:44.646+00:00', NULL, NULL),
    ('2030', 'HER-005', '2026-10-12T00:24:05.906765+00:00', '2026-10-12T00:24:12.405+00:00', NULL, NULL),
    ('2030', 'HER-005', '2026-11-21T22:19:46.704721+00:00', '2026-11-21T22:20:23.074+00:00', 42, 3),
    ('2030', 'HER-005', '2026-11-22T22:19:50.310114+00:00', NULL, 53, 1),
    ('2030', 'HER-006', '2026-11-21T00:40:12.864245+00:00', '2026-11-21T00:43:16.971+00:00', 50, 2),
    ('2030', 'HER-007', '2026-10-03T14:34:36.511798+00:00', '2026-10-03T14:34:54.236+00:00', NULL, NULL),
    ('2030', 'HER-007', '2026-10-03T15:31:17.831906+00:00', '2026-10-03T17:28:38.527+00:00', NULL, NULL),
    ('2030', 'HER-007', '2026-10-03T17:33:33.171266+00:00', '2026-10-14T19:50:20.647+00:00', NULL, NULL),
    ('2030', 'HER-008', '2026-10-14T19:50:17.207938+00:00', '2026-10-15T14:01:42.426+00:00', NULL, NULL),
    ('2030', 'HER-008', '2026-11-21T22:12:42.844254+00:00', '2026-11-21T22:20:18.899+00:00', NULL, NULL)
ON CONFLICT (tecnico_legajo, herr_cod, tec_herr_fecha_prest) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tabla: public.tarea_observacion (18 registros)
-- -----------------------------------------------------------------------------
INSERT INTO public.tarea_observacion (observacion_id, ot_id, tarea_id, usuario_id, observacion_autor_nombre, observacion_texto, observacion_fecha)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 3, 1, 'd337de65-5e6f-4730-b3d0-9c7979086b9a', 'Carlos Perez', 'Se reemplazaron el interruptor y el cable de alimentación.', '2026-10-13T22:35:50.307681+00:00'),
    (2, 9, 5, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se encontró la pérdida en la unión de la unidad exterior y se soldó.', '2026-10-14T18:25:49.933311+00:00'),
    (3, 19, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se cambiaron el portalámparas y las dos lámparas.', '2026-10-14T19:49:00.922407+00:00'),
    (4, 19, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se revisó el cableado de la luminaria y está en buen estado.', '2026-10-14T19:49:13.966741+00:00'),
    (5, 19, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'La escalera telescópica tiene una traba floja. Conviene revisarla antes de volver a usarla.', '2026-10-14T19:49:21.349065+00:00'),
    (6, 19, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Trabajo terminado. La luminaria funciona bien.', '2026-10-14T19:49:27.537245+00:00'),
    (7, 20, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'La manguera de desagüe estaba tapada con sarro. Se limpió y se probó el equipo.', '2026-10-15T14:01:26.000593+00:00'),
    (8, 21, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se soldó la unión y se recargó el gas. Quedó enfriando bien.', '2026-03-12T17:40:00+00:00'),
    (9, 21, 2, 'd337de65-5e6f-4730-b3d0-9c7979086b9a', 'Carlos Perez', 'Los filtros estaban muy sucios, se lavaron y se secaron.', '2026-03-12T16:10:00+00:00'),
    (10, 22, 1, 'd337de65-5e6f-4730-b3d0-9c7979086b9a', 'Carlos Perez', 'Sin novedades. Serpentina y bandeja limpias.', '2026-05-04T15:00:00+00:00'),
    (11, 23, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se cambió el tramo de caño de drenaje.', '2026-07-23T17:00:00+00:00'),
    (12, 23, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se probó 30 minutos y no gotea más.', '2026-07-23T18:45:00+00:00'),
    (13, 24, 2, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Después del cambio de disyuntor arranca sin cortar la luz.', '2026-09-18T19:30:00+00:00'),
    (14, 25, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Hay que cambiar la turbina. Se pidió el repuesto.', '2026-10-22T16:00:00+00:00'),
    (15, 26, 1, 'd337de65-5e6f-4730-b3d0-9c7979086b9a', 'Carlos Perez', 'Se colocaron pilas nuevas y se probó el control remoto.', '2026-11-11T02:14:10.727342+00:00'),
    (16, 46, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'Se reparó la pérdida en el caño de cobre y se completó la carga de gas.', '2026-11-11T02:27:58.791694+00:00'),
    (17, 48, 1, 'd337de65-5e6f-4730-b3d0-9c7979086b9a', 'Carlos Perez', 'Se reemplazó el cable HDMI y el televisor volvió a mostrar imagen.', '2026-11-19T16:38:02.279139+00:00'),
    (18, 53, 1, 'dd7aae5a-597e-4fcc-a7d5-ab068b4de675', 'German Gaona', 'PRUEBA A: se limpio el filtro y se destapo la bandeja.', '2026-11-22T22:20:38.134177+00:00')
ON CONFLICT (observacion_id) DO NOTHING;

SELECT setval('public.tarea_observacion_observacion_id_seq', COALESCE((SELECT MAX(observacion_id) FROM public.tarea_observacion), 1), true);

COMMIT;
