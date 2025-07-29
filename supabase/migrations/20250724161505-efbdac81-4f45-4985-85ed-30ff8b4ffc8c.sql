-- Continuando a correção das funções que não têm search_path

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.webhook_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.invoke_chatbot_queue_processor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_queue_status()
RETURNS TABLE(total_pending integer, total_processing integer, total_failed integer, oldest_pending_age interval, failed_with_retries integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;