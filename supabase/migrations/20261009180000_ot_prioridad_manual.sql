-- Prioridad de la OT puesta a mano por el administrador (09/10/2026).
-- Si queda vacía, la OT usa la sugerida: la más alta de sus tareas, que se
-- calcula en el backend y no se guarda.

ALTER TABLE orden_trabajo
    ADD COLUMN ot_prioridad VARCHAR(20)
    CONSTRAINT chk_ot_prioridad CHECK (ot_prioridad IN ('Alta', 'Media', 'Baja'));
