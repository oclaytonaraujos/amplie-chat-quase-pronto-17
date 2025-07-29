-- Corrigir problemas de segurança relacionados ao search_path das funções

-- Função para atualizar evolution_api_config com search_path seguro
CREATE OR REPLACE FUNCTION public.update_evolution_api_config_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função de limpeza de logs com search_path seguro
CREATE OR REPLACE FUNCTION public.cleanup_evolution_api_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Corrigir outras funções existentes com search_path inseguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversa_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chatbot_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chatbot_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversa_interna_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversas_internas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_interna_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_default_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o novo registro está sendo marcado como padrão
  IF NEW.is_default = TRUE THEN
    -- Desmarcar todos os outros fluxos da mesma empresa como padrão
    UPDATE public.chatbot_flows 
    SET is_default = FALSE 
    WHERE empresa_id = NEW.empresa_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_setor_atendimentos(setor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.setores 
  SET atendimentos_ativos = atendimentos_ativos + 1
  WHERE id = setor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_setor_atendimentos(setor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.setores 
  SET atendimentos_ativos = GREATEST(atendimentos_ativos - 1, 0)
  WHERE id = setor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assumir_conversa_atomico(p_conversa_id uuid, p_agente_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Tentar atualizar a conversa apenas se não tiver agente
  UPDATE public.conversas 
  SET agente_id = p_agente_id, 
      status = 'ativo',
      updated_at = NOW()
  WHERE id = p_conversa_id 
    AND agente_id IS NULL;
  
  -- Retornar true se conseguiu atualizar
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_queue_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.message_queue 
  WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM public.chatbot_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_next_queue_message()
RETURNS TABLE(id uuid, correlation_id uuid, message_type text, payload jsonb, retry_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.message_queue 
  SET 
    status = 'processing',
    processed_at = NOW()
  WHERE message_queue.id = (
    SELECT q.id 
    FROM public.message_queue q
    WHERE q.status = 'pending' 
    AND q.scheduled_at <= NOW()
    ORDER BY q.priority DESC, q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    message_queue.id,
    message_queue.correlation_id,
    message_queue.message_type,
    message_queue.payload,
    message_queue.retry_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.invoke_chatbot_queue_processor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
SET search_path TO 'public'
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