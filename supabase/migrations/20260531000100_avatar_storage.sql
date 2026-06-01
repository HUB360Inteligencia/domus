-- =============================================================================
-- Migration: Avatar Storage Bucket + RLS Policies
-- Description: Creates the 'avatars' storage bucket for user profile pictures
--              with proper RLS policies for secure access control.
-- =============================================================================

-- Create avatars storage bucket (public for fast avatar loading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ─── RLS Policies ───────────────────────────────────────────────────────────

-- Users can upload their own avatar (folder = their user ID)
CREATE POLICY "users_upload_own_avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update/overwrite their own avatar
CREATE POLICY "users_update_own_avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
CREATE POLICY "users_delete_own_avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view avatars (bucket is public)
CREATE POLICY "public_view_avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
