-- Migration for integration events system
-- Creates tables for async event processing with n8n

-- Integration events table
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  correlation_id TEXT NOT NULL UNIQUE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'delivered', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  source TEXT DEFAULT 'app',
  destination TEXT DEFAULT 'n8n',
  idempotency_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Integration event logs table
CREATE TABLE IF NOT EXISTS integration_event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES integration_events(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_events_correlation_id ON integration_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_empresa_id ON integration_events(empresa_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events(status);
CREATE INDEX IF NOT EXISTS idx_integration_events_created_at ON integration_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_event_logs_event_id ON integration_event_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_integration_event_logs_logged_at ON integration_event_logs(logged_at DESC);

-- Updated at trigger for integration_events
CREATE OR REPLACE FUNCTION update_integration_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  
  -- Set processed_at when status changes from queued
  IF OLD.status = 'queued' AND NEW.status != 'queued' AND NEW.processed_at IS NULL THEN
    NEW.processed_at = TIMEZONE('utc'::text, NOW());
  END IF;
  
  -- Set delivered_at when status changes to delivered
  IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = TIMEZONE('utc'::text, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_integration_events_updated_at
  BEFORE UPDATE ON integration_events
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_events_updated_at();

-- RLS Policies
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_event_logs ENABLE ROW LEVEL SECURITY;

-- Policy for integration_events
CREATE POLICY "Users can view integration events from their company" ON integration_events
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert integration events for their company" ON integration_events
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all integration events" ON integration_events
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for integration_event_logs
CREATE POLICY "Users can view logs from their company events" ON integration_event_logs
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM integration_events WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage all event logs" ON integration_event_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON integration_events TO authenticated;
GRANT ALL ON integration_event_logs TO authenticated;
GRANT ALL ON integration_events TO service_role;
GRANT ALL ON integration_event_logs TO service_role;