## Add "Diving Center" group type

Introduce a third `group_type` alongside `community` and `school`, treated as a professional, verification-eligible organization (same trust tier as schools).

### 1. Database
- Migration on `public.groups`: relax/replace the existing `group_type` check (or add value) to allow `'diving_center'` in addition to `'community'` and `'school'`.
- Update `is_verified_group_owner` is unaffected (it checks `verified = true` regardless of type, so diving centers can be verified the same way).

### 2. Backend logic / RLS
- No RLS changes needed. Events/Courses creation gating already relies on instructor/admin role + `is_group_owner`, not on group type.
- Verification flow stays manual (admin-driven), same as schools.

### 3. UI — Create / Edit Group
File: `src/pages/CreateGroup.tsx`
- Replace the 2-button toggle with a 3-option selector (Community / School / Diving Center). Keep pill-style buttons; wrap if needed at narrow widths.
- Update helper text shown when `school` or `diving_center` is selected: "Per diventare partner verificato, contatta il nostro team dopo la creazione."
- Type the state as `"community" | "school" | "diving_center"`.

### 4. UI — Display
- `src/components/groups/GroupHeroCard.tsx`: add a badge case for `groupType === "diving_center"` (label "Diving Center", same styling as the school badge).
- `src/components/community/GroupCard.tsx`: extend `getBadge()` so verified diving centers show "Centro partner" (verified) or "Diving Center" badge; unverified shows the type label.
- `src/components/groups/GroupFilterChips.tsx`: optionally add a "Diving Centers" filter chip next to "Schools" (or fold both into a single "Professional" chip). **Decision: add a separate "Diving Centers" chip** for clarity.
- `src/pages/Groups.tsx`: extend `GroupFilter` union + filtering logic for the new chip.

### 5. i18n
File: `src/lib/i18n.ts`
- Add keys: `groupTypeDivingCenter` ("Diving Center"), `verifiedDivingCenter` ("Centro partner"), `filterDivingCenters` ("Diving Center").
- Keep Italian and English variants consistent with existing pattern.

### 6. Memory updates
- Update `mem://features/group-verification-and-partner-status` and `mem://features/groups-tab-complete` to mention the new type.

### Out of scope
- No changes to event/course creation gating (already permissive).
- No automated verification — admin still flips `verified` flag manually.
- No icon changes for map markers.
