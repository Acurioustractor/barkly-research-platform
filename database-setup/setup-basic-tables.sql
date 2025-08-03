-- Basic tables for Barkly Research Platform
-- Run this in your Supabase SQL editor

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  file_path TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all documents
CREATE POLICY IF NOT EXISTS "Documents are viewable by everyone" 
ON documents FOR SELECT 
USING (true);

-- Policy: Authenticated users can insert documents
CREATE POLICY IF NOT EXISTS "Authenticated users can insert documents" 
ON documents FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own documents
CREATE POLICY IF NOT EXISTS "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a simple test document
INSERT INTO documents (title, content, status) 
VALUES ('Test Document', 'This is a test document for the Barkly Research Platform', 'completed')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON documents TO authenticated;
GRANT SELECT ON documents TO anon;