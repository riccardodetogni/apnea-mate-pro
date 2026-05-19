## Move "Send feedback" to Profile, remove Settings page

You're right — `/settings` is not linked from anywhere (no bottom nav, no Profile entry). It's effectively dead. Let's drop it and put feedback where users actually go.

### Changes

1. **`src/pages/Profile.tsx`** — in the existing Settings card (the one with Admin / Insurance / Search visibility rows), add a new row "Send feedback" (MessageSquare icon) that opens `FeedbackSheet`. Place it right above the Admin row (or at the top of the card if not admin). Add local `feedbackOpen` state and mount `<FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />` at the bottom of the page.

2. **Delete `src/pages/Settings.tsx`** and remove its lazy import + `/settings` route from `src/App.tsx`.

3. Keep `FeedbackSheet.tsx`, `useFeedback.ts`, the migration, admin tab, and i18n keys — all unchanged.

### Out of scope
- No changes to feedback DB / admin UI / hook.
- No floating button.
