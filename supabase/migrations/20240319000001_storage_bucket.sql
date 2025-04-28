-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

-- Policy for public read access to avatar images
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy for authenticated users to upload avatar images
CREATE POLICY "Users can upload avatar images."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy for authenticated users to update avatar images
CREATE POLICY "Users can update avatar images."
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy for authenticated users to delete avatar images
CREATE POLICY "Users can delete avatar images."
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars'); 