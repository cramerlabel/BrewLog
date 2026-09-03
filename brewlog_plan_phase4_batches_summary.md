# Phase 4 — Batches & Summary

Status: **not started**

## Goals
Private, per-user batch tracking with a dashboard-style summary list.

## Tasks
- [ ] Backend: batch creation (snapshot copy from a recipe, or blank).
- [ ] batch_ingredients / batch_steps CRUD (independent of the source recipe after snapshot).
- [ ] batch_log_entries CRUD incl. measurements (OG/FG, Brix/SG, pH, temperature) and optional action
      (filtered by `applicable_to` against the batch's type).
- [ ] Photo upload for log entries (multer) + authenticated retrieval route.
- [ ] batch_number generation: per-year human-readable code (e.g. `2026-001`).
- [ ] Status transitions (planning → fermenting → conditioning → bottled_kegged → aging → completed /
      archived).
- [ ] Owner/admin-only visibility enforced on every batch endpoint.
- [ ] Frontend: Summary page — paginated batch list, default filter = open batches sorted by start_date
      desc, plus status/type filters and search.
- [ ] Frontend: Batch detail page — editable ingredients/steps snapshot, log entry timeline (add/edit,
      measurements, action dropdown, notes, photo), status changer, final yield fields.

## Verification
- A user cannot see or fetch another user's batch via direct API call (403/404, not just hidden in UI) —
  critical authorization check.
- Summary page defaults to open batches sorted by start date on first load.
- Log entry action dropdown only shows actions applicable to the batch's type (beer/wine/both).
