// Page artiste à la charte du label — le futur gabarit du site Parallel Universe.
// Usage : node build/artiste.mjs site/content.json dist/site/artistes/a-res.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const [, , contentPath = "site/content.json",
          outputPath = "dist/site/artistes/a-res.html"] = process.argv;
const root = process.cwd();
const c = JSON.parse(readFileSync(resolve(root, contentPath), "utf8"));
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);
const up = "..";                       // la page vit dans /artistes/

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
const when = (v, fn) => (has(v) ? fn(v) : "");
const asset = (p = "") => (/^([a-z]+:|\/|#)/i.test(p) ? p : `${up}/${p.replace(/^\.\//, "")}`);

/* Un placeholder laissé dans content.json ne doit pas partir en ligne comme du contenu. */
const PLACEHOLDER = /^(paragraphe \d|40 à 60 mots|citation réelle|titre$|lieu, depuis|festival, ville)/i;
const real = (s) => has(s) && !PLACEHOLDER.test(String(s).trim());
const drafts = [];
const guard = (key, v) => { if (has(v) && !real(Array.isArray(v) ? v[0] : v)) { drafts.push(key); return false; } return has(v); };

const section = (id, title, body, sub = "") => body ? `
<section id="${id}" class="wrap">
  <h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
  ${body}
</section>` : "";

const table = (rows) => `<div class="rows">${rows.map(([k, v]) =>
  `<div class="row"><span class="row__k">${esc(k)}</span><span class="row__v">${esc(v)}</span></div>`).join("")}</div>`;

/* Pas de lecteur embarqué : l'iframe SoundCloud impose un bloc blanc au milieu
   de la page, charge un tiers traceur et ralentit le chargement. Un booker clique. */

const css = readFileSync(join(root, "build/label.css"), "utf8") + `
.hero{padding:var(--rhythm) 0 calc(var(--rhythm)*.5)}
.hero__grid{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:end}
@media (max-width:820px){.hero__grid{grid-template-columns:1fr;gap:30px}}
.hero h1{font-size:clamp(46px,9vw,104px);font-weight:700;font-stretch:62%;letter-spacing:-.01em;line-height:.94}
.hero__meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:22px;font-size:13px;color:var(--muted)}
.hero__fig{margin:0;aspect-ratio:1/1}   /* carré : le motif pochette, et moins de vide au-dessus du nom */
.hero__fig img{width:100%;height:100%;object-fit:cover;object-position:50% 26%;
  display:block;filter:grayscale(1) contrast(1.06)}
@media (max-width:820px){.hero__fig{aspect-ratio:3/2}}
.hero__fig figcaption{font-size:11px;color:var(--muted);padding-top:9px}
.lede{font-size:clamp(16px,2vw,20px);line-height:1.5;max-width:56ch}
.body p{max-width:62ch;color:var(--muted);font-size:14.5px}
.rows{border-top:1px solid var(--line)}
.row{display:grid;grid-template-columns:200px 1fr;gap:22px;padding:13px 0;
  border-bottom:1px solid var(--line);font-size:14px}
.row__k{color:var(--muted);font-size:12.5px}
@media (max-width:620px){.row{grid-template-columns:1fr;gap:3px}}
.sets{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line)}
.set{background:var(--bg);padding:20px}
.set b{display:block;font-size:15px;font-weight:600}
.set span{display:block;font-size:12.5px;color:var(--muted);margin-top:5px}
.gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.gal figure{margin:0}
.gal img{width:100%;height:auto;display:block;filter:grayscale(1) contrast(1.06)}
.gal figcaption{font-size:11px;color:var(--muted);padding-top:7px}
.dl{display:flex;flex-wrap:wrap;gap:12px;margin-top:6px}
.dl a{padding:12px 20px;border:1px solid var(--olive);color:var(--olive);
  text-decoration:none;font-size:13.5px;font-weight:600}
.dl a:hover{background:var(--olive);color:var(--bg)}
.dl a.solid{background:var(--olive);color:var(--bg)}
.links{display:flex;flex-wrap:wrap;gap:18px;font-size:14px}
.draft{border:1px solid var(--amber);color:var(--amber);padding:14px 18px;font-size:13px;
  margin:0 auto var(--rhythm);max-width:1120px;line-height:1.5}
.draft b{display:block;font-weight:600;margin-bottom:3px}
`;

const bioLong = c.bio_long?.filter(real) ?? [];
const facts = (c.facts ?? []).filter(([, v]) => real(v));
/* « 00 min », « 0h » : le gabarit n'a pas été rempli — on ne propose pas ce format. */
const sets = (c.sets ?? []).filter((s) => has(s.format) && !/^0+\s*(min|h|:)/i.test(String(s.length ?? "")));
const mixes = (c.mixes ?? []).filter((m) => has(m.url));
const photos = (c.photos ?? []).filter((p) => has(p.src));
const tech = (c.tech ?? []).filter(([, v]) => real(v));
const links = (c.links ?? []).filter((l) => has(l.url));
guard("bio courte", c.bio_short);
guard("bio longue", c.bio_long);
guard("sorties", (c.releases ?? []).map((r) => r.title));
guard("dates", (c.dates ?? []).flatMap((d) => d.items));
guard("presse", (c.press ?? []).map((p) => p.quote));
if ((c.sets ?? []).length > sets.length) drafts.push("certains formats de set");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.artist)} — Parallel Universe</title>
<meta name="description" content="${esc(real(c.bio_short) ? c.bio_short : `${c.artist}, ${(c.meta ?? []).join(", ")}`)}">
<meta property="og:title" content="${esc(c.artist)} — Parallel Universe">
<meta property="og:type" content="profile">
${when(c.hero_image, (s) => `<meta property="og:image" content="${esc(asset(s))}">`)}
<link rel="icon" href="${up}/brand-assets/logo/avatar-mark-512.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<nav class="nav">
  <a href="${up}/brand" style="text-decoration:none;color:inherit"><span class="nav__name">PARALLEL UNIVERSE</span></a>
  <div class="nav__links">
    <a href="#bio">Bio</a>
    ${mixes.length ? '<a href="#ecouter">Écouter</a>' : ""}
    ${sets.length ? '<a href="#formats">Formats</a>' : ""}
    <a href="#contact">Contact</a>
    <a class="nav__home" href="${up}/brand">Charte</a>
  </div>
</nav>

${drafts.length ? `<div class="draft"><b>Page de démonstration</b>
Le contenu de ${esc(drafts.join(", "))} est encore au stade du gabarit dans <code>site/content.json</code> : ces sections sont masquées plutôt qu'affichées vides. Un presskit à moitié rempli fait plus de mal qu'un presskit court.</div>` : ""}

<header class="hero wrap">
  <div class="hero__grid">
    <div>
      <h1>${esc(c.artist)}</h1>
      ${when(c.meta, (m) => `<div class="hero__meta">${m.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`)}
    </div>
    ${when(c.hero_image, (src) => `
    <figure class="hero__fig">
      <img src="${esc(asset(src))}" alt="${esc(c.artist)}" width="900" height="600">
      ${when(c.hero_credit, (cr) => `<figcaption>Photo ${esc(cr)}</figcaption>`)}
    </figure>`)}
  </div>
</header>

${section("bio", real(c.bio_short) || bioLong.length ? "Bio" : "Repères",
  (real(c.bio_short) ? `<p class="lede">${esc(c.bio_short)}</p>` : "") +
  (bioLong.length ? `<div class="body" style="margin-top:22px">${bioLong.map((p) => `<p>${esc(p)}</p>`).join("")}</div>` : "") +
  (facts.length ? `<div style="margin-top:30px">${table(facts)}</div>` : "") ||
  (facts.length ? table(facts) : ""))}

${mixes.length ? section("ecouter", "Écouter",
  `<div class="rows">${mixes.map((m) =>
    `<div class="row"><span class="row__k">${esc([m.year, m.length].filter(Boolean).join(", "))}</span>
     <span class="row__v"><a href="${esc(m.url)}" rel="noopener">${esc(m.title)}</a></span></div>`).join("")}</div>`,
  "Les mixes s'écoutent sur SoundCloud.") : ""}

${sets.length ? section("formats", "Formats de set",
  `<div class="sets">${sets.map((s) => `
    <div class="set"><b>${esc(s.format)}</b>
      <span>${esc(s.length ?? "")}</span>
      <span>${esc(s.setup ?? "")}</span>
      ${when(s.note, (n) => `<span>${esc(n)}</span>`)}
    </div>`).join("")}</div>`,
  "Ce qui est réellement proposé. Un organisateur doit pouvoir choisir sans écrire un mail.") : ""}

${photos.length ? section("photos", "Photos",
  `<div class="gal">${photos.map((p) => `
    <figure><img src="${esc(asset(p.src))}" alt="${esc(p.caption ?? c.artist)}" loading="lazy">
      <figcaption>${esc([p.caption, p.credit && `photo ${p.credit}`].filter(Boolean).join(" — "))}</figcaption>
    </figure>`).join("")}</div>`,
  "Libres de droits pour la promotion. Crédit obligatoire, pas de recadrage.") : ""}

${tech.length ? section("technique", "Fiche technique", table(tech)) : ""}

${section("contact", "Contact",
  `${when(c.contacts, (list) => `<div class="rows">${list.map((x) =>
      `<div class="row"><span class="row__k">${esc(x.role)}</span>
       <span class="row__v">${esc(x.name)} — <a href="mailto:${esc(x.email)}">${esc(x.email)}</a></span></div>`).join("")}</div>`)}
   ${links.length ? `<div class="links" style="margin-top:24px">${links.map((l) =>
      `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join("")}</div>` : ""}
   <div class="dl">
     ${when(c.booking_email, (m) => `<a class="solid" href="mailto:${esc(m)}?subject=${encodeURIComponent(`Demande de date — ${c.artist}`)}">Demander une date</a>`)}
     ${when(c.pdf_url, (u) => `<a href="${esc(asset(u))}">Presskit PDF</a>`)}
     ${when(c.rider_url, (u) => `<a href="${esc(asset(u))}">Fiche technique</a>`)}
   </div>`)}

<footer class="wrap">
  <span>${esc(c.artist)} — Parallel Universe, Lille</span>
  ${when(c.updated, (u) => `<span>Mis à jour le ${esc(u)}</span>`)}
  <a href="${up}/brand">Charte graphique</a>
  <span>Photos à créditer, ne pas recadrer.</span>
</footer>

</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");

// Les photos vivent un niveau au-dessus : la page les partage avec le reste du site.
const src = join(root, "assets");
const dest = join(outDir, "..", "assets");
if (existsSync(src) && !existsSync(dest)) {
  cpSync(src, dest, { recursive: true, filter: (f) => !f.toLowerCase().endsWith(".md") });
}

console.log(`✓ ${outputPath}${drafts.length ? `  (masqué : ${drafts.join(", ")})` : ""}`);
