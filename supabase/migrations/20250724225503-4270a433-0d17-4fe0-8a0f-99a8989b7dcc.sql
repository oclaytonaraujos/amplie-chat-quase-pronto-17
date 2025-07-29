-- Add search_path to existing functions for security
CREATE OR REPLACE FUNCTION update_updated_at_notifications()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_notification(
  title TEXT,
  message TEXT,
  notification_type TEXT DEFAULT 'info',
  user_id UUID DEFAULT NULL,
  empresa_id UUID DEFAULT NULL,
  data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  SET search_path = public;
  
  INSERT INTO notifications (title, message, type, user_id, empresa_id, data)
  VALUES (title, message, notification_type, user_id, empresa_id, data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;