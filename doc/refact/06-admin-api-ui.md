# Step 06 — Admin API & minimal Admin UI

Purpose
- Add minimal admin endpoints and a simple `/admin` UI to create/edit properties for PoC.

Actions
1. API endpoints:
   - `POST /api/admin/property` -> create property in Postgres, returns id
   - `PUT /api/admin/property/:id` -> update property
   - Protect both with ADMIN_SECRET check
   - After create/update, call internal sync (invoke service or call `/api/sync-property` with ADMIN_SECRET)
2. UI (minimal): `src/app/admin/page.tsx`
   - Simple form fields: title, description, price, images (urls), features (comma separated)
   - On submit: POST to create endpoint then call sync endpoint.
   - Show success toast and link to property preview.
3. Image upload options: paste URL or use signed upload via Vercel Blob (see blob helper doc)

Files to add
- `src/app/api/admin/property/route.ts`
- `src/app/admin/page.tsx`
- Tests for admin endpoints (basic request validations)

Acceptance criteria
- Admin UI can create a property and the sync endpoint is triggered to populate the read-model.