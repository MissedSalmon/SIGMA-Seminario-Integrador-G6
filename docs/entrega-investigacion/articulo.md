# ¿La ciberseguridad es opcional para el ingeniero en sistemas?

### El rol profesional en temas de ciberseguridad: la actividad reservada al título, sus obligaciones y el caso de la Provincia del Chaco

**Trabajo de investigación — Unidad Temática 5: *Peritaje, arbitraje y tasaciones*** · **Grupo 6**
Seminario Integrador · UTN-FRRe · Resistencia, Chaco · agosto de 2026

**Autores:** Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro

---

> Versión en texto del artículo, para imprimir. La versión completa —con las figuras y la **presentación de diapositivas** incorporada— es `web/index.html`: se abre en el navegador y tiene arriba el enlace **«Ver como presentación»**, que entra al modo diapositivas (se navega con las flechas ← →).

---

La pregunta que da título a este trabajo admite una respuesta intuitiva y una respuesta correcta, y no coinciden. La intuitiva dice que la ciberseguridad es una especialización a la que un profesional se dedica si le interesa. La correcta, que reconstruimos a lo largo de estas páginas, es que en Argentina constituye una incumbencia reservada por el Estado al título de grado, con un régimen de responsabilidad asociado. La diferencia no es semántica: determina quién responde, con qué alcance y ante quién.

---

## ¿Por qué la ciberseguridad es asunto del profesional informático?

El punto de partida no es una opinión de la disciplina sino un acto administrativo. La Resolución 786/2009 del Ministerio de Educación establece, para cada título universitario de informática, las actividades cuyo ejercicio queda reservado a quien posee ese título. Entre las once que fija para el Ingeniero en Sistemas de Información, la novena es inequívoca:

> «Elaborar, diseñar, implementar y/o evaluar métodos y normas a seguir en cuestiones de seguridad de la información y los datos procesados, generados y/o transmitidos por el software.»
> — Resolución ME 786/2009, actividad profesional reservada n.º 9

El texto no recomienda ni sugiere: reserva. Una actividad reservada es una facultad que el Estado atribuye en exclusiva a un título y sustrae del resto, con la misma lógica por la cual la práctica de la medicina requiere el título habilitante correspondiente. La consecuencia inmediata es que la seguridad de la información deja de ser una elección profesional para convertirse en una competencia propia del título.

Dos incisos más adelante, la misma resolución incorpora la actividad n.º 11:

> «Realizar arbitrajes, peritajes y tasaciones referidas a las áreas específicas de su aplicación y entendimiento.»
> — Resolución ME 786/2009, actividad profesional reservada n.º 11

La coincidencia es significativa y organiza todo el trabajo: el mismo acto que reserva el diseño de la seguridad reserva también el peritaje. Sostenemos que no se trata de dos incumbencias independientes, sino de una misma competencia técnica aplicada en dos momentos distintos del ciclo de un incidente: antes, cuando se diseñan los controles; después, cuando se produce la prueba de lo ocurrido.

---

## ¿De dónde surge esa obligación?

La reserva no aparece de manera aislada: desciende de una cadena normativa breve y verificable. Su origen es el artículo 43 de la Ley 24.521 de Educación Superior, que somete a un régimen especial a las carreras cuyo ejercicio «pudiera comprometer el interés público, poniendo en riesgo de modo directo la salud, la seguridad y los bienes de los habitantes». Medicina e ingeniería civil integran ese conjunto; desde 2009, también las carreras de informática.

Para esas carreras, el Ministerio de Educación asume dos obligaciones: acreditarlas periódicamente y fijar las actividades reservadas a sus títulos. La Resolución 786/2009 cumple la segunda respecto de las licenciaturas en Ciencias de la Computación, Sistemas e Informática, y las ingenierías en Computación y en Sistemas de Información.

> ### Figura 1 — Cadena normativa que funda, en un mismo acto administrativo, la incumbencia en seguridad de la información y la incumbencia pericial.
> Lectura: el sentido es descendente. Una ley del Congreso delega en un ministerio la definición de las actividades reservadas; el ministerio las fija en 2009; de esa decisión derivan las dos incumbencias que estructuran este análisis.
>
> *Elaboración propia sobre la Ley 24.521 y la Resolución ME 786/2009.*

De la condición de actividad reservada se derivan tres consecuencias, ninguna de las cuales depende de la voluntad del profesional. La primera es negativa: su ejercicio por quien no posee el título configura ejercicio ilegal de la profesión. La segunda fija un estándar: a quien la ejerce se lo evalúa según lo que un profesional competente debía conocer, no según lo que efectivamente conocía. La tercera es personal: existe un deber de firma, y la firma compromete a la persona antes que a la organización que la emplea.

---

## ¿Con qué criterio se juzga al profesional?

El Código Civil y Comercial no menciona la ciberseguridad, pero contiene la regla que define el riesgo civil de la actividad. El artículo 1725 establece que «cuanto mayor sea el deber de obrar con prudencia y pleno conocimiento de las cosas, mayor es la diligencia exigible al agente». En términos prácticos, al ingeniero en sistemas no se lo juzga con el estándar de un usuario común, sino contra el estado del arte de su disciplina. Es la contrapartida de la reserva: a mayor competencia reconocida, mayor exigencia.

El artículo 1768 aporta una distinción decisiva. El derecho diferencia la obligación de medios de la obligación de resultado: la primera compromete a emplear la diligencia debida; la segunda, a garantizar un resultado determinado. El profesional liberal responde, por regla, por obligaciones de medios, salvo que haya comprometido un resultado concreto.

En materia de seguridad se asumen obligaciones de medios, no de resultado. «Implementaré los controles adecuados» y «el sistema será inviolable» son compromisos jurídicamente distintos, y sólo el primero resulta sostenible. Comprometer un resultado equivale a responder aun habiendo actuado de manera diligente.

Corresponde señalar un punto que el propio Código resuelve. El artículo 1757 prevé la responsabilidad objetiva por actividades riesgosas; su redacción excluye de ese régimen a la actividad del profesional liberal. No así, eventualmente, a la organización que opera el sistema, que no reviste esa condición. La distinción es relevante al momento de definir responsabilidades contractuales.

De la naturaleza de obligación de medios se sigue una consecuencia procesal: en un litigio no se prueba que el sistema no fue vulnerado, sino que se obró con diligencia. Y la diligencia se acredita con documentación: análisis de riesgos, decisiones de diseño registradas, evidencia de las pruebas realizadas y registros de auditoría. La ausencia de documentación equivale a la ausencia de defensa.

---

## ¿Dónde termina la prueba de seguridad y comienza el delito?

El artículo 153 bis del Código Penal reprime a quien «a sabiendas accediere por cualquier medio, sin la debida autorización o excediendo la que posea, a un sistema o dato informático de acceso restringido», con agravante cuando el sistema pertenece a un organismo público. La figura no exige ánimo de lucro ni de daño: el acceso no autorizado, por sí mismo, es típico. En consecuencia, el elemento que distingue una prueba de penetración legítima de un delito es la autorización previa, otorgada por quien tiene facultades para concederla.

**Prueba legítima.** Autorización escrita y previa. Alcance delimitado: direcciones, dominios y ventana temporal. Acuerdo de confidencialidad. Reporte responsable de los hallazgos.

Una segunda figura alcanza de manera directa al profesional: el artículo 156, que sanciona a quien, «teniendo noticia, por razón de su estado, oficio, empleo, profesión o arte, de un secreto cuya divulgación pueda causar daño, lo revelare sin justa causa». Quien administra una base de datos, opera un sistema o interviene como perito accede a información ajena en razón de su oficio; en consecuencia, queda comprendido en el tipo, con independencia de que exista o no un acuerdo de confidencialidad.

El plano ético refuerza lo anterior. El artículo 6 del Código de Ética del Consejo Profesional de Ciencias Informáticas establece que el profesional «no debe llevar a cabo actos reñidos con la buena técnica, aún cuando pudiera ser en cumplimiento de órdenes emanadas de autoridades, mandantes o comitentes». La norma invierte la jerarquía habitual: el cumplimiento de una orden no exime de responsabilidad cuando la orden contraría la buena técnica. Ante una instrucción de almacenar credenciales sin cifrar o de desactivar los registros de auditoría, el deber profesional consiste en negarse.

---

## ¿Qué exige la ley y qué queda en manos del profesional?

La Ley 25.326 de Protección de los Datos Personales, del año 2000, contiene el artículo que más directamente define el trabajo cotidiano en materia de seguridad:

> «…adoptar las medidas técnicas y organizativas que resulten necesarias para garantizar la seguridad y confidencialidad de los datos personales, de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan detectar desviaciones, intencionales o no, de información.»
> — Ley 25.326, artículo 9

La norma prohíbe, además, registrar datos en archivos que no reúnan condiciones técnicas de integridad y seguridad, y extiende el deber de confidencialidad más allá del fin de la relación laboral. Ahora bien, la ley exige «medidas adecuadas» sin especificar cuáles. Ese contenido lo determina, en los hechos, el profesional que diseña el sistema; y quien lo determina es quien responde si la elección resulta insuficiente. Es una delegación implícita de consecuencias considerables.

Por esa razón, el conocimiento de los estándares técnicos (ISO/IEC 27001 y 27002 para la gestión, la familia OWASP para el desarrollo web, ISO/IEC 27037 para la evidencia digital) deja de ser una cuestión de actualización y pasa a integrar el deber de diligencia: constituyen la referencia disponible de lo que resultaba razonable hacer en un momento dado.

Conviene situar estas normas en su contexto. Argentina no cuenta con una ley integral de ciberseguridad; el marco vigente es un conjunto de instrumentos dictados en momentos y por autoridades distintas.

> ### Figura 2 — Principales hitos normativos que enmarcan el ejercicio profesional en ciberseguridad, 1988–2026.
> Lectura: el eje representa el tiempo y el color, el órgano emisor: azul, leyes del Congreso; naranja, decretos del Poder Ejecutivo; verde, resoluciones y disposiciones técnicas. Dos observaciones: la densidad se concentra a partir de 2000, y el predominio se desplaza del Congreso hacia el Ejecutivo. La institucionalidad reciente se construyó por vía reglamentaria.
>
> *Fuente: compilado normativo del Centro Nacional de Ciberseguridad.*

---

## ¿Cuán extendido está el problema?

Un rol profesional se dimensiona también por la demanda que lo justifica. Para estimarla recurrimos a dos series oficiales: los reportes recibidos por la Unidad Fiscal Especializada en Ciberdelincuencia (UFECI) del Ministerio Público Fiscal, y los incidentes gestionados por el equipo nacional de respuesta.

> ### Figura 3 — Reportes de delitos informáticos recibidos por la UFECI, años calendario 2021–2024.
> Lectura: cada columna corresponde a un año y su altura, a las denuncias recibidas; en color destacado, el último año disponible. El dato relevante no es únicamente que 2024 sea el máximo, sino que 2023 registró una caída: la serie es creciente pero no monótona.
>
> *Referencia previa: entre abril de 2019 y marzo de 2020 la unidad recibió 2.581 reportes, y 14.583 en el período siguiente; ambos períodos son abril–marzo y por eso no se grafican junto a los años calendario. Fuente: UFECI, informe de gestión 2024.*

Entre 2019-2020 y 2024 los reportes pasaron de 2.581 a 34.468, con un incremento interanual del 21,1 % en el último tramo. La caída de 2023, de 32.395 a 28.456, obliga a la cautela: la serie mide denuncias, no hechos, y refleja también el grado de conocimiento y de confianza en el canal de denuncia. Un relevamiento local de la Universidad Champagnat y el municipio de Mendoza estimó que la mitad de los encuestados había sufrido un ciberdelito y que sólo el 8 % lo denunció; no es extrapolable al país, pero ilustra la magnitud del subregistro.

> ### Figura 4 — Modalidades reportadas a la UFECI durante 2024, sobre un total de 34.468 casos.
> Lectura: cada barra representa una modalidad y su extensión, la cantidad de reportes. El fraude en línea concentra cerca de dos tercios del total; las cinco restantes, en conjunto, no lo alcanzan.
>
> *Fuente: UFECI, informe de gestión 2024.*

El dato de mayor interés para la disciplina es el tercero: 2.877 accesos ilegítimos a cuentas, es decir, la figura del artículo 153 bis materializándose de manera cotidiana. En la mayoría de los casos no median técnicas sofisticadas, sino ingeniería social sobre los segundos factores de autenticación. Resta considerar el sector afectado.

> ### Figura 5 — Incidentes de ciberseguridad gestionados por el CERT.ar durante 2024, según sector afectado.
> Lectura: la barra completa representa los 438 incidentes del año; la porción destacada, la fracción que afectó a organismos estatales: seis de cada diez.
>
> *Fuente: CERT.ar, informe anual de gestión de incidentes 2024.*

La concentración en el sector público no es casual: el Estado es, simultáneamente, el mayor custodio de datos personales sensibles y el mayor operador de sistemas heredados. Es, además, empleador o comitente de buena parte de los profesionales formados en universidades públicas.

---

## ¿Tiene efecto real esta incumbencia?

Cabe una objeción razonable: una actividad reservada consignada en un anexo de 2009 carece de relevancia si ningún organismo la aplica. Para evaluarla, verificamos si esa reserva produce efectos concretos, y constatamos que sí.

La inscripción como perito ante la Justicia Nacional se tramita a través del COPITEC (Consejo Profesional de Ingeniería de Telecomunicaciones, Electrónica y Computación), creado por el Decreto-Ley 6070/58 y ratificado por la Ley 14.467. El Consejo admite en su nómina a los ingenieros y licenciados en sistemas, informática o computación, con matrícula vigente y sin sanciones. El peritaje informático ante la justicia, por lo tanto, está reservado a un conjunto acotado de títulos y su acceso lo controla un consejo profesional.

En una versión preliminar sostuvimos que la inscripción se valida verificando las incumbencias del título. La Acordada 02/2014 de la Corte Suprema establece lo contrario: la inscripción «sólo puede ser efectuada de conformidad con los títulos que acrediten fehacientemente los peticionantes» y «no corresponde validar inscripciones por incumbencias de las carreras». La validación opera por el título. Ello no debilita la tesis: la refuerza, en tanto es el título —definido por las actividades reservadas— el que habilita el acceso a la función pericial.

De la verificación se sigue una corrección adicional. Existe colegiación de alcance nacional para el profesional informático: el COPITEC. Lo que no existe es un consejo único; la matrícula se distribuye entre el COPITEC y los consejos provinciales, y cada profesional debe determinar cuál resulta competente según la jurisdicción. Este punto conduce al caso provincial.

---

## ¿Qué ocurre en la Provincia del Chaco?

La pregunta concreta es cuál es la matrícula que rige el ejercicio y el peritaje dentro de la provincia. Partimos de la hipótesis de que no existía un consejo que matriculara a los informáticos, dado que el sitio del COPIPACH (Consejo Profesional de la Ingeniería y Profesiones Afines) no menciona la disciplina. El examen de su ley, la 2955-C, invirtió esa hipótesis.

El artículo 1 comprende el ejercicio de «la ingeniería en todas las ramas y especialidades» y de las licenciaturas conexas no reguladas por ley especial. El artículo 31 atribuye al Consejo el gobierno de la matrícula de «todos los Ingenieros de todas las ramas de especialidad». El artículo 45, que organiza las especialidades en cuatro áreas, incluye un área de «otras» y precisa:

> «Este ordenamiento es meramente enunciativo y a medida que surjan nuevas especialidades, la Comisión Directiva decidirá a qué área se incorporará para la actividad colegiada.»
> — Ley 2955-C de la Provincia del Chaco, artículo 45

La Ingeniería en Sistemas de Información es una rama de la ingeniería, no está regulada por ley especial en la provincia, y la norma prevé de manera expresa la incorporación de especialidades. Cabe destacar que la 2955-C no es una ley antigua: reemplazó al consejo anterior y se sancionó cuando las carreras de sistemas llevaban décadas de dictado en el país. El legislador no las desconocía; no las nombró de manera específica, y dejó abierta la vía del artículo 45.

Esta lectura no es exclusiva de nuestro análisis. En Santa Fe, el Colegio de Ingenieros Especialistas (Ley 11.291) matricula de manera expresa el área de Sistemas: un consejo provincial de ingeniería que resolvió idéntica cuestión de modo afirmativo. La diferencia es que Santa Fe lo explicita y el Chaco lo deja implícito.

El argumento se completa con tres disposiciones. El artículo 4 de la ley chaqueña considera ejercicio profesional «la elaboración de informes, tasaciones, estudios, dictámenes, pericias, laudos y cualquier otro documento comprendido en las incumbencias de la profesión» ante los Tribunales de la Provincia; el artículo 7 exige matrícula para ejercer; y el artículo 8 califica de ejercicio ilegal la oferta de servicios propios de la incumbencia sin la habilitación correspondiente.

De ser correcta nuestra interpretación, la obligación de matriculación probablemente ya rija y se esté incumpliendo de hecho. El vacío no sería normativo, sino institucional: el COPIPACH no cuenta con un área de informática entre las que enumera su artículo 45, ni con un código de ética específico de la disciplina, ni con comunicación dirigida a los egresados de la carrera.

> ### La objeción más fuerte, y nuestra respuesta
> Puede sostenerse que el artículo 45 fue redactado con las ramas tradicionales de la ingeniería en mente, y que su cláusula de «otras especialidades» no contemplaba la informática. Es una objeción atendible, y el texto por sí solo no la refuta. Lo que se modifica, sin embargo, es la carga de la argumentación: dado que la ley comprende «todas las ramas y especialidades», considera las pericias como ejercicio profesional y prevé la incorporación de especialidades nuevas, corresponde explicar por qué no alcanzaría a la informática, y no a la inversa.

---

## ¿En qué roles profesionales se materializa?

Conviene traducir el análisis a las funciones concretas en las que el rol se ejerce, con la norma o el estándar que sostiene cada una.

**Tabla 1. Roles profesionales en ciberseguridad y su fundamento normativo o técnico en el ordenamiento argentino.**

| Rol | Función | Fundamento |
|---|---|---|
| Responsable de seguridad | Define la política, gestiona el riesgo y responde ante la dirección | DA 641/2021 |
| Respuesta a incidentes | Detecta, contiene, erradica y recupera el servicio | Disp. 3/2023 · CERT.ar |
| Prueba de penetración | Evalúa las defensas mediante ataque autorizado | Art. 153 bis, CP |
| Auditoría de sistemas | Verifica la existencia y el funcionamiento de los controles | Res. 786/2009, Lic. n.º 7 |
| Protección de datos | Vela por el cumplimiento en materia de datos personales | Ley 25.326 |
| **Perito informático forense** | **Produce la prueba digital para la justicia** | Res. 786/2009, Ing. n.º 11 · ISO 27037 |
| Desarrollo seguro | Incorpora la seguridad desde el diseño | Disp. 8/2021 · OWASP |

En todos estos roles, la prueba digital debe reunir dos propiedades que la tornan admisible ante un tribunal: integridad, entendida como la posibilidad de demostrar que el original no fue alterado, y una cadena de custodia documentada. Son las mismas propiedades que el profesional debió prever al diseñar el sistema. Un sistema sin registros de auditoría no sólo es inseguro: impide, tras un incidente, reconstruir y probar lo ocurrido.

La demanda de estos perfiles excede ampliamente la oferta disponible.

> ### Figura 6 — Brecha mundial de profesionales de ciberseguridad.
> Lectura: la barra completa representa los profesionales necesarios; la porción llena, los que existen; la porción restante, el déficit, cercano a la mitad de los puestos.
>
> *Fuente: ISC2 Cybersecurity Workforce Study. La edición 2025 añade que el 88 % de las organizaciones consultadas sufrió al menos una consecuencia de seguridad atribuida a la falta de personal capacitado.*

---

## ¿A qué conclusiones llegamos?
1. La incumbencia en ciberseguridad tiene fundamento legal expreso: la Resolución ME 786/2009, dictada bajo el artículo 43 de la Ley 24.521, la reserva al título de grado. No es una recomendación de buenas prácticas.
2. La reserva conlleva un régimen de responsabilidad: estándar de diligencia agravado (art. 1725, CCyC), tipo penal específico para la violación del secreto (art. 156, CP) y deber ético de apartarse de las órdenes contrarias a la buena técnica.
3. La obligación es de medios, no de resultado. No es posible garantizar la ausencia de incidentes; sí acreditar la aplicación del estado del arte, lo que exige documentación.
4. La ley delega en el profesional la definición del contenido técnico de las medidas (art. 9, Ley 25.326); en consecuencia, los estándares dejan de ser opcionales.
5. El principal ámbito de ejercicio es el sector público, que concentró el 61 % de los incidentes gestionados por el CERT.ar en 2024.
6. La incumbencia pericial produce efectos verificables: el acceso a la función de perito ante la justicia está reservado, por título, a un conjunto acotado de profesiones.
7. En la Provincia del Chaco la institución existe pero no alcanza a la disciplina en la práctica: la Ley 2955-C comprende a la ingeniería en todas sus ramas y obliga a matricularse, pero el COPIPACH no ha incorporado el área de informática.

De lo anterior se desprende una recomendación de alcance acotado: no se requiere la creación de un consejo nuevo. Bastaría con que el COPIPACH incorpore el área de informática que su propio artículo 45 habilita, con un código de ética específico, y con que la Facultad informe a sus egresados sobre el alcance probable de la matrícula provincial.

---

## ¿Qué queda por verificar?

Trabajamos sobre los textos normativos originales y sobre estadísticas oficiales, y adoptamos como criterio la transcripción literal de toda norma citada, a partir de su publicación oficial. La aplicación de ese criterio nos permitió detectar que tres citas centrales de una versión preliminar, incluida la que abría el trabajo, eran paráfrasis y no transcripciones; fueron corregidas.

Restan cuatro puntos abiertos. Primero, la interpretación de la Ley 2955-C es propia: si bien los artículos se transcriben del texto publicado y la comparación con Santa Fe la respalda, la confirmación corresponde al COPIPACH. Segundo, no pudimos determinar cuántos profesionales de sistemas están matriculados en la provincia, dado que el padrón publicado no consigna la especialidad. Tercero, el texto de la Ley 4250-J provincial se consultó a través de la prensa, por haberse sancionado poco antes del cierre. Cuarto, los datos de la brecha de profesionales provienen de una asociación del sector y se toman como orden de magnitud.

Finalmente, dejamos constancia de que este trabajo se elaboró con asistencia de un modelo de lenguaje para la búsqueda de normativa, la redacción, la construcción de las figuras y la revisión del borrador. La formulación de la pregunta, la tesis, la selección del caso provincial y la verificación de cada cita contra su fuente son de nuestra autoría.

---

## Fuentes

### Normativa que funda la incumbencia

Ley 24.521 de Educación Superior, art. 43. Resolución 786/2009 del Ministerio de Educación (actividades profesionales reservadas de los títulos de informática).

### Régimen de responsabilidad

Código Civil y Comercial de la Nación, arts. 1725, 1757 y 1768. Código Penal de la Nación, arts. 153, 153 bis, 155, 156 y 157 bis (texto ordenado por la Ley 26.388). Código de Ética del Consejo Profesional de Ciencias Informáticas (CABA), arts. 6, 27, 29 y 30. Ley 13.016 (Prov. de Buenos Aires) y normas equivalentes de Córdoba, Entre Ríos y Mendoza.

### Deberes concretos

Ley 25.326 de Protección de los Datos Personales y Decreto 1558/2001. Ley 25.506 de Firma Digital. Ley 27.411 (Convenio de Budapest). Decreto 941/2025 (Centro Nacional de Ciberseguridad). Decisión Administrativa 641/2021. Disposiciones 1/2021, 8/2021, 3/2023 y 1/2026 del CERT.ar y del CNC.

### Matrícula y peritaje

Decreto-Ley 6070/58, ratificado por la Ley 14.467 (COPITEC). Acordada 02/2014 de la Corte Suprema de Justicia de la Nación. Ley 2955-C de la Provincia del Chaco (arts. 1, 4, 7, 8, 31 y 45). Ley 11.291 de la Provincia de Santa Fe (Colegio de Ingenieros Especialistas).

### Fuentes estadísticas

UFECI, Ministerio Público Fiscal de la Nación, informe de gestión 2024. CERT.ar, informe anual de gestión de incidentes 2024. ISC2 Cybersecurity Workforce Study. Relevamiento de la Universidad Champagnat y la Municipalidad de Mendoza.

### Estándares técnicos

ISO/IEC 27001, 27002, 27032 y 27037. NIST Cybersecurity Framework. OWASP Top 10.

### Normativa que funda la incumbencia
- Ley 24.521 de Educación Superior, art. 43. Resolución 786/2009 del Ministerio de Educación (actividades profesionales reservadas de los títulos de informática).

### Régimen de responsabilidad
- Código Civil y Comercial de la Nación, arts. 1725, 1757 y 1768. Código Penal de la Nación, arts. 153, 153 bis, 155, 156 y 157 bis (texto ordenado por la Ley 26.388). Código de Ética del Consejo Profesional de Ciencias Informáticas (CABA), arts. 6, 27, 29 y 30. Ley 13.016 (Prov. de Buenos Aires) y normas equivalentes de Córdoba, Entre Ríos y Mendoza.

### Deberes concretos
- Ley 25.326 de Protección de los Datos Personales y Decreto 1558/2001. Ley 25.506 de Firma Digital. Ley 27.411 (Convenio de Budapest). Decreto 941/2025 (Centro Nacional de Ciberseguridad). Decisión Administrativa 641/2021. Disposiciones 1/2021, 8/2021, 3/2023 y 1/2026 del CERT.ar y del CNC.

### Matrícula y peritaje
- Decreto-Ley 6070/58, ratificado por la Ley 14.467 (COPITEC). Acordada 02/2014 de la Corte Suprema de Justicia de la Nación. Ley 2955-C de la Provincia del Chaco (arts. 1, 4, 7, 8, 31 y 45). Ley 11.291 de la Provincia de Santa Fe (Colegio de Ingenieros Especialistas).

### Fuentes estadísticas
- UFECI, Ministerio Público Fiscal de la Nación, informe de gestión 2024. CERT.ar, informe anual de gestión de incidentes 2024. ISC2 Cybersecurity Workforce Study. Relevamiento de la Universidad Champagnat y la Municipalidad de Mendoza.

### Estándares técnicos
- ISO/IEC 27001, 27002, 27032 y 27037. NIST Cybersecurity Framework. OWASP Top 10.
