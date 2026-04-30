## Problem

When the user switches the app to English, the "session type" label (e.g. "Piscina", "Uscita mare") and the "environment" label (e.g. "Mare") shown on `SessionCard` chips remain in Italian.

## Root cause

`src/hooks/useSessions.ts` defines its own local `mapSessionType` and `mapEnvironmentType` that return hardcoded Italian strings, instead of using the localized helpers already available in `src/lib/i18n.ts` (which have both IT and EN translations: `mapSessionType`, `t("sea")`, `t("pool")`, `t("lake")`, `t("deepPoolSession")`).

These mapped strings flow into `SessionCard` (used in `Community.tsx` for "Sessions for you" and "From people you follow") and stay in Italian regardless of the active language.

## Changes

### 1. `src/hooks/useSessions.ts`
- Remove the local `mapSessionType` function (lines ~101–110).
- Remove the local `mapEnvironmentType` function (lines ~112–120).
- Import the shared `mapSessionType` from `@/lib/i18n`, plus `t`.
- Add (or reuse) a small `mapEnvironmentType` that uses `t("sea" | "pool" | "lake" | "deepPoolSession")`. Since this helper does not exist yet in `i18n.ts`, add `mapEnvironmentType` next to `mapSessionType` in `src/lib/i18n.ts` and import it here.
- Update the two call sites at lines ~350–351 to use the i18n versions.

### 2. `src/lib/i18n.ts`
- Add a new exported helper:
  ```ts
  export const mapEnvironmentType = (type: string): string => {
    switch (type) {
      case "sea": return t("sea");
      case "pool": return t("pool");
      case "deep_pool": return t("deepPoolSession");
      case "lake": return t("lake");
      default: return type;
    }
  };
  ```
- Verify the IT/EN dictionaries already contain `sea`, `pool`, `lake`, `deepPoolSession` (they do, per lines 57–63 / 814–820).

### 3. Reactivity note
`useSessions` recomputes derived data on every render of its consumer, so once the `LanguageContext` updates and Community re-renders, the new translations will appear immediately. No additional dependency wiring is required, but we will verify by switching language on `/community` after the change.

## Out of scope

- `useDiscoverFreedivers.ts` line 38 (`"pool_training": "Piscina"`) is a separate mapping for discipline labels in profiles; it can be addressed in a follow-up if the user reports the same issue there.
- `SessionDetails`, `MySessions`, `GroupSessionsList`, `SpotFiltersSheet` already use the i18n `mapSessionType` / `getSessionTypes`, so they are already correct.
