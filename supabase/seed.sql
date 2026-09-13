-- ==============================================================================
-- SCRIPT DE MIGRACIÓN DE DATOS DESDE CSV AL NUEVO ESQUEMA (SNAKE_CASE)
-- ==============================================================================
-- NOTA: Como algunas claves primarias ahora son GENERATED ALWAYS AS IDENTITY,
-- utilizamos OVERRIDING SYSTEM VALUE para poder insertar los IDs originales.

-- 1. EDIFICIO
INSERT INTO edificio (edificio_id, edificio_nom, edificio_dir) OVERRIDING SYSTEM VALUE VALUES
(1, 'Edificio central', 'French 414'),
(2, 'Anexo I', 'Laprida 11');

-- 2. TIPO ESPACIO
INSERT INTO tipo_espacio (tipo_espacio_id, tipo_espacio_nom) OVERRIDING SYSTEM VALUE VALUES
(1, 'Laboratorio'),
(2, 'Aula'),
(3, 'Oficina');

-- 3. ESPACIO
-- Las dimensiones ('8 x 6 m', etc) se tradujeron a metros cuadrados para respetar el NUMERIC(8,2).
-- Los tipo_espacio_id se mapearon lógicamente desde sus cadenas originales.
INSERT INTO espacio (espacio_id, edificio_id, espacio_num, tipo_espacio_id, espacio_piso, espacio_dim) OVERRIDING SYSTEM VALUE VALUES
(1, 1, '01', 3, 'Planta Baja', 48.00), -- 8x6 (Oficina)
(2, 1, '1',  3, 'Planta Baja', 9.00),  -- 3x3 (Oficina)
(3, 1, '11', 2, '2', 48.00),           -- 8x6 (Aula)
(4, 1, '12', 2, '1', 48.00),           -- 8x6 (Aula)
(5, 2, '0.2',2, '1', 484.00),          -- 22x22 (Aula)
(6, 2, '01', 3, 'Planta baja', 66.00), -- 22x3 (Oficina)
(7, 2, '11', 1, '1', 3630.00);         -- 55x66 (Laboratorio)

-- 4. AREA
INSERT INTO area (area_id, edificio_id, espacio_id, area_nom) OVERRIDING SYSTEM VALUE VALUES
(3, 1, 2, 'Departamento de Ingeniería Electromecanica'),
(2, 2, 6, 'Departamento de Ingenieria quimica'),
(1, 1, NULL, 'Departamento de Ingeniería en Sistemas de Información');

-- 5. TIPO ACTIVO
INSERT INTO tipo_activo (tipo_activo_id, tipo_activo_nom) OVERRIDING SYSTEM VALUE VALUES
(1, 'Aires acondicionados'),
(2, 'Luminarias'),
(3, 'Mobiliario'),
(4, 'Equipos informaticos'),
(5, 'Proyectores'),
(6, 'Televisores');

-- 6. ACTIVO
-- Mapeo manual de la FK espacio_id basado en edificio_id y espacio_num del CSV.
INSERT INTO activo (activo_codigo, edificio_id, espacio_id, tipo_activo_id, activo_fecha_alta, activo_estado) VALUES
('AC-001', 1, 3, 1, '2026-08-30', 'Operativo'),
('AC-002', 1, 4, 1, '2026-08-30', 'Operativo'),
('AC-003', 1, 4, 1, '2026-08-30', 'Operativo'),
('LUM-001', 1, 3, 2, '2026-08-30', 'Operativo'),
('LUM-002', 1, 3, 2, '2026-08-30', 'Fuera de servicio'),
('LUM-003', 1, 4, 2, '2026-08-30', 'Operativo'),
('MOB-001', 1, 4, 3, '2026-08-30', 'Retirado'),
('PC-001', 1, 2, 4, '2026-08-30', 'Operativo'),
('PROY-001', 1, 3, 5, '2026-08-30', 'Operativo'),
('TV-01', 2, 7, 6, '2026-09-02', 'Fuera de servicio');

-- 7. TECNICO
-- Los nombres y apellidos separados en CSV se concatenaron aquí.
INSERT INTO tecnico (tecnico_legajo, tecnico_nom_ape, tecnico_tel, tecnico_disponibilidad) VALUES
('1025', 'Carlos Perez', '1234123456', true),
('2030', 'German Gaona', '36251233234', true);

-- 8. ESPECIALIDAD
INSERT INTO especialidad (especialidad_id, especialidad_nom) OVERRIDING SYSTEM VALUE VALUES
(1, 'Electricista'),
(2, 'Refrigeracion'),
(3, 'Plomeria'),
(4, 'Mantenimiento general'),
(5, 'Carpinteria'),
(6, 'Albañilería'),
(7, 'Gasista');

-- 9. TECNICO ESPECIALIDAD
INSERT INTO tecnico_especialidad (tecnico_legajo, especialidad_id) VALUES
('1025', 1),
('1025', 4),
('2030', 2);

-- ==============================================================================
-- SINCRONIZACIÓN DE SECUENCIAS
-- Como insertamos IDs a mano, debemos indicarle a PostgreSQL dónde continuar
-- ==============================================================================
SELECT setval('edificio_edificio_id_seq', (SELECT MAX(edificio_id) FROM edificio));
SELECT setval('tipo_espacio_tipo_espacio_id_seq', (SELECT MAX(tipo_espacio_id) FROM tipo_espacio));
SELECT setval('espacio_espacio_id_seq', (SELECT MAX(espacio_id) FROM espacio));
SELECT setval('area_area_id_seq', (SELECT MAX(area_id) FROM area));
SELECT setval('tipo_activo_tipo_activo_id_seq', (SELECT MAX(tipo_activo_id) FROM tipo_activo));
SELECT setval('especialidad_especialidad_id_seq', (SELECT MAX(especialidad_id) FROM especialidad));
