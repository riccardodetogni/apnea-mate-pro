## Problem

Several strings on the GroupDetails page are hardcoded in Italian instead of using the `t()` translation function:

1. **"Condividi"** (Share button) - line 194
2. **"Annulla richiesta"** (Cancel request button) - line 169
3. **"Richiedi iscrizione"** (Request enrollment) - line 164
4. **"Lascia gruppo"** (Leave group) - line 174
5. **"richieste in attesa di approvazione"** (Pending requests notice) - line 205
6. **`activityType`** displayed raw from DB (e.g. "Misto") in `GroupHeroCard` line 55 - needs translation mapping

## Changes

### 1. `src/lib/i18n.ts`
Add missing translation keys to both IT and EN dictionaries:
- `cancelRequest`: "Annulla richiesta" / "Cancel request"
- `requestEnrollment`: "Richiedi iscrizione" / "Request enrollment"  
- `leaveGroup`: "Lascia gruppo" / "Leave group"
- `pendingApprovalNotice`: "richieste in attesa di approvazione" / "pending approval requests"
- Activity type translations: `activityMixed`: "Misto" / "Mixed", and any other activity types used

Add a `mapActivityType()` helper similar to `mapSessionType()`.

### 2. `src/pages/GroupDetails.tsx`
Replace all 5 hardcoded Italian strings with `t()` calls using the new keys.
Pass translated `activityType` to `GroupHeroCard` via `mapActivityType(group.activity_type)`.

### 3. `src/components/groups/GroupHeroCard.tsx`
No changes needed - it already renders `activityType` as-is; the translation happens at the call site.
