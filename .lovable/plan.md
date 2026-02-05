
# Plan: Add Edit Session & Improve Edit Group Access

## Summary
Add the ability to edit sessions for the session creator, and improve the visibility of the edit/manage button for groups.

---

## Current State

### Sessions
- Session creators can only **cancel** a session
- No way to edit session details (title, description, date, time, spot, level, etc.)

### Groups
- Group owners see a **Settings icon** (gear) in the header that navigates to `/groups/:id/manage`
- The manage page has a "Settings" tab for editing name, description, and avatar
- This works but may not be discoverable - it's a small gear icon

---

## Proposed Changes

### 1. Edit Session Functionality

**New Page: `src/pages/EditSession.tsx`**
- Create an edit page similar to `CreateSession.tsx` but pre-populated with existing session data
- Allow editing: title, description, date/time, duration, max participants, level, session type
- Cannot change: spot (to prevent confusion for participants), group
- Only accessible by session creator

**Route:** `/sessions/:id/edit`

**SessionDetails.tsx Updates:**
- Add an "Edit" button (pencil icon) in the header for the session creator
- Navigate to `/sessions/:id/edit` when clicked

**Hook Updates:**
- Add `updateSession` function to `useSessionDetails.ts`

### 2. Improve Group Edit Button Visibility

**GroupDetails.tsx Updates:**
- Make the Settings/Edit button more prominent for group owners
- Add text label "Modifica" or "Gestisci" next to the icon for clarity

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/EditSession.tsx` | Edit session form page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/sessions/:id/edit` |
| `src/pages/SessionDetails.tsx` | Add Edit button for creator |
| `src/hooks/useSessionDetails.ts` | Add `updateSession` function |
| `src/pages/GroupDetails.tsx` | Make edit button more visible |

---

## Technical Details

### EditSession.tsx Structure
```text
- Fetch session data using session ID
- Pre-populate form with current values
- Validate user is the creator
- On submit, update the session in database
- Notify participants if date/time changed
```

### SessionDetails.tsx - Edit Button
Add in header next to back button (only for creator):
```text
{session.isCreator && (
  <button onClick={() => navigate(`/sessions/${id}/edit`)}>
    <Pencil icon />
  </button>
)}
```

### GroupDetails.tsx - More Visible Edit
Change the small gear icon to a button with text:
```text
{group.is_owner && (
  <Button variant="outline" size="sm">
    <Settings icon /> Gestisci
  </Button>
)}
```

---

## Summary Table

| Feature | Current | After |
|---------|---------|-------|
| Edit session | Not available | Edit button in header for creator |
| Edit group | Small gear icon | More visible "Gestisci" button |
