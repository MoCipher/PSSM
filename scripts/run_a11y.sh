#!/usr/bin/env bash
# Simple accessibility audit helper script.
# Installs/uses pa11y (if available) or suggests using axe-core / pa11y.

set -e

if command -v pa11y >/dev/null 2>&1; then
  echo "Running pa11y against localhost:3000 (ensure app is running)..."
  pa11y http://localhost:3000
  exit 0
fi

if command -v npx >/dev/null 2>&1; then
  echo "pa11y not installed globally. Running via npx (requires network)..."
  npx pa11y http://localhost:3000
  exit 0
fi

cat <<EOF
No pa11y or npx found. To run an accessibility audit locally:

1) Start your dev server (e.g., `npm run dev` or `npm start`).
2) Install pa11y: `npm install -g pa11y` or run `npx pa11y http://localhost:3000`.
3) Alternatively use axe devtools in the browser or `npx @axe-core/cli` for CLI scans.

This script only automates running one common scanner; manual review with browser devtools and screen-reader testing is recommended.
EOF
