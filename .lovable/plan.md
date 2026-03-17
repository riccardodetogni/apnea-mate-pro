

# User Reviews Feature

## Summary

Reviews are **user-to-user only** (not on sessions or groups). A user who shared a past session with another user can leave a review on them. Reviews appear on the reviewed user's profile, are **anonymised** (reviewer identity hidden from public), **editable**, and comments are **optional**.

## Database

### New table: `reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| reviewer_id | uuid NOT NULL | FK-style, the person writing |
| reviewed_user_id | uuid NOT NULL | the person being reviewed |
| rating | integer NOT NULL | 1-5, enforced via trigger |
| comment | text | nullable, optional |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**Unique constraint**: `(reviewer_id, reviewed_user_id)` -- one review per pair.

### RLS Policies

- **SELECT**: Authenticated users can read all reviews (public social proof, but reviewer_id is never exposed to the client -- see hook design below).
- **INSERT**: `auth.uid() = reviewer_id`
- **UPDATE**: `auth.uid() = reviewer_id`
- **DELETE**: `auth.uid() = reviewer_id`

### Eligibility check (security definer function)

`can_review_user(reviewer_id uuid, target_id uuid) RETURNS boolean` -- returns true if there exists at least one past session (date_time + interval duration_minutes < now()) where both users are confirmed participants, OR one is the creator and the other is a confirmed participant.

### Validation trigger

Before INSERT/UPDATE on `reviews`: call `can_review_user` and check rating is 1-5.

## Hook: `useReviews.ts`

- `fetchReviewsForUser(userId)` -- returns reviews with **anonymised** data: rating, comment, created_at, updated_at. Does NOT return reviewer_id or reviewer profile info to the client. We'll use a DB view or an RPC function that strips reviewer identity.
- `fetchMyReviewForUser(targetUserId)` -- returns the current user's own review (if any) so they can edit it.
- `fetchAverageRating(userId)` -- returns avg rating + count.
- `submitReview(targetUserId, rating, comment?)` -- upsert (insert or update).
- `deleteReview(targetUserId)` -- remove own review.

### Anonymisation approach

Create a **database view** `anonymous_reviews` that selects `id, reviewed_user_id, rating, comment, created_at, updated_at` (excludes `reviewer_id`). RLS on the base table still applies; the view is used for public-facing queries. The user's own review is fetched separately filtered by `reviewer_id = auth.uid()`.

## UI Components

### `src/components/reviews/StarRating.tsx`
Reusable star display (read-only) and input (interactive) component. 1-5 stars with half-star display for averages.

### `src/components/reviews/ReviewSummary.tsx`
Shows average rating (stars) + review count. Compact, placed on profile cards.

### `src/components/reviews/ReviewCard.tsx`
Single anonymous review: stars, optional comment text, relative date. No reviewer name/avatar shown.

### `src/components/reviews/ReviewForm.tsx`
Star picker + optional textarea. Submit button. Pre-fills if editing an existing review.

## Page Integration

### `UserProfile.tsx`
- Below the profile card, show `ReviewSummary` (avg stars + count).
- Below that, show list of `ReviewCard` components.
- If the current user is eligible (shared a past session) and hasn't reviewed yet, show "Leave a review" button that opens `ReviewForm` in a sheet/dialog.
- If the current user already reviewed, show their review with an "Edit" button.

### `Profile.tsx` (own profile)
- Show `ReviewSummary` so the user can see their own average rating.
- Show the list of anonymous reviews others left.

## i18n Keys

- `reviews` / "Recensioni" / "Reviews"
- `leaveReview` / "Lascia una recensione" / "Leave a review"
- `editReview` / "Modifica recensione" / "Edit review"
- `deleteReview` / "Elimina recensione" / "Delete review"
- `noReviews` / "Nessuna recensione ancora" / "No reviews yet"
- `reviewSubmitted` / "Recensione inviata!" / "Review submitted!"
- `reviewUpdated` / "Recensione aggiornata!" / "Review updated!"
- `reviewDeleted` / "Recensione eliminata" / "Review deleted"
- `averageRating` / "Valutazione media" / "Average rating"
- `anonymous` / "Anonimo" / "Anonymous"

## Files to create
- `src/hooks/useReviews.ts`
- `src/components/reviews/StarRating.tsx`
- `src/components/reviews/ReviewSummary.tsx`
- `src/components/reviews/ReviewCard.tsx`
- `src/components/reviews/ReviewForm.tsx`

## Files to modify
- `src/pages/UserProfile.tsx` -- add review summary + list + leave/edit review
- `src/pages/Profile.tsx` -- add review summary + anonymous review list
- `src/lib/i18n.ts` -- new keys

## Implementation order
1. DB migration (table, view, function, trigger, RLS)
2. `useReviews` hook
3. Star rating + review card + form + summary components
4. Integrate into UserProfile and Profile pages
5. i18n keys

