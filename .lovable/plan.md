
# Fix Creator Label Clarity and Member List Text Colors

## Overview

Two distinct issues to address:
1. The session creator label on SessionCard and SessionDetails is not clearly indicating that the person is the "organizer" of the session
2. Member names in GroupMembersSheet and related people lists appear as black text on dark backgrounds

## Issues Found

### Issue 1: Creator label not clear enough

In **SessionCard.tsx** (line 130-131), the creator's name and role are shown but there's no label like "Organizzatore" or "Creato da" to make it clear this person created the session.

In **SessionDetails.tsx** (line 404), the creator card shows the name and role but the section has no heading or label indicating "Organizer".

### Issue 2: Black text in member/people lists

**GroupMembersSheet.tsx** (line 129): Member names use `text-foreground` (dark) on `bg-card` (dark navy) -- invisible.
Also line 115: Avatar fallback text uses no explicit color, inheriting dark.
Also line 31: The "member" role badge uses `bg-muted text-muted-foreground` which are dark colors on dark card.

**GroupMembersSection.tsx** (line 45): Avatar initials use `text-muted-foreground` which is dark.

**GroupMembersSheet.tsx** (line 90): Search icon uses `text-muted` (dark).

## Changes

### 1. `src/components/community/SessionCard.tsx`
- Add a small label "Organizzato da" (Organized by) before the creator name, or change the role text beneath the name to show "Organizzatore" for clarity
- Change the role subtitle from just "Istruttore"/"Utente" to "Organizzatore - Istruttore"/"Organizzatore" to make the relationship clear

### 2. `src/pages/SessionDetails.tsx`
- Add a section heading "Organizzatore" above the creator card (like how "Partecipanti confermati" has a heading)
- This makes it immediately clear who created/organized the session

### 3. `src/components/groups/GroupMembersSheet.tsx`
- Line 112: Add `border-white/8` to the member card border (dark-compatible)
- Line 115: Change avatar `bg-muted` to `bg-white/10` and add `text-card-foreground` for the initial
- Line 129: Change `text-foreground` to `text-card-foreground` on member names
- Line 31: Change member role badge from `bg-muted text-muted-foreground` to `bg-white/10 text-white/55`
- Line 90: Change search icon from `text-muted` to `text-muted-foreground`
- Line 81: Add `bg-card` styling to the SheetContent for consistency (currently uses `bg-background` from the Sheet default)

### 4. `src/components/groups/GroupMembersSection.tsx`
- Line 45: Change avatar `text-muted-foreground` to `text-white/70` (these avatars sit on `bg-muted` which is dark due to the dark alpha)
- Line 61: Same fix for the "+N" counter

## Technical Details

### SessionCard creator label pattern

Current:
```tsx
<span className="text-[11px] text-white/55">{t(creatorRole)}</span>
// Shows just "Istruttore" or "Utente"
```

After:
```tsx
<span className="text-[11px] text-white/55">
  {t("organizer")} {creatorRole !== "user" ? `· ${t(creatorRole)}` : ""}
</span>
```

This adds an i18n key "organizer" = "Organizzatore" that makes it explicit.

### SessionDetails creator heading

Current: No heading above the creator card.

After:
```tsx
<h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
  Organizzatore
</h3>
<div className="bg-card rounded-2xl ...">
```

### GroupMembersSheet text fix pattern

Before:
```tsx
<p className="font-medium text-foreground truncate">  // BLACK on dark
```

After:
```tsx
<p className="font-medium text-card-foreground truncate">  // WHITE on dark
```

### Member role badge fix

Before:
```tsx
member: { label: "memberBadge", icon: User, className: "bg-muted text-muted-foreground" }
```

After:
```tsx
member: { label: "memberBadge", icon: User, className: "bg-white/10 text-white/55" }
```

### Files to modify

| File | Changes |
|---|---|
| `src/components/community/SessionCard.tsx` | Add "Organizzatore" label to creator section |
| `src/pages/SessionDetails.tsx` | Add "Organizzatore" heading above creator card |
| `src/components/groups/GroupMembersSheet.tsx` | Fix member name to `text-card-foreground`, avatar to `bg-white/10 text-card-foreground`, member badge to `bg-white/10 text-white/55`, border to `border-white/8` |
| `src/components/groups/GroupMembersSection.tsx` | Fix avatar initial color to `text-white/70` |
| `src/lib/i18n.ts` | Add "organizer" translation key (IT: "Organizzatore", EN: "Organizer") |
