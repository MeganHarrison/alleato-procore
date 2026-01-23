-- Directory enhancements: profile photos + admin tooling
-- Adds dedicated table for storing lightweight profile images that can be managed
-- through service-role backed API routes without exposing storage buckets.

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS person_profile_photos (
  person_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'image/png',
  data_base64 TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_person_profile_photos_updated_at
  BEFORE UPDATE ON person_profile_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE person_profile_photos ENABLE ROW LEVEL SECURITY;

-- Limit direct table access to the service role. Application access is mediated
-- through Next.js API routes that perform their own permission checks before
-- invoking the service role client.
CREATE POLICY "profile photos managed via service role"
  ON person_profile_photos
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
