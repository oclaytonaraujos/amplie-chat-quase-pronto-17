-- 1.1. Implementar Dead-Letter Queue (DLQ)
CREATE TABLE public.failed_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_message_id UUID NOT NULL,
  correlation_id UUID NOT NULL,
  message_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 1,
  first_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1.2. Criar Trilha de Auditoria (Audit Log)
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on new tables
ALTER TABLE public.failed_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for failed_messages (system access only)
CREATE POLICY "System can manage failed messages" 
ON public.failed_messages 
FOR ALL 
USING (true);

-- RLS policies for audit_log (admins can view, system can insert)
CREATE POLICY "Super admins can view audit log" 
ON public.audit_log 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "System can insert audit log" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);

-- Function to log audit changes
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, old_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, old_values, new_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, new_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_empresas_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

CREATE TRIGGER audit_chatbot_flows_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.chatbot_flows
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- 1.3. Otimizar Índices de Consulta
CREATE INDEX idx_conversas_empresa_status_updated 
ON public.conversas (empresa_id, status, updated_at DESC);

-- Optimize message_queue for better performance
CREATE INDEX idx_message_queue_processing 
ON public.message_queue (status, priority DESC, created_at ASC) 
WHERE status = 'pending';

-- Index for audit_log queries
CREATE INDEX idx_audit_log_table_timestamp 
ON public.audit_log (table_name, timestamp DESC);

CREATE INDEX idx_audit_log_user_timestamp 
ON public.audit_log (user_id, timestamp DESC);