# Step 11 — Tests & CI

Purpose
- Add a minimal test suite and CI workflow that validates build, tests, and basic checks.

Actions
1. Add unit tests (jest or vitest):
   - readModel.upsert/get (mocked)
   - sync endpoint (mocked DB and Mongo)
   - search endpoint returns expected shape
2. Add fixtures in `test/fixtures/` with 3 sample properties.
3. Add `.github/workflows/ci.yml` with steps:
   - actions/checkout
   - node setup
   - npm ci
   - npm run build
   - npm test

Acceptance criteria
- CI workflow runs and reports build + test status for PRs.