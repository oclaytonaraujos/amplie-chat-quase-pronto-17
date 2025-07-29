
-- Criar tabela para configuração global da Evolution API
CREATE TABLE IF NOT EXISTS public.evolution_api_global_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  server_url TEXT NOT NULL,
  webhook_base_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS policies
ALTER TABLE public.evolution_api_global_config ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem gerenciar configuração global
CREATE POLICY "Only super admins can manage global evolution api config"
ON public.evolution_api_global_config
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Trigger para updated_at
CREATE TRIGGER update_evolution_api_global_config_updated_at
BEFORE UPDATE ON public.evolution_api_global_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Modificar tabela evolution_api_config para usar apenas instance_name e remover api_key/server_url
ALTER TABLE public.evolution_api_config 
DROP COLUMN IF EXISTS api_key,
DROP COLUMN IF EXISTS server_url;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_evolution_api_global_config_ativo ON public.evolution_api_global_config(ativo);
