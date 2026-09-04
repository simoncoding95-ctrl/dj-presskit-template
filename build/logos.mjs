// Page de présentation des pistes de mascotte. Interne : sert à choisir, pas à publier.
// Usage : node build/logos.mjs dist/site/logos.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const [, , outputPath = "dist/site/logos.html"] = process.argv;
const root = process.cwd();
const outAbs = resolve(root, outputPath);
const outDir = dirname(outAbs);
const SRC = join(root, "site/brand-assets/concepts");
const A = "brand-assets/concepts";

const NOTES = {
  "01-bandeau": ["Bandeau", "Le nom porté par un parallèle épaissi. Pose posée, lecture immédiate : la version qui sert de référence."],
  "02-danse": ["Danse", "Bras dissymétriques, appui déporté, corps penché. Le mouvement vient des angles, pas d'un effet."],
  "03-trait": ["Trait", "Globe au contour, sans aplat. Plus léger, meilleur en petit et en sérigraphie une couleur."],
  "04-arc": ["Arc", "Le nom courbé au-dessus, bras levés en écho. Le plus proche d'une étiquette de disque."],
  "05-elan": ["Élan", "Bras tendu haut, nom sur deux lignes dont une en olive. La plus verticale, bonne en story."],
  "06-horizontal": ["Horizontal", "Mascotte à gauche, nom à droite. Le format des en-têtes, des signatures et des bandeaux."],
  "07-badge": ["Badge", "Cerclé, nom en arc. Pour un tampon, un sticker, une pastille de vinyle."],
  "08-papier": ["Sur papier", "L'inverse, pour les fonds clairs. La casquette prend un liseré, sinon elle fusionne avec le globe."],
  "09-encre": ["Casquette encre", "Sans accent de couleur. Tient en une seule encre, mais dépend du liseré pour se détacher."],
  "10-compact": ["Compact", "Nom réduit sous la figure. C'est la version à tester en favicon et en avatar."],

  "b1-globe-seul": ["Globe seul", "Pas de personnage du tout. Les parallèles et le nom suffisent-ils ? C'est la question que pose cette piste, et la réponse est peut-être oui."],
  "b2-lever": ["Lever de planète", "Le globe se lève derrière un horizon. Sobre, horizontal, facile à décliner en bandeau."],
  "b3-dedouble": ["Dédoublé", "Deux figures identiques décalées : « parallèle » au sens propre. Riche en grand, confus en petit."],
  "b4-tranche": ["Tranché", "L'hémisphère bas décalé, comme le logotype. Le seul qui relie explicitement la mascotte au nom déjà dessiné."],
  "b5-typo": ["Typo dominante", "Le nom porte, le globe ponctue. Format d'en-tête, très lisible, mascotte réduite au signe."],
  "b6-profil": ["Profil", "Vu de côté, un bras tendu devant. Plus narratif, moins symétrique."],
  "b7-rythme": ["Rythme", "Globe écrasé et lignes de mouvement. Le plus proche d'une image de danse."],
  "b8-traverse": ["Traversé", "Le nom traverse le globe en pleine largeur. Fort, mais il coupe le visage : à trancher."],
  "b9-picto": ["Pictogramme", "Ni casquette ni yeux. Le globe et ses membres. Le plus neutre, le plus intemporel."],
  "b10-signature": ["Signature", "Figure minuscule, nom dominant, une seule ligne. Pour les en-têtes et les pieds de mail."],
};

const all = readdirSync(SRC).filter((f) => f.endsWith(".svg")).sort();
const serieA = all.filter((f) => /^\d/.test(f));
const serieB = all.filter((f) => /^b\d/.test(f))
  .sort((x, y) => parseInt(x.slice(1)) - parseInt(y.slice(1)));

const css = `
:root{--bg:#16150F;--surface:#252420;--ink:#EDE9E3;--muted:#A8A296;--olive:#8FA383;
  --amber:#D9A441;--paper:#EDE9E3;--line:rgba(237,233,227,.15)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);line-height:1.55;
  font-family:"Archivo","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,56px)}
a{color:var(--olive)}
:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
header{padding:clamp(48px,8vh,88px) 0 34px}
h1{font-size:clamp(34px,5.5vw,60px);font-weight:700;font-stretch:118%;letter-spacing:-.025em;line-height:1}
.lede{margin-top:20px;max-width:62ch;color:var(--muted);font-size:15px}
.lede b{color:var(--ink);font-weight:600}
.warn{border:1px solid var(--amber);color:var(--amber);padding:14px 17px;font-size:13px;
  line-height:1.5;margin-top:26px;max-width:74ch}
.warn b{display:block;font-weight:600;margin-bottom:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:1px;
  background:var(--line);border:1px solid var(--line);margin:22px 0 58px}
.card{background:var(--bg);padding:20px}
.card__top{display:flex;align-items:baseline;gap:9px;margin-bottom:14px}
.card__n{font-size:11px;color:var(--muted);font-weight:600}
.card__t{font-size:14.5px;font-weight:600}
.card__big{background:var(--surface);display:flex;align-items:center;justify-content:center;
  padding:14px;min-height:186px}
.card__big img{width:150px;height:auto;display:block}
.card__sizes{display:flex;align-items:flex-end;gap:16px;padding:16px 4px 0}
.card__sizes img{display:block;height:auto}
.card__sizes span{font-size:10.5px;color:var(--muted)}
.card__note{font-size:12.5px;color:var(--muted);line-height:1.5;padding-top:12px;
  border-top:1px solid var(--line);margin-top:14px}
.serie{font-size:20px;font-weight:700;font-stretch:110%;letter-spacing:-.02em;margin-top:14px}
.serie__sub{color:var(--muted);font-size:13.5px;max-width:66ch;margin-top:8px}
footer{border-top:1px solid var(--line);padding:28px 0 70px;color:var(--muted);font-size:12px;
  display:flex;flex-wrap:wrap;gap:8px 24px}
footer a{color:var(--muted)}
`;

const cards = (files) => files.map((f, i) => {
  // Les accents d'une clé ne survivent pas au nom de fichier : on compare à plat.
  const flat = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const key = flat(f.replace(".svg", ""));
  const entry = Object.entries(NOTES).find(([k]) => flat(k) === key);
  const [title, note] = entry ? entry[1] : [key, ""];
  return `
  <div class="card">
    <div class="card__top">
      <span class="card__n">${String(i + 1).padStart(2, "0")}</span>
      <span class="card__t">${title}</span>
    </div>
    <div class="card__big"><img src="${A}/${f}" alt="${title}" loading="lazy"></div>
    <div class="card__sizes">
      <img src="${A}/${f}" alt="" width="56" loading="lazy">
      <img src="${A}/${f}" alt="" width="32" loading="lazy">
      <span>56 et 32 px — c'est là que ça se décide</span>
    </div>
    <p class="card__note">${note}</p>
  </div>`;
}).join("");

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pistes de mascotte — Universe Parallele</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="brand-assets/logo/avatar-mark-512.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<header class="wrap">
  <h1>Dix pistes de mascotte</h1>
  <p class="lede">Un globe fait de ses <b>parallèles</b> — le nom du label, dessiné — sur deux jambes, deux bras tendus et une casquette. Le nom fait partie du logo dans les dix pistes. Ce qui change : la pose, le traitement du globe, et la façon dont le nom s'accroche.</p>
  <p class="lede">Un parallèle est laissé vierge à hauteur des yeux : sans cette réserve, le visage se noie dans les lignes du globe. Les yeux sont des barres et non des pastilles — les pastilles rondes font emoji. L'enjeu n'est pas qu'elles soient jolies en grand, mais qu'elles tiennent en petit : d'où les vignettes à 56 et 32 px.</p>
  <div class="warn"><b>Page interne</b>
  Elle sert à choisir avant lancement. La mascotte est une direction opposée au logotype sobre de <a href="brand">la charte</a> : les deux peuvent coexister, le logotype signant les documents et la mascotte portant le côté collectif — mais il faut le décider, sinon on se retrouve avec deux marques.</div>
</header>

<div class="wrap">
  <h2 class="serie">Série A — le personnage</h2>
  <p class="serie__sub">Même figure, dix traitements. Ce qui varie : la pose, le rendu du globe, la façon dont le nom s'accroche.</p>
  <div class="grid">${cards(serieA)}</div>

  <h2 class="serie">Série B — dix directions distinctes</h2>
  <p class="serie__sub">Pas des variations : des partis pris différents. Certaines abandonnent le personnage pour ne garder que le globe, d'autres font porter le nom. C'est ici qu'on choisit une direction, pas un détail.</p>
  <div class="grid">${cards(serieB)}</div>
</div>

<footer class="wrap">
  <span>Universe Parallele — Lille</span>
  <span>Pistes, septembre 2026</span>
  <a href="brand">Charte graphique</a>
  <a href="artistes/a-res">Presskit A.RES</a>
</footer>
</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");
console.log(`✓ ${outputPath}  (${serieA.length} + ${serieB.length} pistes)`);
