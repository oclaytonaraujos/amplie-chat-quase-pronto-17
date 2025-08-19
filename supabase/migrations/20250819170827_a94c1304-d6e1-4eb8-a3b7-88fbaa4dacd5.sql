
-- Remove todas as tabelas relacionadas a integrações existentes
DROP TABLE IF EXISTS public.integration_event_logs CASCADE;
DROP TABLE IF EXISTS public.integration_events CASCADE;
DROP TABLE IF EXISTS public.n8n_configurations CASCADE;
DROP TABLE IF EXISTS public.n8n_execution_logs CASCADE;
DROP TABLE IF EXISTS public.n8n_webhook_configs CASCADE;
DROP TABLE IF EXISTS public.unified_webhook_configs CASCADE;
DROP TABLE IF EXISTS public.webhook_delivery_logs CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.webhooks_config CASCADE;
DROP TABLE IF EXISTS public.automation_triggers CASCADE;
DROP TABLE IF EXISTS public.automation_whatsapp_connections CASCADE;
DROP TABLE IF EXISTS public.automations CASCADE;

-- Remove funções relacionadas a integrações
DROP FUNCTION IF EXISTS public.update_n8n_configurations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_n8n_webhook_configs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_unified_webhook_configs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_integration_events_updated_at() CASCADE;

-- Cria a nova tabela simplificada para configuração de webhooks N8N
CREATE TABLE public.n8n_webhook_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  url_envio_mensagens TEXT,
  url_recebimento_mensagens TEXT,
  url_configuracao_instancia TEXT,
  url_boot TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona RLS à nova tabela
ALTER TABLE public.n8n_webhook_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a nova tabela
CREATE POLICY "Users can manage their company n8n config" 
  ON public.n8n_webhook_config 
  FOR ALL 
  USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_n8n_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_n8n_webhook_config_updated_at
  BEFORE UPDATE ON public.n8n_webhook_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_n8n_webhook_config_updated_at();
