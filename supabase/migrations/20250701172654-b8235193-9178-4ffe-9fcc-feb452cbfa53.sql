
-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função para invocar o processador de filas
CREATE OR REPLACE FUNCTION invoke_chatbot_queue_processor()
RETURNS void AS $$
BEGIN
  -- Fazer chamada HTTP para o processador de filas
  PERFORM net.http_post(
    url := 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/chatbot-queue-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'trigger', 'scheduler',
      'timestamp', extract(epoch from now())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar execução do processador de filas a cada 30 segundos
SELECT cron.schedule(
  'chatbot-queue-processor',
  '*/30 * * * * *', -- A cada 30 segundos
  $$SELECT invoke_chatbot_queue_processor();$$
);

-- Criar função para monitorar o status da fila
CREATE OR REPLACE FUNCTION get_queue_status()
RETURNS TABLE(
  total_pending integer,
  total_processing integer,
  total_failed integer,
  oldest_pending_age interval,
  failed_with_retries integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer AS total_pending,
    0::integer AS total_processing,
    0::integer AS total_failed,
    COALESCE(MAX(now() - created_at), interval '0') AS oldest_pending_age,
    0::integer AS failed_with_retries
  FROM public.message_queue 
  WHERE status = 'pending'
  
  UNION ALL
  
  SELECT 
    0::integer,
    COUNT(*)::integer,
    0::integer,
    interval '0',
    0::integer
  FROM public.message_queue 
  WHERE status = 'processing'
  
  UNION ALL
  
  SELECT 
    0::integer,
    0::integer,
    COUNT(*)::integer,
    interval '0',
    COUNT(CASE WHEN retry_count < max_retries THEN 1 END)::integer
  FROM public.message_queue 
  WHERE status = 'failed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar view para monitoramento da fila
CREATE OR REPLACE VIEW queue_monitoring AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries,
  MIN(created_at) as oldest_message,
  MAX(created_at) as newest_message,
  AVG(EXTRACT(EPOCH FROM (now() - created_at))) as avg_age_seconds
FROM public.message_queue 
GROUP BY status;

-- Habilitar realtime na view de monitoramento
ALTER VIEW queue_monitoring SET (security_invoker = on);

-- Comentários para referência
COMMENT ON FUNCTION invoke_chatbot_queue_processor() IS 'Função para invocar o processador de filas via HTTP';
COMMENT ON FUNCTION get_queue_status() IS 'Função para obter estatísticas da fila de mensagens';
COMMENT ON VIEW queue_monitoring IS 'View para monitoramento em tempo real da fila';
