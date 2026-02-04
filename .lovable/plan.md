
# Plan: Add Profile Picture Upload for Users and Groups

## Summary
Add the ability for users to upload personal profile pictures and for group owners to upload group avatars. This will require:
1. Creating a new storage bucket for avatars
2. Building a reusable image upload component
3. Adding upload functionality to the Settings page (for user profiles)
4. Adding upload functionality to the Group Management page (for groups)

---

## Current State

### Database
- **profiles** table already has an `avatar_url` column (currently unused)
- **groups** table already has an `avatar_url` column (currently unused)
- A **certifications** storage bucket exists (private), but no avatar bucket

### UI
- **Profile page**: Shows user initial as placeholder (no upload option)
- **Settings page**: Only allows editing name and location
- **GroupManage page**: Only manages members, no group settings
- **CreateGroup page**: No avatar upload option

---

## Implementation Steps

### Step 1: Create Storage Bucket
Create a public `avatars` bucket with appropriate RLS policies:
- Users can upload to their own folder (`user_id/*`)
- Group owners can upload to their group folder (`groups/group_id/*`)
- Anyone can read public avatars

### Step 2: Create Reusable AvatarUpload Component
A component that:
- Shows current avatar or placeholder initial
- Has a camera/edit icon overlay
- Opens file picker on click
- Handles upload to storage
- Returns the public URL

### Step 3: Add Avatar Upload to Settings Page
- Add the AvatarUpload component above the name field
- Upload to `avatars/user_id/avatar.jpg`
- Update profile.avatar_url on successful upload

### Step 4: Add Group Settings Section
Create a new section in GroupManage page (or a separate tab) for:
- Uploading group avatar
- Upload to `avatars/groups/group_id/avatar.jpg`
- Update groups.avatar_url on successful upload

---

## Technical Details

### Storage Bucket SQL Migration
```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- RLS: Anyone can view avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Group owners can upload group avatars
CREATE POLICY "Group owners can upload group avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'groups'
  AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id::text = (storage.foldername(name))[2]
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
  )
);
```

### New Component: `src/components/ui/AvatarUpload.tsx`
- Props: `currentUrl`, `name` (for initial), `onUpload(url)`, `uploadPath`, `size`
- Uses file input with accept="image/*"
- Resizes image client-side before upload (optional optimization)
- Uploads to storage and calls onUpload with public URL

### Settings Page Changes
- Import AvatarUpload component
- Add above the name field in the "Edit Profile" section
- Call `updateProfile({ avatar_url })` on successful upload

### GroupManage Page Changes
- Add a new "Settings" tab alongside "Requests" and "Members"
- Include AvatarUpload for group avatar
- Add ability to edit group name/description (bonus)

---

## Files to Create
1. `src/components/ui/AvatarUpload.tsx` - Reusable upload component

## Files to Modify
1. `src/pages/Settings.tsx` - Add avatar upload for user profile
2. `src/pages/GroupManage.tsx` - Add settings tab with group avatar upload
3. `src/hooks/useGroupDetails.ts` - Add `updateGroup` function
4. `src/pages/Profile.tsx` - Display uploaded avatar instead of initial

## Database Migration
1. Create `avatars` storage bucket with RLS policies
