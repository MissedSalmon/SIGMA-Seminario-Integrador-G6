# Estás obligado y no lo sabías

### El rol profesional en temas de ciberseguridad: qué le reservó el Estado argentino a nuestro título, qué obligaciones trae y qué pasa con ellas en el Chaco

**Trabajo de investigación — Unidad Temática 5: *Peritaje, arbitraje y tasaciones*** · **Grupo 6**
Seminario Integrador · UTN-FRRe · Resistencia, Chaco · agosto de 2026

**Autores:** Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro

---

> Este archivo se genera automáticamente desde `web/index.html`; no editarlo a mano.
> Las diapositivas de la exposición están en `web/exposicion.html` (se regeneran con `build_all.py`).

---

Cuando nos asignaron el tema, lo primero que hicimos fue preguntarnos entre nosotros por qué la ciberseguridad nos concierne. Salieron dos respuestas. Una técnica: porque sabemos de computadoras. Otra moral: porque está mal que roben datos. Las dos se caen con una repregunta: ¿y si un profesional decide que el tema no le interesa?

Buscando algo mejor terminamos en un anexo que ninguno de nosotros había leído. Lo que dice ahí cambió el trabajo, y de paso nos cambió la idea de qué firmamos cuando firmamos.

---

## Una línea escrita en 2009

La Resolución 786 del Ministerio de Educación es de mayo de 2009 y hace algo muy concreto: para cada título universitario de informática, enumera las tareas que sólo quien tiene ese título puede realizar. Son once para el Ingeniero en Sistemas de Información. La novena dice:

> «Elaborar, diseñar, implementar y/o evaluar métodos y normas a seguir en cuestiones de seguridad de la información y los datos procesados, generados y/o transmitidos por el software.»
> — Resolución ME 786/2009, actividad profesional reservada n.º 9

No dice «conviene». No dice «se recomienda». Dice que es una **actividad reservada**: una facultad que el Estado le atribuye a un título y le saca a todos los demás. Es la misma lógica por la que sólo un médico recibido puede operar.

Dos renglones más abajo, en la misma lista, está la número once:

> «Realizar arbitrajes, peritajes y tasaciones referidas a las áreas específicas de su aplicación y entendimiento.»
> — Resolución ME 786/2009, actividad profesional reservada n.º 11

Es decir: la misma resolución que nos reserva la seguridad de la información nos reserva el peritaje. Las dos cosas, juntas, en el mismo papel. Ese fue el hilo del que tiramos, y este artículo es lo que salió.

> ### La idea, en una línea
> Diseñar la seguridad de un sistema y explicarle a un juez qué pasó cuando falló **no son dos trabajos distintos**. Son el mismo, antes y después del incidente. Y el Estado nos los reservó a los dos en el mismo acto.

---

## De dónde sale esa reserva

La cadena es corta y cualquiera puede recorrerla. Empieza en el **artículo 43 de la Ley 24.521 de Educación Superior**, que separa a las carreras universitarias en dos grupos y pone en un régimen especial a las que «pudieran comprometer el interés público, poniendo en riesgo de modo directo la salud, la seguridad y los bienes de los habitantes». Medicina está ahí. Ingeniería civil también.

Para esas carreras, el Ministerio de Educación tiene que hacer dos cosas: acreditarlas cada tanto y fijar las actividades reservadas a sus títulos. Eso último es lo que hizo la Resolución 786/2009, que metió en ese régimen a Licenciatura en Ciencias de la Computación, Licenciatura en Sistemas, Licenciatura en Informática, Ingeniería en Computación e Ingeniería en Sistemas de Información. La nuestra.

> ### Figura 1 — La cadena normativa que funda la incumbencia profesional en seguridad de la información y, en el mismo acto administrativo, la incumbencia pericial.
> Cómo leerlo: se lee de arriba hacia abajo. Una ley del Congreso habilita a un ministerio a decidir qué tareas quedan reservadas a cada título; el ministerio lo hace en 2009; y de esa decisión salen las dos cajas de color del final. Todo el artículo está adentro de esas dos cajas.
>
> *Elaboración propia sobre la Ley 24.521 y la Resolución ME 786/2009.*

De que una tarea esté reservada se siguen tres cosas, y ninguna depende de que uno esté de acuerdo.

La primera es negativa: quien no tiene el título no debería ejercerla, y hacerlo es ejercicio ilegal de la profesión. La segunda es de vara: a quien la ejerce se lo mide contra lo que un profesional competente *debía* saber, no contra lo que sabía. La tercera es personal: existe un deber de firma, y la firma compromete a la persona antes que a la empresa que la emplea.

---

## Con qué vara nos miden

El Código Civil y Comercial no menciona la palabra ciberseguridad. Pero tiene la regla que define nuestro riesgo. El **artículo 1725** dice que «cuanto mayor sea el deber de obrar con prudencia y pleno conocimiento de las cosas, mayor es la diligencia exigible al agente». Traducido: al ingeniero en sistemas no lo juzgan con la vara del usuario común. Lo juzgan contra el estado del arte de su disciplina.

Es la contracara exacta de la reserva. Nos reconocen una competencia exclusiva y, por eso mismo, nos exigen más.

El **artículo 1768** trae la distinción que más nos sirvió. El derecho separa prometer un esfuerzo de prometer un resultado. Un médico se compromete a tratarte bien, no a curarte. Un transportista, en cambio, se compromete a que el paquete llegue. A lo primero se lo llama obligación de medios; a lo segundo, de resultado. El profesional liberal responde por medios, salvo que haya prometido un resultado concreto.

> ### Lo que hay que sacar de acá
> **En seguridad se contratan medios, nunca resultados.** «Voy a proteger el sistema aplicando estos controles» y «el sistema será inviolable» son dos frases jurídicamente opuestas, y sólo la primera se puede defender.
> El que promete que no lo van a hackear está firmando que se hace cargo aunque lo hackeen habiendo hecho todo bien.

Nos habíamos preguntado si operar un sistema con datos sensibles podría entrar en las «actividades riesgosas» del artículo 1757, que obligan a pagar aunque no haya culpa. Leyendo el 1768 completo encontramos que el propio Código lo resuelve: su última oración dice que «la actividad del profesional liberal no está comprendida en la responsabilidad por actividades riesgosas previstas en el artículo 1757». Al profesional no lo alcanza. A la empresa que opera el sistema, que no es un profesional liberal, tal vez sí. Conviene tenerlo presente antes de firmar un contrato.

Y como la obligación es de medios, lo que se prueba en un juicio no es que el sistema no haya sido vulnerado, sino que se obró con diligencia. Eso se prueba con papeles: análisis de riesgos, decisiones de diseño anotadas, evidencia de las pruebas hechas, registros de auditoría. **El que no documenta no tiene con qué defenderse.**

---

## Dónde termina el hacking ético

El **artículo 153 bis del Código Penal** reprime «al que a sabiendas accediere por cualquier medio, sin la debida autorización o excediendo la que posea, a un sistema o dato informático de acceso restringido». La norma no distingue intenciones: no pide ánimo de lucro ni de daño. Entrar «para ver si se puede» ya alcanza. Y la pena sube si el sistema es de un organismo público.

Lo único que separa una prueba de penetración legítima de un delito es un papel firmado por quien tiene facultades para firmarlo.

**Lo que la vuelve lícita.** Autorización escrita y previa. Alcance delimitado: qué direcciones, qué dominios, en qué horario. Acuerdo de confidencialidad. Reporte responsable de los hallazgos. Autorización dada por quien tiene poder para darla.

La otra figura que nos alcanza de lleno es el **artículo 156**, violación de secreto profesional. Castiga a quien, «teniendo noticia, por razón de su estado, oficio, empleo, profesión o arte, de un secreto cuya divulgación pueda causar daño, lo revelare sin justa causa». Es una norma vieja, pensada para médicos y confesores, y su redacción amplia captura sin esfuerzo a quien administra una base de datos. El administrador de sistemas, el que maneja la base, el soporte técnico y el perito ven datos ajenos por su oficio. Están adentro del tipo penal, y no hace falta firmar ningún acuerdo de confidencialidad para que el deber exista.

El código de ética de los consejos profesionales de informática agrega una cláusula que da vuelta la jerarquía laboral. El artículo 6 dice que el profesional «no debe llevar a cabo actos reñidos con la buena técnica, aún cuando pudiera ser en cumplimiento de órdenes emanadas de autoridades, mandantes o comitentes». Si la orden es guardar contraseñas sin cifrar, o apagar el registro de auditoría antes de una inspección, el deber no es cumplirla: es negarse. Sabemos que es más fácil escribirlo en un trabajo práctico que sostenerlo frente a un jefe, pero la norma no admite matices.

---

## Lo que la ley no dice, y terminamos definiendo nosotros

La Ley 25.326 de Protección de los Datos Personales es del año 2000, anterior a la nube y al teléfono inteligente. Y sin embargo tiene el artículo que más define nuestro trabajo diario:

> «…adoptar las medidas técnicas y organizativas que resulten necesarias para garantizar la seguridad y confidencialidad de los datos personales, de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan detectar desviaciones, intencionales o no, de información.»
> — Ley 25.326, artículo 9

El mismo artículo prohíbe guardar datos personales en archivos que no reúnan condiciones de integridad y seguridad. Y el artículo 10 impone un deber de confidencialidad que **sigue después de terminada la relación**: no se extingue con la renuncia ni con el fin del contrato.

> ### Lo importante es lo que la ley no dice
> No enumera las medidas. No fija un estándar técnico. No remite a ninguna norma ISO. Deja el contenido abierto, y ese vacío lo llena, en los hechos, el profesional que diseña el sistema.
> Es una delegación silenciosa y de consecuencias enormes: **el que define las medidas es el que responde si las eligió mal.**

Ese es el motivo por el cual conocer los estándares técnicos (ISO 27001 y 27002 para la gestión, OWASP para el desarrollo web, ISO 27037 para la evidencia digital) dejó de ser una cuestión de actualización profesional. Son la prueba disponible de qué era razonable hacer en un momento dado. Cuando un juez pregunte si se obró con diligencia, van a ser lo primero que se mire.

---

## Un mosaico, no un edificio

Argentina no tiene una ley integral de ciberseguridad. No existe un texto único al que uno pueda ir a buscar «las reglas». Lo que hay es un conjunto de piezas dictadas en momentos distintos y por autoridades distintas: algunas son leyes del Congreso, otras decretos del Ejecutivo, otras resoluciones de organismos técnicos.

> ### Figura 2 — Hitos normativos que enmarcan el ejercicio profesional en ciberseguridad, entre 1988 y 2026.
> Cómo leerlo: el eje es el tiempo y cada punto es una norma. El color dice quién la dictó: azul el Congreso, naranja el Poder Ejecutivo, verde los organismos técnicos. Hay dos cosas para mirar. Una es la densidad: casi todo se dictó después de 2000. La otra es el cambio de color hacia la derecha. Lo viejo son leyes; lo nuevo, decretos y disposiciones. La institucionalidad de los últimos años se armó sin pasar por el Congreso, y lo que se hace por decreto se deshace por decreto.
>
> *Fuente: compilado normativo del Centro Nacional de Ciberseguridad.*

Para el que ejerce eso significa que el deber de conocer se reparte. Está el **Código Penal**, con las figuras que ya vimos y otras que aplican al ransomware o a la caída de un servicio. Está la **Ley 25.326** para los datos. Está el **Decreto 941/2025**, que creó el Centro Nacional de Ciberseguridad. Y si se trabaja para el Estado, están los requisitos mínimos de la Decisión Administrativa 641/2021 y la guía de desarrollo web seguro del CERT.ar, que aplica de lleno a lo que hacemos en la carrera.

Hay algo que sí falta, y conviene decirlo: **no existe un deber general de avisarle a la gente cuando se le filtran los datos**. Existe para el sector público y por vía de guías, pero no como obligación frente a la persona afectada. El proyecto de reforma de la Ley 25.326 lo incorpora.

---

## Cuánto trabajo hay, y de qué tipo

Un rol profesional también se define por la demanda que lo convoca. Fuimos a las dos series oficiales que encontramos: los reportes que recibe la fiscalía nacional especializada en delitos informáticos y los incidentes que atiende el equipo nacional de respuesta.

> ### Figura 3 — Reportes de delitos informáticos recibidos por la UFECI, años calendario 2021 a 2024.
> Cómo leerlo: cada columna es un año y su altura son las denuncias recibidas. La columna azul oscuro es el último año disponible. Lo que importa no es sólo que 2024 sea el máximo, sino que 2023 bajó. La serie sube, pero no todos los años, y conviene desconfiar de quien la muestre como una recta.
>
> | Año | Reportes recibidos |
> |---|---|
> | 2021 | 22.364 |
> | 2022 | 32.395 |
> | 2023 | 28.456 |
> | 2024 | 34.468 |
>
> *Como referencia del punto de partida: entre abril de 2019 y marzo de 2020 la unidad había recibido 2.581 reportes, y 14.583 en el período siguiente. Esos dos primeros períodos van de abril a marzo, y por eso no los graficamos junto a los años calendario. Fuente: UFECI, informe de gestión 2024.*

De 2.581 reportes en 2019-2020 se pasó a 34.468 en 2024, el máximo histórico, con un aumento del 21,1 % sobre el año anterior. Pero 2023 fue un año de caída, de 32.395 a 28.456, y atribuir cada oscilación a un cambio en la conducta criminal sería imprudente: estos números miden también cuánta gente conoce el canal de denuncia y cuánta confía en él.

Conviene decirlo de una vez: la serie mide **denuncias, no hechos**. Un relevamiento de la Universidad Champagnat junto al municipio de Mendoza encontró que 5 de cada 10 encuestados había sufrido un ciberdelito y sólo el 8 % lo denunció, y que el 67 % ni siquiera sabía dónde hacerlo. Es un dato local y no se puede extrapolar al país, pero da una idea de cuánto se pierde en el camino.

> ### Figura 4 — Modalidades reportadas a la UFECI durante 2024, sobre un total de 34.468 casos.
> Cómo leerlo: cada barra es un tipo de delito y su largo, cuántas veces se denunció. Una sola modalidad, el fraude en línea, explica casi dos tercios de todo. Las otras cinco juntas no le llegan.
>
> | Modalidad | Casos | Porcentaje |
> |---|---|---|
> | Fraude en línea | 21.729 | 63,0 % |
> | Usurpación de identidad | 4.637 | 13,5 % |
> | Acceso ilegítimo a cuentas | 2.877 | 8,3 % |
> | Otras modalidades | 2.204 | 6,4 % |
> | Phishing | 1.563 | 4,5 % |
> | Acoso | 1.458 | 4,2 % |
>
> *Fuente: UFECI, informe de gestión 2024.*

El dato que más nos habla es el tercero: **2.877 accesos ilegítimos a cuentas**. Es la figura del artículo 153 bis ocurriendo casi ocho veces por día. Y detrás de la mayoría no hay nada sofisticado: hay alguien convenciendo a la víctima de que le pase el código de verificación que le llegó por mensaje. Es un dato incómodo para nuestra formación, porque la parte más demandada del oficio no es la más técnica.

Falta la otra mitad del cuadro. El CERT.ar registró 438 incidentes durante 2024, un 15,6 % más que en 2023.

> ### Figura 5 — Incidentes de ciberseguridad gestionados por el CERT.ar durante 2024, según sector afectado.
> Cómo leerlo: la barra entera son los 438 incidentes del año. La parte azul oscuro es la porción que golpeó a organismos del Estado. Seis de cada diez.
>
> | Sector | Incidentes | Porcentaje |
> |---|---|---|
> | Estado | 267 | 61 % |
> | Resto de los sectores | 171 | 39 % |
> | Total | 438 | 100 % |
>
> *Fuente: CERT.ar, informe anual de gestión de incidentes 2024.*

No es casualidad. El Estado es a la vez el mayor custodio de datos personales sensibles del país y el mayor operador de sistemas viejos que nadie actualizó. Es también el que emplea o contrata a buena parte de los que salimos de universidades públicas como la nuestra.

---

## La prueba de que esto no es teoría

Hasta acá todo lo que dijimos se apoya en textos. Podría objetarse, con razón, que una actividad reservada escrita en un anexo de 2009 no significa nada si nadie la mira nunca. Esa objeción nos la hicimos nosotros, y salimos a buscar si en algún lado esa línea produce un efecto concreto.

Lo encontramos, y está más cerca de lo que pensábamos.

Para inscribirse como **perito ante la Justicia Nacional**, un egresado de nuestra carrera tiene que pasar por el COPITEC, el Consejo Profesional de Ingeniería de Telecomunicaciones, Electrónica y Computación, creado por el Decreto-Ley 6070/58 y ratificado por la Ley 14.467. El Consejo admite en esa nómina a «ingenieros en sistemas, en informática o en computación, Analistas y Licenciados en Sistemas / Informática / Computación», entre otros títulos afines, con matrícula al día y sin sanciones.

Al principio contamos esto mal, y la corrección es más interesante que el error. Habíamos escrito que un empleado judicial abre el papel de incumbencias del título y busca ahí la actividad reservada n.º 11. No es así. La **Acordada 02/2014** de la Corte Suprema es explícita: la inscripción de peritos «sólo puede ser efectuada de conformidad con los **títulos** que acrediten fehacientemente los peticionantes», y «**no corresponde validar inscripciones por incumbencias de las carreras**». Lo que abre la puerta no es la línea del anexo: es el título entero.

> ### Por qué esto igual prueba lo que queríamos probar
> Que el peritaje informático ante la justicia esté **reservado a un conjunto cerrado de títulos**, y que un consejo profesional controle la entrada, es la comprobación de que la actividad reservada n.º 11 no es letra muerta. El mecanismo no es leer una línea; es exigir el título que esa línea define.
> Dicho más simple: la reserva y la matrícula son dos capas de la misma idea. La resolución de 2009 dice qué vale el título; COPITEC exige el título para dejarte peritar. Se sostienen entre sí.

De paso, eso nos obligó a otra corrección. Habíamos escrito que no existe colegiación nacional del profesional informático. No es cierto: existe COPITEC, con jurisdicción nacional. Lo que no hay es un consejo único. La matrícula se reparte entre COPITEC y los consejos provinciales, y quien ejerce tiene que averiguar cuál le toca.

De paso, eso nos obligó a corregirnos. Habíamos escrito que no existe colegiación nacional del profesional informático. No es cierto: existe COPITEC, con jurisdicción nacional. Lo que no hay es un consejo único. La matrícula se reparte entre COPITEC y los consejos provinciales, y quien ejerce tiene que averiguar cuál le toca.

Lo cual nos dejó una pregunta puntual, que es donde este trabajo se pone local.

---

## ¿Y acá?

La pregunta era cuál es la matrícula que rige para ejercer y peritar dentro de la Provincia del Chaco.

Llegamos con una hipótesis que nos parecía obvia: que no existe consejo profesional que matricule informáticos, porque el sitio del COPIPACH, el Consejo Profesional de la Ingeniería y Profesiones Afines, no menciona informática, sistemas ni computación por ningún lado. Fuimos al texto de su ley, la **Ley provincial 2955-C**, para confirmarlo. Y nos encontramos con lo contrario.

El artículo 1 somete a la ley al ejercicio de «la ingeniería **en todas las ramas y especialidades** y de las profesiones conexas de grado universitario (Licenciaturas), que no estén reguladas por ley especial». El artículo 31 le da al Consejo «el gobierno de la matrícula de **todos los Ingenieros de todas las ramas de especialidad**». Y el artículo 45, que reparte las especialidades en cuatro áreas, cierra con un inciso de «otras especialidades» y esta aclaración:

> «Este ordenamiento es meramente enunciativo y a medida que surjan nuevas especialidades, la Comisión Directiva decidirá a qué área se incorporará para la actividad colegiada.»
> — Ley 2955-C de la Provincia del Chaco, artículo 45

Ingeniería en Sistemas de Información es una rama de la ingeniería. No está regulada por ley especial en la provincia. Y la ley prevé expresamente qué hacer con las especialidades que van apareciendo.

Hay un detalle que lo vuelve más llamativo: la 2955-C no es una ley vieja. Reemplaza al antiguo Consejo de Agrimensores, Arquitectos e Ingenieros, y se sancionó cuando las carreras de sistemas llevaban décadas dictándose en el país, la nuestra incluida. No es que el legislador no supiera que existíamos. Simplemente no nos nombró, y dejó abierta la puerta del artículo 45 para que alguien lo hiciera después.

No somos los primeros en leerlo así, y eso importa porque somos estudiantes de sistemas interpretando una ley. En Santa Fe, el Colegio de Ingenieros Especialistas creado por la Ley 11.291 matricula a los egresados de las carreras de ingeniería y licenciaturas «de las Áreas Química, Mecánica, Eléctrica, **Sistemas**, entre otras». Un consejo provincial de ingeniería que resolvió la misma pregunta por la afirmativa. La diferencia es que Santa Fe lo dice y el Chaco lo deja implícito.

Y falta lo que termina de cerrar. El **artículo 4** de la ley chaqueña define qué cuenta como ejercicio profesional, y su inciso 4 incluye «la elaboración de informes, tasaciones, estudios, dictámenes, **pericias**, laudos y cualquier otro documento comprendido en las incumbencias de la profesión, sean éstos producidos ante los Tribunales de la Provincia». Es, palabra por palabra, la actividad reservada n.º 11. El **artículo 7** exige matrícula para ejercer. Y el **artículo 8** dice que quien ofrece servicios propios de la incumbencia sin estar habilitado «incurre en ejercicio ilegal de la profesión».

> ### Lo que se sigue de esto
> Si nuestra lectura es correcta, un ingeniero en sistemas que hoy firma una pericia informática en el Chaco **sin estar matriculado** podría estar en ejercicio ilegal de la profesión.
> No medimos cuánta gente lo sabe. Sí podemos decir que nosotros, que estamos por recibirnos de esta carrera en esta provincia, no lo sabíamos, y que no encontramos ninguna comunicación del Consejo ni de la facultad que lo mencione.

> ### La objeción más fuerte, y qué le contestamos
> Alguien puede responder que el artículo 45 se redactó mirando la ingeniería civil, la electromecánica y la higiene y seguridad, y que su inciso de «otras especialidades» pensaba en agrimensura o en ramas cercanas a la obra, no en informática. Que una cláusula sea abierta en el papel no significa que la institución la haya abierto en los hechos.
> Es una objeción válida y con el texto solo no la podemos refutar. Lo que sí cambió es de qué lado está la carga de la prueba. Ya no hay que demostrar que la ley alcanza a los informáticos: hay que explicar por qué no los alcanzaría, cuando dice «todas las ramas y especialidades», cuenta las pericias como ejercicio profesional y prevé cómo incorporar especialidades nuevas.

Entonces el vacío no es el que suponíamos. No falta la norma: la norma está y es amplia. Lo que falta es todo lo demás. El Consejo no tiene un área de informática entre las cuatro de su artículo 45, no tiene un código de ética escrito para la disciplina, y no hay comunicación alguna dirigida a los egresados de nuestra carrera.

**La obligación probablemente exista y nadie la esté cumpliendo**, porque la institución que la administra no mira hacia esta profesión.

---

## En qué se convierte todo esto

Vale la pena aterrizarlo en trabajos concretos. El que interviene en seguridad puede terminar ante un tribunal, y no como acusado sino como auxiliar de la justicia: como **perito de oficio**, cuando el juzgado lo sortea de una lista; como **perito de parte**, cuando lo contrata uno de los litigantes; como **árbitro**, en peleas por contratos de software; y como **tasador**, poniéndole precio a un desarrollo, a una base de datos o al daño que dejó un ataque.

**Tabla 1. Los trabajos concretos en los que se materializa el rol, y la norma o el estándar que sostiene a cada uno.**

| Rol | Qué hace | Qué lo sostiene |
|---|---|---|
| Responsable de seguridad | Define la política, gestiona el riesgo y responde ante la dirección | DA 641/2021 |
| Respuesta a incidentes | Detecta el ataque, lo contiene y recupera el servicio | Disp. 3/2023 · CERT.ar |
| Prueba de penetración | Ataca el sistema propio, con autorización, para encontrarle las fallas | Art. 153 bis, CP |
| Auditor de sistemas | Verifica que los controles existan y funcionen | Res. 786/2009, Lic. n.º 7 |
| Protección de datos | Vela por el cumplimiento en materia de datos personales | Ley 25.326 |
| **Perito informático forense** | **Produce la prueba digital que usa la justicia** | Res. 786/2009, Ing. n.º 11 · ISO 27037 |
| Desarrollador | Construye de forma segura desde el diseño | Disp. 8/2021 · OWASP |

En todos esos casos el trabajo consiste en producir prueba digital con dos propiedades que la vuelven admisible ante un juez: **integridad**, o sea que se pueda demostrar que nadie tocó el original, y una **cadena de custodia** documentada, el registro de quién tuvo la evidencia en su poder, cuándo y por qué.

Son exactamente las mismas propiedades que ese profesional debió diseñar en el sistema cuando lo construyó. Un sistema sin registros de auditoría no es sólo un sistema inseguro: es un sistema sobre el cual, después de un ataque, no se puede peritar nada. El que lo diseñó así no dejó una vulnerabilidad. Destruyó por anticipado la prueba de lo que fuera a pasar.

Y hay un dato que conviene tener a mano, porque explica por qué esto no es un problema del futuro. Hacen falta 10,2 millones de profesionales de ciberseguridad en el mundo y hay 5,5 millones.

> ### Figura 6 — La brecha mundial de profesionales de ciberseguridad.
> Cómo leerlo: la barra entera son los 10,2 millones que harían falta. La parte llena son los que existen. La rayada es el hueco: casi la mitad de los puestos no tiene quién los ocupe.
>
> | Concepto | Personas |
> |---|---|
> | Profesionales necesarios | 10,2 millones |
> | Profesionales activos | 5,5 millones |
> | Brecha | 4,8 millones |
>
> *Fuente: ISC2 Cybersecurity Workforce Study. El estudio 2025 agrega que el 88 % de las organizaciones consultadas sufrió al menos una consecuencia de seguridad atribuida directamente a la falta de personal capacitado.*

Hay trabajo, entonces. Y el que lo tome va a estar bastante solo.

---

## A qué llegamos
1. **Esto no es una recomendación de buenas prácticas.** La Resolución 786/2009, dictada bajo el artículo 43 de la Ley 24.521, le reserva a nuestro título elaborar, diseñar, implementar y evaluar los métodos de seguridad de la información. Está escrito, y no depende de que a uno le interese el tema.
2. **La reserva viene con un precio, y es la responsabilidad.** La vara es más alta por el artículo 1725 del Código Civil; el deber de secreto tiene su propio delito en el artículo 156 del Penal; y el código de ética obliga a desobedecer las órdenes contrarias a la buena técnica.
3. **Se contratan medios, no resultados.** Nadie puede garantizar que no habrá incidentes. Lo que sí hay que poder acreditar es haber aplicado el estado del arte, y eso se prueba únicamente con documentación.
4. **La ley nos delega la parte técnica.** El artículo 9 de la Ley 25.326 exige «medidas técnicas y organizativas» sin decir cuáles. El que las define es el que responde si eligió mal, y por eso los estándares dejan de ser opcionales.
5. **El principal ámbito de ejercicio es el Estado.** Seis de cada diez incidentes que atendió el CERT.ar en 2024 golpearon a organismos públicos, que son los mayores custodios de datos sensibles del país.
6. **La actividad reservada n.º 11 tiene efecto comprobable.** El peritaje informático ante la justicia está reservado a un conjunto cerrado de títulos, y un consejo nacional (COPITEC) controla la entrada. No deja peritar a cualquiera: exige el título que la reserva define.
7. **En el Chaco la institución existe, pero no mira hacia esta profesión.** La Ley 2955-C alcanza a «la ingeniería en todas las ramas y especialidades», hace obligatoria la matrícula bajo pena de ejercicio ilegal y cuenta las pericias como ejercicio profesional. Lo que falta no es la norma sino su aplicación.

De todo esto sale una recomendación concreta, y más barata que la que habíamos previsto. **No hace falta crear un consejo nuevo.** Alcanza con que COPIPACH abra el área de informática que su propio artículo 45 le permite abrir, con un código de ética escrito para la disciplina, y con que la facultad les avise a sus egresados que la matrícula provincial probablemente los alcance.

Cerramos con algo sobre nuestra propia formación. Empezamos este trabajo creyendo que la ciberseguridad era un área de especialización a la que uno se dedica si le interesa. Terminamos convencidos de que es una dimensión del ejercicio profesional de la que no se puede optar por salir. Y que, sin embargo, nadie nos la había mostrado escrita.

---

## Lo que no pudimos verificar

Trabajamos sobre los textos originales de las leyes y sobre estadísticas oficiales, y adoptamos una regla a mitad de camino: toda norma que va entre comillas se transcribe de su texto publicado, nunca de un resumen. La adoptamos tarde. Al aplicarla descubrimos que tres de las citas centrales del borrador, incluida la que abre este artículo, eran paráfrasis que circulan por internet y que habíamos tomado por literales. Están corregidas.

Quedan cuatro cosas abiertas, y preferimos decirlas.

**La lectura de la Ley 2955-C es nuestra.** Los artículos los transcribimos del texto que publica el propio Consejo, y la comparación con Santa Fe apunta en el mismo sentido, pero la conclusión de que la ley alcanza a Ingeniería en Sistemas de Información sigue siendo una interpretación. Sólo COPIPACH puede confirmarla. Conviene medir bien qué está en juego: no discutimos si existe una matrícula para nuestro título, porque existe y COPITEC la otorga para actuar ante la justicia nacional, sino cuál rige para ejercer dentro de la provincia.

**No sabemos cuántos informáticos están matriculados en el Chaco.** El padrón que publica el Consejo trae el número de matrícula pero no la especialidad, así que no pudimos medir si la matriculación de egresados de sistemas es nula, escasa o simplemente invisible.

**El texto de la Ley 4250-J lo tomamos de la prensa.** Se sancionó pocas semanas antes de que cerráramos el trabajo y no pudimos acceder a su publicación oficial en el Digesto provincial.

**Los datos de la brecha de profesionales no vienen del Estado.** Son de ISC2, una asociación del sector, que tiene interés en que el problema se vea grande. Los tomamos como orden de magnitud y no como medición.

Una aclaración final que nos parece que corresponde. Este trabajo se hizo con asistencia de un modelo de lenguaje, para buscar normativa, redactar, armar las figuras y revisar el borrador en busca de afirmaciones sin respaldo. La pregunta, la tesis, la decisión de mirar el Chaco y la verificación de cada cita contra su fuente son nuestras. Ese último punto no es un detalle: fue verificando como encontramos las paráfrasis.

---

## Fuentes

### Lo que funda el rol

Ley 24.521 de Educación Superior, artículo 43.

Resolución 786/2009 del Ministerio de Educación, del 26 de mayo de 2009. Actividades profesionales reservadas de los títulos de Licenciado en Ciencias de la Computación, Licenciado en Sistemas, Licenciado en Informática, Ingeniero en Computación e Ingeniero en Sistemas de Información.

### Responsabilidad

Código Civil y Comercial de la Nación, artículos 1725, 1757 y 1768.

Código Penal de la Nación, artículos 153, 153 bis, 155, 156, 157 bis, 173 inciso 16, 183 y 197, según el texto ordenado por la Ley 26.388.

Consejo Profesional de Ciencias Informáticas, asociación civil de la Ciudad Autónoma de Buenos Aires. *Código de Ética Profesional*, artículos 6, 27, 29 y 30, transcriptos de su texto publicado.

Ley 13.016 de la Provincia de Buenos Aires (CPCIBA). Normas equivalentes de Córdoba, Entre Ríos y Mendoza.

### Deberes concretos

Ley 25.326 de Protección de los Datos Personales y su Decreto reglamentario 1558/2001. Ley 25.506 de Firma Digital.

Ley 27.411, que aprueba el Convenio sobre Ciberdelito del Consejo de Europa. Ley 26.904 de grooming.

Decreto 941/2025, que crea el Centro Nacional de Ciberseguridad. Decisión Administrativa 641/2021. Disposiciones 1/2021, 8/2021, 3/2023 y 1/2026 del CERT.ar y del Centro Nacional de Ciberseguridad.

### Matrícula y peritaje

Decreto-Ley 6070/58, ratificado por la Ley 14.467, que crea el COPITEC, con jurisdicción nacional. Requisitos de inscripción como auxiliar de la justicia de la Nación publicados por el propio Consejo, año 2026. Acordada 02/2014 de la Corte Suprema de Justicia de la Nación, sobre validación de peritos por título.

Ley 2955-C de la Provincia del Chaco, «Ejercicio profesional de la ingeniería y creación del Consejo Profesional de la Ingeniería y Profesiones Afines», artículos 1, 2, 4, 7, 8, 31 y 45, transcriptos del texto publicado por el propio Consejo. Fuente: Dirección de Información Parlamentaria de la Legislatura del Chaco.

Ley 11.291 de la Provincia de Santa Fe, que crea el Colegio de Ingenieros Especialistas, citada como evidencia comparada.

### Números

Unidad Fiscal Especializada en Ciberdelincuencia (UFECI), Ministerio Público Fiscal de la Nación. *Informe 2024: casos y modalidades reportadas.*

CERT.ar. *Informe anual de gestión de incidentes de ciberseguridad 2024.*

Universidad Champagnat y Municipalidad de Mendoza, relevamiento sobre victimización y denuncia de ciberdelitos. ISC2, *Cybersecurity Workforce Study.*

### El Chaco

Constitución de la Provincia del Chaco, artículo 19. Ley provincial 4360 de hábeas data. Ley 3203-A de modernización de la administración. Ley 4250-J de protección digital, sancionada el 8 de julio de 2026, consultada a través de la prensa.

### Estándares

ISO/IEC 27001, 27002, 27032 y 27037. NIST *Cybersecurity Framework*. OWASP *Top 10*.

### Lo que funda el rol
- Ley 24.521 de Educación Superior, artículo 43.
- Resolución 786/2009 del Ministerio de Educación, del 26 de mayo de 2009. Actividades profesionales reservadas de los títulos de Licenciado en Ciencias de la Computación, Licenciado en Sistemas, Licenciado en Informática, Ingeniero en Computación e Ingeniero en Sistemas de Información.

### Responsabilidad
- Código Civil y Comercial de la Nación, artículos 1725, 1757 y 1768.
- Código Penal de la Nación, artículos 153, 153 bis, 155, 156, 157 bis, 173 inciso 16, 183 y 197, según el texto ordenado por la Ley 26.388.
- Consejo Profesional de Ciencias Informáticas, asociación civil de la Ciudad Autónoma de Buenos Aires. *Código de Ética Profesional*, artículos 6, 27, 29 y 30, transcriptos de su texto publicado.
- Ley 13.016 de la Provincia de Buenos Aires (CPCIBA). Normas equivalentes de Córdoba, Entre Ríos y Mendoza.

### Deberes concretos
- Ley 25.326 de Protección de los Datos Personales y su Decreto reglamentario 1558/2001. Ley 25.506 de Firma Digital.
- Ley 27.411, que aprueba el Convenio sobre Ciberdelito del Consejo de Europa. Ley 26.904 de grooming.
- Decreto 941/2025, que crea el Centro Nacional de Ciberseguridad. Decisión Administrativa 641/2021. Disposiciones 1/2021, 8/2021, 3/2023 y 1/2026 del CERT.ar y del Centro Nacional de Ciberseguridad.

### Matrícula y peritaje
- Decreto-Ley 6070/58, ratificado por la Ley 14.467, que crea el COPITEC, con jurisdicción nacional. Requisitos de inscripción como auxiliar de la justicia de la Nación publicados por el propio Consejo, año 2026. Acordada 02/2014 de la Corte Suprema de Justicia de la Nación, sobre validación de peritos por título.
- Ley 2955-C de la Provincia del Chaco, «Ejercicio profesional de la ingeniería y creación del Consejo Profesional de la Ingeniería y Profesiones Afines», artículos 1, 2, 4, 7, 8, 31 y 45, transcriptos del texto publicado por el propio Consejo. Fuente: Dirección de Información Parlamentaria de la Legislatura del Chaco.
- Ley 11.291 de la Provincia de Santa Fe, que crea el Colegio de Ingenieros Especialistas, citada como evidencia comparada.

### Números
- Unidad Fiscal Especializada en Ciberdelincuencia (UFECI), Ministerio Público Fiscal de la Nación. *Informe 2024: casos y modalidades reportadas.*
- CERT.ar. *Informe anual de gestión de incidentes de ciberseguridad 2024.*
- Universidad Champagnat y Municipalidad de Mendoza, relevamiento sobre victimización y denuncia de ciberdelitos. ISC2, *Cybersecurity Workforce Study.*

### El Chaco
- Constitución de la Provincia del Chaco, artículo 19. Ley provincial 4360 de hábeas data. Ley 3203-A de modernización de la administración. Ley 4250-J de protección digital, sancionada el 8 de julio de 2026, consultada a través de la prensa.

### Estándares
- ISO/IEC 27001, 27002, 27032 y 27037. NIST *Cybersecurity Framework*. OWASP *Top 10*.
