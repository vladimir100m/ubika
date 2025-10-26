# Step 08 — Property Detail + Contact endpoint

Purpose
- Wire detail pages to use the Mongo read-model and add a contact endpoint to capture leads.

Actions
1. Detail page logic:
   - Try `readModel.getPropertyDocument(id)` first.
   - If missing, fallback to canonical Postgres query and optionally trigger a background sync.
2. Contact endpoint `src/app/api/property-contact/route.ts`:
   - POST { propertyId, name, email, message }
   - Store to Mongo `property_contacts` collection or Postgres `property_contacts` table.
   - Rate-limit calls using Redis.
   - Add honeypot field on the form to reduce spam.

Files to add/edit
- `src/app/api/property-contact/route.ts`
- Update detail page component to use read-model and render contact form.

Acceptance criteria
- Contact submissions persist and rate-limiter prevents abuse in tests.