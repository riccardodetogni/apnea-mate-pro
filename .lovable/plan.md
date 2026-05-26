## Cover photo upload — Spot, Event, Course

### 1. Database & Storage (one migration)

- Add `cover_image_url TEXT NULL` to `public.spots` (events/courses already have it).
- Create public storage bucket **`covers`** (single bucket, foldered by entity).
  - RLS on `storage.objects`:
    - Public SELECT for `bucket_id='covers'`.
    - Authenticated INSERT/UPDATE/DELETE for `bucket_id='covers'` when `(storage.foldername(name))[1] = auth.uid()::text` — i.e. each user uploads only under their own UID folder.
- File path convention: `covers/{user_id}/{entity}-{timestamp}.{ext}` where entity ∈ `spot|event|course`.

### 2. Shared component `src/components/ui/CoverImageUpload.tsx`

Reusable, used in all 6 forms (Create/Edit × Spot/Event/Course).

Props:
```
{
  currentUrl: string | null;
  uploadPath: string;        // e.g. `${user.id}` (folder)
  entity: "spot" | "event" | "course";
  onChange: (url: string | null) => void;
}
```

Behavior:
- 16:9 area (`aspect-video`, `rounded-xl`, `overflow-hidden`, `bg-muted`, dashed border when empty).
- Empty state: centered camera icon + placeholder text `"Aggiungi una foto di copertina"`. Click anywhere opens hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` (native picker; on Capacitor iOS/Android this opens the system gallery/camera chooser).
- Filled state: `<img class="w-full h-full object-cover" />` + small dark circular ✕ button top-right that calls `handleRemove`.
- Below the area, always show small muted helper text: `"Per un risultato ottimale, carica un'immagine orizzontale in formato 16:9 (es. 1280x720px o superiore). Immagini verticali o quadrate verranno ritagliate ai lati."`
- Loading: spinner overlay while uploading.

Validation (client):
- MIME must be `image/jpeg|png|webp` → otherwise toast `"Formato non supportato. Usa JPG, PNG o WebP."`.
- Size ≤ 5 MB → otherwise inline error under area: `"Il file è troppo grande. Dimensione massima: 5MB."`.

Upload flow:
- `supabase.storage.from('covers').upload(path, file, { upsert: true, cacheControl: '3600' })`.
- `getPublicUrl` → append `?t=${Date.now()}` cache-buster → call `onChange(url)`. Persisted to DB by the parent on save.

Remove flow (`handleRemove`):
- If `currentUrl` points to our `covers` bucket, derive the object path and call `supabase.storage.from('covers').remove([path])` (best-effort, don't block UI on error).
- Call `onChange(null)`. Parent persists `cover_image_url = null` on save.

### 3. Form wiring

For each form, render `<CoverImageUpload />` as the first field (top of the form), keep `coverUrl` in local state, and include it in the insert/update payload.

- **CreateSpot / EditSpot** (`SpotCreator.tsx`): add `cover_image_url` to `form` state, read/write to `spots.cover_image_url`. Pass `entity="spot"`.
- **CreateEvent / EditEvent**: include `cover_image_url` in `events` insert/update payload. Pass `entity="event"`.
- **CreateCourse / EditCourse**: include `cover_image_url` in `courses` insert/update payload. Pass `entity="course"`.

No changes to detail/list pages in this task (display already supported where `cover_image_url` is used; spots display is out of scope unless you want it — flag if desired).

### Technical notes

- Native picker on Capacitor works via the standard `<input type="file" accept="image/*">` — no extra plugin needed for gallery selection.
- Bucket is **public** so URLs render without signed URLs; auth-gated writes via storage RLS.
- Helper text uses `text-xs text-muted-foreground`.
- We re-use the existing `avatars` upload pattern (`AvatarUpload.tsx`) for consistency.
