# Step 10 — Blob helper & admin upload guidance

Purpose
- Provide guidance and helper code to upload images to Vercel Blob for PoC and support signed uploads from browser.

Actions
1. Add `src/lib/blob.ts`:
   - getSignedUploadUrl(filename, contentType): returns { uploadUrl, publicUrl }
   - Use `process.env.VERCEL_BLOB_TOKEN` for auth when calling Vercel Blob API from server.
2. Admin UI integration:
   - Allow admins to select files, request signed upload URL from server, upload directly from browser, and store returned `publicUrl` in image list.
3. Fallback: allow pasting direct image URLs or use `public/sample-images/` for seeded demo.

Commands / notes
- Document how to set VERCEL_BLOB_TOKEN in Vercel and how to generate it.

Acceptance criteria
- Admin flow can attach image URLs to property records using signed uploads or paste fallback.