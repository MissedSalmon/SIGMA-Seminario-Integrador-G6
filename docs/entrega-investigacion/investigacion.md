# INVESTIGACIÓN — El rol profesional en temas de ciberseguridad

> Unidad Temática 5: *Peritaje, Arbitraje y Tasaciones* · **Grupo 6**
> Seminario Integrador — UTN-FRRe
> Última actualización: 2026-07-21 · entrega: agosto de 2026

> ⚠️ **Todas las citas normativas de este cuaderno están verificadas contra su texto publicado** (julio de 2026). Si agregás una cita nueva, transcribila de la fuente oficial: durante la revisión encontramos que varias que circulan por internet, y que dábamos por literales, eran paráfrasis.

---

## 0. Meta

- **Materia:** Seminario Integrador — UTN-FRRe
- **Grupo:** G6 — Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro
- **Tema asignado:** *El rol profesional en temas de ciberseguridad*
- **Alcance pedido:** panorama general + **qué pasa en Argentina** (normativa e institucionalidad) + **qué pasa en Chaco** (normativa e institucionalidad)

### Los archivos de la entrega

| Archivo | Qué es | Para qué se usa |
|---|---|---|
| **`web/index.html`** | **La fuente de verdad.** El artículo. Acá y sólo acá se corrige. Página de scroll vertical con las seis figuras. | Se muestra / se lee |
| **`web/exposicion.html`** | **Las diapositivas** (36), navegables con las flechas. Enlazadas desde el artículo con el vínculo «Exposición». | Se proyecta en la defensa |
| `articulo.md` | El artículo en markdown, **generado** desde el HTML. | Se imprime |
| `web/build_all.py` | Regenera `articulo.md` **y** `exposicion.html` desde `index.html`. | Mantenimiento |
| `investigacion.md` | Este cuaderno de trabajo. | De dónde salió todo |

> ### ⚠️ ORDEN DE SINCRONÍA
> `web/index.html` es la única base de la información. **Cada vez que se toca el artículo, hay que correr:**
>
> ```
> cd docs/entrega-investigacion/web && python3 build_all.py
> ```
>
> Eso actualiza el markdown y las diapositivas de una. **Nunca** editar `articulo.md` ni `exposicion.html` a mano: se pisan en la próxima generación. Las seis figuras del deck se extraen del artículo, así que no se desincronizan.

### Levantar en local

```
cd docs/entrega-investigacion/web
npm run dev          # → http://localhost:3001  (artículo)
```
El artículo tiene arriba el vínculo «Exposición» que abre `exposicion.html`. Ambos se abren también con doble clic.

### ⭐ El hallazgo que dio vuelta el trabajo (2026-07-21)

Llegamos al Chaco con la hipótesis de que **no existe consejo profesional que matricule informáticos**, basada en que el sitio de COPIPACH no menciona la disciplina. Al ir del sitio al **texto de la Ley 2955-C** la hipótesis se cayó:

- **Art. 1** — somete a la ley al ejercicio de «la ingeniería **en todas las ramas y especialidades**» y a las licenciaturas conexas «que no estén reguladas por ley especial».
- **Art. 31 inc. 1** — le da al Consejo el gobierno de la matrícula de «**todos los Ingenieros de todas las ramas de especialidad**».
- **Art. 45** — cuatro áreas de especialidad, la cuarta es «otras», y aclara: «Este ordenamiento es **meramente enunciativo** y a medida que surjan nuevas especialidades, la Comisión Directiva decidirá a qué área se incorporará».
- **Art. 4 inc. 4** — las **pericias** ante los Tribunales de la Provincia son ejercicio profesional.
- **Art. 7 y 8** — matrícula obligatoria; ejercer sin ella es **ejercicio ilegal de la profesión**.

**Conclusión nueva:** la ley probablemente ya alcanza al Ingeniero en Sistemas de Información, con matrícula obligatoria incluida. El vacío no es normativo sino **institucional**: COPIPACH no tiene área de informática, ni código de ética de la disciplina, ni comunicación hacia la carrera.

**Evidencia comparada:** el Colegio de Ingenieros Especialistas de Santa Fe (Ley 11.291) matricula expresamente el área de **Sistemas**. Un consejo provincial de ingeniería que resolvió la misma pregunta por la afirmativa.

**Lo que sigue pendiente:** confirmarlo con COPIPACH. Nuestra lectura de los artículos es una interpretación, no una respuesta institucional.

### ⭐⭐ El hallazgo que cierra el trabajo: COPITEC verifica la incumbencia n.º 11

Existe un consejo **nacional** que matricula computación e informática: el **COPITEC** (Consejo Profesional de Ingeniería de Telecomunicaciones, Electrónica y Computación), creado por **Decreto-Ley 6070/58** y ratificado por la **Ley 14.467**. Esto corrige una afirmación que el borrador daba por buena («no existe colegiación nacional del informático»): sí existe, lo que no hay es un consejo único.

Y lo más importante: para inscribirse como **perito ante la Justicia Nacional**, COPITEC admite a «ingenieros electromecánicos, electrónicos, en telecomunicaciones, **en sistemas, en informática o en computación, Analistas y Licenciados en Sistemas / Informática / Computación**», y exige dos cosas:

1. **Matrícula al día**, sin sanciones vigentes.
2. Entre la documentación pide el plan de estudios y los alcances del título, pero la **validación es por el título**, no por las incumbencias (Acordada 02/2014).

**Por qué importa tanto (versión corregida):** el borrador decía que un empleado judicial lee las incumbencias y busca la actividad n.º 11. Es FALSO. La **Acordada 02/2014** de la Corte es explícita: la inscripción se valida «de conformidad con los **títulos**… no corresponde validar inscripciones por incumbencias de las carreras». Lo que abre la puerta es el título entero. Igual comprueba la tesis: el peritaje informático está reservado a un conjunto cerrado de títulos y un consejo controla la entrada. La reserva define qué vale el título; COPITEC exige el título.

**Efecto sobre la pregunta del Chaco:** ya no es «¿existe alguna matrícula para nuestro título?» (existe) sino «¿cuál rige para ejercer y peritar dentro de la provincia?». COPIPACH tiene «el manejo exclusivo de la matrícula» en jurisdicción provincial, así que la respuesta probablemente sea COPIPACH, pero eso sigue siendo nuestra lectura.

### Otro hallazgo del proceso: tres citas eran paráfrasis

Al aplicar la regla «toda norma entre comillas se transcribe del texto publicado» descubrimos que **las citas centrales del borrador no eran literales**, incluida la que da título al artículo:

| Teníamos | Dice en realidad |
|---|---|
| «Elaborar, diseñar e implementar métodos de seguridad de información» | «Elaborar, diseñar, implementar **y/o evaluar métodos y normas a seguir** en cuestiones de seguridad de la información y los datos procesados, generados y/o transmitidos por el software» |
| «Realizar arbitrajes, peritajes y tasaciones en áreas de su especialidad» | «Realizar arbitrajes, peritajes y tasaciones **referidas a las áreas específicas de su aplicación y entendimiento**» |
| «No realizar actos contrarios a la buena técnica…» | «No debe llevar a cabo actos **reñidos** con la buena técnica, aún cuando pudiera ser en cumplimiento de órdenes **emanadas de autoridades, mandantes o comitentes**» |

Todas corregidas. Está declarado en la sección de Declaraciones del artículo.

### Las seis figuras (en el artículo-relato)

| # | Figura | Forma | Fuente |
|---|--------|-------|--------|
| 1 | Cadena normativa de la incumbencia | Diagrama de flujo | Elaboración propia |
| 2 | Línea de tiempo normativa 1988–2026 | Diagrama, color por quién dictó la norma | Compilado del CNC |
| 3 | Reportes UFECI 2021–2024 | Columnas, énfasis en 2024 | UFECI 2024 |
| 4 | Modalidades reportadas en 2024 | Barras, una por categoría | UFECI 2024 |
| 5 | Incidentes CERT.ar por sector | Medidor de una razón | CERT.ar 2024 |
| 6 | Brecha mundial de profesionales | Barra de hueco | ISC2 |

Nota: los datos de plataformas y de ataques semanales por país se relevaron pero no entraron en el artículo-relato; quedan en este cuaderno por si hacen falta.

Paleta categórica validada contra el fondo de las tarjetas. Cada figura trae su tabla de datos desplegable, que es lo que exige la regla de relieve cuando el color no llega al contraste mínimo.

### Estado de la investigación

| # | Bloque | Estado | Dónde quedó en el artículo |
|---|--------|--------|----------------------------|
| 1 | Marco conceptual (qué es ciberseguridad) | ✅ | § 3 |
| 2 | **El rol profesional: de dónde surge jurídicamente** | ✅ **núcleo** | § 4 |
| 3 | Régimen de responsabilidad (civil, penal, ética, técnica) | ✅ | § 5 |
| 4 | Marco normativo **nacional**, leído como deberes del profesional | ✅ | § 6 |
| 5 | Datos de contexto (UFECI, CERT.ar) | ✅ | § 7 |
| 6 | Situación en **Chaco** | ✅ | § 8 |
| 7 | Roles concretos y puente con el peritaje | ✅ | § 9 |
| 8 | Conclusiones | ✅ | § 10 |
| 9 | Puntos a validar | ❓ | § 11 del artículo · §10 de este documento |
| 10 | Aplicación al proyecto SIGMA | 🟢 redactado (§9 acá) | **fuera del artículo** — se va del tema |

Leyenda: ✅ listo · 🟢 redactado, validar · 🟡 parcial · ❓ pendiente de verificación

---

## 1. Idea fuerza (la tesis del trabajo)

> **En Argentina la ciberseguridad no es "una buena práctica opcional" del informático: es una actividad profesional reservada por ley a los títulos de grado en informática.**

La cadena normativa que lo sostiene es corta y verificable:

```
Ley 24.521 (Educación Superior), art. 43
        ↓  declara de interés público a las carreras que pueden
           poner en riesgo la salud, la seguridad y los bienes
Resolución ME 786/2009
        ↓  incluye a Informática/Sistemas en ese régimen y fija
           las ACTIVIDADES RESERVADAS al título
Actividad reservada n.º 9 (Ing. en Sistemas de Información):
   "Elaborar, diseñar, implementar y/o evaluar métodos y normas a seguir
    en cuestiones de SEGURIDAD DE LA INFORMACIÓN y los datos procesados,
    generados y/o transmitidos por el software"
Actividad reservada n.º 11:
   "Realizar ARBITRAJES, PERITAJES Y TASACIONES referidas a las áreas
    específicas de su aplicación y entendimiento"
```

De ahí se desprende todo lo demás: si la actividad está reservada, hay un **estándar de conducta exigible**; si hay estándar exigible, hay **responsabilidad civil, penal y ética** cuando no se cumple. Ese es el "rol profesional".

Y nótese el detalle que engancha con la Unidad Temática 5: **la misma resolución que nos reserva la seguridad de la información nos reserva el peritaje y el arbitraje**. Son las dos caras de la misma incumbencia.

---

## 2. Marco conceptual

### 2.1 Definiciones que conviene no mezclar

| Término | Qué abarca | Norma / estándar de referencia |
|---|---|---|
| **Seguridad de la información** | Protege la información en **cualquier soporte** (papel, digital, conversación). Preserva confidencialidad, integridad y disponibilidad. | ISO/IEC 27001 · 27002 |
| **Ciberseguridad** | Subconjunto: protege la información y los activos **en el ciberespacio** (redes, sistemas, servicios digitales). | ISO/IEC 27032 · NIST CSF |
| **Ciberdefensa** | Ciberseguridad aplicada a la **defensa nacional**. Ámbito militar. | Ley 23.554 (Defensa Nacional) |
| **Protección de datos personales** | Derecho de la persona sobre **sus** datos. La seguridad es *un medio* para garantizarlo, no el fin. | Ley 25.326 · Const. Chaco art. 19 |
| **Informática forense / peritaje** | Adquisición, preservación y análisis de evidencia digital con validez procesal. | ISO/IEC 27037 · Cód. Procesal |

> ⚠️ **Error frecuente en las exposiciones:** tratar "ciberseguridad" y "protección de datos" como sinónimos. Son cosas distintas con autoridades de aplicación distintas: en Argentina la ciberseguridad la conduce el **Centro Nacional de Ciberseguridad** (Jefatura de Gabinete) y los datos personales la **Agencia de Acceso a la Información Pública (AAIP)**.

### 2.2 La tríada CIA

- **Confidencialidad** — sólo accede quien debe.
- **Integridad** — el dato no se altera sin autorización (y si se altera, se detecta).
- **Disponibilidad** — el dato/servicio está cuando se lo necesita.

A esto se le suman dos propiedades que importan sobre todo para el **peritaje**:
- **Autenticidad / No repudio** — poder probar quién hizo qué. Es lo que habilita la Ley 25.506 de Firma Digital.
- **Trazabilidad (accountability)** — el registro de auditoría que después es *prueba*.

---

## 3. Diagnóstico: por qué esto dejó de ser un tema técnico

Datos oficiales argentinos, para abrir la exposición con números y no con opiniones:

| Indicador | Valor | Fuente |
|---|---|---|
| Reportes de delitos informáticos recibidos por la **UFECI** en 2024 | **34.468** (máximo histórico; **+21,1 %** interanual) | Ministerio Público Fiscal / UFECI |
| Modalidad más denunciada (2024) | **Fraude en línea: 21.729 casos (63 %)** | UFECI |
| Le siguen | Usurpación de identidad 4.637 (13,5 %) · Acceso ilegítimo 2.877 (8,3 %) · Phishing 1.563 (4,5 %) · Acoso 1.458 (4,2 %) | UFECI |
| Estafas y defraudaciones asistidas virtualmente (2025) | **50.155 hechos** (+2,5 % interanual) | Estadísticas criminales |
| Ciberdelitos sexuales contra menores (grooming, difusión de material de abuso) | **+74,1 %**: de 848 víctimas (2024) a **1.476** (2025) | Estadísticas criminales |
| Incidentes gestionados por **CERT.ar** en 2024 | **438** (+15 % vs. 379 en 2023) | Informe anual CERT.ar 2024 |
| De esos incidentes, cuántos golpearon al **Estado** | **267 = 61 % del total** | Informe anual CERT.ar 2024 |

**Lectura para la exposición (tres conclusiones, no siete):**

1. **El delito se mudó.** Mientras el delito físico baja o se estanca, el digital crece de forma sostenida.
2. **El blanco preferido es el Estado.** 6 de cada 10 incidentes registrados por el CERT nacional impactan en organismos públicos — que son, justamente, los que más datos sensibles custodian.
3. **Hay un enorme subregistro.** Los números oficiales son el piso, no el techo: la mayoría de las víctimas no denuncia (estudios del sector estiman que sólo una minoría de los hechos llega a una denuncia formal). ❓ *verificar el porcentaje exacto antes de citarlo en la presentación.*

---

## 4. Marco normativo — ARGENTINA

### 4.1 Mapa general

Argentina **no tiene una ley integral de ciberseguridad**. Lo que tiene es un mosaico: normas penales + normas de datos personales + normas administrativas para el sector público + adhesión a tratados internacionales.

| Norma | Año | Qué hace |
|---|---|---|
| **Ley 23.554** | 1988 | Defensa Nacional — base de la ciberdefensa |
| **Ley 24.059** | 1992 | Seguridad Interior |
| **Ley 25.326** | 2000 | **Protección de Datos Personales** (+ Decreto reglamentario 1558/2001) |
| **Ley 25.506** | 2001 | **Firma Digital** (+ Decreto 2628/2002) |
| **Ley 26.388** | 2008 | **Delitos Informáticos** — no es una ley aparte: *reforma el Código Penal* |
| **Ley 26.904** | 2013 | **Grooming** (art. 131 CP) |
| **Ley 27.411** | 2017 | Aprueba el **Convenio de Budapest** sobre Ciberdelito (Consejo de Europa) |
| **Ley 27.436** | 2018 | Modifica el art. 128 CP (material de abuso sexual infantil) |
| **Ley 27.590** | 2020 | Programa Nacional de Prevención y Concientización del Grooming |
| **Ley 27.699** | 2022 | Aprueba el protocolo de modernización del **Convenio 108** del Consejo de Europa (datos personales) |

**Decretos y decisiones administrativas clave**

| Norma | Año | Qué hace |
|---|---|---|
| Decreto 577/2017 | 2017 | Crea el **Comité de Ciberseguridad** |
| Decreto 50/2019 | 2019 | Asigna responsabilidad en ciberseguridad e **infraestructuras críticas** |
| **DA 641/2021** | 2021 | ⭐ **Requisitos Mínimos de Seguridad de la Información** para el Sector Público Nacional |
| DA 893/2022 | 2022 | Funciones de la Dirección Nacional de Ciberseguridad |
| **Decreto 941/2025** | 2025 | ⭐ Crea el **Centro Nacional de Ciberseguridad (CNC)** |

**Resoluciones y disposiciones**

| Norma | Año | Qué hace |
|---|---|---|
| Resolución 829/2019 | 2019 | Primera **Estrategia Nacional de Ciberseguridad** |
| Resolución 1523/2019 | 2019 | Define **Infraestructuras Críticas de Información** |
| Resolución 44/2023 | 2023 | **Segunda Estrategia Nacional de Ciberseguridad** |
| Resolución 15/2024 | 2024 | Lineamientos para uso seguro de herramientas digitales |
| Disposición 1/2021 | 2021 | Crea el **CERT.ar** |
| Disposición 8/2021 | 2021 | **Guía de Seguridad para Desarrollo de Aplicaciones Web** ← nos aplica directo |
| Disposición 1/2022 | 2022 | Modelo de Política de Seguridad de la Información |
| Disposición 3/2023 | 2023 | Guía de **Notificación y Gestión de Incidentes** |
| **Disposición 1/2026** | 2026 | ⭐ Reglamento técnico de **planes de contingencia y centros de datos alternos** |

### 4.2 Lo penal — Ley 26.388 y el Convenio de Budapest

La Ley 26.388 **no creó un código informático**: insertó las conductas digitales dentro del Código Penal existente. Los artículos que un profesional de sistemas debería saber de memoria:

| Artículo CP | Conducta |
|---|---|
| **153** | Violación de correspondencia / comunicación electrónica |
| **153 bis** | ⭐ **Acceso ilegítimo a un sistema informático** — el artículo que marca el límite del *hacking ético* |
| **155** | Publicación indebida de una comunicación electrónica |
| **156** | ⭐ **Violación de secreto profesional** — aplica a quien conoce un secreto *por razón de su oficio o profesión* |
| **157 bis** | Acceso ilegítimo / revelación indebida de **bancos de datos personales** |
| **173 inc. 16** | Defraudación mediante manipulación informática |
| **183, 2º párr.** | **Daño informático** (alterar, destruir o inutilizar datos, programas o sistemas) |
| **184** | Agravantes del daño (p. ej. sobre sistemas públicos) |
| **197** | Interrupción de comunicaciones |

La **Ley 27.411 (Convenio de Budapest)** aporta lo que el Código Penal solo no puede: **cooperación internacional**, preservación expeditiva de datos y un lenguaje común con otras jurisdicciones. Es indispensable, porque el ciberdelito casi nunca es territorial.

> 🔴 **Punto crítico para el rol profesional.** El art. 153 bis castiga el acceso a un sistema *sin autorización*. Un pentest sin **autorización previa, escrita y con alcance delimitado** no es "hacking ético": es un delito. La autorización escrita (*rules of engagement*) no es burocracia — es el elemento que separa al profesional del imputado.

### 4.3 Protección de datos personales — Ley 25.326

- **Autoridad de aplicación:** Agencia de Acceso a la Información Pública (AAIP).
- **Art. 9 — Seguridad de los datos:** obliga al responsable a adoptar **medidas técnicas y organizativas** que garanticen la seguridad y confidencialidad, e **prohíbe registrar datos en archivos que no reúnan condiciones técnicas de integridad y seguridad**.
- **Art. 10 — Deber de confidencialidad:** el obligado subsiste **aun después de finalizada la relación** con el titular del archivo.
- La ley es de **2000**: es preconstitucional respecto de la nube, el machine learning y el móvil. Hay un **proyecto de reforma integral** impulsado por la AAIP en el Congreso (inspirado en el RGPD europeo: notificación obligatoria de brechas, delegado de protección de datos, sanciones por facturación). ❓ *Verificar estado parlamentario a la fecha de la exposición.*

> 💡 **El art. 9 es el gancho profesional.** Habla de "medidas técnicas y organizativas" pero **no dice cuáles**. Quien las define, en los hechos, es el profesional informático — y por eso responde si elige mal.

### 4.4 Institucionalidad: la reorganización de 2025-2026

El cambio más importante y más reciente:

- **Decreto 941/2025** crea el **Centro Nacional de Ciberseguridad (CNC)** como **organismo descentralizado** en la órbita de la Secretaría de Innovación, Ciencia y Tecnología (Jefatura de Gabinete). Es el **órgano rector** en protección del ciberespacio de interés nacional, infraestructuras críticas de información y activos digitales estratégicos del Estado.
- El mismo decreto **renombra la Agencia Federal de Ciberseguridad como Agencia Federal de Ciberinteligencia (AFC)**, separando el rol de *inteligencia* del rol de *protección*.
- El **CERT.ar** (Disposición 1/2021) es el equipo de respuesta a incidentes: coordina, alerta y publica el informe anual.
- La **DA 641/2021 (Requisitos Mínimos de Seguridad de la Información)** es obligatoria para el Sector Público Nacional y **adherible voluntariamente** por otras organizaciones — dato importante para el capítulo Chaco (§6.4).
- La **Disposición 1/2026** endurece la exigencia sobre continuidad: inventario de sistemas clasificados por criticidad, análisis de impacto, **RTO/RPO** definidos, programa anual de pruebas, y un **centro de datos alterno a no menos de 1.500 km del principal, dentro del país, con certificación Tier 3 en 20 meses**. Plazo de adecuación: **180 días**.

### 4.5 Lo que Argentina todavía NO tiene

Esto vale tanto o más que lo que sí tiene, y da material para la conclusión:

- ❌ **Ley integral de ciberseguridad** (existe institucionalidad por decreto, no por ley del Congreso — lo que la hace reversible con otro decreto).
- ❌ **Obligación general de notificar brechas de datos** al titular afectado (existe para el sector público y por vía de guías, no como deber legal general).
- ❌ **Colegiación nacional obligatoria** del profesional informático (a diferencia de médicos, abogados o ingenieros civiles). Hay consejos **provinciales** y no en todas las provincias.
- ❌ **Certificación profesional obligatoria** en ciberseguridad. Las certificaciones (CISSP, CEH, OSCP, ISO 27001 LA) son de mercado, no legales.

---

## 5. ⭐ EL ROL PROFESIONAL — el núcleo del trabajo

### 5.1 De dónde sale, jurídicamente, que la ciberseguridad es "nuestra"

**Ley 24.521 de Educación Superior, art. 43.** Las carreras cuyo ejercicio "pudiera comprometer el interés público, poniendo en riesgo de modo directo la salud, la seguridad y los bienes de los habitantes" quedan bajo un régimen especial: acreditación obligatoria de la carrera **y actividades profesionales reservadas al título**.

**Resolución ME 786/2009 (26/05/2009)** incorporó a ese régimen a los títulos de:
- Licenciado en Ciencias de la Computación
- Licenciado en Sistemas / Sistemas de Información / Análisis de Sistemas
- Licenciado en Informática
- Ingeniero en Computación
- **Ingeniero en Sistemas de Información / Informática** ← el nuestro

Y fijó las **actividades reservadas**. Estas son las que importan para el tema:

| Título | # | Actividad reservada | Relevancia |
|---|---|---|---|
| **Ing. en Sistemas de Información** | 9 | **"Elaborar, diseñar, implementar y/o evaluar métodos y normas a seguir en cuestiones de seguridad de la información y los datos procesados, generados y/o transmitidos por el software"** | 🔴 núcleo |
| Ing. en Sistemas de Información | 10 | "Establecer métricas y normas de calidad y **seguridad de software**" | 🔴 núcleo |
| Ing. en Sistemas de Información | 4 | "Seleccionar arquitecturas tecnológicas de procesamiento y sistemas de comunicación de datos" | 🟠 diseño seguro |
| Ing. en Sistemas de Información | 8 | "Determinar y controlar normas técnicas de funcionamiento del software" | 🟠 |
| **Ing. en Sistemas de Información** | **11** | **"Realizar arbitrajes, peritajes y tasaciones referidas a las áreas específicas de su aplicación y entendimiento"** | 🔴 **Unidad Temática 5** |
| **Lic. en Sistemas** | 6 | **"Planificar, dirigir, realizar y/o evaluar los sistemas de seguridad en el almacenamiento y procesamiento de la información…"** | 🔴 núcleo |
| **Lic. en Sistemas** | 7 | **"Efectuar las tareas de Auditoría de los Sistemas Informáticos. Realizar arbitrajes, pericias y tasaciones relacionados con los Sistemas Informáticos"** | 🔴 Unidad 5 |
| Lic. en Sistemas | 5 | "Establecer métricas y normas de calidad y seguridad de software" | 🔴 |

> 🎯 **Este es el hallazgo central de la investigación.** La ciberseguridad no nos toca "porque sabemos de computadoras". Nos toca porque una resolución ministerial, dictada bajo el art. 43 de una ley nacional, dice que **diseñar los métodos de seguridad de la información es una actividad reservada a nuestro título**. Y en la misma lista, en el ítem siguiente, aparece el peritaje.

**Consecuencia práctica:** si es actividad reservada, entonces:
1. Alguien sin el título **no debería** ejercerla (ejercicio ilegal de la profesión).
2. Quien la ejerce responde con un **estándar agravado**, porque se presume que sabe.
3. Existe un **deber de firma**: el profesional responde personalmente por lo que dictamina.

### 5.2 Responsabilidad CIVIL del profesional informático

Código Civil y Comercial de la Nación:

| Artículo | Qué dice | Por qué nos importa |
|---|---|---|
| **1725** | *"Cuanto mayor sea el deber de obrar con prudencia y pleno conocimiento de las cosas, mayor es la diligencia exigible."* Si hay confianza especial, se pondera la condición especial del agente. | ⭐ La vara para un ingeniero en sistemas **no** es la del usuario común. Nos miden contra el estado del arte. |
| **1749** | Responde quien incumple una obligación o causa un daño no justificado. | Base general |
| **1757** | Responsabilidad **objetiva** por el riesgo o vicio de las cosas y de las **actividades riesgosas por su naturaleza o por los medios empleados**. | ❓ Discusión doctrinaria abierta: ¿un sistema que trata datos sensibles es "actividad riesgosa"? Si lo es, el profesional responde **sin culpa**. |
| **1768** | El profesional liberal responde por **culpa** (obligación de medios), salvo que haya prometido un **resultado concreto**. | ⭐ La distinción clave: "voy a securizar el sistema" (medios) ≠ "el sistema será inviolable" (resultado). **Nunca prometer resultado en seguridad.** |

> 💡 **Regla práctica para llevarse:** en ciberseguridad se contratan **obligaciones de medios**. Ningún profesional serio garantiza que no habrá incidente. Lo que garantiza es haber aplicado la diligencia y el estado del arte. Eso se prueba con **documentación**: análisis de riesgos, decisiones registradas, logs, pruebas.

### 5.3 Responsabilidad PENAL y el límite del hacking ético

Además de los artículos de §4.2, dos que apuntan directo al profesional:

- **Art. 156 CP — Violación de secreto profesional.** Alcanza a quien conoce un secreto "por razón de su estado, oficio, empleo, **profesión** o arte" y lo revela sin justa causa. El administrador de sistemas, el DBA, el soporte técnico y el perito ven datos ajenos **por su oficio**: están dentro del tipo penal.
- **Art. 157 bis CP.** Acceso ilegítimo a un banco de datos personales, o revelación indebida de información registrada en él. Agrava si el autor es funcionario público.

**El límite del pentesting / hacking ético:**

| Lo que lo hace lícito | Lo que lo vuelve delito |
|---|---|
| Autorización **escrita y previa** del titular del sistema | Empezar "y después aviso" |
| **Alcance delimitado** (IPs, dominios, ventana horaria) | Salirse del alcance acordado |
| Acuerdo de confidencialidad (NDA) | Publicar hallazgos sin autorización |
| Reporte responsable de vulnerabilidades | Vender/publicar el exploit |
| Autorización otorgada por **quien tiene poder** para darla | Autorización de alguien sin facultades |

### 5.4 Responsabilidad ÉTICA — el Código de Ética del CPCI

En el país existen consejos profesionales de ciencias informáticas de alcance **provincial** (Buenos Aires — Ley 13.016, Córdoba, Entre Ríos, Mendoza, entre otras). Su Código de Ética profesional establece deberes que se leen como una especificación técnica de la responsabilidad:

| Art. | Deber | Traducción a ciberseguridad |
|---|---|---|
| **6** | No debe llevar a cabo actos **reñidos** con la buena técnica, aún cuando pudiera ser en cumplimiento de **órdenes emanadas de autoridades, mandantes o comitentes** | 🔴 "Me lo pidió mi jefe" no es defensa. Si te ordenan guardar contraseñas en texto plano, el deber es negarse. |
| **8** | Responsabilidad personal por la **firma** de trabajos, dictámenes e informes | El informe de auditoría o el peritaje comprometen a la persona, no sólo a la empresa |
| **9** | No permitir que no profesionales ejerzan en su nombre | Prestar la firma es falta ética |
| **10** | Rechazar tareas que contraríen leyes y reglamentos | No implementar un tratamiento de datos ilegal |
| **25** | No ofrecer servicios que no se puedan cumplir | No vender ciberseguridad si no se tiene la competencia |
| **27** | Informar al cliente los **errores** y subsanar los propios | 🔴 Deber de comunicar el incidente. Ocultarlo es falta ética además de eventual delito |
| **28** | Atender con la mayor diligencia | Estándar de diligencia agravado (concuerda con CCyC 1725) |
| **29** | ⭐ **Secreto profesional obligatorio**; revelarlo sin justa causa daña a terceros y **constituye delito previsto en el Código Penal** | Es el puente explícito entre ética y art. 156 CP |
| **30** | Excepción: puede revelarse en **defensa propia**, como prueba insustituible | Único caso admitido |
| **4** | Contribuir a que la sociedad comprenda el significado de la profesión | Deber de divulgación y concientización |

**Referencias éticas internacionales complementarias:**
- **ACM/IEEE-CS Software Engineering Code of Ethics** — 8 principios: público, cliente, producto, juicio, gestión, profesión, colegas, sí mismo. El principio 1 es explícito: *el interés público está por encima del interés del cliente*.
- **ISC² Code of Ethics** (para certificados CISSP) — 4 cánones, el primero: *proteger a la sociedad, el bien común y la infraestructura*.

### 5.5 Los estándares que definen el "estado del arte"

Cuando la ley dice "medidas técnicas y organizativas adecuadas" (art. 9, Ley 25.326) o "diligencia exigible" (art. 1725 CCyC), **el contenido lo llenan los estándares**. Conocerlos es parte del rol:

| Estándar | Para qué sirve |
|---|---|
| **ISO/IEC 27001** | Sistema de Gestión de Seguridad de la Información (SGSI). Es certificable. |
| **ISO/IEC 27002** | Catálogo de controles (el "cómo" del 27001) |
| **ISO/IEC 27032** | Lineamientos específicos de ciberseguridad |
| **ISO/IEC 27037** | ⭐ Identificación, recolección y **preservación de evidencia digital** — la norma del perito informático |
| **NIST Cybersecurity Framework** | 5 funciones: Identificar, Proteger, Detectar, Responder, Recuperar |
| **OWASP Top 10 / ASVS** | Seguridad en desarrollo de aplicaciones web ← nuestro terreno directo |
| **DA 641/2021** | El "27001 argentino" para el sector público |

### 5.6 En qué roles concretos se materializa

| Rol | Qué hace | Vínculo normativo directo |
|---|---|---|
| **CISO / Responsable de Seguridad** | Define política, gestiona riesgo, responde ante la dirección | DA 641/2021 exige punto focal de ciberseguridad en el SPN |
| **Analista SOC / Respuesta a incidentes** | Detecta, contiene, erradica, recupera | Disp. 3/2023 (guía de notificación y gestión de incidentes) |
| **Pentester / Red Team** | Prueba defensas por autorización | Art. 153 bis CP marca el límite |
| **Auditor de sistemas** | Verifica cumplimiento y controles | Actividad reservada Lic. en Sistemas n.º 7 |
| **Delegado de Protección de Datos (DPO)** | Vela por el cumplimiento en materia de datos | Ley 25.326 (y figura reforzada en el proyecto de reforma) |
| **Perito informático forense** | Produce prueba digital para la justicia | ⭐ Actividad reservada Ing. Sistemas n.º 11 · ISO 27037 |
| **Desarrollador (¡también!)** | Construye seguro desde el diseño | Disp. 8/2021 · OWASP |

### 5.7 Puente con la Unidad Temática 5: peritaje, arbitraje y tasación

El tema del grupo conecta con la unidad por una vía muy concreta: **el rol profesional en ciberseguridad culmina, con frecuencia, en un estrado judicial**.

- El profesional actúa como **perito informático** — de oficio (sorteo de listas del Poder Judicial), de parte, o como **consultor técnico**.
- Su trabajo consiste en producir **prueba digital** con dos propiedades: **integridad** (hash, imagen forense, no alteración del original) y **cadena de custodia** documentada (ISO/IEC 27037).
- También puede intervenir como **árbitro o amigable componedor** en conflictos contractuales de software: incumplimientos de SLA, disputas por propiedad intelectual del código, litigios por incidentes de seguridad.
- Y en **tasación**: valuar activos intangibles — un desarrollo de software, una base de datos, el daño patrimonial provocado por un ataque.

> 🔗 **El cierre elegante para la exposición:** la actividad reservada n.º 9 (diseñar seguridad) y la n.º 11 (peritar y arbitrar) son **la misma profesión en dos momentos distintos**: antes del incidente y después del incidente.

---

## 6. Marco normativo e institucional — CHACO

### 6.1 Base constitucional: el habeas data chaqueño

La provincia tiene una protección **de raíz constitucional**, no meramente legal:

- **Constitución de la Provincia del Chaco (1957-1994), art. 19.** Reconoce a toda persona el derecho a conocer los datos sobre sí misma o sus bienes que consten en registros o sistemas **públicos oficiales o privados**, la finalidad para la que se usan, y a exigir su **actualización y rectificación**. Prohíbe expresamente su uso con **fines discriminatorios**.
- **Ley provincial 4360** (hoy en el Digesto como **L. 898-B**) reglamenta la **acción de habeas data**, estableciendo el procedimiento para hacer efectiva esa garantía del art. 19.

> 📌 Dato interesante para la exposición: Chaco **se anticipó** a la Nación. El art. 19 de la Constitución provincial es de la reforma de **1994**, la misma en la que se incorpora el habeas data a la Constitución Nacional (art. 43), pero la ley nacional de datos personales (25.326) recién llega en **2000**.

### 6.2 Modernización del Estado: Ley 3203-A

- **Ley 3203-A** — ley de **simplificación y modernización de la administración** provincial. Es el marco del programa **Chaco Digital** y de la plataforma **Tu Gobierno Digital (TGD)**.
- Define e institucionaliza conceptos que son directamente de nuestra materia: **identidad digital** (conjunto de atributos que permiten identificar a una persona en el ciberespacio administrativo) y **seguridad de la información** (políticas, normas, controles, procedimientos e implementación de hardware y software necesarios para preservar la **confidencialidad, integridad y disponibilidad** de los datos como **bien público de la administración**).
- Otorga plena **validez jurídica al domicilio electrónico** constituido en TGD: notificaciones, citaciones y comunicaciones cursadas allí son válidas.
- **Los municipios y organismos adhieren** por ordenanza o acta de adhesión con la Subsecretaría de Modernización del Estado.

> 🎯 Consecuencia profesional: cuando una ley provincial le da **validez jurídica** a una notificación electrónica, la disponibilidad e integridad de esa plataforma dejan de ser un problema de TI y pasan a ser un problema de **debido proceso**. Quien la diseña y la opera asume esa responsabilidad.

### 6.3 ⭐ Ley 4250-J (julio 2026) — Protección Digital

Es la novedad normativa más importante de la provincia en la materia, y es **de este mes**:

- Sancionada por la Cámara de Diputados del Chaco en la **9ª sesión ordinaria de julio de 2026** (aprobada el **08/07/2026**).
- **Modifica el Código de Faltas provincial (Ley 850-J) y el Código Procesal Penal (Ley 965-N).**
- **Conductas sancionadas** (art. 139 del Código de Faltas, según la información de prensa):
  1. Creación o difusión de **contenido generado por Inteligencia Artificial** (*deepfakes*) que dañe el honor o el patrimonio de una persona.
  2. Captura de imágenes en espacios públicos o privados **sin consentimiento** con fines de difusión.
  3. Instalación de **software espía, GPS ocultos o cámaras encubiertas** sin consentimiento.
  4. **Acoso** insistente y reiterado por cualquier medio, incluso bajo **identidad falsa**.
- **Sanciones:** hasta **90 días de arresto** o multa equivalente a **15 remuneraciones mensuales**; hasta **120 días de arresto** cuando ocurre en contexto de **violencia de género o intrafamiliar**. Agravantes cuando la víctima es niño, niña o adolescente.
- **Reformas procesales:** preservación de **evidencia digital**, medidas cautelares, mecanismos de **remoción de contenido** y reparación del daño, y **capacitación judicial** en cibercrimen.
- **Crea el "Instituto de la Denuncia Electrónica"**, para que la ciudadanía pueda denunciar adjuntando documentación digital.

> ❓ **A verificar antes de exponer:** el texto oficial de la Ley 4250-J en el Digesto de la Legislatura del Chaco. Los datos anteriores provienen de la cobertura periodística de la sesión y de comunicados legislativos; conviene contrastar la numeración de artículos y el monto exacto de las multas.

> 💡 **Por qué es relevante para nuestro tema:** la ley presupone que alguien sepa **preservar evidencia digital** y **peritar contenido sintético** (determinar si un video es un deepfake). Es decir: **crea demanda de perito informático por ley provincial.**

### 6.4 Institucionalidad chaqueña

| Actor | Rol |
|---|---|
| **ECOM Chaco S.E.** | Empresa provincial de software y telecomunicaciones. **Fue la primera organización de su tipo en el país en adherir a los Requisitos Mínimos de Seguridad de la Información (DA 641/2021)** ante la Dirección Nacional de Ciberseguridad (acta firmada el 14/06). Cuenta con peritos en ciberseguridad y análisis forense informático. |
| **Poder Judicial del Chaco** | También **adhirió a la norma de Requisitos Mínimos de Seguridad de la Información** de la DNC. |
| **División / Departamento Cibercrimen — Policía del Chaco** | Dentro del Departamento de Investigaciones Complejas (también citada como División Delitos Tecnológicos). Investiga y difunde prevención sobre estafas virtuales. |
| **Fiscalía especializada en delitos informáticos** | Ministerio Público Fiscal provincial: unidad especializada en ciberdelito. |
| **Subsecretaría de Modernización del Estado / Consejo de Transformación Digital** | Conduce Chaco Digital, TGD, firma digital de intendentes, agenda de sistemas e inversiones. |
| **Portal `tramites.chaco.gob.ar`** | Canal formal de denuncia por delitos informáticos. |

### 6.5 🔴 El vacío: no hay consejo profesional de informática en Chaco

Éste es probablemente el hallazgo más incómodo — y el mejor material para la conclusión:

| Consejo / Colegio | Ley provincial | ¿Alcanza a informática/sistemas? |
|---|---|---|
| **COPIPACH** — Consejo Profesional de Ingeniería y profesiones afines del Chaco | **Ley 2955-C** (delega el poder de policía del ejercicio y la ética profesional) | Matricula **ingenieros, arquitectos, agrimensores y afines**. Su marco (Decreto Ley 873/58) **no comprende** a los profesionales de informática/sistemas. ❓ |
| **Colegio Profesional de Técnicos del Chaco (CTEC)** | **Ley 2952-C** | Matricula **técnicos**. Es el encuadre más cercano para técnicos en informática, no para títulos de grado. |
| Consejo Profesional de Ciencias Informáticas | — | **No se identificó uno en Chaco.** Existen en Buenos Aires (Ley 13.016), Córdoba, Entre Ríos (COPROCIER), Mendoza, entre otras. |

**Qué implica esto en la práctica:**

1. El egresado chaqueño de Ingeniería en Sistemas **tiene actividades reservadas por la Resolución ME 786/2009** (nacional)…
2. …pero **no tiene en la provincia un consejo que lo matricule, que ejerza poder de policía sobre el ejercicio ni un Tribunal de Disciplina** que aplique un código de ética informático.
3. Resultado: la **ética profesional queda sin órgano de aplicación local**, y no hay barrera formal contra el ejercicio ilegal de la profesión en un área donde eso puede comprometer datos personales sensibles.

> ❓ **A validar antes de exponer:** confirmar con COPIPACH si aceptan matriculación de Ingenieros en Sistemas de Información (algunos consejos de ingeniería provinciales sí lo hacen, por conexidad). Es un llamado telefónico y transforma este punto de "vacío total" a "vacío parcial". **Es la verificación de mayor valor pendiente en todo el trabajo.**

---

## 7. Comparativa Nación / Chaco

| Dimensión | Argentina (Nación) | Chaco |
|---|---|---|
| **Rango normativo del derecho de fondo** | Ley (25.326, 26.388, 25.506) | Constitución provincial art. 19 + Ley 4360 (habeas data) |
| **Ley integral de ciberseguridad** | ❌ No existe | ❌ No existe |
| **Órgano rector de ciberseguridad** | ✅ Centro Nacional de Ciberseguridad (Dto. 941/2025) | 🟡 Función distribuida: ECOM + Subsecretaría de Modernización + Consejo de Transformación Digital |
| **Equipo de respuesta a incidentes (CERT/CSIRT)** | ✅ CERT.ar (Disp. 1/2021) | ❌ Sin CSIRT provincial propio identificado |
| **Estándar mínimo de seguridad obligatorio** | ✅ DA 641/2021 (Sector Público Nacional) | 🟢 Por **adhesión voluntaria**: ECOM (1ª del país en su tipo) y Poder Judicial |
| **Norma sobre IA / deepfakes** | ❌ Sin ley específica | ✅ **Ley 4250-J (julio 2026)** — la provincia se adelantó |
| **Persecución penal especializada** | UFECI (Min. Público Fiscal de la Nación) | ✅ Fiscalía especializada + División Cibercrimen policial |
| **Gobierno digital** | Trámites a Distancia, firma digital | ✅ Ley 3203-A · Tu Gobierno Digital (~230 trámites) |
| **Matriculación y ética del informático** | ❌ Sin colegiación nacional | 🔴 **Sin consejo profesional de informática en la provincia** |

**Síntesis en una línea:** *Chaco está bien en lo que le corresponde legislar como provincia (procedimiento, faltas, gobierno digital) y es innovador en la Ley 4250-J; el déficit está en la institucionalización de la profesión.*

---

## 8. Conclusiones

1. **El rol profesional en ciberseguridad tiene fundamento legal expreso en Argentina**, y no es una construcción retórica: la Resolución ME 786/2009, bajo el art. 43 de la Ley 24.521, reserva al título de Ingeniero en Sistemas de Información *"elaborar, diseñar e implementar métodos de seguridad de información"*.

2. **Esa reserva tiene un precio: responsabilidad.** El estándar de diligencia es agravado (art. 1725 CCyC), el deber de secreto tiene tipo penal propio (art. 156 CP) y el código de ética profesional obliga a desobedecer órdenes contrarias a la buena técnica (art. 6 CPCI).

3. **Argentina tiene normas, pero dispersas y sin ley marco.** Institucionalidad robusta y reciente (CNC, Dto. 941/2025; Disp. 1/2026) construida **por decreto**, no por ley: es potente pero reversible.

4. **El Estado es la principal víctima**: 61 % de los incidentes gestionados por CERT.ar en 2024 golpearon al sector público. Es también el mayor custodio de datos sensibles.

5. **Chaco tiene una base constitucional sólida y una ley de vanguardia.** El art. 19 de la Constitución provincial protege el habeas data desde 1994, y la Ley 4250-J (julio 2026) coloca a la provincia entre las primeras jurisdicciones argentinas en tipificar deepfakes y suplantación de identidad digital.

6. **Chaco tiene actores técnicos capaces**: ECOM fue la primera organización de su tipo en el país en adherir a la DA 641/2021, y el Poder Judicial provincial también adhirió. Hay capacidad instalada, no sólo normas.

7. **El déficit chaqueño es de institucionalización profesional**: no hay consejo de ciencias informáticas que matricule, controle el ejercicio y aplique un código de ética. Las incumbencias existen a nivel nacional pero **carecen de órgano de aplicación local**.

8. **La ciberseguridad y el peritaje son la misma incumbencia en dos tiempos.** El profesional que diseña los controles (actividad reservada n.º 9) es el mismo que después, ante la justicia, produce la prueba de lo que pasó (actividad reservada n.º 11). La Unidad Temática 5 y este tema no son vecinos: son continuos.

9. **Recomendación:** impulsar desde la universidad y desde los egresados la creación de un **Consejo Profesional de Ciencias Informáticas del Chaco** —o la incorporación formal de los títulos informáticos a un consejo existente—, siguiendo el modelo de Buenos Aires (Ley 13.016), Córdoba y Entre Ríos.

---

## 9. Aplicación a SIGMA (nuestro propio proyecto)

Cierre opcional pero potente: aplicar la investigación al sistema que el grupo está desarrollando.

| Obligación identificada | Cómo impacta a SIGMA |
|---|---|
| **Ley 25.326 art. 9** — medidas técnicas de seguridad | SIGMA guarda datos de técnicos, usuarios autorizados y responsables de área: son **datos personales**. Requiere control de acceso por rol, cifrado de credenciales y política de retención. |
| **Ley 25.326 art. 10** — deber de confidencialidad | Alcanza a todo el equipo, **incluso después** de terminada la cursada o el vínculo. |
| **Roles y trazabilidad** | Los 3 roles de SIGMA (Administrador / Técnico / Usuario Autorizado) ya implementan el principio de **mínimo privilegio**. Falta el **log de auditoría** — sin él, no hay evidencia ante un incidente. |
| **Disposición 8/2021 (DNC)** — Guía de Seguridad para Desarrollo de Aplicaciones Web + OWASP Top 10 | Es el estándar aplicable a nuestro stack. Validación de entradas, gestión de sesión, control de acceso a nivel de objeto. |
| **DA 641/2021** | Si SIGMA se desplegara en la facultad (organismo público), sería el marco de referencia esperable. |
| **Disposición 1/2026** — continuidad | Obliga a pensar **RTO/RPO** y respaldo. Para SIGMA: ¿cuánto puede estar caído el sistema de mantenimiento sin afectar la operación de la facultad? |
| **Art. 1768 CCyC** | Como equipo asumimos una **obligación de medios**, no de resultado. Se documenta con decisiones de diseño registradas — que es exactamente lo que hace `contexto.md`. |

---

## 10. ❓ Puntos a verificar antes de exponer

| # | Qué verificar | Por qué importa | Cómo |
|---|---|---|---|
| 1 | **Texto oficial de la Ley 4250-J** (numeración de artículos, montos de multa) | Los datos actuales vienen de prensa, no del boletín | Digesto de la Legislatura del Chaco / Boletín Oficial provincial |
| 2 | **Si COPIPACH matricula Ingenieros en Sistemas** | Cambia sustancialmente la conclusión §6.5 y §8.7 | Consulta directa a COPIPACH (Resistencia) |
| 3 | Estado parlamentario del **proyecto de reforma de la Ley 25.326** | Puede haberse sancionado; cambiaría §4.3 | Sitio de la AAIP / HCDN |
| 4 | Porcentaje real de **subregistro de denuncias** | Lo citamos como "la mayoría no denuncia"; hay que respaldarlo con cifra o quitarlo | Informe UFECI / estudio citado |
| 5 | Existencia de un **CSIRT provincial** en Chaco | Si existe, corrige la fila correspondiente en §7 | ECOM Chaco / Subsecretaría de Modernización |
| 6 | Informe anual **CERT.ar 2025** | Actualizaría los números de §3 | argentina.gob.ar → CNC → CERT.ar → Informes |

---

## 11. Fuentes

**Normativa nacional**
- Ley 24.521 de Educación Superior, art. 43
- Resolución ME 786/2009 (26/05/2009) — actividades reservadas, títulos de informática — [argentina.gob.ar](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-786-2009-154121/texto)
- Ley 25.326 de Protección de Datos Personales — [InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70368/texact.htm)
- Ley 26.388 de Delitos Informáticos
- Ley 27.411 — Convenio de Budapest sobre Ciberdelito
- Decreto 941/2025 — creación del Centro Nacional de Ciberseguridad — [InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/verNorma.do?id=422011)
- Decisión Administrativa 641/2021 — Requisitos Mínimos de Seguridad de la Información
- Disposición 1/2026 CNC — planes de contingencia y centros de datos alternos — [argentina.gob.ar](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-1-2026-425749/texto)
- Compilado de normativa de ciberseguridad — [Centro Nacional de Ciberseguridad](https://www.argentina.gob.ar/jefatura/innovacion-publica/direccion-nacional-ciberseguridad/normativa)
- Código Civil y Comercial de la Nación, arts. 1725, 1749, 1757, 1768
- Código Penal de la Nación, arts. 153, 153 bis, 155, 156, 157 bis, 173 inc. 16, 183, 184, 197

**Estadísticas**
- UFECI — Reportes de delitos informáticos 2024 (+21,1 %; 34.468 reportes) — [fiscales.gob.ar](https://www.fiscales.gob.ar/ciberdelincuencia/la-unidad-fiscal-especializada-en-ciberdelincuencia-informa-que-en-2024-se-registro-un-aumento-interanual-del-211-en-la-cantidad-de-reportes-de-delitos-informaticos/)
- Informe anual de gestión de incidentes CERT.ar 2024 — [PDF oficial](https://www.argentina.gob.ar/sites/default/files/2025/07/informe_cert-ar_2024.pdf)
- Chequeado — análisis de denuncias de estafas virtuales — [chequeado.com](https://chequeado.com/el-explicador/las-denuncias-de-estafas-virtuales-aumentaron-un-21-en-2024-cuales-son-los-tipos-de-fraude-mas-comunes/)

**Ética profesional**
- Código de Ética — Consejo Profesional de Ciencias Informáticas — [cpci.org.ar](https://www.cpci.org.ar/historia/c%C3%B3digo-de-%C3%A9tica)
- CPCIBA — Ley 13.016 (Provincia de Buenos Aires) — [cpciba.org.ar](https://www.cpciba.org.ar/ley13016)
- COPROCIER (Entre Ríos) — Código de ética profesional — [coprocier.org.ar](https://coprocier.org.ar/web/?page_id=51)
- ACM/IEEE-CS Software Engineering Code of Ethics and Professional Practice

**Chaco**
- Constitución de la Provincia del Chaco (1957-1994), art. 19
- Ley provincial 4360 / L. 898-B — acción de habeas data
- Ley 3203-A — simplificación y modernización de la administración — [Gobierno Abierto Chaco (PDF)](https://gobiernoabierto.chaco.gob.ar/wp-content/uploads/2023/07/L.3203.A.pdf)
- Ley 4250-J (08/07/2026) — Protección Digital; modifica Cód. de Faltas (Ley 850-J) y Cód. Procesal Penal (Ley 965-N) — [DataChaco](https://www.datachaco.com/649406-la-legislatura-aprobo-importantes-leyes-sobre-salud-deporte-y-privacidad) · [Diario Chaco](https://www.diariochaco.com/691544-proteccion-digital-proyecto-de-ley-propone-arrestos-y-multas-por-delitos-digitales)
- Ley 2955-C — COPIPACH — [copipach.org](https://copipach.org/matriculacion/)
- Ley 2952-C — Colegio Profesional de Técnicos del Chaco — [tecnicoschaco.org](https://tecnicoschaco.org/)
- ECOM Chaco: primera organización de su tipo en adherir a los Requisitos Mínimos de Seguridad de la Información — [argentina.gob.ar](https://www.argentina.gob.ar/noticias/por-primera-vez-una-empresa-adhirio-los-requisitos-minimos-de-seguridad-de-la-informacion)
- Poder Judicial del Chaco adhiere a los Requisitos Mínimos de Seguridad de la Información — [argentina.gob.ar](https://www.argentina.gob.ar/noticias/el-poder-judicial-de-chaco-adhirio-la-norma-de-los-requisitos-minimos-de-seguridad-de-la)
- Chaco Digital — [gobiernoabierto.chaco.gob.ar](https://gobiernoabierto.chaco.gob.ar/innovacion/chacodigital/)
- Denuncia de delitos informáticos — [tramites.chaco.gob.ar](https://tramites.chaco.gob.ar/tramite/Delitos-informaticos)

**Estándares**
- ISO/IEC 27001, 27002, 27032, 27037
- NIST Cybersecurity Framework
- OWASP Top 10 / ASVS
