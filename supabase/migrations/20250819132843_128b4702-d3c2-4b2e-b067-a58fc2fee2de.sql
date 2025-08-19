-- Criar tabela para configurações n8n se não existir
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  instance_url TEXT NOT NULL DEFAULT 'https://app.n8n.cloud',
  api_key TEXT,
  webhook_receive_url TEXT,
  webhook_send_url TEXT,
  webhook_create_connection TEXT,
  webhook_delete_instance TEXT,
  webhook_chatbot TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  settings JSONB DEFAULT '{"events": {}}'::jsonb,
  last_ping TIMESTAMP WITH TIME ZONE,
  workflow_count INTEGER DEFAULT 0,
  total_executions INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem gerenciar configurações da própria empresa
CREATE POLICY IF NOT EXISTS "Users can manage company n8n configurations" 
ON public.n8n_configurations 
FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_n8n_configurations_updated_at
  BEFORE UPDATE ON public.n8n_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_n8n_configurations_updated_at();

-- Criar tabela para logs de execução n8n se não existir  
CREATE TABLE IF NOT EXISTS public.n8n_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES public.n8n_configurations(id) ON DELETE CASCADE,
  workflow_id TEXT,
  execution_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para logs
ALTER TABLE public.n8n_execution_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem ver logs da própria empresa
CREATE POLICY IF NOT EXISTS "Users can view company n8n execution logs" 
ON public.n8n_execution_logs 
FOR SELECT 
USING (config_id IN (
  SELECT id FROM public.n8n_configurations 
  WHERE empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
));