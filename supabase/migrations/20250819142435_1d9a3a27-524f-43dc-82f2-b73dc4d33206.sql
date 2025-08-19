-- Criar tabela para configurações de webhook unificado
CREATE TABLE IF NOT EXISTS public.unified_webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  events TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Enable RLS
ALTER TABLE public.unified_webhook_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage company unified webhook configs" 
ON public.unified_webhook_configs 
FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_unified_webhook_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unified_webhook_configs_updated_at
  BEFORE UPDATE ON public.unified_webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unified_webhook_configs_updated_at();