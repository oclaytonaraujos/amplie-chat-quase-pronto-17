-- Corrigir problemas de segurança: adicionar search_path às funções

-- 1. Corrigir função update_service_worker_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_service_worker_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 2. Corrigir função cleanup_expired_cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.offline_data_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Corrigir função update_connectivity_stats
CREATE OR REPLACE FUNCTION public.update_connectivity_stats(
  p_empresa_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.connectivity_logs (
    empresa_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    p_empresa_id,
    auth.uid(),
    p_event_type,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 4. Também vou corrigir outras funções que podem ter o mesmo problema
CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS void AS $$
BEGIN
  -- Remover logs de segurança com mais de 90 dias
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Remover dados de monitoramento com mais de 30 dias
  DELETE FROM public.system_monitoring 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Remover logs de backup com mais de 180 dias
  DELETE FROM public.backup_logs 
  WHERE created_at < NOW() - INTERVAL '180 days';
  
  -- Remover IPs bloqueados temporariamente que já expiraram
  DELETE FROM public.blocked_ips 
  WHERE blocked_until IS NOT NULL AND blocked_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.cleanup_evolution_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.cleanup_old_queue_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.message_queue 
  WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM public.chatbot_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.reset_daily_stats()
RETURNS void AS $$
BEGIN
  UPDATE public.evolution_api_instance_stats 
  SET 
    messages_sent_today = 0,
    messages_received_today = 0,
    error_count_today = 0,
    success_rate_today = 100.0,
    webhook_delivery_rate = 100.0,
    updated_at = now()
  WHERE DATE(updated_at) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';