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
  "01-base": ["Base", "La proposition telle quelle : anneaux devenus bras, planète pleine, casquette. La plus directe."],
  "02-trait": ["Trait", "Tout au contour. Plus léger, tient mieux en petit et à l'impression une couleur."],
  "03-incline": ["Anneau incliné", "L'anneau franchement penché, bras plus hauts. Plus de mouvement, silhouette moins stable."],
  "04-clin": ["Clin d'œil", "Un œil fermé, visière à gauche. Le plus chaleureux, le moins sérieux."],
  "05-marche": ["En marche", "Jambes décalées, yeux en traits. Suggère le déplacement — utile en animation."],
  "06-papier": ["Sur papier", "Le même, inversé pour les fonds clairs. À vérifier : la casquette s'y lit autrement."],
  "07-accent": ["Casquette olive", "La seule qui reste lisible sur n'importe quel fond. Consomme l'accent de la charte."],
  "08-badge": ["Badge", "Enfermé dans un cercle. Pour un avatar, un tampon, une sérigraphie."],
  "09-tete": ["Tête seule", "Sans corps. Le seul qui tienne à 32 px, là où les jambes deviennent une bouillie."],
  "10-signature": ["Signature", "Mascotte et nom réunis. Le nom est ici tracé au trait — le logotype réel est en /brand."],
};

const files = readdirSync(SRC).filter((f) => f.endsWith(".svg")).sort();

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
  background:var(--line);border:1px solid var(--line);margin:38px 0 60px}
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
footer{border-top:1px solid var(--line);padding:28px 0 70px;color:var(--muted);font-size:12px;
  display:flex;flex-wrap:wrap;gap:8px 24px}
footer a{color:var(--muted)}
`;

const cards = files.map((f, i) => {
  const key = f.replace(".svg", "");
  const [title, note] = NOTES[key] ?? [key, ""];
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
<title>Pistes de mascotte — Parallel Universe</title>
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
  <p class="lede">Une planète à deux jambes et deux bras, <b>les anneaux prolongés en bras tendus</b>, deux yeux et une casquette. Toutes les pistes partagent la même géométrie : ce qui change, c'est le traitement — plein ou contour, inclinaison, expression, mise en situation.</p>
  <p class="lede">Elles sont dessinées dans la charte du label : deux couleurs, traits épais, aucun aplat superflu. L'enjeu n'est pas qu'elles soient jolies en grand, mais qu'elles restent lisibles en petit — d'où les vignettes à 56 et 32 px sous chacune.</p>
  <div class="warn"><b>Page interne</b>
  Elle sert à choisir avant lancement. La mascotte est une direction opposée au logotype sobre de <a href="brand">la charte</a> : les deux peuvent coexister, le logotype signant les documents et la mascotte portant le côté collectif — mais il faut le décider, sinon on se retrouve avec deux marques.</div>
</header>

<div class="wrap"><div class="grid">${cards}</div></div>

<footer class="wrap">
  <span>Parallel Universe — Lille</span>
  <span>Pistes, septembre 2026</span>
  <a href="brand">Charte graphique</a>
  <a href="artistes/a-res">Presskit A.RES</a>
</footer>
</body>
</html>
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outAbs, html, "utf8");
console.log(`✓ ${outputPath}  (${files.length} pistes)`);
