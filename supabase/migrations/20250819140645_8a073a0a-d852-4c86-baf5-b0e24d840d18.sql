-- Atualizar tabela n8n_webhook_configs para incluir os novos campos
ALTER TABLE public.n8n_webhook_configs 
ADD COLUMN IF NOT EXISTS send_messages_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS receive_messages_webhook_url TEXT;

-- Migrar dados existentes se houver
UPDATE public.n8n_webhook_configs 
SET send_messages_webhook_url = messages_webhook_url
WHERE messages_webhook_url IS NOT NULL;

-- Remover coluna antiga (opcional, pode ser mantida por compatibilidade)
-- ALTER TABLE public.n8n_webhook_configs DROP COLUMN IF EXISTS messages_webhook_url;