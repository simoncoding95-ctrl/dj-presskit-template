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

- `dist/site/index.html` — **la page du label** : collectif, artistes, dates, Instagram, booking
- `dist/site/artistes/a-res.html` — la fiche artiste, servie à `/artistes/a-res`
- `presskit.pdf` / `technical-rider.pdf` — les versions à envoyer par mail
- `presskit.html` / `technical-rider.html` — les mêmes en page simple

Si aucun navigateur n'est détecté, le script s'arrête après le HTML : ouvre-le et fais **Ctrl+P → Enregistrer en PDF** (marges par défaut, en-têtes/pieds de page décochés).

## Structure

| Fichier | Rôle |
|---|---|
| `site/label.json` | **Le contenu de la page du label.** Collectif, artistes, dates, Instagram, booking. |
| `site/content.json` | **Le contenu de la fiche artiste.** Un seul fichier à remplir. |
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

`npm run build` produit deux pages.

| Route | Source |
|---|---|
| `/` | `build/label.mjs` + `site/label.json` — la page du collectif |
| `/artistes/a-res` | `build/artiste.mjs` + `site/content.json` — la fiche artiste |

`cleanUrls` sert `artistes/a-res.html` sans son extension. `/a-res` redirige en 301 vers
`/artistes/a-res`, pour les liens courts.

La fiche artiste vivait à la racine jusqu'au 6 septembre 2026. Elle calculait déjà ses
liens depuis sa profondeur (`up`), donc le déplacement n'a coûté qu'une ligne de
`package.json` — mais **les liens partagés vers `/` pointent maintenant sur le label**,
pas sur A.RES. C'est le bon sens de l'échange : un booker qui reçoit le presskit arrive
sur la fiche, un curieux qui tape le domaine arrive sur le collectif.

### Les pages non routées

`npm run internal` les génère dans `dist/internal/`, **hors du dossier déployé par Vercel**
(`outputDirectory: dist/site`). Elles restent dans le dépôt pour référence et ne sont
accessibles par aucune URL.

| Fichier | Contenu |
|---|---|
| `brand.html` | Charte : palette, typo, logo, mascotte, gabarits |
| `logos.html` | Les vingt pistes de mascotte écartées |
| `presskit-v1.html` | Le presskit d'origine, avec sa direction artistique initiale |
| `presskit-v1-exemple.html` | Le même, rempli avec le gabarit de démonstration |

La page publique ne pointe vers aucune d'elles : ses liens sortants ont été retirés, sans
quoi elle renverrait des 404. Et comme `brand.mjs` copiait les assets de marque,
`artiste.mjs` les copie désormais lui-même — photos, logos, presskit PDF.

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

## Le presskit PDF

`npm run build` produit `dist/presskit.html`, converti en PDF par `build.sh` (ou Ctrl+P), et
copié dans `site/downloads/` d'où le site le sert.

Il lit **`site/content.json`**, la même source que la page. Avant, `PRESSKIT.md` disait la
même chose en parallèle et il fallait éditer les deux à chaque changement de bio — le
document a divergé plusieurs fois. Ce fichier reste dans le dépôt comme référence lisible,
mais il ne produit plus rien.

Trois écarts assumés avec la page web, parce qu'un PDF n'est pas un écran :

- **Palette papier**, pas la sombre. La charte la réserve aux documents imprimés ; un A4 en
  fond sombre vide une cartouche.
- **Un QR code** vers le SoundCloud. Sur un document imprimé c'est le seul moyen d'écouter,
  et écouter est tout le travail de ce presskit. `site/qr-soundcloud.svg`, regénéré avec
  `segno` si l'URL change.
- **Deux pages, la première autosuffisante.** Nom, photo, bio courte, écoute, repères et
  adresse de booking y tiennent : un programmateur qui n'ouvre pas la seconde a l'essentiel.

Les deux feuilles remplissent exactement 297 mm. Ajouter du contenu fait déborder la
seconde — vérifier après toute modification.


---

## La page du label

`site/label.json` pilote `/`. Chaque section disparaît quand elle n'a rien à dire — une
liste d'artistes vide n'affiche pas un cadre vide, elle n'affiche rien, et la numérotation
des sections se recale.

**Les dates.** Une entrée passe d'elle-même dans l'archive dépliable quand sa `date` (au
format `AAAA-MM-JJ`) est dépassée : la page ne ment jamais sur ce qui est à venir. Sans
`ticket_url`, le bouton devient « Billetterie bientôt » plutôt que de disparaître — un
visiteur qui voit une date sans lien croit que c'est complet.

`"events": []` n'efface pas la section : elle affiche `events_placeholder`, et le bandeau
d'ouverture annonce la même chose. Une page de label sans rubrique « dates » se lit comme
un label à l'arrêt ; un « to be announced » assumé se lit comme un label qui prépare
quelque chose. **Ne mettez une date ici qu'une fois le lieu signé** — une date annoncée
puis retirée coûte plus cher que pas de date du tout.

**Instagram.** Les vignettes sont manuelles : on dépose l'image dans
`site/assets/instagram/` et on ajoute une entrée.

```json
"instagram": [
  { "src": "assets/instagram/2026-09-01.jpg",
    "url": "https://www.instagram.com/p/XXXXXXXX/",
    "alt": "Affiche du 7 novembre" }
]
```

Il n'y a pas d'automatisation possible ici : l'API Instagram exige une session
authentifiée, et l'embed officiel de Meta impose un script tiers, des cookies et un rendu
blanc au milieu de l'encre. Tableau vide, la section se réduit au bloc « suivre » — ce qui
est le bon état tant que le compte a peu de contenu.
