-- Gestion de activos fisicos y su ubicacion.
--
-- La tabla Activo ya existia desde el esquema inicial con el codigo de
-- inventario, la ubicacion, el tipo, las fechas y el estado. Le faltaban dos
-- cosas para poder gestionarla desde el sistema:
--
-- activoDesc: la descripcion del activo. El alta la pide, y sin ella la unica
-- forma de saber que es cada activo seria el codigo.
--
-- activoFechaUltReub: cuando se lo movio de espacio por ultima vez. Se guarda
-- en el activo y no en una tabla aparte, asi que conserva el ultimo movimiento
-- y no el recorrido completo. Es lo que el equipo decidio para esta entrega.
--
-- El estado (activoEstado) sigue siendo VARCHAR(50) sin CHECK, igual que el
-- resto de los estados del sistema: los valores validos se controlan en el
-- servicio (backend/src/servicios/activos.servicio.js). Los estados de un
-- activo son Operativo, En mantenimiento, Fuera de servicio y Retirado.

ALTER TABLE Activo
    ADD COLUMN activoDesc TEXT,
    ADD COLUMN activoFechaUltReub DATE;
