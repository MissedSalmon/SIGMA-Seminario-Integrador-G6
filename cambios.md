# Cambios implementados en la HU-6: Gestión de Técnicos y Especialidades

Este documento detalla todos los cambios introducidos en el commit `b607266` ("hu 6") para resolver la Historia de Usuario acerca del Personal Técnico. La implementación abarca las tres capas principales de la aplicación: la base de datos, la API (backend) y la interfaz de usuario (frontend).

## 1. Base de Datos
Se agregó una migración de Supabase para adaptar el esquema de la tabla de Técnicos según los nuevos requerimientos (separar nombre y apellido, agregar DNI, CUIL, etc.):
- `supabase/migrations/20260829210000_tecnico_datos_personales.sql`: Archivo SQL (32 líneas) que altera la tabla de técnicos.

## 2. Backend (API / Node.js)
Se crearon los módulos necesarios para exponer las entidades *Técnico* y *Especialidad*:
- **Controladores:**
  - `backend/src/controladores/tecnicos.controlador.js` (56 líneas): Maneja las peticiones HTTP para el ABM de técnicos.
  - `backend/src/controladores/especialidades.controlador.js` (12 líneas): Maneja las peticiones HTTP para obtener las especialidades.
- **Rutas:**
  - `backend/src/rutas/tecnicos.rutas.js` (16 líneas): Define los endpoints (GET, POST, PUT, DELETE) para `/api/tecnicos`.
  - `backend/src/rutas/especialidades.rutas.js` (12 líneas): Define el endpoint para `/api/especialidades`.
  - `backend/src/rutas/index.js`: Se actualizó (7 líneas) para registrar y montar ambas rutas en la aplicación de Express.
- **Servicios:**
  - `backend/src/servicios/tecnicos.servicio.js` (251 líneas): Contiene la lógica de negocio fuerte para técnicos (inserción, actualización con validaciones, y borrado lógico modificando la disponibilidad).
  - `backend/src/servicios/especialidades.servicio.js` (24 líneas): Lógica de negocio para las especialidades.
- **Configuración:**
  - `backend/.env.example` (15 líneas): Plantilla de variables de entorno añadida para facilitar el despliegue a nuevos desarrolladores.

## 3. Frontend (UI / Next.js)
Se construyeron todas las pantallas y formularios para gestionar el personal técnico, así como la conexión a la API:
- **Páginas:**
  - `frontend/src/app/tecnicos/page.js` (238 líneas): Listado principal de técnicos con tabla de datos, filtros y acciones.
  - `frontend/src/app/tecnicos/agregar/page.js` (20 líneas): Pantalla de alta de un nuevo técnico.
  - `frontend/src/app/tecnicos/[legajo]/editar/page.js` (49 líneas): Pantalla para modificar los datos de un técnico existente.
- **Componentes:**
  - `frontend/src/componentes/tecnicos/FormularioTecnico.js` (329 líneas): Formulario extenso y validado para la carga/edición de datos del personal técnico (nombre, apellido, dni, cuil, especialidades).
  - `frontend/src/componentes/EtiquetaDisponibilidad.js` (22 líneas): Componente visual para renderizar estados como "Disponible" / "No disponible".
- **Layout y Navegación:**
  - `frontend/src/componentes/layout/navegacion.js`: Se agregó el link a "Técnicos" en el menú de la barra lateral izquierda.
  - `frontend/src/componentes/layout/Encabezado.js`: Se configuraron las "migas de pan" (breadcrumbs) para mostrar "Técnicos" en el encabezado.
- **Servicios API (Fetchers):**
  - `frontend/src/servicios/tecnicos.js` (40 líneas): Funciones de Javascript para llamar a la API de técnicos (crear, listar, eliminar, actualizar).
  - `frontend/src/servicios/especialidades.js` (13 líneas): Funciones de Javascript para obtener el listado de especialidades disponibles desde el backend.

---

> **Total del commit:** 18 archivos modificados/creados, 1148 líneas de código añadidas.
