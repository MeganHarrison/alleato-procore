-- Fix documents table RLS policies to allow authenticated users to insert/update

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON "public"."documents";

-- Create new policies for authenticated users
CREATE POLICY "Enable insert for authenticated users"
ON "public"."documents"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON "public"."documents"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON "public"."documents"
FOR DELETE
TO authenticated
USING (true);
