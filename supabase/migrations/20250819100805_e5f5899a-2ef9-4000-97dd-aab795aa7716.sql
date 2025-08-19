-- Criar tabelas para integração com n8n
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  instance_url TEXT NOT NULL DEFAULT 'https://app.n8n.cloud',
  api_key TEXT,
  webhook_receive_url TEXT,
  webhook_send_url TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  settings JSONB DEFAULT '{"events": {}}'::jsonb,
  last_ping TIMESTAMP WITH TIME ZONE,
  workflow_count INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para logs de execução n8n
CREATE TABLE IF NOT EXISTS public.n8n_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  configuration_id UUID NOT NULL REFERENCES public.n8n_configurations(id) ON DELETE CASCADE,
  workflow_id TEXT,
  execution_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'waiting', 'running', 'canceled')),
  event_type TEXT,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para n8n_configurations
CREATE POLICY "Users can manage their company n8n configs" 
ON public.n8n_configurations 
FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admins can manage all n8n configs" 
ON public.n8n_configurations 
FOR ALL 
USING (is_super_admin());

-- RLS Policies para n8n_execution_logs  
CREATE POLICY "Users can view their company n8n logs" 
ON public.n8n_execution_logs 
FOR SELECT 
USING (configuration_id IN (
  SELECT id FROM n8n_configurations 
  WHERE empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
));

CREATE POLICY "System can insert n8n logs" 
ON public.n8n_execution_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins can manage all n8n logs" 
ON public.n8n_execution_logs 
FOR ALL 
USING (is_super_admin());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_n8n_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER update_n8n_configurations_updated_at
  BEFORE UPDATE ON public.n8n_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_n8n_configurations_updated_at();