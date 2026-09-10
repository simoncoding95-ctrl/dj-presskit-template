#!/usr/bin/env bash
# Génère dist/*.html (Markdown + content.json), puis les PDF si un navigateur Chromium est disponible.
set -euo pipefail
cd "$(dirname "$0")"

DOCS=("TECHNICAL-RIDER.md:technical-rider")   # documents Markdown

for entry in "${DOCS[@]}"; do
  node build/render.mjs "${entry%%:*}" "dist/${entry##*:}.html"
done

# Le presskit a son propre générateur : il vient de content.json, pas d'un Markdown.
node build/pdf.mjs site/content.json dist/presskit.html

# Tout ce qui doit finir en PDF téléchargeable, quelle que soit son origine.
PDFS=("technical-rider" "presskit")

# Le site : content.json est le vôtre, content.example.json sert de référence de remplissage.

find_chrome() {
  for c in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
    if command -v "$c" >/dev/null 2>&1; then command -v "$c"; return 0; fi
  done
  for w in \
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe"; do
    if [ -f "$w" ]; then echo "$w"; return 0; fi
  done
  return 1
}

if ! CHROME="$(find_chrome)"; then
  echo "… Aucun Chrome/Edge trouvé. Ouvre chaque dist/*.html puis Ctrl+P → Enregistrer en PDF (marges par défaut, sans en-têtes)."
  exit 0
fi

# Un Chrome installé côté Windows ne comprend pas les chemins WSL : on les convertit en UNC.
to_path() { case "$CHROME" in /mnt/c/*) wslpath -w "$PWD/$1" ;; *) echo "$PWD/$1" ;; esac; }

mkdir -p dist/site site/downloads

for name in "${PDFS[@]}"; do
  rm -f "dist/$name.pdf"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$(to_path "dist/$name.pdf")" "$(to_path "dist/$name.html")" >/dev/null 2>&1 || true
  if [ -s "dist/$name.pdf" ]; then
    # Le PDF rejoint les téléchargements : versionné, il part en ligne avec le site.
    cp "dist/$name.pdf" "site/downloads/$name.pdf"
    cp "dist/$name.pdf" "dist/site/$name.pdf"
    echo "✓ dist/$name.pdf"
  else
    echo "… PDF non généré pour $name — ouvre dist/$name.html et fais Ctrl+P → Enregistrer en PDF"
  fi
done
