# Fix: spearfishing sessions cannot be created

## What's wrong

The session type dropdown offers "Pesca subacquea" (`spearfishing`), but the database still only accepts the five older types. Publishing such a session fails with:

`new row for relation "sessions" violates check constraint "sessions_session_type_check"`

Confirmed by reading the live constraint: it allows only `sea_trip`, `pool_session`, `deep_pool_session`, `lake_trip`, `training` — `spearfishing` was added to the UI and to the register logic (spearfishing outings correctly skip the dive register) but never to this constraint.

## The fix

One migration that replaces the session type rule so it also accepts `spearfishing` (keeping the existing five values, including the legacy `training`).

No frontend change is needed: the dropdown, filters and labels already handle spearfishing correctly, and the register-skip trigger already excludes it.

## Technical detail

New migration file `supabase/migrations/<timestamp>_allow_spearfishing_session_type.sql`:

- Drop `sessions_session_type_check`
- Recreate it with `sea_trip`, `pool_session`, `deep_pool_session`, `lake_trip`, `training`, `spearfishing`

## Verification

- Create a spearfishing session end to end and confirm it publishes.
- Confirm no dive register is auto-created for it, while a sea session still gets one.
