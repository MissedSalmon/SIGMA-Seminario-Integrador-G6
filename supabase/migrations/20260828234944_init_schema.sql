-- 1. Ubicación y Estructura Organizativa

CREATE TABLE Edificio (
    edificioId INT PRIMARY KEY,
    edificioNom VARCHAR(100),
    edificioDir VARCHAR(200)
);

CREATE TABLE Autorizado (
    autorizadoLegajo INT PRIMARY KEY,
    autorizadoNomYApe VARCHAR(150),
    autorizadoTel VARCHAR(50)
);

CREATE TABLE Area (
    areaId INT PRIMARY KEY,
    autorizadoLegajo INT,
    areaNom VARCHAR(100),
    FOREIGN KEY (autorizadoLegajo) REFERENCES Autorizado(autorizadoLegajo)
);

CREATE TABLE Espacio (
    edificioId INT,
    espacioNum VARCHAR(20),
    areaId INT,
    espacioPiso VARCHAR(50),
    PRIMARY KEY (edificioId, espacioNum),
    FOREIGN KEY (edificioId) REFERENCES Edificio(edificioId),
    FOREIGN KEY (areaId) REFERENCES Area(areaId)
);

-- 2. Gestión de Activos y Fallas

CREATE TABLE TipoActivo (
    tipoActivoId INT PRIMARY KEY,
    tipoActivoNom VARCHAR(100)
);

CREATE TABLE Activo (
    activoCodigo VARCHAR(50) PRIMARY KEY,
    edificioId INT,
    espacioNum VARCHAR(20),
    tipoActivoId INT,
    fallaId INT,
    activoFechaAlta DATE,
    activoFechaInst DATE,
    activoFechaUltMant DATE,
    activoEstado VARCHAR(50),
    FOREIGN KEY (edificioId, espacioNum) REFERENCES Espacio(edificioId, espacioNum),
    FOREIGN KEY (tipoActivoId) REFERENCES TipoActivo(tipoActivoId)
    -- fallaId FK will be added later to avoid circular reference issues
);

-- 3. Tickets y Solicitudes

CREATE TABLE Ticket (
    ticketId INT PRIMARY KEY,
    activoCodigo VARCHAR(50),
    edificioId INT,
    espacioNum VARCHAR(20),
    autorizadoLegajo INT,
    ticketFechaAlta TIMESTAMP,
    ticketDesc TEXT,
    ticketEstado VARCHAR(50),
    ticketEvidencia VARCHAR(255),
    FOREIGN KEY (activoCodigo) REFERENCES Activo(activoCodigo),
    FOREIGN KEY (edificioId, espacioNum) REFERENCES Espacio(edificioId, espacioNum),
    FOREIGN KEY (autorizadoLegajo) REFERENCES Autorizado(autorizadoLegajo),
    CONSTRAINT chk_ticket_ubicacion CHECK (
        (activoCodigo IS NOT NULL AND edificioId IS NULL AND espacioNum IS NULL) 
        OR 
        (activoCodigo IS NULL AND edificioId IS NOT NULL AND espacioNum IS NOT NULL)
    )
);

-- 4. Gestión de Órdenes de Trabajo (OT) y Tareas

CREATE TABLE Administrador (
    adminLegajo INT PRIMARY KEY,
    adminNomYApe VARCHAR(150),
    adminTel VARCHAR(50),
    adminFechaAsun DATE
);

-- 5. Mantenimiento Preventivo

CREATE TABLE MantPrev_Plantilla (
    mantPrevPlanId INT PRIMARY KEY,
    mantPrevPlanNom VARCHAR(100),
    mantPrevPlanDesc TEXT,
    mantPrevPlanFrec VARCHAR(50)
);

CREATE TABLE MantenimientoPreventivo (
    mantPrevId INT PRIMARY KEY,
    adminLegajo INT,
    mantPrevPlanId INT,
    tipoActivoId INT,
    mantPrevNom VARCHAR(100),
    mantPrevDesc TEXT,
    mantPrevFrec VARCHAR(50),
    FOREIGN KEY (adminLegajo) REFERENCES Administrador(adminLegajo),
    FOREIGN KEY (mantPrevPlanId) REFERENCES MantPrev_Plantilla(mantPrevPlanId),
    FOREIGN KEY (tipoActivoId) REFERENCES TipoActivo(tipoActivoId)
);

CREATE TABLE OrdenesTrabajo (
    otId INT PRIMARY KEY,
    ticketId INT,
    mantPrevId INT,
    otFechaAlta TIMESTAMP,
    otFechaCierre TIMESTAMP,
    otEstado VARCHAR(50),
    otDesc TEXT,
    FOREIGN KEY (ticketId) REFERENCES Ticket(ticketId),
    FOREIGN KEY (mantPrevId) REFERENCES MantenimientoPreventivo(mantPrevId),
    CONSTRAINT chk_ot_origen CHECK (
        (ticketId IS NOT NULL AND mantPrevId IS NULL) 
        OR 
        (ticketId IS NULL AND mantPrevId IS NOT NULL)
    )
);

CREATE TABLE PlantillaDeTareas (
    tareaPlanId INT PRIMARY KEY,
    tipoActivoId INT,
    tareaPlanDesc TEXT,
    FOREIGN KEY (tipoActivoId) REFERENCES TipoActivo(tipoActivoId)
);

CREATE TABLE PrestadorServicio (
    prestadorServId INT PRIMARY KEY,
    prestadorServNom VARCHAR(150),
    prestadorServCUIL VARCHAR(20),
    prestadorServTel VARCHAR(50),
    prestadorServGarantia VARCHAR(100)
);

CREATE TABLE TareasOT (
    tareaId INT PRIMARY KEY,
    otId INT,
    tareaPlanId INT,
    prestadorServId INT,
    tareaDesc TEXT,
    tareaEstado VARCHAR(50),
    tareaPrioridad VARCHAR(50),
    tareaFechaIni TIMESTAMP,
    tareaFechaFin TIMESTAMP,
    FOREIGN KEY (otId) REFERENCES OrdenesTrabajo(otId),
    FOREIGN KEY (tareaPlanId) REFERENCES PlantillaDeTareas(tareaPlanId),
    FOREIGN KEY (prestadorServId) REFERENCES PrestadorServicio(prestadorServId)
);

CREATE TABLE Falla (
    fallaId INT PRIMARY KEY,
    otId INT,
    tareaId INT,
    fallaTipo VARCHAR(100),
    fallaDesc TEXT,
    fallaFecha TIMESTAMP,
    FOREIGN KEY (otId) REFERENCES OrdenesTrabajo(otId),
    FOREIGN KEY (tareaId) REFERENCES TareasOT(tareaId)
);

-- Agregar FK de Activo a Falla
ALTER TABLE Activo ADD CONSTRAINT fk_activo_falla FOREIGN KEY (fallaId) REFERENCES Falla(fallaId);

-- 6. Personal Técnico y Prestadores Externos

CREATE TABLE Tecnico (
    tecnicoLegajo INT PRIMARY KEY,
    tecnicoNomYApe VARCHAR(150),
    tecnicoTel VARCHAR(50),
    tecnicoDisponibilidad VARCHAR(50)
);

CREATE TABLE Tecnico_asignado_TareaOT (
    tecnicoLegajo INT,
    otId INT,
    tareaId INT,
    tectarFechaAsig TIMESTAMP,
    tectarEstado VARCHAR(50),
    PRIMARY KEY (tecnicoLegajo, otId, tareaId),
    FOREIGN KEY (tecnicoLegajo) REFERENCES Tecnico(tecnicoLegajo),
    FOREIGN KEY (otId) REFERENCES OrdenesTrabajo(otId),
    FOREIGN KEY (tareaId) REFERENCES TareasOT(tareaId)
);

CREATE TABLE Especialidad (
    especialidadId INT PRIMARY KEY,
    especialidadNom VARCHAR(100)
);

CREATE TABLE Tecnico_Especialidad (
    tecnicoLegajo INT,
    especialidadId INT,
    teCosto DECIMAL(10,2),
    PRIMARY KEY (tecnicoLegajo, especialidadId),
    FOREIGN KEY (tecnicoLegajo) REFERENCES Tecnico(tecnicoLegajo),
    FOREIGN KEY (especialidadId) REFERENCES Especialidad(especialidadId)
);

CREATE TABLE Prestador_Especialidad (
    prestadorServId INT,
    especialidadId INT,
    peCosto DECIMAL(10,2),
    PRIMARY KEY (prestadorServId, especialidadId),
    FOREIGN KEY (prestadorServId) REFERENCES PrestadorServicio(prestadorServId),
    FOREIGN KEY (especialidadId) REFERENCES Especialidad(especialidadId)
);

-- 7. Compras, Materiales y Herramientas

CREATE TABLE Proveedor (
    proveedorId INT PRIMARY KEY,
    proveedorNom VARCHAR(150),
    proveedorCUIL VARCHAR(20),
    proveedorTel VARCHAR(50),
    proveedorDir VARCHAR(200),
    proveedorRubro VARCHAR(100)
);

CREATE TABLE Compra (
    compraId INT PRIMARY KEY,
    proveedorId INT,
    compraFecha DATE,
    compraTipoFac VARCHAR(10),
    compraObv TEXT,
    compraNroFac VARCHAR(50),
    FOREIGN KEY (proveedorId) REFERENCES Proveedor(proveedorId)
);

CREATE TABLE LineaCompra (
    compraId INT,
    lineaId INT,
    lineaMonto DECIMAL(12,2),
    lineaDesc TEXT,
    lineaCant INT,
    PRIMARY KEY (compraId, lineaId),
    FOREIGN KEY (compraId) REFERENCES Compra(compraId)
);

CREATE TABLE Material (
    matCod VARCHAR(50) PRIMARY KEY,
    compraId INT,
    lineaId INT,
    matNom VARCHAR(150),
    matStockActual INT,
    matStockMin INT,
    matFechaVenc DATE,
    FOREIGN KEY (compraId, lineaId) REFERENCES LineaCompra(compraId, lineaId)
);

CREATE TABLE TareaOT_consume_Material (
    tareaId INT,
    matCod VARCHAR(50),
    tamatFechaCons TIMESTAMP,
    PRIMARY KEY (tareaId, matCod),
    FOREIGN KEY (tareaId) REFERENCES TareasOT(tareaId),
    FOREIGN KEY (matCod) REFERENCES Material(matCod)
);

CREATE TABLE Herramienta (
    herrCod VARCHAR(50) PRIMARY KEY,
    compraId INT,
    lineaId INT,
    herrNom VARCHAR(150),
    herrEstado VARCHAR(50),
    FOREIGN KEY (compraId, lineaId) REFERENCES LineaCompra(compraId, lineaId)
);

CREATE TABLE Tecnico_utiliza_Herramienta (
    tecnicoLegajo INT,
    herrCod VARCHAR(50),
    techenFechaPrest TIMESTAMP,
    techenFechaDev TIMESTAMP,
    PRIMARY KEY (tecnicoLegajo, herrCod),
    FOREIGN KEY (tecnicoLegajo) REFERENCES Tecnico(tecnicoLegajo),
    FOREIGN KEY (herrCod) REFERENCES Herramienta(herrCod)
);
