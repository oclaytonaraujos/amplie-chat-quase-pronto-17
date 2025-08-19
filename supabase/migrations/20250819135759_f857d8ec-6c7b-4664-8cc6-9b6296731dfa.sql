-- Criar tabela para configurações de webhook N8N
CREATE TABLE IF NOT EXISTS public.n8n_webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  messages_webhook_url TEXT,
  instances_webhook_url TEXT,
  chatbot_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Enable RLS
ALTER TABLE public.n8n_webhook_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage company webhook configs" 
ON public.n8n_webhook_configs 
FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_n8n_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_n8n_webhook_configs_updated_at
  BEFORE UPDATE ON public.n8n_webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_n8n_webhook_configs_updated_at();