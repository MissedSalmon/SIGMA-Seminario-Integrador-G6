---
target: panel de control
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\alann\\OneDrive\\Desktop\\seminario\\SIGMA-Seminario-Integrador-G6\\frontend\\src\\app\\(admin)\\page.js"
target_fingerprint: "sha256:b3d1d1671160f6e5ef8fef579bfbcda6eb24200ad55cd5904f55d9edbc9a6126"
target_path: "C:\\Users\\alann\\OneDrive\\Desktop\\seminario\\SIGMA-Seminario-Integrador-G6\\frontend\\src\\app\\(admin)\\page.js"
timestamp: 2026-11-19T00-20-27Z
slug: src-app-admin-page-js
---
Method: dual-agent (A: revisión de diseño · B: detector y navegador)

# Crítica de diseño: Panel de control (src/app/(admin)/page.js)

## Puntaje de diseño (Nielsen) — 23/40, Aceptable
| # | Heurística | Puntaje | Problema principal |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Al recargar, los indicadores quedan con el valor viejo sin aviso |
| 2 | Relación con el mundo real | 2 | Sello «CREADA» vs referencia «Falta empezar»; «Sin tareas» como prioridad; decimales con punto |
| 3 | Control y libertad | 3 | Período sin costo; sin acciones destructivas |
| 4 | Consistencia | 2 | «8 tickets cerrados» junto a «9 ya cerrados»; «1 retirados» |
| 5 | Prevención de errores | 3 | Error de rango lejos de los campos |
| 6 | Reconocer antes que recordar | 2 | Explicaciones sólo en title; «5 sin plan» no dice cuáles |
| 7 | Flexibilidad y eficiencia | 2 | Gráficos e indicadores no llevan a ningún lado |
| 8 | Estética y minimalismo | 2 | ~12 bloques con el mismo peso; materiales duplicados |
| 9 | Recuperarse de errores | 2 | Error técnico en rojo sin reintento |
| 10 | Ayuda | 2 | No se explica cómo se calculan los indicadores |

## Especificidad
Mitad propia (talones de OT) y mitad intercambiable (grilla CoreUI desde «Situación actual»). Detector: 3 hallazgos menores de tamaño de letra (Encabezado.js:277, BarraLateral.js:154 y :166). Overlay: 2 de contraste (títulos de grupo del menú 3,4:1; «Actualizar» 4,25:1).

## Lo que funciona
1. Talones de OT abiertas con sello y referencia.
2. Separación «Situación actual» / «Según el período».
3. Gráficos honestos y accesibles (escala desde cero, modo tabla, nombres accesibles).

## Problemas prioritarios
- [P1] Color sin referencia escrita (regla 6): materiales en rojo y ámbar (page.js:411, 432, 439), error de OT en rojo (TalonesAbiertos.js:61). Comando: /impeccable clarify
- [P1] Cifras contradictorias y textos mal armados: 8 vs 9 cerrados, «1 retirados», «79.2 %», «Sin tareas» como prioridad. Comando: /impeccable clarify
- [P1] Jerarquía plana: falta una franja de pendientes; materiales duplicados; celular de ~9 pantallas. Comando: /impeccable layout
- [P1] Contraste: títulos de grupo del menú 3,4:1 y «Actualizar» 4,25:1. Comando: /impeccable colorize
- [P2] Mitad inferior sin el lenguaje del talonario; referencia con otras palabras que el sello; 3 de 22 OT sin criterio. Comando: /impeccable bolder

## Señales por persona
- Alex: nada lleva a su detalle; «sin plan» sólo con hover; sin atajos de período.
- Sam: explicaciones en title; sin aria-live al cambiar período; resumen de gráficos sólo en modo tabla; contraste del menú.
- Secretario: «Sin área» a la vista, torta de prioridad gris, «3 min» sospechoso, dato de prueba «se ve todo borroso».
- Técnico en celular: 14 de 24 elementos tocables bajo 44 px.

## Observaciones menores
«Personalizado» cortado en celular; tabla de materiales con scroll lateral; RankingAreasIncidencia y TiemposResolucion sin usar; estilo de títulos repetido; restarDias en UTC; «Exportar PDF» como único botón primario.

## Preguntas
1. ¿El panel debería abrir con «lo que necesita tu decisión hoy»?
2. ¿Cómo sería un indicador «sellado» o un faltante como «vale pendiente de firma»?
3. ¿Cada gráfico se ganó su lugar?
