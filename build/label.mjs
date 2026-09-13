// Page d'accueil du label. Un seul objectif : qu'on reparte avec une date ou un contact.
// Usage : node build/label.mjs site/label.json dist/site/index.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";

const [, , contentPath = "site/label.json",
          outputPath = "dist/site/index.html"] = process.argv;
const root = process.cwd();
const c = JSON.parse(readFileSync(resolve(root, contentPath), "utf8"));
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);

/* Même plomberie que la fiche artiste : la page se moque de sa profondeur. */
const SITE_ROOT = resolve(root, "dist/site");
const depth = relative(SITE_ROOT, outDir).split(/[\\/]/).filter(Boolean).length;
const up = depth ? Array(depth).fill("..").join("/") : ".";

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
const when = (v, fn) => (has(v) ? fn(v) : "");
const asset = (p = "") => (/^([a-z]+:|\/|#)/i.test(p) ? p : `${up}/${p.replace(/^\.\//, "")}`);

/* Une date passée n'est plus une invitation : elle descend dans l'archive. */
const today = new Date().toISOString().slice(0, 10);
const events = (c.events ?? []).filter((e) => has(e.date_label));
const upcoming = events.filter((e) => (e.date ?? "") >= today)
  .sort((a, b) => String(a.date).localeCompare(String(b.date)));
const past = events.filter((e) => (e.date ?? "") < today)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));
const next = upcoming[0];

const artists = (c.artists ?? []).filter((a) => has(a.name));
const posts = (c.instagram ?? []).filter((p) => has(p.src) && has(p.url));
const links = (c.links ?? []).filter((l) => has(l.url));
const booking = c.booking ?? {};
const tba = c.events_placeholder ?? {};
const mail = has(booking.email) ? `mailto:${booking.email}` : "";

/* Numérotation des sections : elle se cale sur ce qui reste après filtrage,
   sinon on affiche « 04 » juste après « 02 » et ça se voit. */
let n = 0;
const num = () => String(++n).padStart(2, "0");
const h2 = (title, sub = "") => `<h2><span class="h2__n">${num()}</span> ${esc(title)}</h2>` +
  (sub ? `<p class="sub">${esc(sub)}</p>` : "");

const css = `
:root{
  --bg:#16150F; --surface:#252420; --ink:#EDE9E3; --muted:#A8A296;
  --olive:#8FA383; --amber:#D9A441; --paper:#EDE9E3;
  --line:rgba(237,233,227,.15);
  --gutter:clamp(24px,5vw,68px);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{background:var(--bg);color:var(--ink);line-height:1.55;font-size:15px;
  font-family:"Archivo","Helvetica Neue",Arial,sans-serif;font-variant-numeric:tabular-nums;
  -webkit-font-smoothing:antialiased}
a{color:var(--olive)}
:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
.wrap{max-width:1120px;margin:0 auto;padding:0 var(--gutter)}

/* ---------- navigation ---------- */
.nav{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:16px;
  padding:12px var(--gutter);background:rgba(22,21,15,.9);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line);font-size:13px}
.nav__home{display:block;line-height:0}
.nav__logo{height:28px;width:auto;display:block}
.nav__links{display:flex;gap:20px;margin-left:auto;color:var(--muted)}
.nav__links a{color:inherit;text-decoration:none;white-space:nowrap}
.nav__links a:hover{color:var(--ink)}
@media (max-width:820px){.nav__links{display:none}}

/* ---------- ouverture ---------- */
/* padding-block, pas le raccourci : il remettait à zéro la gouttière de .wrap. */
.hero{padding-block:clamp(44px,7vw,86px) clamp(36px,5vw,58px);display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,440px);gap:clamp(28px,5vw,64px);align-items:center}
/* Le titre est le logotype lui-même : un <h1> texte en Archivo 62 % aurait contredit la marque. */
.hero h1{line-height:0;margin:0}
.hero__wordmark{width:100%;max-width:440px;height:auto;display:block;margin-left:auto}
.hero__lede{margin-top:0;max-width:52ch;font-size:clamp(16px,1.9vw,20px);line-height:1.45}
.hero__meta{display:flex;flex-wrap:wrap;gap:8px 24px;margin-top:22px;font-size:13px;color:var(--muted)}
@media (max-width:820px){
  .hero{grid-template-columns:1fr;gap:26px}
  /* Le logotype est déjà dans la barre : répété juste dessous, il ferait doublon.
     Visuellement masqué seulement — le <h1> reste pour les lecteurs d'écran et le SEO. */
  .hero__fig{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
}

/* La prochaine date, en ouverture : c'est la seule information périssable. */
.nextdate{text-decoration:none;color:inherit;display:flex;flex-wrap:wrap;align-items:center;gap:14px 26px;
  border:1px solid var(--line);border-left:3px solid var(--amber);
  padding:16px 20px;margin-top:30px}
.nextdate__k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);
  font-weight:600}
.nextdate__d{font-weight:700;font-stretch:76%;font-size:19px}
.nextdate__t{color:var(--muted);font-size:13.5px;margin-right:auto}
.nextdate__t b{color:var(--ink);font-weight:500}
/* Sans date au calendrier, le même bandeau annonce l'absence plutôt que de disparaître :
   une page de label sans rubrique « dates » se lit comme un label à l'arrêt. */
.nextdate--tba .nextdate__d{font-stretch:62%;font-size:23px;letter-spacing:.02em}

.tba{border:1px dashed var(--line);padding:clamp(30px,5vw,52px) clamp(24px,4vw,42px);
  display:flex;flex-wrap:wrap;align-items:center;gap:20px 40px}
.tba__l{font-size:clamp(30px,5.4vw,58px);font-weight:700;font-stretch:62%;line-height:.92;
  letter-spacing:-.005em;color:var(--amber)}
.tba__n{color:var(--muted);font-size:14.5px;max-width:44ch;margin-right:auto;line-height:1.5}

section{border-top:1px solid var(--line)}
section.wrap{padding-block:clamp(44px,6vw,72px)}
h2{font-size:13px;font-weight:600;display:flex;align-items:baseline;gap:14px;margin-bottom:26px}
.h2__n{color:var(--muted);font-size:11px;font-weight:500}
.sub{color:var(--muted);font-size:13.5px;max-width:58ch;margin:-16px 0 26px}

/* ---------- collectif ---------- */
.about{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);
  gap:clamp(28px,5vw,64px);align-items:start}
.about p{max-width:60ch;font-size:15.5px;color:var(--muted)}
.about p+p{margin-top:14px}
.about p:first-child{color:var(--ink);font-size:clamp(17px,2.1vw,21px);line-height:1.45}
.facts{border-top:1px solid var(--line)}
.facts>div{display:grid;grid-template-columns:104px 1fr;gap:16px;padding:11px 0;
  border-bottom:1px solid var(--line)}
.facts dt{color:var(--muted);font-size:12.5px}
.facts dd{font-size:14px}
@media (max-width:820px){.about{grid-template-columns:1fr}}

/* ---------- artistes ---------- */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:14px;
  align-items:start}
.card{background:var(--bg);border:1px solid var(--line);display:flex;flex-direction:column;
  text-decoration:none;color:inherit;transition:background .15s}
a.card:hover{background:var(--surface)}
.card__img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;object-position:50% 22%;
  display:block;filter:grayscale(1) contrast(1.06);transition:filter .2s}
a.card:hover .card__img{filter:grayscale(.4) contrast(1.06)}
.card__body{padding:18px 18px 20px;display:flex;flex-direction:column;gap:7px;flex:1}
.card__name{font-size:25px;font-weight:700;font-stretch:62%;line-height:1}
.card__role{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--amber);
  font-weight:600}
.card__meta{font-size:12.5px;color:var(--muted)}
.card__note{font-size:13.5px;color:var(--muted);line-height:1.5;margin-top:2px}
.card__go{margin-top:auto;padding-top:14px;font-size:13px;color:var(--olive);font-weight:500}
.card__go a{text-decoration:none}
.card__go a:hover{text-decoration:underline}
/* La carte « ouverte » n'a pas de photo : elle ne doit pas se lire comme un artiste. */
.card--open{border-style:dashed;justify-content:center;min-height:230px}
.card--open .card__body{gap:10px}

/* ---------- dates ---------- */
.ev{display:grid;grid-template-columns:118px minmax(0,1fr) auto;gap:20px 26px;
  padding:20px 0;border-bottom:1px solid var(--line);align-items:baseline}
.ev:first-child{border-top:1px solid var(--line)}
.ev__date{font-weight:700;font-stretch:62%;font-size:31px;line-height:.92}
.ev__date span{display:block;font-size:12px;font-stretch:100%;font-weight:500;
  letter-spacing:.1em;color:var(--muted);margin-bottom:5px}
.ev__title{font-size:19px;font-weight:600}
.ev__meta{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.6}
.ev__lineup{font-size:13.5px;margin-top:8px}
.ev__lineup i{font-style:normal;color:var(--muted)}
.ev__note{font-size:12.5px;color:var(--amber);margin-top:8px}
.ev__act{text-align:right;font-size:13px}
.ev__price{color:var(--amber);font-weight:600;display:block;margin-bottom:9px}
.ticket{display:inline-block;padding:11px 17px;background:var(--olive);color:var(--bg);
  font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap;transition:filter .15s}
.ticket:hover{filter:brightness(1.1)}
.soon{color:var(--muted);font-size:12.5px;white-space:nowrap}
.ev--past{opacity:.55}
.ev--past .ev__date{font-size:22px}
@media (max-width:700px){
  .ev{grid-template-columns:1fr;gap:0}
  .ev__date{font-size:26px;margin-bottom:10px}
  .ev__act{text-align:left;margin-top:14px}
}
.archive{margin-top:34px}
.archive>summary{cursor:pointer;font-size:13px;color:var(--muted);padding:6px 0}

/* ---------- instagram ---------- */
.igrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px}
.igrid a{display:block;position:relative}
.igrid img{width:100%;height:auto;aspect-ratio:1;object-fit:cover;display:block;
  transition:opacity .15s}
.igrid a:hover img{opacity:.78}
.follow{display:flex;flex-wrap:wrap;align-items:center;gap:16px 28px;
  background:var(--surface);padding:24px 26px;margin-top:18px}
.follow__h{font-weight:700;font-stretch:76%;font-size:20px}
.follow__n{color:var(--muted);font-size:13.5px;max-width:46ch;margin-right:auto}
.btn{display:inline-block;padding:12px 20px;border:1px solid var(--olive);color:var(--olive);
  font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap;transition:.15s}
.btn:hover{background:var(--olive);color:var(--bg)}

/* ---------- booking ---------- */
.book{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,320px);
  gap:clamp(28px,5vw,64px);align-items:start}
.asks{list-style:none}
.asks li{padding:13px 0 13px 26px;border-bottom:1px solid var(--line);font-size:14.5px;
  position:relative;color:var(--muted)}
.asks li:first-child{border-top:1px solid var(--line)}
.asks li::before{content:"";position:absolute;left:0;top:21px;width:11px;height:1px;
  background:var(--olive)}
.bookcard{background:var(--paper);color:#1A1917;padding:24px}
.bookcard__k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6B665E;
  font-weight:600}
.bookcard__m{display:block;margin-top:10px;font-size:clamp(16px,2.2vw,20px);font-weight:600;
  color:#1A1917;word-break:break-word}
.bookcard__n{margin-top:14px;font-size:13.5px;color:#6B665E;line-height:1.5}
.bookcard .btn{margin-top:18px;border-color:#4A5D45;color:#4A5D45}
.bookcard .btn:hover{background:#4A5D45;color:var(--paper)}
@media (max-width:820px){.book{grid-template-columns:1fr}}

footer.wrap{padding-block:30px 46px}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:12px;
  display:flex;flex-wrap:wrap;gap:8px 26px}
footer a{color:var(--muted)}
`;

const lineup = (l = []) => l.map((s) => {
  const [name, note] = String(s).split(/\s+—\s+/);
  return esc(name) + (note ? ` <i>${esc(note)}</i>` : "");
}).join(" · ");

const eventRow = (e, isPast = false) => `
  <div class="ev${isPast ? " ev--past" : ""}">
    <div class="ev__date">${(e.date_label ?? []).map((d, i) =>
      i === 0 ? `<span>${esc(d)}</span>` : esc(d)).join("")}</div>
    <div>
      <div class="ev__title">${esc(e.title)}</div>
      <div class="ev__meta">${[e.format, e.place && `${e.place}, ${e.city ?? ""}`.trim().replace(/,$/, ""), e.time]
        .filter(has).map(esc).join(" · ")}</div>
      ${when(e.lineup, (l) => `<div class="ev__lineup">${lineup(l)}</div>`)}
      ${!isPast ? when(e.note, (t) => `<div class="ev__note">${esc(t)}</div>`) : ""}
    </div>
    <div class="ev__act">
      ${when(e.price, (p) => `<span class="ev__price">${esc(p)}</span>`)}
      ${isPast ? "" : has(e.ticket_url)
        ? `<a class="ticket" href="${esc(e.ticket_url)}" rel="noopener">Billetterie</a>`
        : `<span class="soon">Billetterie bientôt</span>`}
    </div>
  </div>`;

const artistCard = (a) => {
  const inner = `
    ${when(a.photo, (p) => `<img class="card__img" src="${esc(asset(p))}" alt="" loading="lazy">`)}
    <div class="card__body">
      ${when(a.role, (r) => `<div class="card__role">${esc(r)}</div>`)}
      <div class="card__name">${esc(a.name)}</div>
      ${when(a.meta, (m) => `<div class="card__meta">${esc(m)}</div>`)}
      ${when(a.note, (t) => `<div class="card__note">${esc(t)}</div>`)}
      ${has(a.url) ? `<div class="card__go">Presskit et booking →</div>` : ""}
    </div>`;
  return has(a.url)
    ? `<a class="card" href="${esc(asset(a.url))}">${inner}</a>`
    : `<div class="card">${inner}</div>`;
};

const open = c.artists_open ?? {};
const openCard = has(open.title) ? `
  <div class="card card--open">
    <div class="card__body">
      <div class="card__name">${esc(open.title)}</div>
      ${when(open.note, (t) => `<div class="card__note">${esc(t)}</div>`)}
      ${mail && has(open.cta)
        ? `<div class="card__go"><a href="${esc(mail)}">${esc(open.cta)} →</a></div>` : ""}
    </div>
  </div>` : "";

const navLinks = [
  ["#collectif", "Le collectif"],
  [artists.length ? "#artistes" : "", "Artistes"],
  ["#dates", "Dates"],
  ["#instagram", "Instagram"],
  ["#booking", "Booking"],
].filter(([href]) => href);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.name)} — Collectif et label minimal / micro house, Lille</title>
<meta name="description" content="${esc(has(c.lede) ? c.lede : c.baseline)}">
<meta property="og:title" content="${esc(c.name)} — Lille">
<meta property="og:description" content="${esc(c.baseline)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${esc(asset("brand-assets/logo/og-1200.png"))}">
<link rel="icon" href="${up}/brand-assets/logo/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="${up}/brand-assets/logo/favicon.svg">
<link rel="apple-touch-icon" href="${up}/brand-assets/logo/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<nav class="nav">
  <a class="nav__home" href="#top" aria-label="${esc(c.name)}"><img class="nav__logo" src="${up}/brand-assets/logo/nom-papier.svg" alt="" width="4795" height="1458"></a>
  <div class="nav__links">
    ${navLinks.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("")}
  </div>
</nav>

<header class="wrap hero" id="top">
  <div>
    ${when(c.lede, (t) => `<p class="hero__lede">${esc(t)}</p>`)}
    ${when(c.meta, (m) => `<div class="hero__meta">${m.map((x) =>
      `<span>${esc(x)}</span>`).join("")}</div>`)}
    ${next ? `
    <a class="nextdate" href="#dates">
      <span class="nextdate__k">Prochaine date</span>
      <span class="nextdate__d">${esc((next.date_label ?? []).join(" "))}</span>
      <span class="nextdate__t"><b>${esc(next.title)}</b> — ${esc(next.place ?? "")}</span>
    </a>` : has(tba.label) ? `
    <a class="nextdate nextdate--tba" href="#dates">
      <span class="nextdate__k">Prochaine date</span>
      <span class="nextdate__d">${esc(tba.label)}</span>
    </a>` : ""}
  </div>
  <h1 class="hero__fig"><img class="hero__wordmark" src="${up}/brand-assets/logo/nom-papier.svg" alt="${esc(c.name)}" width="4795" height="1458"></h1>
</header>

<main>

<section class="wrap" id="collectif">
  ${h2("Le collectif")}
  <div class="about">
    <div>${(c.about ?? []).filter(has).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${when(c.facts, (f) => `<dl class="facts">${f.filter(([, v]) => has(v)).map(([k, v]) =>
      `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`)}
  </div>
</section>

${artists.length ? `
<section class="wrap" id="artistes">
  ${h2("Les artistes", "Chaque fiche porte le presskit, la fiche technique et le contact booking.")}
  <div class="cards">
    ${artists.map(artistCard).join("")}
    ${openCard}
  </div>
</section>` : ""}

<section class="wrap" id="dates">
  ${h2("Les dates")}
  ${upcoming.length ? upcoming.map((e) => eventRow(e)).join("") : `
  <div class="tba">
    <div class="tba__l">${esc(tba.label ?? "To be announced")}</div>
    ${when(tba.note, (t) => `<p class="tba__n">${esc(t)}</p>`)}
    ${has(tba.cta) && has(c.instagram_url)
      ? `<a class="btn" href="${esc(c.instagram_url)}" rel="noopener">${esc(tba.cta)}</a>` : ""}
  </div>`}
  ${past.length ? `
  <details class="archive">
    <summary>Les dates passées (${past.length})</summary>
    ${past.map((e) => eventRow(e, true)).join("")}
  </details>` : ""}
</section>

<section class="wrap" id="instagram">
  ${h2("Sur Instagram")}
  ${posts.length ? `<div class="igrid">${posts.slice(0, 12).map((p) =>
    `<a href="${esc(p.url)}" rel="noopener"><img src="${esc(asset(p.src))}"
       alt="${esc(p.alt ?? "")}" loading="lazy"></a>`).join("")}</div>` : ""}
  <div class="follow">
    <div>
      <div class="follow__h">@${esc(c.instagram_handle)}</div>
    </div>
    ${when(c.instagram_note, (t) => `<p class="follow__n">${esc(t)}</p>`)}
    <a class="btn" href="${esc(c.instagram_url)}" rel="noopener">Suivre le collectif</a>
  </div>
</section>

<section class="wrap" id="booking">
  ${h2("Booking et contact")}
  <div class="book">
    <ul class="asks">
      ${(booking.asks ?? []).filter(has).map((a) => `<li>${esc(a)}</li>`).join("")}
    </ul>
    ${mail ? `
    <div class="bookcard">
      <div class="bookcard__k">Écrire au collectif</div>
      <a class="bookcard__m" href="${esc(mail)}">${esc(booking.email)}</a>
      ${when(booking.note, (t) => `<p class="bookcard__n">${esc(t)}</p>`)}
      <a class="btn" href="${esc(mail)}">Demander une date</a>
    </div>` : ""}
  </div>
</section>

</main>

<footer class="wrap">
  <span>© ${new Date().getFullYear()} ${esc(c.name)} — Lille</span>
  ${links.map((l) => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join("")}
  ${when(c.updated, (d) => `<span>Mis à jour le ${esc(d)}</span>`)}
</footer>

</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");

const notDoc = (f) => !f.toLowerCase().endsWith(".md");
for (const [from, to] of [
  ["assets", join(SITE_ROOT, "assets")],
  ["site/brand-assets/logo", join(SITE_ROOT, "brand-assets/logo")],
]) {
  const s = join(root, from);
  if (existsSync(s)) cpSync(s, to, { recursive: true, filter: notDoc });
}

console.log(`✓ ${outputPath}  (${artists.length} artiste(s), ${upcoming.length} date(s) à venir` +
  `, ${posts.length} post(s))`);
