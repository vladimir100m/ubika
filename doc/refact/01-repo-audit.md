# Step 01 — Repo audit & env.example

Purpose
- Map the repo to identify components, pages, API routes, scripts and libs we will reuse or refactor.
- Produce `doc/repo-audit.md` and create `env.example` with PoC env vars.

Actions
1. Run quick searches and collect results:
   - rg "\\bProperty\\b" src
   - rg "src/app/api|src/pages/api" -n
   - ls -la scripts/
2. Parse results and build a concise table: component -> file -> props used -> pages where referenced.
3. Write `doc/repo-audit.md` at repo root with the mapping and high-priority change suggestions.
4. Create `env.example` with placeholders:
   - DATABASE_URL=
   - MONGODB_URI=
   - VERCEL_REDIS_URL=
   - VERCEL_BLOB_TOKEN=
   - ADMIN_SECRET=

Files to add
- `doc/repo-audit.md` (generated)
- `env.example` (stub)
- `scripts/repo_audit.sh` or Node script (optional) to automate the scan

Commands (examples)
```bash
# quick scan (run locally)
rg "\bProperty\b" src | sed -n '1,200p' > tmp/repo_audit_properties.txt
rg "src/app/api|src/pages/api" -n > tmp/repo_audit_routes.txt
ls -la scripts/ > tmp/repo_audit_scripts.txt
```

Acceptance criteria
- `doc/repo-audit.md` created and contains a clear map and prioritized list of components/routes to change.
- `env.example` created with placeholders and brief explanation.