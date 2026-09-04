# DJ Presskit — template

Template de presskit DJ en Markdown, qui se compile en page HTML et en PDF envoyable aux bookers, programmateurs et journalistes. Aucune dépendance à installer : Node (déjà présent) et un navigateur Chromium suffisent.

## Utilisation

```bash
git clone <ce-repo> mon-presskit && cd mon-presskit
# 1. Remplis PRESSKIT.md et TECHNICAL-RIDER.md (tout ce qui est entre [crochets])
# 2. Dépose tes visuels dans assets/photos/
./build.sh
```

Sortie dans `dist/` :

- `dist/site/index.html` — **le site**, à héberger tel quel (les assets sont copiés à côté)
- `dist/site/exemple.html` — le même site rempli avec un artiste fictif, pour comparer
- `presskit.pdf` / `technical-rider.pdf` — les versions à envoyer par mail
- `presskit.html` / `technical-rider.html` — les mêmes en page simple

Si aucun navigateur n'est détecté, le script s'arrête après le HTML : ouvre-le et fais **Ctrl+P → Enregistrer en PDF** (marges par défaut, en-têtes/pieds de page décochés).

## Structure

| Fichier | Rôle |
|---|---|
| `site/content.json` | **Le contenu du site.** Un seul fichier à remplir. |
| `site/content.example.json` | Le même, rempli, comme référence. |
| `PRESSKIT.md` | La version document du presskit (celle qui devient un PDF). |
| `TECHNICAL-RIDER.md` | Fiche technique et hospitalité. Envoyée avec le contrat, pas avant. |
| `build/site.mjs` | `content.json` → site HTML autonome. |
| `build/site.css` `build/site.js` | Mise en forme et carrousels du site. |
| `build/render.mjs` | Markdown → HTML autonome (CSS inclus dans le fichier). |
| `build/presskit.css` | Mise en forme du document, écran et impression A4. |
| `assets/` | Photos, logos, artworks. |
| `examples/` | Un presskit fictif rempli, pour voir le niveau d'écriture visé. |

## Règles d'écriture

Ce qui fait la différence entre un presskit lu et un presskit fermé :

- **La bio courte est celle qui sert.** Les organisateurs la copient-collent sur leur event. Si elle fait 300 mots, ils la réécrivent ou la coupent mal.
- **Des faits, pas des adjectifs.** « Éclectique », « univers singulier », « passionné depuis toujours » ne dit rien de toi. Un label, une résidence, une technique, un festival : oui.
- **Antichronologique et sélectif.** Trois sorties fortes valent mieux que douze dont neuf anecdotiques. Pareil pour les dates.
- **Pas de citation inventée.** Une fausse citation presse se vérifie en dix secondes et te coûte la date.
- **Une seule photo en tête.** Paysage, 2000px minimum, sans texte incrusté, crédit photographe indiqué.
- **Un lien qui marche.** Le premier mix listé est le seul qui sera écouté : mets le meilleur en haut.
- **Date de mise à jour visible.** Un presskit de 2023 signale un projet à l'arrêt.

## Le site

Deux matières, une par usage : le papier gris chaud pour ce qui se lit (bio, formats de set, dates, technique, contact), les panneaux sombres pour ce qui se regarde et s'écoute (photos, sorties). Trois carrousels — photos, sorties, citations — au clavier, à la souris et au doigt.

Une section disparaît d'elle-même si son tableau est vide dans `content.json` : pas de section « Presse » tant qu'il n'y a pas de citation, pas de « Sorties » avant la première sortie. Enlève, ne remplis pas de vide.

Le thème tient dans les variables en haut de `build/site.css` :

```css
--paper: #e6e3dc;   /* papier mat */
--night: #201f1c;   /* panneaux médias */
--accent: #3f5a5a;  /* filets actifs, focus — jamais en aplat */
```

Typographies via Google Fonts : Archivo (titres, axe de largeur étendu), Newsreader (texte), IBM Plex Mono (données). Chacune a une pile de repli système si le réseau manque.

## Personnaliser le PDF

Tout est dans `build/presskit.css`. Les variables en haut du fichier suffisent pour la plupart des cas :

```css
--ink: #0e0e10;      /* texte */
--accent: #d8402f;   /* titres de section, filets, puces */
--paper: #ffffff;    /* fond de page */
```

Le Markdown supporté : titres, paragraphes, gras/italique, liens, images, listes, tableaux, citations, séparateurs, `code`. Les commentaires HTML (`<!-- ... -->`) servent de consignes de remplissage et ne sont jamais rendus.

## Publier en ligne

### Vercel

Le dépôt est déjà configuré (`vercel.json` + `package.json`). Importe-le sur [vercel.com/new](https://vercel.com/new), garde le framework « Other », et ne touche à rien : Vercel lit le fichier.

| Réglage | Valeur | D'où elle vient |
|---|---|---|
| Build Command | `npm run build` | `vercel.json` |
| Output Directory | `dist/site` | `vercel.json` |
| Install Command | *(aucune dépendance)* | `vercel.json` |
| Node | 20+ | `package.json` → `engines` |

En ligne de commande : `npx vercel login` puis `npx vercel --prod`.

**Les PDF ne se fabriquent pas sur Vercel** — le serveur de build n'a pas de navigateur. Génère-les chez toi avec `./build.sh` : ils sont copiés dans `site/downloads/`, versionnés, et repartent en ligne au déploiement suivant. Tout ce que tu déposes dans `site/downloads/` atterrit à la racine du site.

Si le déploiement sort une page blanche ou un 404, c'est presque toujours l'Output Directory : il doit pointer sur `dist/site`, pas sur `dist` ni sur la racine.

### Ailleurs

`dist/site/` est un dossier statique autonome : Netlify (publish directory `dist/site`, build `npm run build`), GitHub Pages, Cloudflare Pages ou un simple dossier sur ton serveur. `dist/presskit.html` fonctionne aussi seul, à condition de copier `assets/` à côté.

### Voir le site en local

```bash
npm run dev     # build puis http://localhost:4321
```

Pour visualiser l'exemple fourni :

```bash
node build/render.mjs examples/EXEMPLE-REMPLI.md dist/exemple.html
```

## Routes du site

`npm run build` produit quatre pages dans `dist/site/`. Vercel sert le dossier avec
`cleanUrls`, donc `brand.html` répond sur `/brand`.

| Route | Source | Contenu |
|---|---|---|
| `/` | `build/site.mjs` + `site/content.json` | Presskit A.RES, direction artistique d'origine |
| `/exemple` | `build/site.mjs` + `site/content.example.json` | Le gabarit rempli, pour référence |
| `/brand` | `build/brand.mjs` | Charte graphique Univers Parallele : palette, typo, logo, gabarits |
| `/artistes/a-res` | `build/artiste.mjs` + `site/content.json` | La même fiche artiste, à la charte du label |

`/` et `/artistes/a-res` lisent le **même** `content.json` : deux directions artistiques sur
une seule source de contenu. C'est volontaire — la page artiste sert de prototype au futur
site du label, et on compare les deux sans dupliquer les données.

`build/label.css` porte le socle de la charte (tokens, nav, sections, pied de page). Il est
partagé par `/brand` et `/artistes/a-res` ; chaque page y ajoute son CSS propre.

### Ce que la page artiste masque

`build/artiste.mjs` détecte les valeurs restées au stade du gabarit — « Paragraphe 1 — … »,
« 40 à 60 mots… », « 00 min » — et **masque la section** au lieu de l'afficher vide. Un
bandeau en haut de page liste ce qui manque.

C'est un garde-fou, pas une fonctionnalité : dès que `content.json` est réellement rempli,
le bandeau disparaît de lui-même. **Ne pas mettre cette page en avant auprès d'un booker
tant que le bandeau est visible.**

### Assets de marque

`site/brand-assets/` contient une copie des logos, gabarits et de la charte PDF issus de
`../../brand/`. La copie rend le dépôt autonome, mais c'est une **dette assumée** : ce dépôt
est un gabarit réutilisable pour d'autres artistes, et il embarque aujourd'hui la marque d'un
label précis. À déplacer vers le site Univers Parallele une fois celui-ci en ligne — deadline
du 2 octobre au plan marketing.
