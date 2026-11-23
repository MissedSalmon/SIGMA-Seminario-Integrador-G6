-- Notificaciones leídas y eliminadas (23/11/2026).
--
-- Las notificaciones no se guardan: se calculan cada vez que se piden (tickets
-- nuevos, OT finalizadas, stock bajo, tareas...). Esta tabla guarda sólo lo que
-- hizo cada usuario con cada una, identificada por su clave ("ticket-nuevo-4",
-- "stock-CA-1", "tarea-7-2"...):
--   - notif_fecha:     la primera vez que se le mostró. Ordena las que no tienen
--                      una fecha propia (por ejemplo, el stock bajo).
--   - notif_leida:     si ya la leyó.
--   - notif_eliminada: si la eliminó. No se le vuelve a mostrar.
--
-- Cuando una notificación deja de calcularse (se repuso el stock, pasó la
-- semana, se terminó la tarea) su fila se borra. Si después vuelve a aparecer,
-- llega como nueva y sin leer.
CREATE TABLE public.notificacion_usuario (
    identificador VARCHAR(255) NOT NULL
        REFERENCES public.usuario(identificador) ON DELETE CASCADE ON UPDATE CASCADE,
    notif_clave VARCHAR(150) NOT NULL,
    notif_fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notif_leida BOOLEAN NOT NULL DEFAULT FALSE,
    notif_eliminada BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (identificador, notif_clave)
);

ALTER TABLE public.notificacion_usuario ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notificacion_usuario FROM PUBLIC, anon, authenticated;
