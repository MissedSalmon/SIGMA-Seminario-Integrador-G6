# Documentación de Cambios en Base de Datos: HU-30 (Autenticación y Sesiones)

Este documento detalla todas las modificaciones arquitectónicas, adiciones al modelo de datos, el diccionario de datos y los términos del glosario introducidos durante la implementación de la **HU-30: Módulo de Autenticación y Gestión de Sesiones**.

---

## 1. Nuevas Tablas y Estructura

Se agregó una única entidad centralizada para resolver el manejo de credenciales y acceso al sistema, independizando la autenticación del proveedor externo (Supabase Auth en el frontend) para pasar a un esquema controlado por el backend propio con JWT.

### Tabla: `Usuario`

Responsable de almacenar las credenciales de acceso, los roles y el estado de la cuenta para forzar políticas de seguridad (como el cambio de contraseña inicial).

#### Atributos y Tipos de Datos

| Campo | Tipo de Dato | Restricción (Constraints) | Descripción |
| :--- | :--- | :--- | :--- |
| `usuarioId` | `UUID` | **PRIMARY KEY**, `DEFAULT uuid_generate_v4()` | Identificador interno único del usuario en el sistema. |
| `identificador` | `VARCHAR(255)` | **NOT NULL**, **UNIQUE** | Credencial de acceso ingresada en el login. Se corresponde con el *legajo* de la persona (Admin, Técnico o Autorizado). |
| `passwordHash` | `VARCHAR(255)` | **NOT NULL** | Contraseña cifrada del usuario utilizando el algoritmo `bcrypt`. Nunca se almacena en texto plano. |
| `rol` | `VARCHAR(50)` | **NOT NULL**, `CHECK (rol IN ('administrador', 'tecnico', 'autorizado'))` | Define el nivel de acceso y permisos del usuario en la plataforma. |
| `requirePasswordChange`| `BOOLEAN` | **NOT NULL**, `DEFAULT true` | Bandera de estado. Si es `true`, el usuario no puede navegar el sistema y es forzado a establecer una nueva contraseña (Primer Inicio de Sesión). |
| `activo` | `BOOLEAN` | **NOT NULL**, `DEFAULT true` | Baja lógica de la cuenta. Si es `false`, el identificador no podrá iniciar sesión. |
| `creadoEn` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora de creación de las credenciales. |
| `adminLegajo` | `VARCHAR(255)` | **FOREIGN KEY** | Clave foránea referenciando a `Administrador(adminLegajo)`. |
| `tecnicoLegajo` | `VARCHAR(255)` | **FOREIGN KEY** | Clave foránea referenciando a `Tecnico(tecnicoLegajo)`. |
| `autorizadoLegajo`| `VARCHAR(255)` | **FOREIGN KEY** | Clave foránea referenciando a `Autorizado(autorizadoLegajo)`. |

> **Arco Exclusivo (XOR):** La tabla posee la restricción `chk_usuario_perfil` asegurando que un usuario esté vinculado a **exactamente una** de las tres llaves foráneas. Esto impone una integridad referencial 100% estricta, impidiendo la existencia de credenciales huérfanas o apuntando a personas eliminadas de la BD.

---

## 2. Relaciones Lógicas y Físicas

La tabla `Usuario` mantiene una **relación física de 1 a 1** y borrado en cascada (`ON DELETE CASCADE`) a través de sus llaves foráneas. El campo `identificador` (siempre el legajo) es el que se tipea en el Login, mientras que el motor de base de datos mantiene las FKs actualizadas y consistentes:

Al momento de obtener el perfil (`GET /api/auth/perfil`), el backend utiliza el valor del `identificador` y el `rol` del token JWT para ir a buscar los datos personales (Nombre, Apellido, Teléfono, etc.) a la tabla correspondiente.

---

## 3. Diccionario de Datos (Ampliación)

Se incorporan los siguientes dominios de valores y reglas de negocio al diccionario de datos general del proyecto:

* **Roles del Sistema (`Usuario.rol`)**
  * `administrador`: Acceso total, dashboard, ABM del sistema, validación de tickets y programación de OTs.
  * `tecnico`: Acceso limitado a su panel de tareas (`/tareas`), registro de consumos y diagnóstico de fallas.
  * `autorizado`: Acceso exclusivo a visualizar y reportar tickets (`/tickets`) sobre las áreas de las que es responsable.

* **Estados de la Cuenta (`Usuario.requirePasswordChange`)**
  * **Primer Inicio de Sesión (`true`)**: Estado donde la cuenta fue dada de alta por el administrador (contraseña por defecto = legajo o autogenerada). El JWT emitido bloquea todas las rutas protegidas excepto `/configuracion/cambiar-password`.
  * **Cuenta Activa Segura (`false`)**: Estado alcanzado cuando la persona ya definió una contraseña personal privada.

---

## 4. Actualización del Glosario de Términos

Para garantizar un lenguaje ubicuo claro entre desarrollo y negocio, se agregan los siguientes términos derivados de la HU-30:

| Término | Definición en el contexto de SIGMA |
| :--- | :--- |
| **Credenciales** | Conjunto compuesto por un `identificador` (Email o Legajo) y una contraseña privada utilizado para demostrar la identidad de la persona ante el sistema. |
| **Identificador de Acceso** | Dato único mediante el cual una persona ingresa a SIGMA. Varía según el rol: es el correo electrónico institucional para los *Usuarios Autorizados* y el número de legajo para los *Técnicos* y *Administradores*. |
| **JWT (JSON Web Token)** | Tecnología utilizada por el backend de SIGMA para emitir un "pase de acceso" (sesión) temporal al frontend tras un login exitoso. Contiene de forma segura el rol y los permisos del usuario sin necesidad de consultar la base de datos en cada clic. Viaja protegido en una cookie `HttpOnly`. |
| **Primer Inicio de Sesión** | Regla de seguridad obligatoria (Force Password Change). Cuando un usuario nuevo es registrado, entra en este modo temporal; el sistema no le permite visualizar ninguna pantalla hasta que reemplace la clave genérica asignada por el Administrador por una clave propia. |
| **Cookie HttpOnly** | Mecanismo de seguridad web empleado en SIGMA para guardar la sesión (JWT). Garantiza que el token no pueda ser leído ni robado por código malicioso o extensiones del navegador, ya que solo se envía internamente al comunicarse con el backend. |
| **Bcrypt** | Algoritmo de encriptación "de una sola vía" (hashing) usado en la base de datos. Asegura que nadie (ni siquiera el Administrador o los desarrolladores que miran la tabla `Usuario`) pueda conocer las contraseñas reales de las personas. |
