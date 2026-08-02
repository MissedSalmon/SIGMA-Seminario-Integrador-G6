# -*- coding: utf-8 -*-
"""
Reconstruye TODO lo que deriva del artículo, en orden.

  cd docs/entrega-investigacion/web && python3 build_all.py

⚠️ ORDEN DE SINCRONÍA (importante):
`index.html` es la ÚNICA fuente de verdad. Todo lo demás se genera de ahí:

  index.html  ─┬─►  articulo.md      (el artículo en markdown, para imprimir)
               └─►  exposicion.html  (las diapositivas de la exposición)

Cada vez que se toca `index.html` (la base de la información) hay que correr
este script para que el markdown Y las diapositivas queden actualizados.
No editar `articulo.md` ni `exposicion.html` a mano: se pisan en la próxima
generación.
"""
import subprocess, pathlib, sys
WEB = pathlib.Path(__file__).resolve().parent
for paso in ("html2md.py", "build_expo.py"):
    print(f"· {paso}")
    r = subprocess.run([sys.executable, str(WEB / paso)], capture_output=True, text=True)
    print("  " + (r.stdout.strip() or r.stderr.strip()))
    if r.returncode: sys.exit(f"falló {paso}")
print("listo · articulo.md y exposicion.html regenerados desde index.html")
