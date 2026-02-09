

# Fix Auth Guards, Add Session Sharing, and Show Profile Pictures

## Overview

Three issues to address:
1. **Sharing**: Sessions need a share button (groups already have one)
2. **Auth Guards**: Most pages are accessible without login -- only Community, Profile, MySessions, SessionDetails, CreateSession, and Onboarding redirect to `/auth`. Pages like Spots, Groups, GroupDetails, SpotDetails, Training, Search, UserProfile, EditSession, CreateGroup, GroupManage, and DiscoverFreedivers have NO auth guard.
3. **Profile Pictures**: SessionDetails fetches `avatar_url` for creator and participants but never renders the actual images -- only showing initials.

## Changes

### 1. Centralized Auth Guard

Instead of adding `useEffect` auth redirects to every page individually, create a reusable `RequireAuth` wrapper component that checks authentication and redirects to `/auth` if not logged in. Then wrap all protected routes in `App.tsx`.

**New file**: `src/components/auth/RequireAuth.tsx`
- Uses `useAuth()` to check for user
- Shows a loading spinner while auth is loading
- Redirects to `/auth` if no user
- Renders children if authenticated

**Modify**: `src/App.tsx`
- Wrap all routes except `/auth`, `/reset-password`, and `*` (NotFound) with `<RequireAuth>`
- Remove individual `useEffect` auth guards from: Community, Profile, MySessions, SessionDetails, CreateSession, Onboarding

### 2. Share Button on SessionDetails

**Modify**: `src/pages/SessionDetails.tsx`
- Add a Share button in the header (next to the edit button)
- Use the same share pattern as GroupDetails: `navigator.share()` with fallback to clipboard
- Add the `Share2` icon import from lucide-react

### 3. Show Profile Pictures in SessionDetails

**Modify**: `src/pages/SessionDetails.tsx`

**Creator avatar** (line ~401): Currently shows only the initial letter. Change to:
- If `session.creator?.avatar_url` exists, render an `<img>` tag with the avatar URL
- Otherwise fall back to the initial letter

**Participant avatars** (lines ~470-474 for pending, ~522-528 for confirmed): Currently show only initials. Change to:
- If `p.profile?.avatar_url` exists, render an `<img>` tag
- Otherwise fall back to the initial letter

## Technical Details

### RequireAuth Component

```text
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  return children;
};
```

### App.tsx Route Wrapping

```text
<Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
<Route path="/spots" element={<RequireAuth><Spots /></RequireAuth>} />
// ... all protected routes
```

### Avatar Rendering Pattern

```text
{session.creator?.avatar_url ? (
  <img
    src={session.creator.avatar_url}
    alt={session.creator.name}
    className="w-12 h-12 rounded-full object-cover"
  />
) : (
  <div className="w-12 h-12 rounded-full avatar-gradient flex items-center justify-center text-lg font-bold text-white">
    {session.creator?.name?.charAt(0).toUpperCase() || "?"}
  </div>
)}
```

Same pattern for participant bubbles (w-8 h-8 size).

### Share on SessionDetails

Same pattern as GroupDetails:
```text
const handleShare = async () => {
  try {
    await navigator.share({
      title: session.title,
      text: `Partecipa alla sessione "${session.title}"`,
      url: window.location.href,
    });
  } catch {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copiato!" });
  }
};
```

## Files to Modify

| File | Changes |
|---|---|
| `src/components/auth/RequireAuth.tsx` | **NEW** - Centralized auth guard component |
| `src/App.tsx` | Wrap all protected routes with RequireAuth |
| `src/pages/Community.tsx` | Remove individual useEffect auth guard |
| `src/pages/Profile.tsx` | Remove individual useEffect auth guard |
| `src/pages/MySessions.tsx` | Remove individual useEffect auth guard |
| `src/pages/SessionDetails.tsx` | Remove auth guard, add share button, show profile pictures for creator and participants |
| `src/pages/CreateSession.tsx` | Remove individual useEffect auth guard |
| `src/pages/Onboarding.tsx` | Remove individual useEffect auth guard |

## Scope

- Auth: structural change (centralized guard) -- no database changes
- Share: UI addition using existing Web Share API pattern
- Avatars: rendering fix using data already fetched by useSessionDetails
