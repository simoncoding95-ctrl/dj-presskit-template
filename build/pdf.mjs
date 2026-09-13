// Presskit imprimable, tiré de la même source que la page : site/content.json.
// Palette papier — la charte la réserve aux documents imprimés, un A4 en fond
// sombre vidant une cartouche d'encre.
//
// Usage : node build/pdf.mjs site/content.json dist/presskit.html
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const [, , contentPath = "site/content.json",
          outputPath = "dist/presskit.html"] = process.argv;
const root = process.cwd();
const c = JSON.parse(readFileSync(resolve(root, contentPath), "utf8"));
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
const when = (v, fn) => (has(v) ? fn(v) : "");
const file = (p) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
const b64 = (p) => { try { return readFileSync(join(root, p)).toString("base64"); } catch { return ""; } };
const img = (p) => { const d = b64(p); return d ? `data:image/png;base64,${d}` : ""; };

const TEMPLATE = /^(paragraphe \d|40 à 60 mots|citation réelle|titre$|lieu, depuis|festival, ville|\[)/i;
const real = (s) => has(s) && !TEMPLATE.test(String(s).trim());

const bioLong = (c.bio_long ?? []).filter(real);
const sets = (c.sets ?? []).filter((s) => has(s.format) && !/^0+\s*(min|h|:)/i.test(String(s.length ?? "")));
const facts = (c.facts ?? []).filter(([, v]) => real(v));
const tech = (c.tech ?? []).filter(([, v]) => real(v));
const mixes = (c.mixes ?? []).filter((m) => has(m.url));
const links = (c.links ?? []).filter((l) => has(l.url));
const photos = (c.photos ?? []).filter((p) => has(p.src)).slice(0, 3);
const booking = (c.contacts ?? []).find((x) => /booking/i.test(x.role)) ?? c.contacts?.[0];

const qr = file("site/qr-soundcloud.svg")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/\swidth="[^"]*"\s+height="[^"]*"/, ' style="width:100%;height:auto;display:block"');
const logo = file("site/brand-assets/logo/logo-encre-fixe.svg")
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/\swidth="[^"]*"\s+height="[^"]*"/, ' style="width:40mm;height:auto;display:block"');

const rows = (list) => `<dl class="spec">${list.map(([k, v]) =>
  `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;

const css = `
@page{size:A4;margin:0}
:root{--paper:#EDE9E3;--shade:#DDD7CC;--ink:#1A1917;--muted:#6B665E;
  --olive:#4A5D45;--amber:#7A5A1E;--line:rgba(26,25,23,.16);--m:17mm}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Geist',system-ui,sans-serif;font-variant-numeric:tabular-nums;
  background:var(--paper);color:var(--ink);line-height:1.5}
.sheet{width:210mm;height:297mm;padding:var(--m);position:relative;overflow:hidden;
  background:var(--paper);display:flex;flex-direction:column;page-break-after:always}
.sheet:last-child{page-break-after:auto}

h1{font-size:60pt;font-weight:800;line-height:.86;letter-spacing:-.045em}
h2{font-size:9.5pt;font-weight:600;padding-bottom:1.6mm;margin-bottom:2.8mm;
  border-bottom:.5pt solid var(--line)}
p{font-size:9pt;line-height:1.55;max-width:78mm}
.lede{font-size:11pt;line-height:1.42;max-width:96mm}
.micro{font-size:6.8pt;color:var(--muted);line-height:1.4}
em{font-style:normal;color:var(--olive)}

.top{display:grid;grid-template-columns:1fr 62mm;gap:10mm;align-items:end}
.top__meta{display:flex;flex-wrap:wrap;gap:1.5mm 6mm;margin-top:5mm;font-size:8pt;color:var(--muted)}
.portrait{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:50% 22%;
  display:block;filter:grayscale(1) contrast(1.06)}

.listen{display:grid;grid-template-columns:26mm 1fr;gap:8mm;align-items:start;
  background:var(--shade);padding:6mm;margin-top:7mm}
.listen__qr{width:26mm}
.mix{display:flex;justify-content:space-between;gap:6mm;font-size:9pt;padding:1.6mm 0;
  border-bottom:.4pt solid var(--line)}
.mix:last-child{border-bottom:0}
.mix span{color:var(--muted);font-size:8pt;white-space:nowrap}
.mix a{color:var(--ink);text-decoration:none}

.book{margin-top:auto;padding-top:6mm;border-top:1pt solid var(--ink)}
.book__mail{font-size:15pt;font-weight:600;color:var(--olive);text-decoration:none}
.book__who{font-size:8.5pt;color:var(--muted);margin-bottom:1mm}

.spec{border-top:.5pt solid var(--line)}
.spec>div{display:grid;grid-template-columns:38mm 1fr;gap:6mm;padding:1.5mm 0;
  border-bottom:.5pt solid var(--line);font-size:9pt}
.spec dt{color:var(--muted);font-size:8pt}

.sets{display:grid;grid-template-columns:repeat(auto-fit,minmax(48mm,1fr));gap:.5pt;
  background:var(--line);border:.5pt solid var(--line)}
.set{background:var(--paper);padding:3.6mm}
.set b{display:block;font-size:10pt;font-weight:600}
.set span{display:block;font-size:8pt;color:var(--muted);margin-top:1mm}
.set span.len{color:var(--olive);font-weight:500}

.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.gal img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block;
  filter:grayscale(1) contrast(1.05)}
.gal figcaption{font-size:6.8pt;color:var(--muted);padding-top:1.5mm}
.gal figure{margin:0}

.links{display:flex;flex-wrap:wrap;gap:3mm 8mm;font-size:8.5pt}
.links a{color:var(--olive);text-decoration:none}
.foot{margin-top:auto;padding-top:5mm;border-top:.5pt solid var(--line);
  display:flex;justify-content:space-between;align-items:flex-end;gap:8mm}
.sig{opacity:.92}
.sig--top{margin-bottom:5mm}
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(c.artist)} — Presskit</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..800&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<section class="sheet">
  <div class="sig sig--top">${logo}</div>

  <div class="top">
    <div style="min-width:0">
      <h1>${esc(c.artist)}</h1>
      ${when(c.meta, (m) => `<div class="top__meta">${m.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`)}
      ${real(c.bio_short) ? `<p class="lede" style="margin-top:7mm">${esc(c.bio_short)}</p>` : ""}
    </div>
    ${when(c.hero_image, (s) => `<img class="portrait" src="${img(s)}" alt="">`)}
  </div>

  ${mixes.length ? `
  <div class="listen">
    <div class="listen__qr">${qr}
      <div class="micro" style="margin-top:2mm">Scanner pour écouter</div></div>
    <div>
      <h2 style="border:0;padding:0;margin-bottom:2.5mm">Écouter</h2>
      ${mixes.map((m) => `<div class="mix">
        <a href="${esc(m.url)}">${esc(m.title)}</a>
        <span>${esc([m.year, m.length].filter(Boolean).join(", "))}</span></div>`).join("")}
      <div class="micro" style="margin-top:3mm">${esc((links.find((l) => /soundcloud/i.test(l.label)) ?? {}).url ?? "")}</div>
    </div>
  </div>` : ""}

  ${facts.length ? `<div style="margin-top:7mm">
    <h2>Repères</h2>${rows(facts)}</div>` : ""}

  ${booking ? `
  <div class="book">
    <div>
      <div class="book__who">${esc(booking.role)} — ${esc(booking.name)}</div>
      <a class="book__mail" href="mailto:${esc(booking.email)}">${esc(booking.email)}</a>
    </div>
  </div>` : ""}
</section>

<section class="sheet">
  ${bioLong.length ? `<h2>Bio</h2>${bioLong.map((p) => `<p style="margin-bottom:3mm">${esc(p)}</p>`).join("")}` : ""}

  ${sets.length ? `<h2 style="margin-top:7mm">Formats de set</h2>
  <div class="sets">${sets.map((s) => `
    <div class="set"><b>${esc(s.format)}</b>
      <span class="len">${esc(s.length ?? "")}</span>
      <span>${esc(s.setup ?? "")}</span>
      ${when(s.note, (n) => `<span>${esc(n)}</span>`)}</div>`).join("")}</div>
  <p class="micro" style="margin-top:2.5mm">A.RES joue sur le matériel du lieu.</p>` : ""}

  ${tech.length ? `<h2 style="margin-top:7mm">Fiche technique</h2>${rows(tech)}` : ""}

  ${photos.length ? `<h2 style="margin-top:7mm">Photos</h2>
  <div class="gal">${photos.map((p) => `<figure>
    <img src="${img(p.src)}" alt="">
    <figcaption>${esc([p.caption, p.credit && `photo ${p.credit}`].filter(Boolean).join(" — ")) || "&nbsp;"}</figcaption>
  </figure>`).join("")}</div>
  <p class="micro" style="margin-top:2.5mm">Libres de droits pour la promotion. Crédit obligatoire, pas de recadrage.</p>` : ""}

  <div class="foot">
    <div class="links">${links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join("")}</div>
    <div class="micro" style="text-align:right">${esc(c.artist)} — Univers Parallele, Lille
      ${when(c.updated, (u) => `<br>Mis à jour le ${esc(u)}`)}</div>
  </div>
</section>

</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");
console.log(`✓ ${outputPath}`);
