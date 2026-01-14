-- Migration: Create meal_plan_history table for storing plan history
-- Feature #11: Historial de Planes

-- Create table for storing meal plan history
CREATE TABLE IF NOT EXISTS meal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan data stored as JSON for flexibility
  plan_data JSONB NOT NULL,
  
  -- Quick access fields for filtering/sorting
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Computed nutrition summary
  total_calories INT,
  total_protein DECIMAL(10,2),
  total_carbs DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  
  -- Cost estimate (if available)
  total_cost DECIMAL(10,2),
  
  -- Meal count
  total_meals INT,
  
  -- User feedback
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by user
CREATE INDEX IF NOT EXISTS idx_meal_plan_history_user_id ON meal_plan_history(user_id);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_meal_plan_history_week_start ON meal_plan_history(week_start DESC);

-- Enable RLS
ALTER TABLE meal_plan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own history
CREATE POLICY "Users can view their own plan history" 
  ON meal_plan_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own history records
CREATE POLICY "Users can insert their own plan history" 
  ON meal_plan_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own history (e.g., add rating/notes)
CREATE POLICY "Users can update their own plan history" 
  ON meal_plan_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own plan history" 
  ON meal_plan_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_meal_plan_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_plan_history_updated_at
  BEFORE UPDATE ON meal_plan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_plan_history_updated_at();
