#!/bin/sh
# Maakt de .min-bestanden die de site laadt. Draai dit vóór elke commit.
set -e
npx -y terser@5.31.6 site.bundle.js -c -m -o site.bundle.min.js
npx -y clean-css-cli@5.6.3 -o site.min.css site.css
