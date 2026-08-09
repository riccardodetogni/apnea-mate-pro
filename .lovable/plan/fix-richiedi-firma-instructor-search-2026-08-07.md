# Fix "Richiedi firma" instructor search

## What's wrong

The search filters profiles on the optional `instructor_brevetto_label` field. Verified in the database: **0 of 244 profiles have that field filled**, while **46 users actually hold the instructor role**. So the query can never return anyone — hence "Nessun istruttore trovato" for Luca and everyone else.

## The fix

Identify instructors by their **role**, not by the optional label text.

1. Add a secure server-side search function that:
   - takes a search term (min 2 chars),
   - matches on first name, last name, or full name (so "Luca Ferrari" typed in full also works),
   - returns only users holding the instructor (or admin) role,
   - returns id, name, last name, and a best-effort certification label (instructor label if present, otherwise the approved certification agency/level), so the list still shows a credential line when available,
   - limits results to 8.

2. Update the "Chiedi la firma" modal to call this function instead of querying profiles directly. Behaviour, layout and copy stay the same; only the data source changes.

3. Keep the existing empty-state message for genuinely no matches.

## Technical notes

- New `SECURITY DEFINER` function `public.search_instructors(_q text)` with `search_path = public`, `EXECUTE` granted to `authenticated` only. It uses `has_role(user_id, 'instructor')` / `'admin'` and reuses the existing `brevetto_label_of()` helper for the label.
- `src/components/logbook/RequestSignatureModal.tsx`: replace the `.from("profiles")...not("instructor_brevetto_label","is",null)` query with `supabase.rpc("search_instructors", { _q })`.
- `request_log_signature` already validates that the target is an instructor, so no change to the request flow.
