// Fiche artiste à la charte du label. Un seul objectif : déclencher une demande de date.
// Usage : node build/artiste.mjs site/content.json dist/site/artistes/a-res.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";

const [, , contentPath = "site/content.json",
          outputPath = "dist/site/artistes/a-res.html"] = process.argv;
const root = process.cwd();
const c = JSON.parse(readFileSync(resolve(root, contentPath), "utf8"));
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);

/* La page peut vivre à la racine du site ou dans un sous-dossier :
   on en déduit le préfixe des liens et l'emplacement des assets. */
const SITE_ROOT = resolve(root, "dist/site");
const depth = relative(SITE_ROOT, outDir).split(/[\\/]/).filter(Boolean).length;
const up = depth ? Array(depth).fill("..").join("/") : ".";

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
const when = (v, fn) => (has(v) ? fn(v) : "");
const asset = (p = "") => (/^([a-z]+:|\/|#)/i.test(p) ? p : `${up}/${p.replace(/^\.\//, "")}`);

/* Une valeur restée au stade du gabarit ne part pas en ligne comme du contenu. */
const TEMPLATE = /^(paragraphe \d|40 à 60 mots|citation réelle|titre$|lieu, depuis|festival, ville|club \d|nom$|\[)/i;
const real = (s) => has(s) && !TEMPLATE.test(String(s).trim());
const missing = [];
const keep = (label, v) => {
  const ok = Array.isArray(v) ? v.some(real) : real(v);
  if (has(v) && !ok) missing.push(label);
  return ok;
};

const mixes = (c.mixes ?? []).filter((m) => has(m.url));
const sets = (c.sets ?? []).filter((s) => has(s.format) && !/^0+\s*(min|h|:)/i.test(String(s.length ?? "")));
if ((c.sets ?? []).length > sets.length) missing.push("des formats de set");
const photos = (c.photos ?? []).filter((p) => has(p.src));
const tech = (c.tech ?? []).filter(([, v]) => real(v));
const facts = (c.facts ?? []).filter(([, v]) => real(v));
const links = (c.links ?? []).filter((l) => has(l.url));
const bioShort = keep("la bio courte", c.bio_short) ? c.bio_short : "";
const bioLong = keep("la bio longue", c.bio_long) ? c.bio_long.filter(real) : [];
keep("les sorties", (c.releases ?? []).map((r) => r.title));
keep("les dates", (c.dates ?? []).flatMap((d) => d.items));
keep("la presse", (c.press ?? []).map((p) => p.quote));

const mailto = (m, subject) => `mailto:${esc(m)}?subject=${encodeURIComponent(subject)}`;
const bookingHref = has(c.booking_email)
  ? mailto(c.booking_email, `Demande de date — ${c.artist}`) : "";

/* Le lecteur SoundCloud impose un fond clair : on en fait l'étiquette papier
   posée sur le disque noir, c'est-à-dire le motif même de la marque. */
const player = (m, i) => `
<figure class="cart">
  <figcaption class="cart__head">
    <span class="cart__n">${String(i + 1).padStart(2, "0")}</span>
    <span class="cart__t">${esc(m.title)}</span>
    <span class="cart__m">${esc([m.year, m.length].filter(Boolean).join(" · "))}</span>
  </figcaption>
  <iframe title="${esc(m.title)}" loading="lazy" scrolling="no" frameborder="0" allow="autoplay"
    src="https://w.soundcloud.com/player/?url=${encodeURIComponent(m.url)}&color=%234A5D45&hide_related=true&show_comments=false&show_user=false&show_teaser=false&show_reposts=false&visual=false"></iframe>
</figure>`;

const dl = (rows) => `<dl class="spec">${rows.map(([k, v]) =>
  `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;

let step = 0;
const section = (id, title, body, sub = "") => body ? `
<section id="${id}">
  <h2><span class="h2__n">${String(++step).padStart(2, "0")}</span>${esc(title)}</h2>
  ${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
  ${body}
</section>` : "";

const css = `
:root{
  --bg:#16150F; --surface:#252420; --ink:#EDE9E3; --muted:#A8A296;
  --olive:#8FA383; --olive-d:#4A5D45; --amber:#D9A441; --paper:#EDE9E3;
  --line:rgba(237,233,227,.15); --rail:322px;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{background:var(--bg);color:var(--ink);line-height:1.55;font-size:15px;
  font-family:"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
a{color:var(--olive)}
:focus-visible{outline:2px solid var(--amber);outline-offset:3px}

.shell{display:grid;grid-template-columns:var(--rail) 1fr;min-height:100vh}
.rail{position:sticky;top:0;align-self:start;height:100vh;padding:38px 32px;
  border-right:1px solid var(--line);display:flex;flex-direction:column;gap:26px}
/* Le logotype du label signe la colonne. */
.rail__home{display:block;width:max-content}
.rail__logo{width:170px;height:auto;display:block;opacity:.9;transition:opacity .15s}
.rail__home:hover .rail__logo{opacity:1}
.rail__id{margin-bottom:auto}
.rail__name{font-size:23px;font-weight:800;letter-spacing:-.03em;line-height:1}
.rail__spec{margin-top:16px;font-size:12.5px;color:var(--muted);line-height:1.75}
.rail__spec b{color:var(--ink);font-weight:500}
.book{display:block;text-align:center;padding:15px 18px;background:var(--olive);color:var(--bg);
  font-weight:600;font-size:14.5px;text-decoration:none;transition:filter .15s}
.book:hover{filter:brightness(1.1)}
.rail__dl{display:flex;flex-direction:column;gap:9px;font-size:13px}
.rail__dl a{text-decoration:none;color:var(--muted)}
.rail__dl a:hover{color:var(--ink)}
.rail__soc{display:flex;gap:14px;font-size:12.5px;padding-top:4px;border-top:1px solid var(--line)}
.rail__soc a{text-decoration:none}

main{min-width:0;padding:0 clamp(24px,4.5vw,68px) 96px}
section{padding:58px 0;border-top:1px solid var(--line)}
h2{font-size:13px;font-weight:600;display:flex;align-items:baseline;gap:14px;margin-bottom:26px}
.h2__n{color:var(--muted);font-size:11px;font-weight:500}
.sub{color:var(--muted);font-size:13.5px;max-width:58ch;margin:-16px 0 26px}

.top{padding:clamp(48px,7vh,80px) 0 4px;display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,300px);gap:clamp(24px,4vw,52px);align-items:end}
.top h1{font-size:clamp(44px,7vw,104px);font-weight:800;
  line-height:.9;letter-spacing:-.045em}
.top__fig{margin:0;min-width:0}
/* height:auto est indispensable : sans lui l'attribut height="" de la balise
   fixe la hauteur en pixels et aspect-ratio est ignoré. */
.top__fig img{width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;object-position:50% 22%;
  display:block;filter:grayscale(1) contrast(1.06)}
.top__fig figcaption{font-size:11px;color:var(--muted);padding-top:8px}
@media (max-width:820px){.top{grid-template-columns:1fr;align-items:start}
  .top__fig{max-width:260px}   /* le nom passe avant la photo : on lit qui avant de voir */}
.top__meta{display:flex;flex-wrap:wrap;gap:8px 26px;margin-top:26px;
  font-size:13px;color:var(--muted)}
.top__lede{margin-top:30px;max-width:56ch;font-size:clamp(16px,1.9vw,19px);line-height:1.5}

/* L'étiquette papier : le lecteur, encadré, devient un objet de la marque. */
.cart{background:var(--paper);color:#1A1917;padding:16px 16px 12px;margin-bottom:14px}
.cart__head{display:flex;align-items:baseline;gap:12px;padding-bottom:12px;font-size:13px}
.cart__n{font-weight:800;font-size:13px;letter-spacing:-.02em}
.cart__t{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cart__m{color:#6B665E;font-size:12px;white-space:nowrap}
.cart iframe{width:100%;height:166px;display:block;border:0}

.body p{max-width:62ch;color:var(--muted);font-size:15px}
.body p+p{margin-top:14px}

.spec{border-top:1px solid var(--line)}
.spec>div{display:grid;grid-template-columns:190px 1fr;gap:22px;padding:13px 0;
  border-bottom:1px solid var(--line)}
.spec dt{color:var(--muted);font-size:12.5px}
.spec dd{font-size:14.5px}
@media (max-width:620px){.spec>div{grid-template-columns:1fr;gap:2px}}

.sets{display:grid;grid-template-columns:repeat(auto-fit,minmax(198px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line)}
.set{background:var(--bg);padding:20px 18px}
.set b{display:block;font-size:15.5px;font-weight:600}
.set span{display:block;font-size:12.5px;color:var(--muted);margin-top:5px}
.set span.len{color:var(--olive);font-weight:500}

.gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.gal figure{margin:0}
.gal img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;display:block;
  filter:grayscale(1) contrast(1.05)}
.gal figcaption{font-size:11.5px;color:var(--muted);padding-top:8px}

.draft{border:1px solid var(--amber);color:var(--amber);padding:14px 17px;font-size:13px;
  line-height:1.5;margin-top:26px}
.draft b{display:block;font-weight:600;margin-bottom:3px}

footer{padding:34px 0 0;border-top:1px solid var(--line);color:var(--muted);font-size:12px;
  display:flex;flex-wrap:wrap;gap:8px 26px}
footer a{color:var(--muted)}

.mob{display:none}
@media (max-width:900px){
  .shell{grid-template-columns:1fr}
  .rail{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line);
    flex-direction:row;align-items:center;gap:18px;padding:18px clamp(24px,4.5vw,68px)}
  .rail__logo{width:120px}
  .rail__id,.rail__spec,.rail__dl,.rail__soc,.rail .book{display:none}
  main{padding-bottom:104px}
  /* Le bouton reste sous le pouce : c'est la seule action de la page. */
  .mob{display:block;position:fixed;left:0;right:0;bottom:0;z-index:9;
    padding:12px clamp(24px,4.5vw,68px) calc(12px + env(safe-area-inset-bottom));
    background:rgba(22,21,15,.94);backdrop-filter:blur(9px);border-top:1px solid var(--line)}
}
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.artist)} — Booking, presskit</title>
<meta name="description" content="${esc(real(bioShort) ? bioShort : `${c.artist} — ${(c.meta ?? []).join(", ")}. Écouter, formats de set, fiche technique, booking.`)}">
<meta property="og:title" content="${esc(c.artist)} — Univers Parallele">
<meta property="og:description" content="${esc((c.meta ?? []).join(" · "))}">
<meta property="og:type" content="profile">
${when(c.hero_image, (s) => `<meta property="og:image" content="${esc(asset(s))}">`)}
<link rel="icon" href="${up}/brand-assets/logo/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${up}/brand-assets/logo/favicon-32.png">
<link rel="icon" type="image/png" sizes="512x512" href="${up}/brand-assets/logo/favicon-512.png">
<link rel="apple-touch-icon" href="${up}/brand-assets/logo/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://w.soundcloud.com">
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400..800&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<div class="shell">
<aside class="rail">
  <a class="rail__home" href="${up}/">
    <img class="rail__logo" src="${up}/brand-assets/logo/logo-papier-2000.png"
         alt="Univers Parallele — accueil" width="2000" height="508">
  </a>


  <div class="rail__id">
    <div class="rail__name">${esc(c.artist)}</div>
    <div class="rail__spec">
      ${(c.meta ?? []).map((m) => `<div>${esc(m)}</div>`).join("")}
      ${sets.length ? `<div><b>${esc(sets[0].length)}</b> en set standard</div>` : ""}
    </div>
  </div>

  ${bookingHref ? `<a class="book" href="${bookingHref}">Demander une date</a>` : ""}

  <div class="rail__dl">
    ${when(c.pdf_url, (u) => `<a href="${esc(asset(u))}">Presskit PDF</a>`)}
    ${when(c.rider_url, (u) => `<a href="${esc(asset(u))}">Fiche technique PDF</a>`)}
  </div>

  ${links.length ? `<div class="rail__soc">${links.map((l) =>
    `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join("")}</div>` : ""}
</aside>

<main>
  <header class="top">
    <div>
      <h1>${esc(c.artist)}</h1>
      ${when(c.meta, (m) => `<div class="top__meta">${m.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`)}
      ${real(bioShort) ? `<p class="top__lede">${esc(bioShort)}</p>` : ""}
    </div>
    ${when(c.hero_image, (src) => `
    <figure class="top__fig">
      <img src="${esc(asset(src))}" alt="${esc(c.artist)}" width="800" height="1066">
      ${when(c.hero_credit, (cr) => `<figcaption>Photo ${esc(cr)}</figcaption>`)}
    </figure>`)}
  </header>
  ${missing.length ? `<div class="draft" style="margin-bottom:8px"><b>Page de démonstration</b>
      ${esc(missing.join(", "))} ${missing.length > 1 ? "sont encore" : "est encore"} au stade du gabarit dans <code>site/content.json</code> :
      ces sections sont masquées plutôt qu'affichées vides. Un presskit à moitié rempli fait plus de mal qu'un presskit court.</div>` : ""}

  ${mixes.length ? `
  <section id="ecouter">
    <h2><span class="h2__n">${String(++step).padStart(2, "0")}</span>Écouter</h2>
    ${mixes.map(player).join("")}
  </section>` : ""}

  ${bioLong.length ? section("bio", "Bio",
    `<div class="body">${bioLong.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`) : ""}

  ${sets.length ? section("formats", "Formats de set",
    `<div class="sets">${sets.map((s) => `
      <div class="set"><b>${esc(s.format)}</b>
        <span class="len">${esc(s.length ?? "")}</span>
        <span>${esc(s.setup ?? "")}</span>
        ${when(s.note, (n) => `<span>${esc(n)}</span>`)}
      </div>`).join("")}</div>`,
    "Un organisateur doit pouvoir choisir sans écrire un mail.") : ""}

  ${facts.length ? section("reperes", "Repères", dl(facts)) : ""}

  ${tech.length ? section("technique", "Fiche technique", dl(tech),
    "Le détail complet est dans le PDF.") : ""}

  ${photos.length ? section("photos", "Photos",
    `<div class="gal">${photos.map((p) => `
      <figure><img src="${esc(asset(p.src))}" alt="${esc(p.caption ?? c.artist)}" loading="lazy">
        <figcaption>${esc([p.caption, p.credit && `photo ${p.credit}`].filter(Boolean).join(" — ")) || "&nbsp;"}</figcaption>
      </figure>`).join("")}</div>`,
    "Libres de droits pour la promotion. Crédit obligatoire, pas de recadrage.") : ""}

  ${section("contact", "Contact",
    when(c.contacts, (list) => dl(list.map((x) => [x.role, `${x.name} — ${x.email}`]))))}

  <footer>
    <span>${esc(c.artist)} — Univers Parallele, Lille</span>
    ${when(c.updated, (u) => `<span>Mis à jour le ${esc(u)}</span>`)}
  </footer>
</main>
</div>

${bookingHref ? `<div class="mob"><a class="book" href="${bookingHref}">Demander une date</a></div>` : ""}

</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");

const notDoc = (f) => !f.toLowerCase().endsWith(".md");
for (const [from, to] of [
  ["assets", join(SITE_ROOT, "assets")],                            // photos
  ["site/brand-assets/logo", join(SITE_ROOT, "brand-assets/logo")], // logotype, favicon
  ["site/downloads", SITE_ROOT],                                    // presskit PDF
]) {
  const s = join(root, from);
  if (!existsSync(s)) continue;
  // Remplacer, pas fusionner : un fichier retiré des sources doit disparaître de la
  // sortie, sinon il repart en production (arrivé avec les anciens logos le 13/09).
  // Jamais la racine du site : les PDF y sont copiés à côté des pages générées.
  if (to !== SITE_ROOT) rmSync(to, { recursive: true, force: true });
  cpSync(s, to, { recursive: true, filter: notDoc });
}

console.log(`✓ ${outputPath}${missing.length ? `  (masqué : ${missing.join(", ")})` : ""}`);
