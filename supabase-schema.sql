-- Create profiles_tracked table
CREATE TABLE IF NOT EXISTS profiles_tracked (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS profiles_tracked_user_id_idx ON profiles_tracked(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS profiles_tracked_created_at_idx ON profiles_tracked(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles_tracked ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own profiles
CREATE POLICY "Users can view their own profiles"
  ON profiles_tracked
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own profiles
CREATE POLICY "Users can insert their own profiles"
  ON profiles_tracked
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON profiles_tracked
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own profiles
CREATE POLICY "Users can delete their own profiles"
  ON profiles_tracked
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_tracked_updated_at
  BEFORE UPDATE ON profiles_tracked
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

