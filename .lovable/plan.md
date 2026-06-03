## Fix

`src/pages/Groups.tsx` lists each prop passed to `GroupCard` explicitly (line 113-128) and was never updated when we added `avatarUrl` to `GroupWithDetails`. So the card always renders the initial.

Add one line:

```tsx
<GroupCard
  ...
  groupType={group.groupType}
  avatarUrl={group.avatarUrl}
  onJoin={...}
  onViewProfile={...}
/>
```

No other changes. Community already works because it uses `{...group}`.

## Verification

`/groups` shows uploaded group avatars; groups without an avatar still show the initial.