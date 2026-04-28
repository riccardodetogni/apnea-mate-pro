# Fix GroupManage visual issues

Two regressions visible in the screenshot:
1. **Inactive tabs** ("Richieste" and "Impostazioni") are nearly invisible — `text-white/70` over a `bg-white/10` translucent strip lacks contrast.
2. **Member cards** ("Membri" tab) are flat uniform navy (`bg-card`) — they should match the radial teal/blue gradient used by other cards in the app (`card-group`).

## Changes (src/pages/GroupManage.tsx)

### 1. Tab bar — restore readable inactive state
- Strengthen inactive label contrast: `text-white/70` → `text-white/90 font-medium`
- Slightly stronger background container: `bg-white/10` → `bg-white/15`
- Keep active tab as solid white pill with `text-foreground` (already correct)

### 2. Member cards — add gradient
- `MemberCard` container: replace `bg-card border border-white/8` with `card-group border border-white/10`
- `PendingCard` container: replace `bg-card border border-warning/30` with `card-group border border-warning/40` (keeps the warning accent border to distinguish pending state, but adds the gradient base)
- `creatorLabel` badge: keep current `bg-white/10` chip styling (already legible against the new gradient)

## Out of scope
- No changes to `GroupMembersSheet.tsx` (already uses `card-group` from previous fix)
- No changes to settings tab content (already uses `card-group`)
- No changes to icons, layout, or behavior