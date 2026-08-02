# -*- coding: utf-8 -*-
"""
Genera exposicion.html (las diapositivas) A PARTIR de index.html (el artículo).

⚠️ ORDEN DE SINCRONÍA: las diapositivas se nutren del artículo. Si se toca
index.html (la base de la información), hay que volver a correr este script
para que la exposición quede actualizada:

    cd docs/entrega-investigacion/web && python3 build_expo.py

Las seis figuras NO se dibujan acá: se extraen tal cual del artículo, así que
nunca se desincronizan. El texto de cada slide es un resumen del artículo,
pensado para verse grande y proyectado.
"""
import re, pathlib

WEB = pathlib.Path(__file__).resolve().parent
ART = (WEB / "index.html").read_text(encoding="utf-8")

# ── tokens de color, tomados del artículo ────────────────────────────────
root = re.search(r":root\{(.*?)\}", ART, re.S).group(1)
TOK = {k: v.strip() for k, v in re.findall(r"(--[\w-]+):\s*([^;]+);", root)}

# ── figuras del artículo: nos quedamos con el .fig-body (el visual) ──────
FIGS = {}
for f in re.findall(r"<figure>.*?</figure>", ART, re.S):
    n = re.search(r'<span class="num">Figura (\d+)', f)
    body = re.search(r'(<div class="fig-body[^"]*">.*?</div>\s*</div>|<div class="fig-body[^"]*">.*?</div>)', f, re.S)
    # el fig-body puede tener anidamiento; tomamos desde fig-body hasta el cierre antes de <figcaption>
    fb = f[f.index('<div class="fig-body'):f.index("<figcaption")].strip()
    if n: FIGS[int(n.group(1))] = fb

# ── CSS de figuras del artículo, reusado tal cual ────────────────────────
style = re.search(r"<style>(.*?)</style>", ART, re.S).group(1)
FIGCSS = style[style.index("/* diagrama de la cadena */"):style.index("/* ---------------- tablas")]

def fig(n):
    return FIGS[n]

# ── colores por bloque (uno por integrante) ──────────────────────────────
BLOQ = {1:TOK["--c1"], 2:TOK["--c3"], 3:TOK["--c2"], 4:TOK["--c4"], 5:TOK["--s6"], 6:TOK["--c5"]}

S = []  # cada elemento es una slide (html interno)

def slide(html, bloque=None, kind=""):
    b = f' style="--bl:{BLOQ[bloque]}"' if bloque else ""
    cls = ("slide " + kind).strip()
    S.append(f'<section class="{cls}"{b}>{html}</section>')

def eyebrow(bloque, quien, tema):
    return (f'<div class="eyebrow"><span class="dot"></span>'
            f'<b>Integrante {bloque}</b><span class="sep">·</span>{quien}'
            f'<span class="grow"></span>{tema}</div>')

# ═══════════════════════ PORTADA ═══════════════════════
slide('''
<div class="cover">
  <p class="kick">Trabajo de investigación · Unidad Temática 5 · Grupo 6</p>
  <h1>Estás obligado<br>y no lo sabías</h1>
  <p class="sub">El rol profesional en ciberseguridad: qué le reservó el Estado a nuestro título, y qué obligaciones trae.</p>
  <p class="foot">UTN-FRRe · Seminario Integrador · agosto de 2026 &nbsp;·&nbsp; usá las flechas → para avanzar</p>
</div>''')

# ═══════════════════════ ÍNDICE ═══════════════════════
slide('''
<h2 class="big">Seis partes, seis voces</h2>
<div class="idx">
  <div><span>1</span><b>La línea que lo empezó todo</b>Una resolución de 2009 nos reservó dos tareas.</div>
  <div><span>2</span><b>De dónde sale y con qué vara</b>La cadena legal y la responsabilidad civil.</div>
  <div><span>3</span><b>El límite penal y la ética</b>Dónde termina el hacking ético.</div>
  <div><span>4</span><b>El panorama en números</b>Cuánto pasa y a quién le pasa.</div>
  <div><span>5</span><b>La prueba de que no es teoría</b>La justicia gatea el peritaje.</div>
  <div><span>6</span><b>El Chaco y el cierre</b>Una vuelta de tuerca local.</div>
</div>''')

# ═══════════ BLOQUE 1 ═══════════
slide(f'{eyebrow(1,"Apertura","La línea de 2009")}<div class="portada"><span class="num">1</span><h2>La línea que lo empezó todo</h2></div>', 1)

slide(f'''{eyebrow(1,"Apertura","La pregunta")}
<div class="mid">
<h2>¿Por qué la ciberseguridad nos concierne?</h2>
<p class="lead">Aparecen dos respuestas fáciles:</p>
<div class="two">
  <div class="cardq">«Porque sabemos de computadoras.»<span>respuesta técnica</span></div>
  <div class="cardq">«Porque está mal robar datos.»<span>respuesta moral</span></div>
</div>
<p class="lead">Las dos se caen con una repregunta: <b>¿y si un profesional decide que el tema no le interesa?</b></p>
</div>''', 1)

slide(f'''{eyebrow(1,"Apertura","Actividad reservada n.º 9")}
<div class="mid">
<p class="lead">La respuesta está en un anexo de la Resolución 786/2009. La actividad n.º 9 del Ingeniero en Sistemas dice:</p>
<blockquote class="huge">Elaborar, diseñar, implementar y/o evaluar métodos y normas a seguir en cuestiones de <mark>seguridad de la información</mark>.</blockquote>
<p class="lead">No dice «conviene». Es una <b>actividad reservada</b>: sólo ese título la habilita. Como sólo un médico recibido puede operar.</p>
</div>''', 1)

slide(f'''{eyebrow(1,"Apertura","Actividad reservada n.º 11")}
<div class="mid">
<p class="lead">Dos renglones más abajo, en la misma lista, la n.º 11:</p>
<blockquote class="huge">Realizar <mark>arbitrajes, peritajes y tasaciones</mark> referidas a las áreas específicas de su aplicación y entendimiento.</blockquote>
<div class="tesis">La misma resolución nos reservó las dos. Diseñar la seguridad y peritar el daño son <b>el mismo trabajo, antes y después del incidente.</b></div>
</div>''', 1)

slide(f'''{eyebrow(1,"Apertura","Figura · la cadena")}
<h3 class="figt">De la ley a las dos incumbencias</h3>
<div class="figwrap big">{fig(1)}</div>''', 1, "fig")

# ═══════════ BLOQUE 2 ═══════════
slide(f'{eyebrow(2,"Fundamento","De dónde sale")}<div class="portada"><span class="num">2</span><h2>De dónde sale, y con qué vara nos miden</h2></div>', 2)

slide(f'''{eyebrow(2,"Fundamento","Ley 24.521, art. 43")}
<div class="mid">
<h2>El Estado puede reservar tareas</h2>
<p class="lead">El artículo 43 de la Ley de Educación Superior pone en un régimen especial a las carreras que «pudieran comprometer el interés público, poniendo en riesgo de modo directo la salud, la seguridad y los bienes».</p>
<p class="lead">Están medicina e ingeniería civil. Y desde 2009, la nuestra. Para esas carreras, el Ministerio fija las <b>actividades reservadas al título</b>.</p>
</div>''', 2)

slide(f'''{eyebrow(2,"Fundamento","Tres consecuencias")}
<div class="mid">
<h2>Si la tarea está reservada…</h2>
<div class="three">
  <div><span>01</span><b>No sin título</b>Ejercerla sin el título es ejercicio ilegal de la profesión.</div>
  <div><span>02</span><b>Vara agravada</b>Te miden contra lo que <i>debías</i> saber, no lo que sabías.</div>
  <div><span>03</span><b>Deber de firma</b>La firma te compromete a vos, antes que a la empresa.</div>
</div>
<p class="lead">Ninguna depende de que estés de acuerdo.</p>
</div>''', 2)

slide(f'''{eyebrow(2,"Fundamento","Código Civil, art. 1725")}
<div class="mid">
<blockquote class="huge">Cuanto mayor sea el deber de obrar con <mark>pleno conocimiento de las cosas</mark>, mayor es la diligencia exigible al agente.</blockquote>
<p class="lead">Al ingeniero en sistemas no lo juzgan con la vara del usuario común: lo juzgan contra el <b>estado del arte</b> de su disciplina. Es la contracara de la reserva.</p>
</div>''', 2)

slide(f'''{eyebrow(2,"Fundamento","Código Civil, art. 1768")}
<div class="mid">
<h2>Medios, no resultados</h2>
<div class="two">
  <div class="cardq ok">«Voy a proteger el sistema aplicando estos controles.»<span>obligación de medios · defendible</span></div>
  <div class="cardq no">«El sistema será inviolable.»<span>obligación de resultado · indefendible</span></div>
</div>
<p class="lead">El que promete que no lo van a hackear se hace cargo <b>aunque lo hackeen habiendo hecho todo bien.</b></p>
</div>''', 2)

slide(f'''{eyebrow(2,"Fundamento","La regla práctica")}
<div class="mid center">
<blockquote class="mega">El que no documenta<br>no tiene con qué defenderse.</blockquote>
<p class="lead">Como la obligación es de medios, en un juicio no se prueba que el sistema no fue vulnerado, sino que se obró con diligencia. Y eso se prueba con papeles.</p>
</div>''', 2)

# ═══════════ BLOQUE 3 ═══════════
slide(f'{eyebrow(3,"Lo penal","El límite")}<div class="portada"><span class="num">3</span><h2>El límite penal y la ética</h2></div>', 3)

slide(f'''{eyebrow(3,"Lo penal","Código Penal, art. 153 bis")}
<div class="mid">
<h2>Dónde termina el hacking ético</h2>
<p class="lead">Acceder a un sistema sin autorización es delito, aunque no haya intención de dañar. Lo único que separa una prueba de penetración de un delito es un papel firmado.</p>
<div class="two">
  <div class="cardq ok"><b>Lícito</b>Autorización escrita y previa. Alcance delimitado. Reporte responsable.</div>
  <div class="cardq no"><b>Delito</b>Empezar y avisar después. Salirse del alcance. Publicar o vender los hallazgos.</div>
</div>
</div>''', 3)

slide(f'''{eyebrow(3,"Lo penal","Código Penal, art. 156")}
<div class="mid">
<h2>El secreto profesional</h2>
<blockquote class="huge">El que, por razón de su <mark>oficio, empleo o profesión</mark>, tuviere noticia de un secreto cuya divulgación pueda causar daño, y lo revelare sin justa causa.</blockquote>
<p class="lead">El admin, el que maneja la base, el soporte, el perito: ven datos ajenos por su oficio. Están dentro del tipo penal <b>sin firmar nada.</b></p>
</div>''', 3)

slide(f'''{eyebrow(3,"Lo ético","Código de ética, art. 6")}
<div class="mid center">
<blockquote class="mega">No hacer actos reñidos con la buena técnica,<br>aunque sea en cumplimiento de órdenes.</blockquote>
<p class="lead"><b>«Me lo pidió mi jefe» no es defensa.</b> Si la orden es guardar contraseñas sin cifrar o apagar la auditoría antes de una inspección, el deber es negarse.</p>
</div>''', 3)

slide(f'''{eyebrow(3,"Lo penal","Ley 25.326, art. 9")}
<div class="mid">
<h2>La ley te delega la parte técnica</h2>
<blockquote class="huge">…adoptar las <mark>medidas técnicas y organizativas</mark> que resulten necesarias para garantizar la seguridad y confidencialidad de los datos.</blockquote>
<div class="tesis">La ley no dice cuáles son esas medidas. Las define el profesional. <b>El que las define es el que responde si eligió mal.</b></div>
</div>''', 3)

# ═══════════ BLOQUE 4 ═══════════
slide(f'{eyebrow(4,"El panorama","Cuánto pasa")}<div class="portada"><span class="num">4</span><h2>El panorama: cuánto pasa y a quién</h2></div>', 4)

slide(f'''{eyebrow(4,"El panorama","Un mosaico")}
<h3 class="figt">Argentina no tiene una ley integral de ciberseguridad</h3>
<div class="figwrap big">{fig(2)}</div>
<p class="cap">Lo viejo son leyes; lo nuevo, decretos. La institucionalidad reciente se armó sin pasar por el Congreso.</p>''', 4, "fig")

slide(f'''{eyebrow(4,"El panorama","UFECI · denuncias")}
<h3 class="figt">Las denuncias por ciberdelito, año a año</h3>
<div class="figwrap big">{fig(3)}</div>
<p class="cap">34.468 denuncias en 2024, máximo histórico. Pero 2023 bajó: la serie sube, no todos los años. Y son denuncias, no hechos.</p>''', 4, "fig")

slide(f'''{eyebrow(4,"El panorama","UFECI · modalidades")}
<h3 class="figt">Una sola modalidad explica casi todo</h3>
<div class="figwrap big">{fig(4)}</div>
<p class="cap">El fraude en línea concentra casi dos tercios. Detrás no hay nada sofisticado: hay ingeniería social.</p>''', 4, "fig")

slide(f'''{eyebrow(4,"El panorama","CERT.ar · sector")}
<h3 class="figt">¿A quién le pegan?</h3>
<div class="figwrap big">{fig(5)}</div>
<p class="cap"><b>Seis de cada diez</b> incidentes del CERT nacional golpearon al Estado, el mayor custodio de datos sensibles y el principal ámbito donde vamos a ejercer.</p>''', 4, "fig")

# ═══════════ BLOQUE 5 ═══════════
slide(f'{eyebrow(5,"La prueba","No es teoría")}<div class="portada"><span class="num">5</span><h2>La prueba de que no es teoría</h2></div>', 5)

slide(f'''{eyebrow(5,"La prueba","La objeción")}
<div class="mid center">
<blockquote class="mega">«Una línea en un anexo de 2009 no significa nada si nadie la mira.»</blockquote>
<p class="lead">Nos hicimos esa objeción y salimos a buscar si en algún lado esa línea produce un efecto concreto. Lo encontramos.</p>
</div>''', 5)

slide(f'''{eyebrow(5,"La prueba","COPITEC")}
<div class="mid">
<h2>Para peritar ante la justicia, hay que pasar por un consejo</h2>
<p class="lead">El COPITEC, consejo nacional de ingeniería en electrónica, telecomunicaciones y computación, controla quién entra en la nómina de peritos. Sólo admite un conjunto cerrado de títulos: <b>ingenieros y licenciados en sistemas, informática o computación.</b></p>
<div class="tesis">El peritaje informático ante la justicia <b>no lo puede hacer cualquiera.</b> Está reservado a esos títulos, y un consejo lo controla.</div>
</div>''', 5)

slide(f'''{eyebrow(5,"La prueba","Acordada 02/2014 · el rigor")}
<div class="mid">
<h2>Nos corregimos, y la corrección es mejor que el error</h2>
<p class="lead">Al principio dijimos que un empleado judicial lee las incumbencias y busca la actividad n.º 11. No es así. La Acordada 02/2014 de la Corte es explícita:</p>
<blockquote class="huge">La inscripción se valida por los <mark>títulos</mark>… no corresponde validar inscripciones por incumbencias de las carreras.</blockquote>
<p class="lead">Lo que abre la puerta no es la línea: es el título entero. Y eso <b>refuerza</b> la tesis: la reserva define qué vale el título; COPITEC exige el título.</p>
</div>''', 5)

slide(f'''{eyebrow(5,"La prueba","Una corrección más")}
<div class="mid center">
<h2>Sí hay colegiación nacional</h2>
<p class="lead big">Habíamos creído que no existía. Existe: es COPITEC. Lo que no hay es un <b>consejo único</b>. La matrícula se reparte entre COPITEC y los consejos provinciales, y quien ejerce tiene que averiguar cuál le toca.</p>
<p class="lead">Eso nos dejó una pregunta puntual, y ahí el trabajo se pone local.</p>
</div>''', 5)

# ═══════════ BLOQUE 6 ═══════════
slide(f'{eyebrow(6,"El Chaco","La vuelta de tuerca")}<div class="portada"><span class="num">6</span><h2>¿Y acá, en el Chaco?</h2></div>', 6)

slide(f'''{eyebrow(6,"El Chaco","Ley 2955-C")}
<div class="mid">
<h2>Buscábamos un vacío y encontramos lo contrario</h2>
<p class="lead">La hipótesis era que ningún consejo chaqueño matricula informáticos. Fuimos al texto de la Ley 2955-C:</p>
<ul class="pts">
  <li>Alcanza a «la ingeniería <b>en todas las ramas y especialidades</b>» (art. 1 y 31).</li>
  <li>El listado de especialidades es «<b>meramente enunciativo</b>» y deja un área abierta (art. 45).</li>
</ul>
</div>''', 6)

slide(f'''{eyebrow(6,"El Chaco","La vuelta de tuerca")}
<div class="mid">
<ul class="pts">
  <li>El art. 4 cuenta las <b>pericias</b> como ejercicio profesional.</li>
  <li>Los arts. 7 y 8 hacen la matrícula <b>obligatoria</b>, bajo pena de ejercicio ilegal.</li>
</ul>
<div class="tesis alerta">La obligación probablemente ya exista, y nadie la esté cumpliendo. El vacío no es de la norma: es institucional. COPIPACH no tiene área de informática, ni código de ética de la disciplina, ni comunicación hacia la carrera.</div>
</div>''', 6)

slide(f'''{eyebrow(6,"El Chaco","Evidencia comparada")}
<div class="mid center">
<h2>Se puede: Santa Fe ya lo hace</h2>
<p class="lead big">El Colegio de Ingenieros Especialistas de Santa Fe (Ley 11.291) matricula expresamente el <b>área de Sistemas</b>. Un consejo provincial de ingeniería que resolvió la misma pregunta por la afirmativa.</p>
<p class="lead">La diferencia es que Santa Fe lo dice y el Chaco lo deja implícito.</p>
</div>''', 6)

slide(f'''{eyebrow(6,"El Chaco","Hay trabajo")}
<h3 class="figt">Hace falta gente, y falta mucha</h3>
<div class="figwrap big">{fig(6)}</div>
<p class="cap">Casi la mitad de los puestos de ciberseguridad del mundo están vacíos. Hay trabajo. Y el que lo tome va a estar bastante solo.</p>''', 6, "fig")

slide(f'''{eyebrow(6,"Cierre","La recomendación")}
<div class="mid">
<h2>No hace falta un consejo nuevo</h2>
<p class="lead">Alcanza con dos cosas:</p>
<div class="two">
  <div class="cardq"><b>COPIPACH</b>Que abra el área de informática que su propio artículo 45 le permite, con un código de ética de la disciplina.</div>
  <div class="cardq"><b>La facultad</b>Que les avise a sus egresados que la matrícula provincial probablemente los alcanza.</div>
</div>
</div>''', 6)

slide(f'''{eyebrow(6,"Cierre","")}
<div class="mid center">
<blockquote class="mega">Terminamos convencidos de que la ciberseguridad es una dimensión del ejercicio profesional de la que <b>no se puede optar por salir</b>.<br>Y que, sin embargo, nadie nos la había mostrado escrita.</blockquote>
</div>''', 6, "final")

slide(f'''{eyebrow(6,"Cierre","Honestidad")}
<div class="mid">
<h2>Lo que queda pendiente</h2>
<p class="lead">Nuestra lectura de la ley chaqueña es una interpretación, no una respuesta institucional. Sólo COPIPACH puede confirmarla.</p>
<p class="lead">Si nos preguntan «¿ustedes consultaron?», la respuesta honesta es: <b>leímos su ley y sostenemos que los alcanza; confirmarlo con ellos es el paso que sigue.</b> Eso es más fuerte que un sí dudoso.</p>
<p class="gracias">Gracias.</p>
</div>''', 6)

# ═══════════════════════ ENSAMBLADO ═══════════════════════
CSS = f'''
:root{{
  --page:{TOK["--page"]}; --card:{TOK["--card"]}; --ink:{TOK["--ink"]};
  --ink-2:{TOK["--ink-2"]}; --ink-3:{TOK["--ink-3"]}; --rule:{TOK["--rule"]};
  --page-2:{TOK["--card"]}; --rule-2:{TOK.get("--rule-2","#D8D5C9")};
  --c1:{TOK["--c1"]}; --c2:{TOK["--c2"]}; --c3:{TOK["--c3"]}; --c4:{TOK["--c4"]};
  --c5:{TOK["--c5"]}; --c6:{TOK["--c6"]};
  --s1:{TOK["--s1"]}; --s2:{TOK["--s2"]}; --s4:{TOK["--s4"]}; --s6:{TOK["--s6"]}; --s7:{TOK["--s7"]};
  --bar-emph:{TOK["--s6"]}; --bar-ctx:{TOK["--s2"]}; --bar-ctx-soft:#C9D9EC;
  --pill:{TOK["--pill"]}; --pill-ink:{TOK["--pill-ink"]};
  --alert:{TOK["--alert"]}; --ok:{TOK["--ok"]};
  --sans:"Helvetica Neue",Helvetica,Arial,"Liberation Sans",sans-serif;
  --serif:Georgia,"Times New Roman",Times,serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}}
*,*::before,*::after{{ box-sizing:border-box; }}
html,body{{ margin:0; height:100%; background:#0e0e0c; }}
body{{ font-family:var(--serif); color:var(--ink); -webkit-font-smoothing:antialiased; overflow:hidden; }}

.deck{{ position:fixed; inset:0; }}
.slide{{
  position:absolute; inset:0; display:none; flex-direction:column;
  background:var(--page); padding:clamp(1.6rem,3.2vh,3.2rem) clamp(2rem,6vw,7rem);
  --bl:var(--ink); overflow:hidden;
}}
.slide.on{{ display:flex; }}

/* barra de color del bloque, arriba */
.slide::before{{ content:""; position:absolute; top:0; left:0; right:0; height:8px; background:var(--bl); }}

.eyebrow{{ display:flex; align-items:center; gap:.7rem; font-family:var(--sans);
  font-size:clamp(.8rem,1.4vw,1.05rem); color:var(--ink-3); font-weight:600; letter-spacing:.01em; }}
.eyebrow b{{ color:var(--bl); font-weight:800; }}
.eyebrow .dot{{ width:.7rem; height:.7rem; border-radius:50%; background:var(--bl); }}
.eyebrow .sep{{ color:var(--rule-2); }}
.eyebrow .grow{{ flex:1; }}

h1,h2,h3{{ font-family:var(--sans); font-weight:800; letter-spacing:-.02em; margin:0; text-wrap:balance; line-height:1.03; }}
h1{{ font-size:clamp(3rem,9vw,8rem); }}
h2{{ font-size:clamp(2rem,5vw,4rem); line-height:1.08; }}
.mid{{ flex:1; display:flex; flex-direction:column; justify-content:center; gap:clamp(.7rem,1.8vh,1.8rem); min-height:0; }}
.mid.center{{ text-align:center; align-items:center; }}
.lead{{ font-size:clamp(1.15rem,2.2vw,2rem); line-height:1.38; color:var(--ink-2); margin:0; max-width:34ch; }}
.mid.center .lead{{ max-width:40ch; }}
.lead.big{{ color:var(--ink); max-width:34ch; }}
mark{{ background:color-mix(in srgb, var(--bl) 22%, transparent); color:inherit; padding:0 .12em; border-radius:3px; }}

/* portada de bloque */
.portada{{ flex:1; display:flex; flex-direction:column; justify-content:center; gap:1.5rem; }}
.portada .num{{ font-family:var(--sans); font-weight:800; font-size:clamp(5rem,16vw,15rem);
  line-height:.8; color:var(--bl); }}
.portada h2{{ font-size:clamp(2.4rem,6vw,5.5rem); max-width:20ch; }}

/* cover */
.cover{{ flex:1; display:flex; flex-direction:column; justify-content:center; gap:clamp(1rem,3vh,2.5rem); }}
.cover .kick{{ font-family:var(--sans); font-weight:700; color:var(--ink-3);
  font-size:clamp(.9rem,1.6vw,1.2rem); margin:0; }}
.cover .sub{{ font-size:clamp(1.3rem,2.8vw,2.4rem); color:var(--ink-2); line-height:1.35; margin:0; max-width:30ch; }}
.cover .foot{{ font-family:var(--sans); font-size:clamp(.85rem,1.4vw,1.05rem); color:var(--ink-3); margin:0; }}

blockquote{{ margin:0; }}
.huge{{ font-family:var(--serif); font-style:italic; font-size:clamp(1.5rem,3.2vw,2.9rem);
  line-height:1.22; border-left:.35rem solid var(--bl); padding-left:clamp(1rem,2vw,2rem); max-width:26ch; }}
.mega{{ font-family:var(--sans); font-weight:800; font-size:clamp(1.5rem,3.4vw,3rem);
  line-height:1.12; letter-spacing:-.02em; max-width:26ch; }}
.mega b{{ color:var(--bl); }}

.tesis{{ background:var(--card); border-left:.4rem solid var(--bl); border-radius:6px;
  padding:clamp(1rem,2.2vw,1.8rem) clamp(1.2rem,2.6vw,2.2rem);
  font-size:clamp(1.3rem,2.5vw,2.2rem); line-height:1.35; }}
.tesis b{{ color:var(--bl); }}
.tesis.alerta{{ border-left-color:var(--alert); }}
.tesis.alerta b{{ color:var(--alert); }}

.two{{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(1rem,2vw,1.6rem); }}
.three{{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(1rem,2vw,1.6rem); }}
@media (max-width:820px){{ .two,.three{{ grid-template-columns:1fr; }} }}
.cardq{{ background:var(--card); border-radius:8px; padding:clamp(1.1rem,2.4vw,2rem);
  font-family:var(--serif); font-style:italic; font-size:clamp(1.2rem,2.3vw,1.9rem); line-height:1.3; }}
.cardq span{{ display:block; margin-top:.8rem; font-family:var(--sans); font-style:normal;
  font-weight:700; font-size:clamp(.8rem,1.3vw,1rem); color:var(--ink-3); }}
.cardq b{{ font-style:normal; font-family:var(--sans); font-weight:800; display:block; margin-bottom:.5rem; color:var(--bl); }}
.cardq.ok{{ box-shadow:inset .35rem 0 0 var(--ok); }} .cardq.ok b{{ color:var(--ok); }}
.cardq.no{{ box-shadow:inset .35rem 0 0 var(--alert); }} .cardq.no b{{ color:var(--alert); }}

.three > div{{ background:var(--card); border-radius:8px; padding:clamp(1.1rem,2.2vw,1.8rem);
  font-family:var(--sans); }}
.three span{{ font-weight:800; font-size:clamp(1rem,1.6vw,1.3rem); color:var(--bl); }}
.three b{{ display:block; margin:.5rem 0 .5rem; font-size:clamp(1.2rem,2vw,1.7rem); }}
.three div :last-child{{ font-family:var(--serif); font-size:clamp(1rem,1.7vw,1.4rem); color:var(--ink-2); line-height:1.35; }}

ul.pts{{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:clamp(.9rem,2vh,1.6rem); }}
ul.pts li{{ position:relative; padding-left:2.2rem; font-size:clamp(1.3rem,2.5vw,2.2rem); line-height:1.35; }}
ul.pts li::before{{ content:""; position:absolute; left:0; top:.55em; width:.9rem; height:.9rem;
  border-radius:50%; background:var(--bl); }}
ul.pts b{{ color:var(--bl); font-weight:800; }}

.idx{{ flex:1; display:grid; grid-template-columns:1fr 1fr; gap:clamp(.8rem,1.6vw,1.4rem); align-content:center; }}
@media (max-width:820px){{ .idx{{ grid-template-columns:1fr; }} }}
.idx > div{{ background:var(--card); border-radius:8px; padding:clamp(1rem,2vw,1.6rem);
  font-family:var(--sans); display:grid; grid-template-columns:auto 1fr; gap:.3rem 1rem; align-items:baseline; }}
.idx span{{ grid-row:span 2; font-weight:800; font-size:clamp(1.6rem,3vw,2.6rem); color:var(--ink-3); }}
.idx b{{ font-size:clamp(1.1rem,1.9vw,1.5rem); }}
.idx div > :last-child{{ grid-column:2; font-family:var(--serif); font-size:clamp(.95rem,1.6vw,1.25rem); color:var(--ink-2); }}
.big{{ font-size:clamp(2rem,5vw,4rem); }}

/* figuras */
.figt{{ font-size:clamp(1.5rem,3.2vw,2.6rem); margin-bottom:clamp(1rem,2vh,1.6rem); }}
.figwrap{{ flex:1; display:flex; align-items:center; }}
.figwrap .fig-body{{ width:100%; }}
.figwrap.big{{ font-size:clamp(15px,1.5vw,22px); }}
.cap{{ font-family:var(--sans); font-size:clamp(1rem,1.8vw,1.5rem); color:var(--ink-2);
  line-height:1.4; margin:clamp(.8rem,2vh,1.4rem) 0 0; max-width:60ch; }}
.cap b{{ color:var(--ink); font-weight:800; }}

.gracias{{ font-family:var(--sans); font-weight:800; font-size:clamp(1.6rem,3vw,2.6rem);
  color:var(--bl); margin-top:1rem; }}
.slide.final .mega b{{ color:var(--c5); }}

{FIGCSS}

/* las figuras del artículo escalan al alto de la slide */
.figwrap .cols{{ height:clamp(16rem,40vh,30rem); }}
.figwrap .tlwrap{{ width:100%; }}
.figwrap .tl{{ min-width:0; }}

/* chrome */
.bar{{ position:fixed; top:0; left:0; height:8px; background:rgba(0,0,0,.28); z-index:60; transition:width .3s; }}
.hud{{ position:fixed; bottom:1rem; right:1.2rem; z-index:60; display:flex; gap:.5rem; align-items:center;
  font-family:var(--sans); }}
.hud button{{ font-family:var(--sans); font-size:.85rem; font-weight:700; background:var(--card);
  color:var(--ink-2); border:1px solid var(--rule); border-radius:6px; padding:.4rem .7rem; cursor:pointer; }}
.hud button:hover{{ color:var(--ink); }}
.count{{ font-size:.9rem; color:var(--ink-3); font-variant-numeric:tabular-nums; padding:0 .3rem; }}
.hint{{ position:fixed; bottom:1rem; left:1.2rem; z-index:60; font-family:var(--sans);
  font-size:.8rem; color:var(--ink-3); }}

/* overview */
.ov{{ position:fixed; inset:0; z-index:80; background:var(--page); display:none;
  grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:.6rem; padding:1.2rem;
  overflow:auto; align-content:start; }}
.ov.on{{ display:grid; }}
.ov button{{ aspect-ratio:16/9; border:1px solid var(--rule); border-radius:6px; background:var(--card);
  cursor:pointer; font-family:var(--sans); font-size:.75rem; color:var(--ink-2); padding:.5rem;
  display:flex; flex-direction:column; justify-content:space-between; text-align:left; overflow:hidden; }}
.ov button:hover{{ border-color:var(--ink); }}
.ov button span{{ font-weight:800; font-size:1.1rem; }}

@media print{{
  html,body{{ overflow:visible; background:#fff; }}
  .slide{{ display:flex !important; position:relative; inset:auto; height:100vh; page-break-after:always; }}
  .bar,.hud,.hint,.ov{{ display:none !important; }}
  @page{{ size:landscape; margin:0; }}
}}
'''

JS = '''
(function(){
  var sl=[].slice.call(document.querySelectorAll(".slide"));
  var bar=document.getElementById("bar"), ov=document.getElementById("ov"),
      cnt=document.getElementById("cnt"), i=0;
  function go(n,replay){
    n=Math.max(0,Math.min(sl.length-1,n));
    sl[i].classList.remove("on"); i=n;
    var s=sl[i]; s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
    bar.style.width=((i+1)/sl.length*100)+"%";
    cnt.textContent=(i+1)+" / "+sl.length;
    if(location.hash!=="#"+(i+1)) history.replaceState(null,"","#"+(i+1));
  }
  function ovToggle(f){ ov.classList.toggle("on", typeof f==="boolean"?f:!ov.classList.contains("on")); }
  sl.forEach(function(s,n){
    var b=document.createElement("button");
    var t=(s.querySelector("h1,h2,.figt,.mega")||{}).textContent||"";
    b.innerHTML='<span>'+(n+1)+'</span><em style="font-style:normal">'+t.slice(0,60)+'</em>';
    b.onclick=function(){ ovToggle(false); go(n); };
    ov.appendChild(b);
  });
  document.addEventListener("keydown",function(e){
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var k=e.key;
    if(k==="ArrowRight"||k==="PageDown"||k===" "||k==="Enter"){e.preventDefault();go(i+1);}
    else if(k==="ArrowLeft"||k==="PageUp"||k==="Backspace"){e.preventDefault();go(i-1);}
    else if(k==="Home"){go(0);} else if(k==="End"){go(sl.length-1);}
    else if(k==="o"||k==="O"){ovToggle();}
    else if(k==="Escape"){ovToggle(false);}
    else if(k==="f"||k==="F"){ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); }
  });
  document.getElementById("prev").onclick=function(){go(i-1);};
  document.getElementById("next").onclick=function(){go(i+1);};
  document.getElementById("idx").onclick=function(){ovToggle();};
  ov.onclick=function(e){ if(e.target===ov) ovToggle(false); };
  var x=null;
  document.addEventListener("touchstart",function(e){x=e.changedTouches[0].clientX;},{passive:true});
  document.addEventListener("touchend",function(e){ if(x===null)return;
    var d=e.changedTouches[0].clientX-x; if(Math.abs(d)>55){ d<0?go(i+1):go(i-1); } x=null; },{passive:true});
  var st=parseInt((location.hash||"").slice(1),10);
  go(isNaN(st)?0:st-1,true);
})();
'''

HTML = f'''<!doctype html>
<html lang="es" style="color-scheme:light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Exposición · Estás obligado y no lo sabías — Grupo 6</title>
<style>{CSS}</style>
</head>
<body>
<div class="bar" id="bar" style="width:0"></div>
<main class="deck">
{chr(10).join(S)}
</main>
<div class="ov" id="ov"></div>
<div class="hint">← → avanzar · O índice · F pantalla completa</div>
<div class="hud">
  <button id="idx" type="button">Índice</button>
  <span class="count" id="cnt"></span>
  <button id="prev" type="button">←</button>
  <button id="next" type="button">→</button>
</div>
<script>{JS}</script>
</body>
</html>
'''

(WEB / "exposicion.html").write_text(HTML, encoding="utf-8")
print(f"→ exposicion.html · {len(S)} diapositivas · {len(HTML):,} bytes")
