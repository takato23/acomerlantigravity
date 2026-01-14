-- Add notification preferences to user_profiles
-- Migration: 20260110_notification_preferences.sql

-- Add notification_preferences column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
      "email_enabled": true,
      "push_enabled": false,
      "plan_ready": true,
      "daily_reminders": true,
      "shopping_reminders": true,
      "reminder_time": "08:00"
    }'::jsonb;
  END IF;
END $$;

-- Add push_subscription column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'push_subscription'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN push_subscription JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.notification_preferences IS 'User notification preferences including email and push settings';
COMMENT ON COLUMN user_profiles.push_subscription IS 'Web Push subscription data for browser notifications';

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_user_profiles_notification_prefs 
ON user_profiles USING gin (notification_preferences);
