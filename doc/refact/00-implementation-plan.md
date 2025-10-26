# Refactor Implementation Plan (PoC) — Summary

This folder contains the refactor plan and per-step implementation documents derived from `doc/implementation-plan-poc.md`.

Goal
- Implement a conservative PoC on Vercel Hobby using: Postgres (canonical), Vercel-managed MongoDB (denormalized read-models), Vercel Redis (cache/rate-limiter), and Vercel Blob (images).

Work breakdown
- See individual step documents in this folder (01..12). Each file contains: purpose, actions, files to change, commands, tests, and acceptance criteria.

How to use these docs
1. Start with `01-repo-audit.md` to produce `doc/repo-audit.md` and get a mapping of code to touch.
2. Implement changes as small PRs following the PR order in each step file.
3. Run CI and smoke tests after each PR.

Branching and PR strategy
- Use a small PR-per-step approach. Keep changes minimal and reversible.

Contact
- If anything is unclear, open an issue or request a deeper edit for a given step file.