-- Adicionar campos de gatilhos na tabela chatbot_flows
ALTER TABLE public.chatbot_flows 
ADD COLUMN trigger_conditions JSONB DEFAULT '{}',
ADD COLUMN activation_mode TEXT DEFAULT 'manual' CHECK (activation_mode IN ('manual', 'automatic', 'scheduled')),
ADD COLUMN priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
ADD COLUMN n8n_webhook_url TEXT,
ADD COLUMN auto_start_enabled BOOLEAN DEFAULT false;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.chatbot_flows.trigger_conditions IS 'Condições JSON para ativação automática do fluxo';
COMMENT ON COLUMN public.chatbot_flows.activation_mode IS 'Modo de ativação: manual, automatic ou scheduled';
COMMENT ON COLUMN public.chatbot_flows.priority IS 'Prioridade do fluxo (1-10, onde 1 é mais alta)';
COMMENT ON COLUMN public.chatbot_flows.n8n_webhook_url IS 'URL do webhook n8n para integração';
COMMENT ON COLUMN public.chatbot_flows.auto_start_enabled IS 'Se o fluxo deve iniciar automaticamente quando as condições forem atendidas';

-- Criar índice para melhor performance nas consultas de fluxos automáticos
CREATE INDEX idx_chatbot_flows_auto_start ON public.chatbot_flows(auto_start_enabled, activation_mode, priority) WHERE auto_start_enabled = true;