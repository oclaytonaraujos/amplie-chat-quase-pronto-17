-- Corrigir todas as funções que não têm search_path definido

-- Corrigir funções existentes que não têm search_path
CREATE OR REPLACE FUNCTION public.update_chatbot_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_instance_stats(p_instance_id uuid, p_type text, p_increment integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.evolution_api_instance_stats (
    instance_id,
    messages_sent_today,
    messages_received_today,
    last_activity
  ) VALUES (
    p_instance_id,
    CASE WHEN p_type = 'sent' THEN p_increment ELSE 0 END,
    CASE WHEN p_type = 'received' THEN p_increment ELSE 0 END,
    now()
  )
  ON CONFLICT (instance_id) 
  DO UPDATE SET
    messages_sent_today = CASE 
      WHEN p_type = 'sent' THEN evolution_api_instance_stats.messages_sent_today + p_increment
      ELSE evolution_api_instance_stats.messages_sent_today
    END,
    messages_received_today = CASE 
      WHEN p_type = 'received' THEN evolution_api_instance_stats.messages_received_today + p_increment  
      ELSE evolution_api_instance_stats.messages_received_today
    END,
    last_activity = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_daily_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_evolution_api_stats_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;