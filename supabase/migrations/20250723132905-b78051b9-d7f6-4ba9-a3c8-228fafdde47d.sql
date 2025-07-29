-- Atualizar tabela evolution_api_config para suportar melhor monitoramento
-- Adicionar campos para webhook status e logs

ALTER TABLE public.evolution_api_config 
ADD COLUMN IF NOT EXISTS webhook_status TEXT DEFAULT 'inativo' CHECK (webhook_status IN ('ativo', 'inativo', 'erro'));

ALTER TABLE public.evolution_api_config 
ADD COLUMN IF NOT EXISTS last_webhook_test TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.evolution_api_config 
ADD COLUMN IF NOT EXISTS webhook_error_message TEXT;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_evolution_api_config_empresa_id ON public.evolution_api_config(empresa_id);
CREATE INDEX IF NOT EXISTS idx_evolution_api_config_instance_name ON public.evolution_api_config(instance_name);
CREATE INDEX IF NOT EXISTS idx_evolution_api_config_ativo ON public.evolution_api_config(ativo);

-- Criar trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_evolution_api_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_evolution_api_config_updated_at ON public.evolution_api_config;
CREATE TRIGGER trigger_update_evolution_api_config_updated_at
  BEFORE UPDATE ON public.evolution_api_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evolution_api_config_updated_at();

-- Limpar configurações duplicadas da evolution_api_global_config, mantendo apenas uma ativa
WITH ranked_configs AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.evolution_api_global_config
  WHERE ativo = true
)
UPDATE public.evolution_api_global_config 
SET ativo = false 
WHERE id IN (
  SELECT id FROM ranked_configs WHERE rn > 1
);

-- Criar tabela para logs de instâncias WhatsApp (se não existir)
CREATE TABLE IF NOT EXISTS public.evolution_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  empresa_id UUID REFERENCES public.empresas(id),
  user_id UUID,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Políticas RLS para logs
ALTER TABLE public.evolution_api_logs ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver todos os logs
CREATE POLICY "Super admins can manage evolution api logs" 
ON public.evolution_api_logs 
FOR ALL 
USING (is_super_admin());

-- Usuários podem ver logs da própria empresa
CREATE POLICY "Users can view company evolution api logs" 
ON public.evolution_api_logs 
FOR SELECT 
USING (
  empresa_id = (
    SELECT empresa_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Sistema pode inserir logs
CREATE POLICY "System can insert evolution api logs" 
ON public.evolution_api_logs 
FOR INSERT 
WITH CHECK (true);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_evolution_api_logs_instance_name ON public.evolution_api_logs(instance_name);
CREATE INDEX IF NOT EXISTS idx_evolution_api_logs_empresa_id ON public.evolution_api_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_evolution_api_logs_created_at ON public.evolution_api_logs(created_at);

-- Função para limpar logs antigos (opcional, para manutenção)
CREATE OR REPLACE FUNCTION public.cleanup_evolution_api_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;