# Phase 3 — Recipes

Status: **complete**

## Goals
Full recipe management: viewable by everyone, editable by owner/admin, with structured ingredients/steps
and an optional photo.

## Tasks
- [x] Backend: recipes + recipe_ingredients + recipe_steps CRUD endpoints.
- [x] Ownership/admin edit enforcement (view is open to all authenticated users).
- [x] Optional recipe photo: multer upload endpoint + authenticated photo-serve route.
- [x] Frontend: Recipe list page — search/filter by type (beer/wine), style, creator; thumbnail if a photo
      is present.
- [x] Frontend: Recipe detail page — photo upload/display, structured ingredients table, ordered steps,
      edit form gated to owner/admin.
- [x] "Start Batch from Recipe" action — added as a disabled stub button ("arrives in Phase 4"); full
      snapshot-copy wiring happens in Phase 4 once the batches schema/endpoints exist.

## Verification
- A non-owner, non-admin user can view but not edit another user's recipe — **verified via direct API call**
  (403 on PATCH) **and in-browser** (Edit/Delete buttons hidden for non-owners).
- Recipe photo upload rejects disallowed mime types/oversized files (multer `fileFilter`/`limits`) and is
  only retrievable while authenticated (`requireAuth` on the serve route, no public nginx static path).
- Full CRUD lifecycle verified in-browser: create (with and without ingredients/steps), edit (add
  ingredient, updates persist), photo upload/display/remove, delete with confirmation dialog, list
  search/type filter.

## Notes
- Reusable `createImageUpload()` helper (`server/src/uploads/image-upload.ts`) added for randomized-filename,
  mime/size-validated uploads - Phase 4's batch log photos will reuse this directly.
- Standardized all `updatedAt` writes on a shared `now()` SQL helper (`server/src/db/now.ts`) instead of
  `new Date().toISOString()`, after finding the two formats sort inconsistently as TEXT in SQLite.
- Recipe edit/create full-replaces ingredients/steps on every save (delete + reinsert in a transaction)
  rather than diffing - simpler and safe since both are recipe-owned child tables with no external
  references at this phase.

