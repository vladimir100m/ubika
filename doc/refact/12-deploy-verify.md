# Step 12 — Deploy & verification (PoC)

Purpose
- Deploy the PoC to Vercel Preview and run smoke-tests and verification checklist.

Checklist
1. Vercel project created and env vars set:
   - DATABASE_URL
   - MONGODB_URI
   - VERCEL_REDIS_URL (or REDIS_URL)
   - VERCEL_BLOB_TOKEN
   - ADMIN_SECRET
2. Deploy to Preview and confirm build passes.
3. From local environment run seed script to populate Preview DB (separate dev DB) and run the following tests:
   - Search for seeded property -> returns results
   - Open property detail -> shows images and features
   - Submit contact form -> record created
   - Create property via admin UI -> triggers sync -> detail shows new content
   - Verify cache invalidation: update property -> sync -> cached detail refreshed
4. Document any deploy issues in `doc/poc-vercel-verify.md` and capture remediation steps.

Acceptance criteria
- Preview deployment is healthy; end-to-end flows work for seeded data.
- Documented verification steps and outcomes.

Optional: schedule a manual run or small automated smoke test that runs the above steps after each preview build.