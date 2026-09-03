# Phase 3 — Recipes

Status: **not started**

## Goals
Full recipe management: viewable by everyone, editable by owner/admin, with structured ingredients/steps
and an optional photo.

## Tasks
- [ ] Backend: recipes + recipe_ingredients + recipe_steps CRUD endpoints.
- [ ] Ownership/admin edit enforcement (view is open to all authenticated users).
- [ ] Optional recipe photo: multer upload endpoint + authenticated photo-serve route.
- [ ] Frontend: Recipe list page — search/filter by type (beer/wine), style, creator; thumbnail if a photo
      is present.
- [ ] Frontend: Recipe detail page — photo upload/display, structured ingredients table, ordered steps,
      edit form gated to owner/admin.
- [ ] "Start Batch from Recipe" action (wires into Phase 4's snapshot-copy batch creation).

## Verification
- A non-owner, non-admin user can view but not edit another user's recipe (verify via direct API call, not
  just UI hiding the button).
- Recipe photo upload rejects disallowed mime types/oversized files and is only retrievable while
  authenticated.
