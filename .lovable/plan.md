## Fix avatar stretching

### Root cause

`src/components/ui/avatar.tsx` — the shadcn `AvatarImage` primitive applies `aspect-square h-full w-full` but **omits `object-cover`**. Default `<img>` behavior is `object-fit: fill`, which stretches non-square photos. Every avatar in the app (profile page, session/event/course cards, chat, search, member lists, upload preview) flows through this primitive, so a one-line fix in the primitive fixes all of them.

### Fix

In `src/components/ui/avatar.tsx`, add `object-cover` to `AvatarImage` className:

```tsx
className={cn("aspect-square h-full w-full object-cover", className)}
```

`Avatar` root already enforces fixed size (`h-10 w-10` default, overridden per call site) and `rounded-full overflow-hidden`, so width/height are explicit and the circular crop is preserved.

### Verification

All other avatar renders are raw `<img>` tags that already include `object-cover` and explicit `w-*/h-*` (verified: `UserProfile`, `CourseDetails`, `EventDetails`, `ChatThread`, `ConversationItem`, `SessionCard`, `EventCard`, `CourseCard`, `GroupHeroCard`). No changes needed there.

The upload preview (`AvatarUpload.tsx`) uses `Avatar`/`AvatarImage`, so it inherits the fix automatically — the user will see the exact circular crop before saving.

### Scope

One file changed: `src/components/ui/avatar.tsx`. No layout, color, or sizing changes.
