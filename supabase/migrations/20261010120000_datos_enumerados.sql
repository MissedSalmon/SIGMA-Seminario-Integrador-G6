-- Datos enumerados como numeros (diccionario de datos del Sprint 3).
--
-- Los estados y las prioridades (de la tarea y de la OT) dejan de guardarse
-- como texto ("En ejecución", "Fuera de servicio") y pasan a ser un numero
-- entero. Cada columna acepta solo los valores del diccionario (CHECK) y
-- lleva un comentario con lo que significa cada numero.
--
-- La traduccion numero <-> texto vive en un solo lugar del backend:
-- backend/src/utiles/enumerados.js. La API sigue mandando el texto, asi que las
-- pantallas no cambian.
--
-- Decisiones del 07/10/2026 (ver .claude/contexto/dominio.md):
--   - Ticket: se agrega "En ejecución" (4), que el diccionario no tenia.
--   - Herramienta: 1=Disponible, 2=En uso, 3=Fuera de servicio.
--   - Tarea: los 6 estados del diccionario. Las tareas guardadas como
--     "Pendiente" quedan en 4=Pendiente; "Completada" pasa a ser 5=Finalizada.
--   - Prioridad de la tarea: 1=Alta, 2=Media, 3=Baja.
--   - Prioridad manual de la OT (10/10/2026): los mismos numeros que la de la
--     tarea. Sigue pudiendo quedar vacia (la OT usa entonces la sugerida).
--
-- Fecha de este archivo: va despues de 20261009190000 a proposito. Se escribio
-- el 07/10 pero no se habia aplicado, y la base ya tenia migraciones mas nuevas.
--
-- Antes de comparar se sacan las tildes, para no depender de como la base
-- pase a mayuscula una letra con tilde.
--
-- Si ya hay un numero escrito como texto ("2"), se toma tal cual: pasa si el
-- codigo nuevo se uso antes de aplicar esta migracion. El CHECK revisa el rango.
--
-- Si aparece un valor que no esta en la lista, la conversion lo deja vacio y
-- el SET NOT NULL frena toda la migracion: mejor eso que cambiarlo a ciegas.
-- Los valores viejos en mayuscula ('ABIERTO', 'PENDIENTE', 'ASIGNADO',
-- 'DISPONIBLE') se traducen al estado que el sistema ya les daba.

-- ---------------------------------------------------------------- Activo
ALTER TABLE activo ALTER COLUMN activo_estado DROP DEFAULT;
ALTER TABLE activo ALTER COLUMN activo_estado TYPE INT USING (
    CASE
        WHEN activo_estado IS NULL THEN 1
        WHEN btrim(activo_estado) ~ '^[0-9]+$' THEN btrim(activo_estado)::INT
        WHEN upper(translate(btrim(activo_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'OPERATIVO' THEN 1
        WHEN upper(translate(btrim(activo_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN MANTENIMIENTO' THEN 2
        WHEN upper(translate(btrim(activo_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'FUERA DE SERVICIO' THEN 3
        WHEN upper(translate(btrim(activo_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'RETIRADO' THEN 4
    END
);
ALTER TABLE activo ALTER COLUMN activo_estado SET DEFAULT 1;
ALTER TABLE activo ALTER COLUMN activo_estado SET NOT NULL;
ALTER TABLE activo ADD CONSTRAINT chk_activo_estado CHECK (activo_estado BETWEEN 1 AND 4);
COMMENT ON COLUMN activo.activo_estado IS
    '1=Operativo, 2=En mantenimiento, 3=Fuera de servicio, 4=Retirado';

-- ---------------------------------------------------------------- Ticket
ALTER TABLE ticket ALTER COLUMN ticket_estado DROP DEFAULT;
ALTER TABLE ticket ALTER COLUMN ticket_estado TYPE INT USING (
    CASE
        WHEN ticket_estado IS NULL THEN 1
        WHEN btrim(ticket_estado) ~ '^[0-9]+$' THEN btrim(ticket_estado)::INT
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) IN ('CREADO', 'ABIERTO') THEN 1
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'VALIDADO' THEN 2
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ASIGNADO' THEN 3
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN EJECUCION' THEN 4
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'FINALIZADO' THEN 5
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'CERRADO' THEN 6
        WHEN upper(translate(btrim(ticket_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'RECHAZADO' THEN 7
    END
);
ALTER TABLE ticket ALTER COLUMN ticket_estado SET DEFAULT 1;
ALTER TABLE ticket ALTER COLUMN ticket_estado SET NOT NULL;
ALTER TABLE ticket ADD CONSTRAINT chk_ticket_estado CHECK (ticket_estado BETWEEN 1 AND 7);
COMMENT ON COLUMN ticket.ticket_estado IS
    '1=Creado, 2=Validado, 3=Asignado, 4=En ejecución, 5=Finalizado, 6=Cerrado, 7=Rechazado';

-- ---------------------------------------------------------------- Orden de trabajo
ALTER TABLE orden_trabajo ALTER COLUMN ot_estado DROP DEFAULT;
ALTER TABLE orden_trabajo ALTER COLUMN ot_estado TYPE INT USING (
    CASE
        WHEN ot_estado IS NULL THEN 1
        WHEN btrim(ot_estado) ~ '^[0-9]+$' THEN btrim(ot_estado)::INT
        WHEN upper(translate(btrim(ot_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) IN ('CREADA', 'PENDIENTE') THEN 1
        WHEN upper(translate(btrim(ot_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ASIGNADA' THEN 2
        WHEN upper(translate(btrim(ot_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN EJECUCION' THEN 3
        WHEN upper(translate(btrim(ot_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'FINALIZADA' THEN 4
        WHEN upper(translate(btrim(ot_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'CANCELADA' THEN 5
    END
);
ALTER TABLE orden_trabajo ALTER COLUMN ot_estado SET DEFAULT 1;
ALTER TABLE orden_trabajo ALTER COLUMN ot_estado SET NOT NULL;
ALTER TABLE orden_trabajo ADD CONSTRAINT chk_ot_estado CHECK (ot_estado BETWEEN 1 AND 5);
COMMENT ON COLUMN orden_trabajo.ot_estado IS
    '1=Creada, 2=Asignada, 3=En ejecución, 4=Finalizada, 5=Cancelada';

-- ---------------------------------------------------------------- Tarea de la OT
ALTER TABLE tarea_ot ALTER COLUMN tarea_estado DROP DEFAULT;
ALTER TABLE tarea_ot ALTER COLUMN tarea_estado TYPE INT USING (
    CASE
        WHEN tarea_estado IS NULL THEN 1
        WHEN btrim(tarea_estado) ~ '^[0-9]+$' THEN btrim(tarea_estado)::INT
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'CREADA' THEN 1
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ASIGNADA' THEN 2
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN EJECUCION' THEN 3
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'PENDIENTE' THEN 4
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) IN ('FINALIZADA', 'COMPLETADA') THEN 5
        WHEN upper(translate(btrim(tarea_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'CANCELADA' THEN 6
    END
);
ALTER TABLE tarea_ot ALTER COLUMN tarea_estado SET DEFAULT 1;
ALTER TABLE tarea_ot ALTER COLUMN tarea_estado SET NOT NULL;
ALTER TABLE tarea_ot ADD CONSTRAINT chk_tarea_estado CHECK (tarea_estado BETWEEN 1 AND 6);
COMMENT ON COLUMN tarea_ot.tarea_estado IS
    '1=Creada, 2=Asignada, 3=En ejecución, 4=Pendiente, 5=Finalizada, 6=Cancelada';

ALTER TABLE tarea_ot ALTER COLUMN tarea_prioridad DROP DEFAULT;
ALTER TABLE tarea_ot ALTER COLUMN tarea_prioridad TYPE INT USING (
    CASE
        WHEN tarea_prioridad IS NULL THEN 2
        WHEN btrim(tarea_prioridad) ~ '^[0-9]+$' THEN btrim(tarea_prioridad)::INT
        WHEN upper(translate(btrim(tarea_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ALTA' THEN 1
        WHEN upper(translate(btrim(tarea_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'MEDIA' THEN 2
        WHEN upper(translate(btrim(tarea_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'BAJA' THEN 3
    END
);
ALTER TABLE tarea_ot ALTER COLUMN tarea_prioridad SET DEFAULT 2;
ALTER TABLE tarea_ot ALTER COLUMN tarea_prioridad SET NOT NULL;
ALTER TABLE tarea_ot ADD CONSTRAINT chk_tarea_prioridad CHECK (tarea_prioridad BETWEEN 1 AND 3);
COMMENT ON COLUMN tarea_ot.tarea_prioridad IS '1=Alta, 2=Media, 3=Baja';

-- ---------------------------------------------------------------- Prioridad manual de la OT
-- La columna nacio como texto con su propio CHECK (20261009180000): se saca el
-- CHECK viejo antes de cambiar el tipo. Vacia sigue siendo vacia.
ALTER TABLE orden_trabajo DROP CONSTRAINT IF EXISTS chk_ot_prioridad;
ALTER TABLE orden_trabajo ALTER COLUMN ot_prioridad TYPE INT USING (
    CASE
        WHEN ot_prioridad IS NULL OR btrim(ot_prioridad) = '' THEN NULL
        WHEN btrim(ot_prioridad) ~ '^[0-9]+$' THEN btrim(ot_prioridad)::INT
        WHEN upper(translate(btrim(ot_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'ALTA' THEN 1
        WHEN upper(translate(btrim(ot_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'MEDIA' THEN 2
        WHEN upper(translate(btrim(ot_prioridad), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'BAJA' THEN 3
    END
);
ALTER TABLE orden_trabajo ADD CONSTRAINT chk_ot_prioridad CHECK (ot_prioridad BETWEEN 1 AND 3);
COMMENT ON COLUMN orden_trabajo.ot_prioridad IS
    '1=Alta, 2=Media, 3=Baja. Vacia: la OT usa la prioridad sugerida (la mas alta de sus tareas)';

-- ---------------------------------------------------------------- Tecnico asignado a la tarea
ALTER TABLE tecnico_asignado_tarea_ot ALTER COLUMN tec_asig_estado DROP DEFAULT;
ALTER TABLE tecnico_asignado_tarea_ot ALTER COLUMN tec_asig_estado TYPE INT USING (
    CASE
        WHEN tec_asig_estado IS NULL THEN 1
        WHEN btrim(tec_asig_estado) ~ '^[0-9]+$' THEN btrim(tec_asig_estado)::INT
        WHEN upper(translate(btrim(tec_asig_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'PENDIENTE' THEN 1
        WHEN upper(translate(btrim(tec_asig_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) IN ('ASIGNADA', 'ASIGNADO') THEN 2
        WHEN upper(translate(btrim(tec_asig_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN CURSO' THEN 3
        WHEN upper(translate(btrim(tec_asig_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'FINALIZADA' THEN 4
        WHEN upper(translate(btrim(tec_asig_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'CANCELADA' THEN 5
    END
);
ALTER TABLE tecnico_asignado_tarea_ot ALTER COLUMN tec_asig_estado SET DEFAULT 1;
ALTER TABLE tecnico_asignado_tarea_ot ALTER COLUMN tec_asig_estado SET NOT NULL;
ALTER TABLE tecnico_asignado_tarea_ot ADD CONSTRAINT chk_tec_asig_estado CHECK (tec_asig_estado BETWEEN 1 AND 5);
COMMENT ON COLUMN tecnico_asignado_tarea_ot.tec_asig_estado IS
    '1=Pendiente, 2=Asignada, 3=En curso, 4=Finalizada, 5=Cancelada';

-- ---------------------------------------------------------------- Herramienta
ALTER TABLE herramienta ALTER COLUMN herr_estado DROP DEFAULT;
ALTER TABLE herramienta ALTER COLUMN herr_estado TYPE INT USING (
    CASE
        WHEN herr_estado IS NULL THEN 1
        WHEN btrim(herr_estado) ~ '^[0-9]+$' THEN btrim(herr_estado)::INT
        WHEN upper(translate(btrim(herr_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'DISPONIBLE' THEN 1
        WHEN upper(translate(btrim(herr_estado), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) = 'EN USO' THEN 2
        WHEN upper(translate(btrim(replace(herr_estado, '_', ' ')), 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) IN
            ('FUERA DE SERVICIO', 'EN REPARACION', 'NO DISPONIBLE') THEN 3
    END
);
ALTER TABLE herramienta ALTER COLUMN herr_estado SET DEFAULT 1;
ALTER TABLE herramienta ALTER COLUMN herr_estado SET NOT NULL;
ALTER TABLE herramienta ADD CONSTRAINT chk_herr_estado CHECK (herr_estado BETWEEN 1 AND 3);
COMMENT ON COLUMN herramienta.herr_estado IS '1=Disponible, 2=En uso, 3=Fuera de servicio';

-- Hasta ahora "En uso" no se guardaba: salia del prestamo abierto. Desde aca
-- tambien queda en la columna, asi que se pone al dia con los prestamos de hoy.
UPDATE herramienta
SET herr_estado = 2
WHERE herr_cod IN (
    SELECT herr_cod FROM tecnico_utiliza_herramienta WHERE tec_herr_fecha_dev IS NULL
);

-- Una tarea con responsable (un tecnico o un prestador) esta "Asignada"
-- (decision del 07/10/2026). Las que ya tenian a alguien y no empezaron
-- (Creada o Pendiente) pasan a 2=Asignada; las que no tienen a nadie quedan
-- como estaban.
UPDATE tarea_ot AS tarea
SET tarea_estado = 2
WHERE tarea.tarea_estado IN (1, 4)
  AND (
      tarea.prestador_serv_id IS NOT NULL
      OR EXISTS (
          SELECT 1
          FROM tecnico_asignado_tarea_ot AS asignacion
          WHERE asignacion.ot_id = tarea.ot_id
            AND asignacion.tarea_id = tarea.tarea_id
      )
  );
