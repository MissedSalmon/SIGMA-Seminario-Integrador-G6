# -*- coding: utf-8 -*-
import re, pathlib, html as H
WEB = pathlib.Path(__file__).resolve().parent
SRC = WEB / "index.html"
DST = WEB.parent / "articulo.md"
doc = SRC.read_text(encoding="utf-8")
def inline(s):
    s = re.sub(r"<strong>(.*?)</strong>", r"**\1**", s, flags=re.S)
    s = re.sub(r"<em>(.*?)</em>", r"*\1*", s, flags=re.S)
    s = re.sub(r"<br\s*/?>", "  \n", s)
    s = re.sub(r"<span[^>]*>|</span>|<b>|</b>", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"[ \t]+", " ", H.unescape(s)).strip()
def tabla(bloque):
    out, cab = [], True
    for f in re.findall(r"<tr[^>]*>(.*?)</tr>", bloque, re.S):
        celdas = [inline(c) for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", f, re.S)]
        if not celdas: continue
        out.append("| " + " | ".join(celdas) + " |")
        if cab and "<th" in f: out.append("|"+"---|"*len(celdas)); cab=False
    return "\n".join(out)
partes=[]; A=partes.append
cuerpo = re.search(r"<main>(.*)</main>", doc, re.S).group(1)
patron = re.compile(
 r"<h2[^>]*>(?P<h2>.*?)</h2>|<h3>(?P<h3>.*?)</h3>|<p class=\"lede\">(?P<lede>.*?)</p>"
 r"|<p>(?P<p>.*?)</p>|<blockquote class=\"q\">(?P<qt>.*?)</blockquote>|<figure>(?P<fig>.*?)</figure>"
 r"|<div class=\"tw\">(?P<tw>.*?)</div>\s*(?=<|$)|<div class=\"plain\">(?P<plain>.*?)</div>"
 r"|<div class=\"box[^\"]*\">(?P<box>.*?)</div>|<div class=\"duo\">(?P<duo>.*?)</div>\s*</div>"
 r"|<ol class=\"n\">(?P<ol>.*?)</ol>|<ul class=\"b\">(?P<ul>.*?)</ul>", re.S)
for m in patron.finditer(cuerpo):
    g=m.groupdict()
    if g["h2"] is not None: A("\n---\n\n## "+inline(g["h2"]))
    elif g["h3"] is not None: A("\n### "+inline(g["h3"]))
    elif g["plain"] is not None or g["box"] is not None:
        b=g["plain"] or g["box"]; t=re.search(r"<h4>(.*?)</h4>",b,re.S)
        A("\n> ### "+(inline(t.group(1)) if t else "Nota"))
        for x in re.findall(r"<p>(.*?)</p>",b,re.S): A("> "+inline(x))
    elif g["duo"] is not None:
        for d in re.findall(r'<div class="(si|no)">(.*?)</div>',g["duo"],re.S):
            t=inline(re.search(r"<h4>(.*?)</h4>",d[1],re.S).group(1))
            c=inline(re.search(r"<p>(.*?)</p>",d[1],re.S).group(1)); A(f"\n**{t}.** {c}")
    elif g["qt"] is not None:
        ci=re.search(r"<cite>(.*?)</cite>",g["qt"],re.S)
        cq=inline(re.sub(r"<cite>.*?</cite>","",g["qt"],flags=re.S))
        A(f"\n> {cq}\n> — {inline(ci.group(1))}" if ci else f"\n> {cq}")
    elif g["fig"] is not None:
        f=g["fig"]; num=re.search(r'<span class="num">(Figura \d+)\.</span>\s*([^<]*)',f)
        leer=re.search(r'<span class="read">(.*?)</span>',f,re.S); src_=re.search(r'<span class="src">(.*?)</span>',f,re.S)
        dat=re.search(r"<details class=\"data\">.*?(<table>.*?</table>)",f,re.S)
        A(f"\n> ### {num.group(1) if num else 'Figura'} — {inline(num.group(2)) if num else ''}")
        if leer: A("> "+inline(leer.group(1)))
        if dat:
            A(">")
            for l in tabla(dat.group(1)).splitlines(): A("> "+l)
        if src_: A(">\n> *"+inline(src_.group(1))+"*")
    elif g["tw"] is not None:
        cap=re.search(r'<p class="tcap">(.*?)</p>',g["tw"],re.S)
        if cap: A("\n**"+inline(cap.group(1))+"**\n")
        t=re.search(r"<table>.*?</table>",g["tw"],re.S)
        if t: A(tabla(t.group(0)))
        pie=re.search(r'<p class="tfoot">(.*?)</p>',g["tw"],re.S)
        if pie: A("\n*"+inline(pie.group(1))+"*")
    elif g["ol"] is not None:
        for i,li in enumerate(re.findall(r"<li>(.*?)</li>",g["ol"],re.S),1): A(f"{i}. {inline(li)}")
    elif g["ul"] is not None:
        for li in re.findall(r"<li>(.*?)</li>",g["ul"],re.S): A("- "+inline(li))
    else:
        t=inline(g["lede"] or g["p"])
        if t: A("\n"+t)
refs=re.search(r'<div class="refs">(.*?)</div>\s*</div>\s*</main>|<div class="refs">(.*?)</div>',cuerpo,re.S)
if refs:
    blk=refs.group(1) or refs.group(2)
    for m2 in re.finditer(r"<h3>(.*?)</h3>|<p>(.*?)</p>",blk,re.S):
        A("\n### "+inline(m2.group(1)) if m2.group(1) else "- "+inline(m2.group(2)))
CAB="""# Estás obligado y no lo sabías

### El rol profesional en temas de ciberseguridad: qué le reservó el Estado argentino a nuestro título, qué obligaciones trae y qué pasa con ellas en el Chaco

**Trabajo de investigación — Unidad Temática 5: *Peritaje, arbitraje y tasaciones*** · **Grupo 6**
Seminario Integrador · UTN-FRRe · Resistencia, Chaco · agosto de 2026

**Autores:** Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro

---

> Este archivo se genera automáticamente desde `web/index.html`; no editarlo a mano.
> Las diapositivas de la exposición están en `web/exposicion.html` (se regeneran con `build_all.py`).

---
"""
md=CAB+"\n".join(partes)+"\n"; md=re.sub(r"\n{4,}","\n\n\n",md)
DST.write_text(md,encoding="utf-8")
print(f"→ articulo.md ({len(md):,} bytes, {len(md.split()):,} palabras)")
