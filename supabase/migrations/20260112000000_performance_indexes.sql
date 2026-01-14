-- Add indexes for common queries in meal_plan_history

-- Index for filtering by user (highly frequent)
CREATE INDEX IF NOT EXISTS idx_meal_plan_history_user_id ON meal_plan_history(user_id);

-- Index for sorting by date (highly frequent in dashboard/history)
CREATE INDEX IF NOT EXISTS idx_meal_plan_history_week_start ON meal_plan_history(week_start);

-- Index for created_at (useful for general ordering/auditing)
CREATE INDEX IF NOT EXISTS idx_meal_plan_history_created_at ON meal_plan_history(created_at);

-- If plan_id exists or is needed in future joining, we can add it, 
-- but primary key 'id' is already indexed.
