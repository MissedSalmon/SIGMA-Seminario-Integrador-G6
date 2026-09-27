-- Una falla se diagnostica en una tarea concreta. Las filas antiguas, que
-- sólo estaban asociadas a la OT, se conservan sin tarea ni activo.
ALTER TABLE falla
    ADD COLUMN tarea_id INT,
    ADD COLUMN activo_codigo VARCHAR(50);

ALTER TABLE falla
    ADD CONSTRAINT falla_tarea_fk
        FOREIGN KEY (ot_id, tarea_id)
        REFERENCES tarea_ot (ot_id, tarea_id)
        DEFERRABLE INITIALLY DEFERRED,
    ADD CONSTRAINT falla_activo_fk
        FOREIGN KEY (activo_codigo)
        REFERENCES activo (activo_codigo),
    ADD CONSTRAINT falla_una_por_tarea
        UNIQUE (ot_id, tarea_id),
    ADD CONSTRAINT falla_tarea_y_activo_juntos
        CHECK ((tarea_id IS NULL) = (activo_codigo IS NULL));