// Génère la page /brand : la charte du label, en ligne.
// Usage : node build/brand.mjs dist/site/brand.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const [, , outputPath = "dist/site/brand.html"] = process.argv;
const root = process.cwd();
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);
const A = "brand-assets";

/* ---------- données ---------- */

const palette = {
  principale: [
    ["Encre", "#16150F", "Le fond, partout. Noir chaud teinté de vert-brun, pas un noir d'écran."],
    ["Surface", "#252420", "Encarts, séparations, second plan. À peine perceptible — c'est voulu."],
    ["Papier", "#EDE9E3", "Le texte, et les aplats de respiration. Carton non blanchi, jamais blanc pur."],
    ["Papier sourd", "#A8A296", "Dates, légendes, mentions secondaires."],
    ["Olive", "#8FA383", "Liens, boutons, éléments actifs."],
    ["Ambre", "#D9A441", "Rare. Un seul par écran : un prix, une date, le bouton billetterie."],
  ],
  papier: [
    ["Papier", "#EDE9E3", "Le fond."],
    ["Papier ombré", "#DDD7CC", "Encarts et séparations."],
    ["Encre", "#1A1917", "Titres et texte. Jamais #000000."],
    ["Encre sourde", "#6B665E", "Légendes et métadonnées."],
    ["Olive", "#4A5D45", "Liens et boutons."],
    ["Ambre", "#7A5A1E", "L'accent rare."],
  ],
};

const echelle = [
  ["Titre", "125 % de largeur, 700, interlettrage −0.03 em", 34, 125, 700, "Dimanche 6 décembre"],
  ["Sous-titre", "100 %, 600", 21, 100, 600, "Le café-croissant du dimanche"],
  ["Courant", "100 %, 400, interlignage 1.55", 15, 100, 400, "Minimal et micro house, de 11h à 17h, entrée 8 €"],
  ["Mention", "100 %, 500, en papier sourd", 11, 100, 500, "Photo Camille Rousseau, tous droits réservés"],
  ["Affiche", "62 %, 700, capitales", 30, 62, 700, "UNIVERS PARALLELE"],
];

const gabarits = [
  ["affiche-a3.png", "Affiche A3", "297 × 420 mm", "affiche-a3.pdf", "PDF vectoriel"],
  ["story-1080x1920.png", "Story", "1080 × 1920", null, null],
  ["carre-1080x1080.png", "Carré", "1080 × 1080", null, null],
  ["cover-1500x1500.png", "Cover de mix", "1500 × 1500", null, null],
];

const fichiers = [
  ["logo/nom-papier.svg", "Nom, papier — pour fond sombre"],
  ["logo/nom-encre.svg", "Nom, encre — pour fond clair"],
  ["logo/nom-papier-2000.png", "Nom, papier, PNG 2000 px sans fond"],
  ["logo/nom-encre-2000.png", "Nom, encre, PNG 2000 px sans fond"],
  ["logo/up-papier.svg", "UP, papier"],
  ["logo/up-encre.svg", "UP, encre"],
  ["logo/up-olive.svg", "UP, olive"],
  ["logo/up-papier-1000.png", "UP, papier, PNG 1000 px sans fond"],
  ["logo/favicon-512.png", "Icône 512 px"],
];

/* ---------- rendu ---------- */

const swatch = (list) =>
  list.map(([nom, hex, usage]) => `
    <div class="sw">
      <div class="sw__chip" style="background:${hex}"></div>
      <div class="sw__body">
        <span class="sw__name">${nom}</span>
        <span class="sw__hex">${hex}</span>
        <p class="sw__use">${usage}</p>
      </div>
    </div>`).join("");

const css = readFileSync(join(root, "build/label.css"), "utf8") + `
.hero{padding:var(--rhythm) 0 calc(var(--rhythm) * .7)}
.hero h1{font-size:clamp(38px,7vw,76px);font-weight:700;font-stretch:118%;
  letter-spacing:-.028em;line-height:1}
.hero p{margin-top:22px;max-width:58ch;color:var(--muted);font-size:clamp(15px,1.6vw,18px)}
.hero .mark{width:clamp(180px,26vw,320px);height:auto;display:block;margin-bottom:34px}

section{padding:calc(var(--rhythm) * .55) 0;border-top:1px solid var(--line)}
h2{font-size:13px;font-weight:600;margin-bottom:8px}
.sub{color:var(--muted);font-size:14px;max-width:62ch;margin-bottom:32px}
p+p{margin-top:12px}
em{font-style:normal;color:var(--olive)}

.sws{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
  background:var(--line);border:1px solid var(--line)}
@media (max-width:860px){.sws{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.sws{grid-template-columns:1fr}}
.sw{background:var(--bg);padding:0}
.sw__chip{height:82px}
.sw__body{padding:13px 15px 17px}
.sw__name{font-weight:600;font-size:13.5px}
.sw__hex{float:right;font-size:12px;color:var(--muted);letter-spacing:.03em}
.sw__use{clear:both;font-size:12px;color:var(--muted);line-height:1.45;padding-top:6px}

.scale{border-top:1px solid var(--line)}
.scale__row{display:grid;grid-template-columns:190px 1fr;gap:24px;align-items:baseline;
  padding:18px 0;border-bottom:1px solid var(--line)}
.scale__k{font-size:12px;color:var(--muted);line-height:1.4}
.scale__s{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:640px){.scale__row{grid-template-columns:1fr;gap:8px}}

.logos{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:34px;align-items:end}
.logos figure{margin:0;min-width:0}
.logos img{display:block;max-width:100%;height:auto}
.logos figcaption{font-size:12px;color:var(--muted);padding-top:14px;line-height:1.45}
@media (max-width:900px){.logos{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.logos{grid-template-columns:1fr}}
.round{border-radius:50%}

.tpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:26px}
.tpl figure{margin:0}
.tpl img{display:block;width:100%;height:auto;background:var(--surface);
  border:1px solid var(--line)}
.tpl figcaption{font-size:12px;padding-top:11px;color:var(--muted)}
.tpl b{display:block;color:var(--ink);font-weight:600;font-size:13px;margin-bottom:2px}

.files{columns:2;column-gap:38px;font-size:13.5px;max-width:760px}
.files a{display:block;padding:5px 0;text-decoration:none;break-inside:avoid}
.files a:hover{text-decoration:underline}
.files span{color:var(--muted);font-size:12px;display:block}
@media (max-width:640px){.files{columns:1}}

.cta{display:inline-block;margin-top:8px;padding:13px 24px;background:var(--olive);
  color:var(--bg);font-weight:600;font-size:14px;text-decoration:none}
.cta:hover{filter:brightness(1.08)}

.rules{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:8px}
.rules h3{font-size:13px;font-weight:600;padding-bottom:9px;border-bottom:1px solid currentColor}
.rules .yes h3{color:var(--olive)}
.rules .no h3{color:var(--amber)}
.rules li{list-style:none;padding:14px 0;border-bottom:1px solid var(--line);font-size:13px;
  color:var(--muted)}
.rules b{display:block;color:var(--ink);font-weight:600;margin-bottom:3px}
@media (max-width:700px){.rules{grid-template-columns:1fr;gap:26px}}

footer{border-top:1px solid var(--line);padding:30px 0 64px;font-size:12px;color:var(--muted);
  display:flex;flex-wrap:wrap;gap:20px}
footer a{color:var(--muted)}
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Univers Parallele — Charte graphique</title>
<meta name="description" content="Palette, typographie, logo et gabarits du collectif Univers Parallele, Lille.">
<meta property="og:title" content="Univers Parallele — Charte graphique">
<meta property="og:description" content="Palette, typographie, logo et gabarits.">
<meta property="og:type" content="website">
<meta property="og:image" content="${A}/logo/og-1200.png">
<link rel="icon" type="image/svg+xml" href="${A}/logo/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>

<nav class="nav">
  <span class="nav__name">UNIVERS PARALLELE</span>
  <div class="nav__links">
    <a href="#palette">Palette</a>
    <a href="#typo">Typographie</a>
    <a href="#logo">Logo</a>
    <a href="#up">UP</a>
    <a href="#gabarits">Gabarits</a>
    <a href="logos">Pistes</a>
    <a class="nav__home" href="/">Presskit A.RES</a>
  </div>
</nav>

<header class="hero wrap">
  <img class="mark" src="${A}/logo/nom-papier.svg" alt="Univers Parallele" width="4795" height="1458">
  <h1>Charte graphique</h1>
  <p>Un disque noir, une étiquette en papier. La charte part d'une matière plutôt que d'un genre musical : le vinyle mat, et le carton non blanchi de l'étiquette centrale. Le fond est sombre parce qu'un disque l'est, et parce qu'un site de label se consulte le soir.</p>
  <p><em>Univers Parallele, c'est le dimanche matin au lieu du samedi soir. La face B. Le disque resté au fond du bac.</em> Un décalage, pas de l'espace — d'où l'absence de violet, d'étoiles et de dégradés.</p>
  <p><a class="cta" href="${A}/charte-graphique.pdf">Charte complète en PDF, 12 planches</a></p>
</header>

<section id="palette" class="wrap">
  <h2>Palette principale</h2>
  <p class="sub">Le thème par défaut. Site, réseaux, affiches, covers de mix.</p>
  <div class="sws">${swatch(palette.principale)}</div>

  <h2 style="margin-top:52px">Palette papier</h2>
  <p class="sub">La déclinaison claire : documents imprimés, presskits, dossiers de subvention. Les accents s'assombrissent, ceux du thème principal disparaîtraient sur fond clair. Ne jamais réutiliser un accent d'une palette dans l'autre.</p>
  <div class="sws">${swatch(palette.papier)}</div>

  <p class="sub" style="margin-top:32px">Contrastes vérifiés au calcul : encre sur fond 15.12:1, texte sourd 7.21:1, olive 6.74:1, ambre 8.13:1. Tout dépasse le seuil WCAG AA de 4.5:1, dans les deux thèmes. Olive et ambre se distinguent aussi par la luminosité — la palette reste lisible en déficience de vision des couleurs.</p>
</section>

<section id="typo" class="wrap">
  <h2>Typographie</h2>
  <p class="sub">Archivo, une seule famille sur toute la marque. Le contraste vient de l'échelle et de la largeur — variable de 62 % à 125 % — jamais du mélange de deux familles. Le nom étant générique, ce système typographique est le principal signe distinctif : ajouter une police le dilue.</p>
  <div class="scale">
    ${echelle.map(([k, d, size, wdth, wght, sample]) => `
    <div class="scale__row">
      <div class="scale__k"><b>${k}</b><br>${d}</div>
      <div class="scale__s" style="font-size:${size}px;font-stretch:${wdth}%;font-weight:${wght};letter-spacing:${wdth > 110 ? "-.03em" : "0"}">${sample}</div>
    </div>`).join("")}
  </div>
</section>

<section id="logo" class="wrap">
  <h2>Logo</h2>
  <p class="sub">Deux signes, pas un de plus. Le nom signe tout ; UP le remplace là où il ne se lit plus. Archivo largeur 75 %, graisse 900, interlettrage −0,03 em, deux lignes centrées. Vectorisé en tracés — aucune police requise pour l'ouvrir.</p>
  <div class="logos">
    <figure><img src="${A}/logo/nom-papier.svg" width="320" alt="Univers Parallele">
      <figcaption>Le nom. Site, documents, affiches, merch. Minimum 96 px de large.</figcaption></figure>
  </div>
  <p class="sub" style="margin-top:34px">Zone de protection : la hauteur d'une capitale autour du bloc. Ne jamais étirer, recolorer hors palette, ni retaper le nom en police.</p>
</section>

<section id="up" class="wrap">
  <h2>UP</h2>
  <p class="sub">Le U et le P partagent la même barre. Le signe des petites tailles : photos de profil, favicon, icône, tampon. Jamais à côté du nom.</p>
  <div class="logos">
    <figure><img src="${A}/logo/up-papier.svg" width="160" alt="UP">
      <figcaption>Papier, sur fond sombre.</figcaption></figure>
    <figure><img src="${A}/logo/favicon.svg" width="132" alt="">
      <figcaption>Tuile encre. Favicon et icônes.</figcaption></figure>
  </div>
</section>

<section id="gabarits" class="wrap">
  <h2>Gabarits</h2>
  <p class="sub">Quatre visuels générés depuis un seul fichier de données. On change le texte, tout se recompose — aucun éditeur graphique. La story réserve 130 px en haut et en bas : l'interface Instagram y recouvre le visuel, et c'est ce qui trahit une story faite maison.</p>
  <div class="tpl">
    ${gabarits.map(([img, nom, dim, pdf, pdfLabel]) => `
    <figure>
      <img src="${A}/gabarits/${img}" alt="${nom}" loading="lazy">
      <figcaption><b>${nom}</b>${dim}${pdf ? ` — <a href="${A}/gabarits/${pdf}">${pdfLabel}</a>` : ""}</figcaption>
    </figure>`).join("")}
  </div>
</section>

<section class="wrap">
  <h2>Usage</h2>
  <p class="sub">Un seul accent visible à l'écran à la fois. La finesse ne vient pas des couleurs choisies, elle vient de leur rareté.</p>
  <div class="rules">
    <ul class="yes">
      <h3>Ce qui tient</h3>
      <li><b>Beaucoup de vide</b>Le blanc autour d'un titre vaut plus qu'un effet. C'est gratuit et personne ne le fait.</li>
      <li><b>Un ton retenu</b>Une date, un lieu, un line-up. Rien à vendre dans la phrase.</li>
      <li><b>Des photos à grain</b>Lumière naturelle, pas de flash saturé. Un fanzine, pas un compte de club.</li>
    </ul>
    <ul class="no">
      <h3>Ce qui casse</h3>
      <li><b>Tout ce qui évoque l'espace</b>Violet, étoiles, dégradés galaxie. Le nom y pousse ; la marque dit l'inverse.</li>
      <li><b>Le noir pur et le blanc pur</b>#000000 et #FFFFFF sont froids et absents de la palette.</li>
      <li><b>Les superlatifs</b>« Line-up de fou », les flammes, les compteurs de places restantes.</li>
    </ul>
  </div>
</section>

<section id="fichiers" class="wrap">
  <h2>Fichiers</h2>
  <p class="sub">SVG pour tout usage vectoriel, PNG transparents pour les plateformes qui n'acceptent pas le SVG.</p>
  <div class="files">
    ${fichiers.map(([f, d]) => `<a href="${A}/${f}">${f.split("/").pop()}<span>${d}</span></a>`).join("")}
  </div>
</section>

<footer class="wrap">
  <span>Univers Parallele — Lille</span>
  <span>Charte v1, septembre 2026</span>
  <a href="/">Presskit A.RES</a>
</footer>

</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");

// Les assets de marque voyagent avec la page.
const src = join(root, "site/brand-assets");
if (existsSync(src)) cpSync(src, join(outDir, A), { recursive: true });

console.log(`✓ ${outputPath}`);
