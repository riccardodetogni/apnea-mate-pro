## Issue

On the Community (and Groups) page, group cards always show the first letter of the group name instead of the uploaded group avatar — even when the group has one. `GroupHeroCard` on the group detail page renders avatars correctly, so the data exists; only the list card is broken.

## Root cause

`src/components/community/GroupCard.tsx` accepts only `initial` and renders it inside `.avatar-group`. It never receives or renders an `avatarUrl`.

`src/hooks/useGroups.ts` fetches `groups.*` (which includes `avatar_url`), but its `GroupWithDetails` formatter strips it out — only `initial` is forwarded to the card.

## Fix (UI / presentation only, fully backward compatible)

1. `src/hooks/useGroups.ts`
   - Add `avatarUrl: string | null` to `GroupWithDetails`.
   - In the `formattedGroups` map, set `avatarUrl: group.avatar_url ?? null`.

2. `src/components/community/GroupCard.tsx`
   - Add optional prop `avatarUrl?: string | null`.
   - In the avatar slot, render `<img src={avatarUrl} alt={name} class="w-full h-full object-cover rounded-[inherit]" />` when `avatarUrl` is truthy, otherwise fall back to the existing `{initial}`.
   - Keep all existing classes/sizes so layout doesn't shift.

No changes to `Community.tsx` or `Groups.tsx` are needed — they already spread `{...group}`, so the new `avatarUrl` flows through automatically.

## Verification

- Groups with an uploaded avatar in `/community` "Your groups" and "Groups near you" rows now show the image.
- Groups without an avatar still show the initial (retrocompatible).
- Hero card on group detail page is unchanged.