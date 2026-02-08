

# Inline "Tap to Edit" Profile UX

## Problem
Currently, editing profile fields (name, bio, location, avatar, personal bests) requires navigating to a separate Settings page. This creates unnecessary friction. The user wants a **"click to modify"** approach where each field can be edited directly from the Profile page.

## New UX Pattern

Each profile field becomes tappable directly on the Profile page. Tapping opens a small dialog/sheet to edit just that field, then saves and closes. No more navigating away.

### Profile Card Changes

| Element | Current Behavior | New Behavior |
|---------|-----------------|-------------|
| Avatar | Only editable in Settings | Tap to upload directly (camera icon overlay) |
| Name | Only editable in Settings | Tap to open edit dialog |
| Bio (empty) | Not shown | Show "Add bio" button that opens edit dialog |
| Bio (filled) | Static text | Tap to open edit dialog |
| Location (empty) | Not shown | Show "Add location" button |
| Location (filled) | Static text | Tap to edit in dialog |
| Personal Bests (empty) | "Add" goes to Settings | "Add" opens edit dialog/sheet |
| Personal Bests (filled) | View only; edit in Settings | Tap opens edit sheet |

### Settings Page Simplification

The Settings page becomes a lightweight preferences page with only:
- Language toggle
- Search visibility toggle
- Admin dashboard link (if admin)
- Logout button

Profile editing (name, bio, location, avatar, PBs) is removed from Settings since it all lives inline on the Profile page now.

## Implementation Details

### 1. New Component: `ProfileEditDialog`
A reusable dialog component that handles editing a single profile field (name, bio, or location). It receives:
- The field type (name / bio / location)
- Current value
- An onSave callback
- Open/close state

For **name**: a simple text input.
For **bio**: a textarea with 300-char counter.
For **location**: a text input.

### 2. New Component: `PersonalBestsSheet`
A bottom sheet (using the existing `Sheet` component) that wraps the existing `PersonalBestsForm` for editing PBs inline from the Profile page.

### 3. Profile Page Updates (`src/pages/Profile.tsx`)

**Avatar**: Add the `AvatarUpload` component directly in the profile card (replacing the static image/initial), so tapping the avatar triggers file upload.

**Name**: Wrap the name in a tappable element with a subtle edit icon. Clicking opens `ProfileEditDialog` in "name" mode.

**Bio**: 
- If bio exists: show it as tappable text, clicking opens the edit dialog
- If no bio: show an "Add bio" ghost button that opens the dialog

**Location**:
- If location exists: tappable, clicking opens edit dialog  
- If no location: show "Add location" ghost button

**Personal Bests**:
- Change `onAddClick` to open `PersonalBestsSheet` instead of navigating to `/settings`
- Add an edit button on the PBs card header that also opens the sheet

### 4. Settings Page Simplification (`src/pages/Settings.tsx`)

Remove the "Edit Profile" section (name, bio, location, avatar) and the "Personal Bests" section. Keep only:
- Language toggle
- Search visibility toggle
- Admin link
- Logout

This makes Settings a clean preferences-only page.

### 5. Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/profile/ProfileEditDialog.tsx` | **Create** -- reusable inline field editor |
| `src/components/profile/PersonalBestsSheet.tsx` | **Create** -- bottom sheet wrapping PBs form |
| `src/pages/Profile.tsx` | **Modify** -- add inline editing, avatar upload, add-bio button |
| `src/pages/Settings.tsx` | **Modify** -- remove profile editing, keep preferences only |
| `src/components/profile/PersonalBestsCard.tsx` | **Modify** -- add edit button on header |

No database changes needed -- all existing hooks and data layer remain the same.
