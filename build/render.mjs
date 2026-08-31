#!/usr/bin/env node
// Convertit un fichier Markdown du presskit en HTML autonome (CSS inline, prêt à imprimer en PDF).
// Aucune dépendance npm : le sous-ensemble Markdown utilisé par les templates est géré ici.
//
// Usage : node build/render.mjs PRESSKIT.md dist/presskit.html

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Usage: node build/render.mjs <input.md> <output.html>");
  process.exit(1);
}

const root = process.cwd();
const raw = readFileSync(resolve(root, inputPath), "utf8");

/* ---------- frontmatter ---------- */

function splitFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: text };
  const block = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, "");
  const meta = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    meta[m[1]] = value;
  }
  return { meta, body };
}

const { meta, body } = splitFrontmatter(raw);

/* ---------- markdown -> html ---------- */

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Le HTML est écrit dans dist/ : les chemins relatifs des assets doivent remonter d'autant.
const assetPrefix = (() => {
  const rel = relative(dirname(resolve(root, outputPath)), root);
  return rel ? rel.replace(/\\/g, "/") + "/" : "";
})();
const resolveAsset = (src) =>
  /^([a-z]+:|\/|#)/i.test(src) ? src : assetPrefix + src;

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/!\[((?:[^[\]]|\[[^\]]*\])*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const caption = alt ? `<figcaption>${alt}</figcaption>` : "";
    return `<figure><img src="${resolveAsset(src)}" alt="${alt}">${caption}</figure>`;
  });
  out = out.replace(/\[((?:[^[\]]|\[[^\]]*\])+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return out;
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const cells = (l) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function markdown(src) {
  // On retire les commentaires HTML : ce sont les consignes de remplissage.
  const lines = src.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      html.push("<hr>"); i++; continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i++; continue;
    }

    if (isTableRow(line) && isTableRow(lines[i + 1] || "") && /^[\s|:-]+$/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      html.push(
        "<table><thead><tr>" +
          head.map((c) => `<th>${inline(c)}</th>`).join("") +
          "</tr></thead><tbody>" +
          rows
            .map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>")
            .join("") +
          "</tbody></table>"
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(inline(lines[i++].replace(/^\s*[-*]\s+/, "")));
      }
      html.push("<ul>" + items.map((it) => `<li>${it}</li>`).join("") + "</ul>");
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|\s*[-*]\s|\|)/.test(lines[i])
           && !/^(-{3,}|\*{3,})\s*$/.test(lines[i].trim())) {
      para.push(lines[i++]);
    }
    if (para.length) {
      const joined = inline(para.join(" "));
      // Une image seule occupe son propre bloc.
      html.push(/^<figure>/.test(joined) ? joined : `<p>${joined.replace(/ {2,}$/gm, "<br>")}</p>`);
    } else {
      i++;
    }
  }
  return html.join("\n");
}

/* ---------- page ---------- */

const cssPath = join(dirname(new URL(import.meta.url).pathname), "presskit.css");
const css = readFileSync(cssPath, "utf8");

const title = meta.artist_name ? `${meta.artist_name} — Presskit` : "Presskit";
const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
<main class="presskit">
${markdown(body)}
</main>
</body>
</html>
`;

const outAbs = resolve(root, outputPath);
if (!existsSync(dirname(outAbs))) mkdirSync(dirname(outAbs), { recursive: true });
writeFileSync(outAbs, page, "utf8");
console.log(`✓ ${outputPath}`);
