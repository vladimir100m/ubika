# Step 09 — Save / Favorite (client hook)

Purpose
- Add a simple client-side saved properties feature using localStorage with optional server persistence.

Actions
1. Add `src/lib/useSavedProperties.ts` hook:
   - Expose `saved` set, `toggleSave(id)`, `isSaved(id)`.
   - Persist to localStorage key `ubika.savedProperties`.
   - Optionally, when a `user_id` is present, call `POST /api/user-saved-properties` to persist server-side.
2. Wire Save button on `PropertyCard` and detail page to use this hook.
3. Add server API stub `src/app/api/user-saved-properties/route.ts` that accepts `user_id` header and a list of IDs to persist.

Acceptance criteria
- Local save UX works across pages; optional server persistence stub implemented.