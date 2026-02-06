

# Fix: Group Members Interaction Flow

## Current Behavior
- The stacked avatar row on the group details page is static (not clickable)
- The "View all" text link only appears when there are more than 6 members
- The bottom sheet (searchable member list) already has clickable rows that navigate to profiles correctly

## Desired Behavior
- Clicking on the members section (avatars or the member count) opens the searchable members sheet
- From the sheet, each member row navigates to their profile (already working)
- Avatars on the group page should NOT navigate directly to profiles

## Changes

### 1. `GroupMembersSection.tsx`
- Make the entire avatar row and member count clickable
- Always allow opening the sheet regardless of member count (remove the `totalCount > 6` condition for showing the interaction)
- When clicked, trigger the `onViewAll` callback to open the members sheet
- Add cursor and hover styles to indicate the section is interactive

### 2. No changes needed to `GroupMembersSheet.tsx`
- It already handles search, filtering, role badges, and profile navigation with correct `from` state

### 3. No changes needed to `GroupDetails.tsx`
- It already passes `onViewAll` and renders the sheet -- the connection is already wired up

## Technical Details

**GroupMembersSection.tsx** -- wrap the avatar row and count in a clickable container:

```typescript
// Make the avatar row and count clickable to open the sheet
<div
  onClick={onViewAll}
  className="cursor-pointer hover:opacity-80 transition-opacity"
>
  <div className="flex items-center -space-x-2">
    {/* existing avatars */}
  </div>
  <p className="text-sm text-muted mt-3">
    {totalCount} {t("members")}
  </p>
</div>
```

The "View all" text link with the chevron will always be shown (not just when there are more than 6 members) so users always have a clear way to open the full list.

