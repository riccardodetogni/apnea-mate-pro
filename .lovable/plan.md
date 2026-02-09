

# Fix Notification Navigation URLs (404 Bug)

## Problem

The notification click handler in `NotificationsDrawer.tsx` navigates to URLs that don't match the routes defined in `App.tsx`:

| Notification navigates to | Actual route in App.tsx |
|---|---|
| `/session/:id` (singular) | `/sessions/:id` (plural) |
| `/group/:id` (singular) | `/groups/:id` (plural) |
| `/user/:id` (singular) | `/users/:id` (plural) |

All three are wrong, causing 404s when clicking any notification.

## Fix

**File**: `src/components/notifications/NotificationsDrawer.tsx`

Change lines 47-53 in `handleNotificationClick`:

- `/session/` to `/sessions/`
- `/group/` to `/groups/`
- `/user/` to `/users/`

That's it -- a 3-character fix in 3 lines.

