# Implementation plan for data model changes — v0.1 rollout

This is a practical, phased plan to implement the proposals in `01-data-model-propose.md` with minimal downtime and safe rollbacks.

Phases overview
- Phase 0 — Prep & tests (local + staging)
- Phase 1 — Additive schema changes and lookup tables
- Phase 2 — Backfill and dual-write support
- Phase 3 — Enforce constraints and cutover
- Phase 4 — Clean up and harden

Phase 0 — Prep & tests
- Add introspection script in `scripts/introspect-schema.js` (done).
- Create a staging database and restore a snapshot of production data.
- Add migration scripts to `migrations/` (SQL or node-based) and test idempotency.
- Add automated tests for critical data flows: property creation, image upload, search queries.

Phase 1 — Additive changes (zero-downtime)
- Create lookup tables (`property_types`, `property_statuses`) WITHOUT FK constraints.
- Add nullable columns to `properties`: `property_type_id`, `property_status_id`, `currency`, `published_at`, `is_listed`.
- Add columns to `property_images`: `storage_key`, `checksum`, `width`, `height`.
- Deploy application changes that optionally write to the new columns but keep reading from old columns.

Phase 2 — Backfill + dual-write
- Backfill `property_types` from distinct values in `properties.type`. Insert mapping rows and set `property_type_id` for each property using a safe script.
- Backfill `property_statuses` from distinct values in `properties.status` and set `property_status_id`.
- Keep application in dual-write mode: on writes, populate both text and FK columns.
- Run integration tests and sampling checks to validate no data divergence.

Phase 3 — Enforce constraints and cutover
- Add FK constraints and create NOT NULL constraints if safe (or use CHECK to narrow values). Perform this in a maintenance window if necessary.
- Update application code to read from FK columns and use normalized enums.
- Remove dual-write paths after monitoring.

Phase 4 — Cleanup
- Remove legacy `properties.type` and `properties.status` text columns if no longer used.
- Remove transitional code and tests.
- Add additional indexes, materialized views, and caching as needed.

Rollback strategy
- Each migration must be additive. For destructive operations (dropping columns, adding NOT NULL), create an explicit rollback SQL script.
- Keep a backup snapshot prior to Phase 3.

Validation & monitoring
- Add monitoring for query latencies and error rates during rollout.
- Use sampling queries to compare original vs. migrated values for correctness.
- Create an audit log for migration scripts that records counts and any mismatches.

Estimated timeline (small team)
- Prep & tests: 1-2 days
- Phase 1: 0.5 days (deploy additive migrations and app changes)
- Phase 2: 1-2 days (backfill and validation)
- Phase 3: 0.5-1 day (enforce constraints)
- Phase 4: 0.5 days

Quick checklist for engineers
- [ ] Add migration SQL files under `migrations/` with ids and descriptions
- [ ] Add integration tests for property CRUD flows
- [ ] Update TypeScript types (`src/types/index.ts`) to match DB types (UUIDs => string)
- [ ] Deploy to staging and run `scripts/introspect-schema.js` to compare schemas
- [ ] Run backfill scripts and validate

End of file
