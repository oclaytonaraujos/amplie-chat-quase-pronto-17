-- Ensure required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- 1) Core tables for async integration events
CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  correlation_id TEXT NOT NULL UNIQUE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'delivered', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  source TEXT DEFAULT 'app',
  destination TEXT DEFAULT 'n8n',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  processed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.integration_event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.integration_events(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2) Performance indexes
CREATE INDEX IF NOT EXISTS idx_integration_events_correlation_id ON public.integration_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_empresa_id ON public.integration_events(empresa_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON public.integration_events(status);
CREATE INDEX IF NOT EXISTS idx_integration_events_created_at ON public.integration_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_event_logs_event_id ON public.integration_event_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_integration_event_logs_logged_at ON public.integration_event_logs(logged_at DESC);

-- Idempotency per company (ignore NULL keys)
CREATE UNIQUE INDEX IF NOT EXISTS uq_integration_events_idem_per_company
  ON public.integration_events(empresa_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3) Trigger: manage timestamps and derived status times
CREATE OR REPLACE FUNCTION public.update_integration_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());

  -- Set processed_at when status moves off queued
  IF (OLD.status = 'queued' AND NEW.status <> 'queued' AND NEW.processed_at IS NULL) THEN
    NEW.processed_at = TIMEZONE('utc'::text, NOW());
  END IF;

  -- Set delivered_at when status becomes delivered
  IF (NEW.status = 'delivered' AND NEW.delivered_at IS NULL) THEN
    NEW.delivered_at = TIMEZONE('utc'::text, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integration_events_updated_at ON public.integration_events;
CREATE TRIGGER trigger_integration_events_updated_at
  BEFORE UPDATE ON public.integration_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_events_updated_at();

-- 4) Realtime configuration
ALTER TABLE public.integration_events REPLICA IDENTITY FULL;
ALTER TABLE public.integration_event_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_event_logs;

-- 5) Row Level Security (RLS)
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_event_logs ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view integration events from their company" ON public.integration_events;
DROP POLICY IF EXISTS "Users can insert integration events for their company" ON public.integration_events;
DROP POLICY IF EXISTS "Service role can manage all integration events" ON public.integration_events;

DROP POLICY IF EXISTS "Users can view logs from their company events" ON public.integration_event_logs;
DROP POLICY IF EXISTS "Service role can manage all event logs" ON public.integration_event_logs;

-- Policies (using profiles for company scoping)
CREATE POLICY "Users can view integration events from their company" ON public.integration_events
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert integration events for their company" ON public.integration_events
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all integration events" ON public.integration_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view logs from their company events" ON public.integration_event_logs
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.integration_events WHERE empresa_id IN (
        SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage all event logs" ON public.integration_event_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6) Grants (narrowed; RLS still applies)
GRANT SELECT, INSERT ON public.integration_events TO authenticated;
GRANT SELECT ON public.integration_event_logs TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
GRANT ALL ON public.integration_event_logs TO service_role;

-- 7) Compatibility view for legacy references to "usuarios"
--    (maps to profiles to avoid code changes while we migrate)
DROP VIEW IF EXISTS public.usuarios;
CREATE VIEW public.usuarios AS
SELECT id, empresa_id FROM public.profiles;

COMMIT;