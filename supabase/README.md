# Migraciones de Supabase

En esta carpeta se guardan los scripts SQL de la base de datos, gestionados ahora mediante la **CLI de Supabase**. 

Ya no ejecutamos los scripts manualmente pegándolos en el panel web. En su lugar, utilizamos el entorno local para versionar la base de datos como código (Infraestructura como Código).

---

## Cómo crear un nuevo script (migración)

Cuando necesites hacer un cambio en la base de datos (crear una tabla, modificar una columna, etc.):

1. Creá una nueva migración corriendo este comando desde la raíz del proyecto:
   ```bash
   npx supabase migration new nombre_de_tu_cambio
   ```

2. Eso va a generar un nuevo archivo `.sql` vacío en esta carpeta con un timestamp (ej: `20260828234944_nombre_de_tu_cambio.sql`).
3. Escribí tus sentencias SQL adentro de ese archivo.
4. Para subir y aplicar tus cambios a la base de datos real en Supabase, ejecutá:
   ```bash
   npm run db:push
   ```

*(Tenés que estar logueado previamente con `npx supabase login` y vinculado con `npm run db:link`).*

## Reglas importantes
1. **Nunca edites una migración que ya fue subida** (pusheada). Si te equivocaste o necesitás agregar algo a una tabla existente, **creá una nueva migración** con `ALTER TABLE`.
2. Todos los integrantes del equipo ejecutan `npm run db:push` cuando se bajan los últimos cambios del repositorio, manteniendo sus bases de datos completamente idénticas de forma automática.
