-- Add missing UPDATE policy for reference-images storage bucket.
-- Without this, upsert uploads fail when the file already exists.

CREATE POLICY "Users update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'reference-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'reference-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
