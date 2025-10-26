#!/usr/bin/env bash
set -euo pipefail

OUT_FILE="doc/repo-audit.md"
mkdir -p doc

echo "# Repo Audit" > "$OUT_FILE"
echo "" >> "$OUT_FILE"
echo "Generated: $(date -u) UTC" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

echo "## Summary" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
echo "This audit lists key routes, API endpoints, scripts, migrations and important libraries for the PoC refactor (Mongo read-model + Redis cache)." >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

echo "## Next.js App Routes (src/app)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d src/app ]; then
  find src/app -type f \( -name 'route.ts' -o -name 'route.tsx' -o -name 'page.tsx' -o -name 'layout.tsx' \) | sed 's/^/ - /' >> "$OUT_FILE" || true
else
  echo "(no src/app directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## Pages (src/pages)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d src/pages ]; then
  find src/pages -maxdepth 3 -type f -name '*.tsx' | sed 's/^/ - /' >> "$OUT_FILE" || true
else
  echo "(no src/pages directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## API routes (app router: src/app/**/api)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
find src/app -type f -path '*/api/*' \( -name 'route.ts' -o -name 'route.tsx' \) 2>/dev/null | sed 's/^/ - /' >> "$OUT_FILE" || true
echo "" >> "$OUT_FILE"

echo "## API routes (pages router: src/pages/api)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d src/pages/api ]; then
  find src/pages/api -type f | sed 's/^/ - /' >> "$OUT_FILE" || true
else
  echo "(no src/pages/api directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## Scripts" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d scripts ]; then
  ls -1 scripts | sed 's/^/ - scripts\//' >> "$OUT_FILE" || true
else
  echo "(no scripts directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## Migrations" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d migrations ]; then
  ls -1 migrations | sed 's/^/ - migrations\//' >> "$OUT_FILE" || true
else
  echo "(no migrations directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## Key libraries / helpers (src/lib)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
if [ -d src/lib ]; then
  find src/lib -maxdepth 1 -type f -name '*.ts*' | sed 's/^/ - /' >> "$OUT_FILE" || true
else
  echo "(no src/lib directory)" >> "$OUT_FILE"
fi
echo "" >> "$OUT_FILE"

echo "## Env vars required for PoC (do NOT commit secrets)" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
cat >> "$OUT_FILE" <<'EOF'
Required env vars (create a local `.env.local` with these placeholders):

- DATABASE_URL           # Postgres canonical DB
- MONGODB_URI            # Vercel-managed MongoDB connection string
- MONGODB_DB             # Explicit Mongo DB name (required, do NOT use default 'test')
- VERCEL_REDIS_URL       # Vercel-managed Redis URL (or REDIS_URL)
- VERCEL_BLOB_TOKEN      # Vercel Blob token for signed uploads
- ADMIN_SECRET           # Protect sync/admin endpoints
- SAFE_TO_RUN (optional) # set true to allow destructive scripts without --confirm

EOF

echo "" >> "$OUT_FILE"
echo "## Notes / Next actions" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"
echo " - Implement /api/sync-property to upsert denormalized read-model (Mongo) and invalidate cache." >> "$OUT_FILE"
echo " - Ensure `.env.local` sets MONGODB_DB to avoid using default 'test' DB." >> "$OUT_FILE"
echo " - Use scripts/db_clean.js with --dry-run then --confirm when ready." >> "$OUT_FILE"

echo "Repo audit written to $OUT_FILE"

exit 0
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
