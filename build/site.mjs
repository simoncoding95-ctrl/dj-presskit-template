#!/usr/bin/env node
// Génère le site presskit (HTML autonome) à partir d'un fichier de contenu JSON.
// Usage : node build/site.mjs site/content.json dist/site/index.html

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";

const [, , contentPath, outputPath] = process.argv;
if (!contentPath || !outputPath) {
  console.error("Usage: node build/site.mjs <content.json> <output.html>");
  process.exit(1);
}

const root = process.cwd();
const c = JSON.parse(readFileSync(resolve(root, contentPath), "utf8"));
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Les visuels sont copiés à côté du HTML : le dossier de sortie est déplaçable tel quel.
const asset = (p = "") => (/^([a-z]+:|\/|#)/i.test(p) ? p : p.replace(/^\.\//, ""));

const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
const when = (v, fn) => (has(v) ? fn(v) : "");

/* ---------- blocs ---------- */

const label = (t) => `<span class="mono section__label">${esc(t)}</span>`;

const reel = ({ id, items, cls = "" }) => `
<div class="reel-block" data-reel>
  <div class="reel__head">
    <div class="reel__nav">
      <button class="reel__btn" type="button" data-dir="-1" aria-label="Élément précédent" aria-controls="${id}">&#8592;</button>
      <button class="reel__btn" type="button" data-dir="1" aria-label="Élément suivant" aria-controls="${id}">&#8594;</button>
    </div>
    <span class="mono reel__count">01 / ${String(items.length).padStart(2, "0")}</span>
  </div>
  <div class="reel ${cls}" id="${id}" tabindex="0" role="group" aria-label="Carrousel, naviguez avec les flèches">
    ${items.join("\n")}
  </div>
  <div class="reel__rail"><span class="reel__thumb"></span></div>
</div>`;

const photos = (list) =>
  reel({
    id: "reel-photos",
    items: list.map((p, i) => `
    <figure class="reel__item">
      <img src="${esc(asset(p.src))}" alt="${esc(p.caption || "Photo de presse")}" loading="lazy">
      <figcaption class="mono reel__cap">
        <span>${esc(p.caption || "")}${p.credit ? ` — <b>${esc(p.credit)}</b>` : ""}</span>
        <span class="reel__idx">${String(i + 1).padStart(2, "0")}</span>
      </figcaption>
    </figure>`),
  });

const releases = (list) =>
  reel({
    id: "reel-releases",
    items: list.map((r) => {
      const inner = `
      <img src="${esc(asset(r.art))}" alt="${esc(r.title)}" loading="lazy">
      <div class="release__meta">
        <span class="mono">${esc(r.year || "")}${r.label ? " · " + esc(r.label) : ""}</span>
        <div class="release__title">${esc(r.title)}</div>
        <div class="release__sub">${esc(r.artist || "")}</div>
      </div>`;
      return r.url
        ? `<a class="reel__item release" href="${esc(r.url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="reel__item release">${inner}</div>`;
    }),
  });

const quotes = (list) =>
  reel({
    id: "reel-press",
    items: list.map((q) => `
    <blockquote class="reel__item quote">
      <p>${esc(q.quote)}</p>
      <footer class="mono">${q.url ? `<a href="${esc(q.url)}" target="_blank" rel="noopener"><b>${esc(q.source)}</b></a>` : `<b>${esc(q.source)}</b>`}${q.date ? " · " + esc(q.date) : ""}</footer>
    </blockquote>`),
  });

const rows = (list) =>
  `<div class="rows">${list
    .map(
      (s) => `<div class="row">
      <span class="row__key">${esc(s.format)}</span>
      <span class="mono">${esc(s.length || "")}</span>
      <span class="row__val">${esc(s.setup || "")}</span>
      <span class="row__val">${esc(s.note || "")}</span>
    </div>`
    )
    .join("")}</div>`;

const mixRows = (list) =>
  `<div class="rows">${list
    .map(
      (m) => `<a class="row row--link" href="${esc(m.url || "#")}" target="_blank" rel="noopener">
      <span class="row__key">${esc(m.title)}</span>
      <span class="mono">${esc(m.year || "")}</span>
      <span class="row__val">${esc(m.length || "")}</span>
      <span class="mono">Écouter &#8594;</span>
    </a>`
    )
    .join("")}</div>`;

const pairs = (list) =>
  `<dl class="facts">${list
    .map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("")}</dl>`;

/* ---------- page ---------- */

const nav = [
  has(c.bio_long) || has(c.bio_short) ? ["#bio", "Bio"] : null,
  has(c.photos) ? ["#live", "Live"] : null,
  has(c.mixes) ? ["#ecouter", "Écouter"] : null,
  has(c.releases) ? ["#sorties", "Sorties"] : null,
  has(c.dates) ? ["#dates", "Dates"] : null,
  has(c.tech) ? ["#technique", "Technique"] : null,
].filter(Boolean);

const css = readFileSync(join(root, "build/site.css"), "utf8");
const js = readFileSync(join(root, "build/site.js"), "utf8");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.artist)} — Presskit</title>
<meta name="description" content="${esc(c.bio_short || c.tagline || "")}">
<meta property="og:title" content="${esc(c.artist)} — Presskit">
<meta property="og:description" content="${esc(c.tagline || "")}">
<meta property="og:type" content="profile">
${c.hero_image ? `<meta property="og:image" content="${esc(asset(c.hero_image))}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,300;6..72,400&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<nav class="nav">
  <span class="nav__name">${esc(c.artist)}</span>
  <div class="nav__links mono">
    ${nav.map(([href, text]) => `<a href="${href}">${esc(text)}</a>`).join("")}
  </div>
  ${when(c.booking_email, (m) => `<a class="nav__cta" href="mailto:${esc(m)}?subject=Demande%20de%20date%20%E2%80%94%20${encodeURIComponent(c.artist)}">Demander une date</a>`)}
</nav>

<header class="hero wrap">
  <div class="hero__grid">
    <div>
      <h1 class="display">${esc(c.artist)}</h1>
      ${when(c.tagline, (t) => `<p class="hero__tagline">${esc(t)}</p>`)}
      ${when(c.meta, (m) => `<div class="hero__meta mono">${m.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`)}
    </div>
    ${when(c.hero_image, (src) => `
    <figure class="hero__figure">
      <img src="${esc(asset(src))}" alt="${esc(c.artist)}">
      ${when(c.hero_credit, (cr) => `<figcaption class="mono">Photo — ${esc(cr)}</figcaption>`)}
    </figure>`)}
  </div>
</header>

${has(c.bio_long) || has(c.bio_short) ? `
<section class="section paper wrap reveal" id="bio">
  ${label("Bio")}
  <div class="bio">
    <div>
      ${when(c.bio_short, (b) => `<p class="bio__lead">${esc(b)}</p>`)}
      ${when(c.bio_long, (ps) => ps.map((p) => `<p>${esc(p)}</p>`).join(""))}
    </div>
    ${when(c.facts, pairs)}
  </div>
</section>` : ""}

${has(c.photos) ? `
<section class="section night" id="live">
  <div class="wrap reveal">
    ${label("Live")}
    <h2 class="section__title display">Sur scène</h2>
    ${photos(c.photos)}
  </div>
</section>` : ""}

${has(c.mixes) || has(c.sets) ? `
<section class="section paper wrap reveal" id="ecouter">
  ${label("Écouter")}
  ${when(c.mixes, (m) => `<h2 class="section__title display">Mixes</h2>${mixRows(m)}`)}
  ${when(c.sets, (s) => `<h2 class="section__title display section__title--second">Formats de set</h2>${rows(s)}`)}
</section>` : ""}

${has(c.releases) ? `
<section class="section night" id="sorties">
  <div class="wrap reveal">
    ${label("Discographie")}
    <h2 class="section__title display">Sorties</h2>
    ${releases(c.releases)}
  </div>
</section>` : ""}

${has(c.dates) ? `
<section class="section section--joined night" id="dates">
  <div class="wrap reveal">
    ${label("Sélection de dates")}
    <div class="dates">
      ${c.dates.map((g) => `<div><h3>${esc(g.group)}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
    </div>
  </div>
</section>` : ""}

${has(c.press) ? `
<section class="section paper wrap reveal" id="presse">
  ${label("Presse")}
  ${quotes(c.press)}
</section>` : ""}

${has(c.tech) ? `
<section class="section paper wrap reveal" id="technique">
  ${label("Technique")}
  <h2 class="section__title display">Fiche technique</h2>
  <div class="bio">
    ${pairs(c.tech)}
    <div>
      <p>Le détail complet — hospitalité, timing, voyage — est dans la fiche technique. Elle part avec le contrat.</p>
      <div class="linklist">
        ${when(c.rider_url, (u) => `<a href="${esc(u)}">Fiche technique (PDF)</a>`)}
        ${when(c.pdf_url, (u) => `<a href="${esc(u)}">Presskit (PDF)</a>`)}
      </div>
    </div>
  </div>
</section>` : ""}

<section class="section paper wrap reveal" id="contact">
  ${label("Contact")}
  <div class="contact">
    <div>
      <h2 class="section__title display" style="margin-bottom:18px">Une date&nbsp;?</h2>
      ${when(c.booking_email, (m) => `<a class="contact__mail" href="mailto:${esc(m)}?subject=Demande%20de%20date%20%E2%80%94%20${encodeURIComponent(c.artist)}">${esc(m)}</a>`)}
      ${when(c.links, (l) => `<div class="linklist">${l.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join("")}</div>`)}
    </div>
    ${when(c.contacts, (list) => pairs(list.map((p) => [p.role, `${p.name} — ${p.email}`])))}
  </div>
</section>

<footer class="wrap">
  <div class="foot mono">
    <span>${esc(c.artist)}</span>
    ${when(c.updated, (u) => `<span>Mis à jour le ${esc(u)}</span>`)}
    ${when(c.press_email, (m) => `<a href="mailto:${esc(m)}">Presse — ${esc(m)}</a>`)}
    <span>Photos à créditer, ne pas recadrer.</span>
  </div>
</footer>

<script>${js}</script>
</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");

// Les notes de remplissage restent dans le dépôt, elles ne partent pas en ligne.
const notDoc = (src) => !src.toLowerCase().endsWith(".md");

// Les assets voyagent avec la page : le dossier de sortie s'héberge tel quel.
if (existsSync(join(root, "assets")) && relative(join(root, "assets"), join(outDir, "assets")) !== "") {
  cpSync(join(root, "assets"), join(outDir, "assets"), { recursive: true, filter: notDoc });
}

// Fichiers à mettre en téléchargement (PDF, dossier photos) : ils partent en ligne avec le site.
if (existsSync(join(root, "site/downloads"))) {
  cpSync(join(root, "site/downloads"), outDir, { recursive: true, filter: notDoc });
}

console.log(`✓ ${outputPath}`);
