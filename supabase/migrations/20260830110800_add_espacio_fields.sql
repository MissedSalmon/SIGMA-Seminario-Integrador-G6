-- Add missing fields to Espacio to match frontend form requirements
ALTER TABLE Espacio ADD COLUMN espacioNom VARCHAR(100);
ALTER TABLE Espacio ADD COLUMN espacioTipo VARCHAR(50);
ALTER TABLE Espacio ADD COLUMN espacioDim VARCHAR(50);
