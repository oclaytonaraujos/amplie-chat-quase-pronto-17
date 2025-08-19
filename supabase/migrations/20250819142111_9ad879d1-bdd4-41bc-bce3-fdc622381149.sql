-- Ensure new webhook columns exist and backfill from legacy column
ALTER TABLE public.n8n_webhook_configs 
  ADD COLUMN IF NOT EXISTS send_messages_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS receive_messages_webhook_url TEXT;

-- Backfill from old messages_webhook_url if present
UPDATE public.n8n_webhook_configs 
SET send_messages_webhook_url = messages_webhook_url
WHERE messages_webhook_url IS NOT NULL
  AND (send_messages_webhook_url IS NULL OR send_messages_webhook_url = '');