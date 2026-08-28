# Base de datos

Acá se guardan los scripts SQL de la base de datos de SIGMA. El motor es **PostgreSQL**,
alojado en **Supabase**.

```
base-de-datos/
├── migraciones/   →  los scripts que crean y modifican las tablas
└── semillas/      →  datos de ejemplo para probar
```

---

## Para qué sirve

Lo más fácil sería entrar a Supabase y crear las tablas haciendo clic en el panel.
Funciona cuando trabaja una sola persona. Con un equipo de siete, empieza a fallar:

- Alguien crea una tabla desde el panel y el resto no se entera de qué columnas le puso.
- Alguien agrega un campo, y los demás siguen programando contra la versión vieja sin
  entender por qué les falla.
- Alguien borra algo sin querer y no hay forma de volver atrás.
- Llega la demo, hay que armar la base de cero en otra cuenta, y nadie se acuerda del
  orden en que se crearon las tablas.
- La cátedra pide ver el modelo y hay que sacar capturas de pantalla del panel.

Esta carpeta resuelve todo eso guardando **cada cambio de la base como un archivo de texto
dentro del repositorio**. La base deja de vivir sólo en Supabase: queda escrita en el
proyecto y versionada junto al código.

---

## `migraciones/`

Son los scripts que construyen la base. Así se trabaja en el día a día:

**1.** Quien toma una historia que necesita una tabla nueva, escribe el archivo:

```
base-de-datos/migraciones/001_estructura_edilicia.sql
```

```sql
CREATE TABLE edificios (
  id_edificio  SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  direccion    TEXT
);
```

**2.** Lo pega en el editor SQL de Supabase y lo ejecuta.

**3.** Hace commit del archivo.

**4.** El resto del equipo hace `git pull`, ve el archivo nuevo y ejecuta el mismo script.

Resultado: **todos tienen exactamente la misma base**, y queda registrado qué se cambió y
cuándo.

### Por qué van numerados

Porque el orden importa: no se puede crear `espacios` con una clave foránea a `edificios`
si `edificios` todavía no existe.

Con la numeración, **cualquiera arma la base desde cero** ejecutando los archivos del 001
en adelante. Sirve para un integrante que se suma, para preparar la demo, o para cuando
haya que rehacer todo.

```
migraciones/
├── 001_estructura_edilicia.sql     # edificios, espacios, areas
├── 002_activos.sql                 # tipos de activo, activos, fallas
├── 003_usuarios_y_roles.sql        # usuarios y los tres roles
├── 004_tickets.sql
├── 005_ordenes_trabajo.sql
├── 006_inventario.sql
└── ...
```

### La regla que más se rompe

> **Un archivo ya ejecutado no se modifica nunca.**

Si te olvidaste una columna en `001_estructura_edilicia.sql`, **no lo edites**: el resto
del equipo ya lo ejecutó y su base no se va a enterar del cambio. Se crea un archivo
nuevo:

```
008_agrega_telefono_a_edificios.sql
```

```sql
ALTER TABLE edificios ADD COLUMN telefono TEXT;
```

Así todos aplican el cambio corriendo sólo el archivo nuevo.

### Otras reglas

- **Un archivo por tema.** No un único script gigante.
- **Nombres en español y en minúscula**, igual que en el resto del proyecto:
  `ordenes_trabajo`, `tareas_ot`, `items_inventario`.

---

## `semillas/`

Datos de ejemplo, para no tener que cargar todo a mano cada vez que alguien reinicia su
base: un par de edificios, algunos espacios, técnicos y materiales.

**Hay un motivo que conviene tener presente desde ahora.** Todo el último sprint son
indicadores: tiempos promedio de resolución, carga de trabajo por técnico, áreas con más
fallas. Esos gráficos necesitan **meses de historia acumulada** para mostrar algo.

Como ese sprint es el último, va a llegar con la base recién estrenada y **el tablero se
va a ver vacío en la demo final**. La solución es preparar una semilla que genere tickets
y órdenes de trabajo repartidos en meses anteriores. Es mejor tenerlo en cuenta desde
temprano y no descubrirlo sobre la fecha de entrega.

---

## Estado actual

La carpeta está **vacía a propósito**.

Escribir el primer script significa fijar el modelo de tablas, y el modelo **se está
rehaciendo** por las correcciones de la cátedra. Cualquier script que se escriba ahora
habría que tirarlo.

Esto corresponde a la **tarea T3 del Sprint 0**, la única de ese sprint que quedó
pendiente. Se destraba cuando el equipo cierre el modelo corregido.

---

## Más adelante

Supabase tiene una herramienta de línea de comandos que automatiza esto: lleva la cuenta
de qué migraciones se aplicaron y cuáles no, así nadie tiene que acordarse.

**No hace falta ahora.** Instalarla y vincular el proyecto suma pasos, y mientras el
equipo se está acomodando, "pegar el script en el editor de Supabase" tiene menos cosas
que puedan salir mal. Si más adelante se hace pesado llevar la cuenta a mano, conviene
mirarla.
