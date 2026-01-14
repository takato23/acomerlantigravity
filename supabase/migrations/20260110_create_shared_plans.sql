-- Migration: Create shared_plans table for sharing meal plans
-- Feature #13: Share Plan with Family

-- Create table for shared plans
CREATE TABLE IF NOT EXISTS shared_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to the original plan or snapshot
  plan_id UUID,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Unique share token for public access
  share_token VARCHAR(32) UNIQUE NOT NULL,
  
  -- Snapshot of the plan at share time (so original edits don't affect shared view)
  plan_snapshot JSONB NOT NULL,
  
  -- Optional title for the shared plan
  title VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  
  -- Analytics
  views INT DEFAULT 0,
  
  -- Settings
  is_active BOOLEAN DEFAULT true
);

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_shared_plans_token ON shared_plans(share_token);

-- Create index for creator queries
CREATE INDEX IF NOT EXISTS idx_shared_plans_creator ON shared_plans(creator_id);

-- Enable RLS
ALTER TABLE shared_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view an active shared plan by token (public access)
CREATE POLICY "Anyone can view active shared plans" 
  ON shared_plans 
  FOR SELECT 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Creators can see all their shared plans
CREATE POLICY "Creators can view their shared plans" 
  ON shared_plans 
  FOR SELECT 
  USING (auth.uid() = creator_id);

-- Creators can insert new shared plans
CREATE POLICY "Users can create share links" 
  ON shared_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their shared plans (e.g., deactivate)
CREATE POLICY "Users can update their shared plans" 
  ON shared_plans 
  FOR UPDATE 
  USING (auth.uid() = creator_id);

-- Creators can delete their shared plans
CREATE POLICY "Users can delete their shared plans" 
  ON shared_plans 
  FOR DELETE 
  USING (auth.uid() = creator_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_shared_plan_views(token VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE shared_plans
  SET views = views + 1
  WHERE share_token = token AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
