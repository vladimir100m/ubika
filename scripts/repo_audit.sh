#!/usr/bin/env bash
set -euo pipefail

# Simple repository audit script for Ubika
# - collects files that reference Property-related UI
# - collects API route usages
# - lists scripts under scripts/
# - produces doc/repo-audit.md and prints a short summary

OUT_DOC="$(pwd)/doc/repo-audit.md"

command -v rg >/dev/null 2>&1 || {
  echo "Please install ripgrep (rg) or adjust the script to use grep." >&2
  exit 1
}

echo "# Repo audit - generated $(date --iso-8601=seconds)" > "$OUT_DOC"
echo >> "$OUT_DOC"

echo "## UI components referencing 'Property' or 'property'" >> "$OUT_DOC"
echo >> "$OUT_DOC"
rg -n --hidden -S "\bProperty\b|\bproperty\b" src | sed 's/^/ - /' >> "$OUT_DOC" || true
echo >> "$OUT_DOC"

echo "## API route usages referenced inside source files" >> "$OUT_DOC"
echo >> "$OUT_DOC"
# Find files that call /api/ and list the exact occurrences
rg -n "(/api/|fetch\(|axios\.|fetch\s*\()" src/app src/pages src/ui 2>/dev/null | sed 's/^/ - /' >> "$OUT_DOC" || true
echo >> "$OUT_DOC"

echo "## Scripts folder listing" >> "$OUT_DOC"
echo >> "$OUT_DOC"
ls -1 scripts | sed 's/^/ - /' >> "$OUT_DOC" || true
echo >> "$OUT_DOC"

echo "## Component -> API mapping (best-effort)" >> "$OUT_DOC"
echo >> "$OUT_DOC"
# For each component file that mentions 'Property', attempt to find referenced /api/ endpoints
rg -l "\bProperty\b|\bproperty\b" src | while read -r file; do
  echo "### $file" >> "$OUT_DOC"
  rg -n "(/api/|fetch\(|axios\.)" "$file" 2>/dev/null | sed 's/^/ - /' >> "$OUT_DOC" || true
  echo >> "$OUT_DOC"
done

echo "Generated $OUT_DOC"
echo
echo "Summary:" 
echo " - UI matches: $(rg -c "\bProperty\b|\bproperty\b" src || true)"
echo " - API matches: $(rg -c "/api/|fetch\(|axios\." src || true)"

exit 0
