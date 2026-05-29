## Problem

When users added their surname (`last_name` column on `profiles`), search was never updated. Today all profile lookups only do `ilike("name", "%query%")`, so typing "Mario Rossi" returns nothing because `name` is `"Mario"` and `last_name` is `"Rossi"` are stored in separate columns.

## Fix strategy

Split the query on whitespace and match each token against `name` OR `last_name`. Single-token queries (e.g. just "Mario") still work — they match either column — so the change is fully retrocompatible with profiles that only have `name`.

In supabase-js, chained `.or()` calls are AND-combined, so for tokens `[t1, t2]` we do:
```ts
let q = supabase.from("profiles").select(...);
tokens.forEach(t => {
  q = q.or(`name.ilike.%${t}%,last_name.ilike.%${t}%`);
});
```

## Changes

### 1. `src/hooks/useSearch.ts` (global search bar)
- Select `last_name` along with `name`.
- Replace the single `ilike("name", pattern)` with the tokenized OR-per-token approach above.
- Build display name as `${name} ${last_name ?? ""}`.trim() in the mapped result so the dropdown shows the full name.

### 2. `src/pages/Search.tsx` — `searchPeople`
- Same tokenized matching against `name` + `last_name`.
- Select `last_name`, expose it on `PersonResult`, and render `${p.name} ${p.last_name ?? ""}`.trim() in the people list (line ~421) and the avatar fallback initial.

### 3. `src/hooks/useDiscoverFreedivers.ts`
- Add `last_name` to the profiles select (line 58 area) and to the `SuggestedUser` mapping (line ~196).
- Update the client-side `filteredSuggestions` filter (lines 280–284) to also match `last_name` and to match all whitespace-separated tokens, so "Mario Rossi" works here too.
- Display full name in the suggestion card.

### Out of scope (intentionally)

- Other profile lookups (`useEvents`, `useCourses`, `useSessionDetails`, chat, etc.) only fetch by `user_id` and just need the display label — these can stay as-is for this task. If you want full-name everywhere, that's a separate, larger pass and not required to fix search.
- No DB migration needed; we keep `name` and `last_name` as separate columns.

## Verification

- Search "Mario" → finds users named Mario (existing behavior preserved).
- Search "Rossi" → now finds users whose surname is Rossi.
- Search "Mario Rossi" → finds the user with `name=Mario`, `last_name=Rossi`.
- Search "mario ros" → still matches (substring + case-insensitive).
- Profiles without `last_name` still appear for first-name queries.
