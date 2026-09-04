# Phase 4 — Batches & Summary

Status: **complete**

## Goals
Private, per-user batch tracking with a dashboard-style summary list.

## Tasks
- [x] Backend: batch creation (snapshot copy from a recipe, or blank).
- [x] batch_ingredients / batch_steps CRUD (independent of the source recipe after snapshot).
- [x] batch_log_entries CRUD incl. measurements (OG/FG, Brix/SG, pH, temperature) and optional action
      (filtered by `applicable_to` against the batch's type).
- [x] Photo upload for log entries (multer) + authenticated retrieval route.
- [x] batch_number generation: per-year human-readable code (e.g. `2026-001`).
- [x] Status transitions (planning → fermenting → conditioning → bottled_kegged → aging → completed /
      archived).
- [x] Owner/admin-only visibility enforced on every batch endpoint.
- [x] Frontend: Summary page — paginated batch list, default filter = open batches sorted by start_date
      desc, plus status/type filters and search.
- [x] Frontend: Batch detail page — editable ingredients/steps snapshot, log entry timeline (add/edit,
      measurements, action dropdown, notes, photo), status changer, final yield fields.

## Verification
- A user cannot see or fetch another user's batch via direct API call — **verified via curl**: non-owner
  list returns empty, direct GET returns 403; **and** log entry photos on another user's batch also 403.
- Summary page defaults to open batches sorted by start date on first load — **verified in-browser**.
- Log entry action dropdown only shows actions applicable to the batch's type (beer/wine/both) —
  **verified in-browser** (wine-only/beer-only actions correctly filtered).
- Full lifecycle verified in-browser: create batch from recipe (ingredient/step snapshot copy confirmed
  independent of the source recipe), create blank batch, add/edit log entries with measurements + action +
  photo, edit batch (status transitions, final yield/ABV, ingredients/steps with per-step done tracking),
  status filter correctly moves a batch in/out of the default "Open batches" view.

## Notes
- `generateBatchNumber()` (server/src/db/batch-number.ts) runs inside the same synchronous
  `sqlite.transaction()` as the batch insert, relying on better-sqlite3 + Node's single-threaded execution
  to avoid duplicate numbers under concurrent requests.
- Batch update full-replaces ingredients/steps on every save, same pattern as recipes (Phase 3).
- Log entry photos support multiple per entry (batch_log_photos has no unique constraint on log_entry_id),
  each served/deleted individually via `/api/batches/:id/log-entries/:entryId/photos/:photoId`.
- "Start batch" on the Recipe detail page now links to `/batches/new?recipeId=…`, replacing the Phase 3
  disabled stub.

