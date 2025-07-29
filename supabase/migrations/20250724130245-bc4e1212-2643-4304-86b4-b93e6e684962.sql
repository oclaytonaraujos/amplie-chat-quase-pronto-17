-- ===============================================
-- MIGRAÇÃO COMPLETA - EVOLUTION API V2 E MELHORIAS
-- ===============================================

-- 1. Atualizar configuração global da Evolution API
ALTER TABLE public.evolution_api_global_config 
ADD COLUMN IF NOT EXISTS timeout_ms integer DEFAULT 30000,
ADD COLUMN IF NOT EXISTS retry_attempts integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS rate_limit_per_minute integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS webhook_base_path text DEFAULT '/functions/v1',
ADD COLUMN IF NOT EXISTS environment text DEFAULT 'production';

-- Atualizar configuração por instância
ALTER TABLE public.evolution_api_config 
ADD COLUMN IF NOT EXISTS api_version text DEFAULT 'v2',
ADD COLUMN IF NOT EXISTS integration_type text DEFAULT 'WHATSAPP-BAILEYS',
ADD COLUMN IF NOT EXISTS reject_call boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS msg_call text DEFAULT 'Chamadas não são atendidas',
ADD COLUMN IF NOT EXISTS groups_ignore boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS always_online boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS read_messages boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS read_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS websocket_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS websocket_events text[] DEFAULT ARRAY['APPLICATION_STARTUP'],
ADD COLUMN IF NOT EXISTS proxy_host text,
ADD COLUMN IF NOT EXISTS proxy_port integer,
ADD COLUMN IF NOT EXISTS proxy_protocol text,
ADD COLUMN IF NOT EXISTS chatwoot_account_id text,
ADD COLUMN IF NOT EXISTS chatwoot_token text,
ADD COLUMN IF NOT EXISTS chatwoot_url text,
ADD COLUMN IF NOT EXISTS chatwoot_sign_msg boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS chatwoot_reopen_conversation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS chatwoot_conversation_pending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS typebot_url text,
ADD COLUMN IF NOT EXISTS typebot_public_id text,
ADD COLUMN IF NOT EXISTS typebot_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS typebot_expire integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS typebot_keyword_restart text,
ADD COLUMN IF NOT EXISTS typebot_delay_message integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS typebot_unknown_message text,
ADD COLUMN IF NOT EXISTS typebot_listening_from_me boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rabbitmq_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rabbitmq_uri text,
ADD COLUMN IF NOT EXISTS sqs_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS websocket_base64 boolean DEFAULT true;

-- 2. Tabela para estatísticas detalhadas das instâncias
CREATE TABLE IF NOT EXISTS public.evolution_api_instance_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid NOT NULL,
  messages_sent_today integer DEFAULT 0,
  messages_received_today integer DEFAULT 0,
  total_contacts integer DEFAULT 0,
  total_groups integer DEFAULT 0,
  uptime_minutes integer DEFAULT 0,
  last_activity timestamp with time zone DEFAULT now(),
  error_count_today integer DEFAULT 0,
  success_rate_today numeric DEFAULT 100.0,
  webhook_delivery_rate numeric DEFAULT 100.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (instance_id) REFERENCES public.evolution_api_config(id) ON DELETE CASCADE
);

-- 3. Tabela para gerenciar grupos do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  group_jid text NOT NULL,
  group_name text NOT NULL,
  group_description text,
  group_picture_url text,
  participants_count integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  is_announcement boolean DEFAULT false,
  is_restricted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  FOREIGN KEY (instance_id) REFERENCES public.evolution_api_config(id) ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE,
  UNIQUE(instance_id, group_jid)
);

-- 4. Tabela para participantes dos grupos
CREATE TABLE IF NOT EXISTS public.whatsapp_group_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL,
  participant_jid text NOT NULL,
  participant_name text,
  is_admin boolean DEFAULT false,
  is_super_admin boolean DEFAULT false,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (group_id) REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  UNIQUE(group_id, participant_jid)
);

-- 5. Tabela para configurações de perfil do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid NOT NULL,
  profile_name text,
  profile_status text,
  profile_picture_url text,
  business_description text,
  business_category text,
  business_email text,
  business_website text,
  privacy_last_seen text DEFAULT 'contacts',
  privacy_profile_photo text DEFAULT 'contacts',
  privacy_status text DEFAULT 'contacts',
  privacy_read_receipts boolean DEFAULT true,
  privacy_groups text DEFAULT 'contacts',
  auto_reply_message text,
  auto_reply_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (instance_id) REFERENCES public.evolution_api_config(id) ON DELETE CASCADE,
  UNIQUE(instance_id)
);

-- 6. Tabela para logs de webhook detalhados
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid,
  webhook_url text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  delivery_attempt integer DEFAULT 1,
  success boolean DEFAULT false,
  error_message text,
  processing_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  delivered_at timestamp with time zone,
  FOREIGN KEY (instance_id) REFERENCES public.evolution_api_config(id) ON DELETE SET NULL
);

-- 7. Atualizar eventos de webhook com novos tipos da v2
UPDATE public.evolution_api_config 
SET webhook_events = ARRAY[
  'APPLICATION_STARTUP',
  'QRCODE_UPDATED', 
  'MESSAGES_SET',
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'MESSAGES_DELETE',
  'SEND_MESSAGE',
  'CONTACTS_SET',
  'CONTACTS_UPSERT', 
  'CONTACTS_UPDATE',
  'PRESENCE_UPDATE',
  'CHATS_SET',
  'CHATS_UPSERT',
  'CHATS_UPDATE', 
  'CHATS_DELETE',
  'GROUPS_UPSERT',
  'GROUP_UPDATE',
  'GROUP_PARTICIPANTS_UPDATE',
  'CONNECTION_UPDATE',
  'CALL',
  'NEW_JWT_TOKEN',
  'TYPEBOT_START', 
  'TYPEBOT_CHANGE_STATUS',
  'LABELS_EDIT',
  'LABELS_ASSOCIATION',
  'LOGOUT_INSTANCE',
  'REMOVE_INSTANCE'
]
WHERE webhook_events IS NULL OR array_length(webhook_events, 1) < 15;

-- 8. Função para atualizar estatísticas da instância
CREATE OR REPLACE FUNCTION public.update_instance_stats(
  p_instance_id uuid,
  p_type text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 9. Função para resetar estatísticas diárias
CREATE OR REPLACE FUNCTION public.reset_daily_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 10. Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_evolution_api_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_evolution_api_instance_stats_updated_at ON public.evolution_api_instance_stats;
CREATE TRIGGER update_evolution_api_instance_stats_updated_at
  BEFORE UPDATE ON public.evolution_api_instance_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evolution_api_stats_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_groups_updated_at ON public.whatsapp_groups;
CREATE TRIGGER update_whatsapp_groups_updated_at
  BEFORE UPDATE ON public.whatsapp_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evolution_api_stats_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_profiles_updated_at ON public.whatsapp_profiles;
CREATE TRIGGER update_whatsapp_profiles_updated_at
  BEFORE UPDATE ON public.whatsapp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evolution_api_stats_updated_at();

-- 11. RLS Policies para as novas tabelas
ALTER TABLE public.evolution_api_instance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Policies para estatísticas de instância
CREATE POLICY "Super admins can manage all instance stats" 
ON public.evolution_api_instance_stats 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their company instance stats" 
ON public.evolution_api_instance_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.evolution_api_config eac
    JOIN public.profiles p ON p.empresa_id = eac.empresa_id
    WHERE eac.id = evolution_api_instance_stats.instance_id 
    AND p.id = auth.uid()
  )
);

-- Policies para grupos do WhatsApp
CREATE POLICY "Super admins can manage all whatsapp groups" 
ON public.whatsapp_groups 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can manage their company whatsapp groups" 
ON public.whatsapp_groups 
FOR ALL 
USING (
  empresa_id = (
    SELECT profiles.empresa_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  empresa_id = (
    SELECT profiles.empresa_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- Policies para participantes dos grupos
CREATE POLICY "Super admins can manage all group participants" 
ON public.whatsapp_group_participants 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can manage their company group participants" 
ON public.whatsapp_group_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_groups wg
    JOIN public.profiles p ON p.empresa_id = wg.empresa_id
    WHERE wg.id = whatsapp_group_participants.group_id 
    AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whatsapp_groups wg
    JOIN public.profiles p ON p.empresa_id = wg.empresa_id
    WHERE wg.id = whatsapp_group_participants.group_id 
    AND p.id = auth.uid()
  )
);

-- Policies para perfis do WhatsApp
CREATE POLICY "Super admins can manage all whatsapp profiles" 
ON public.whatsapp_profiles 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can manage their company whatsapp profiles" 
ON public.whatsapp_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.evolution_api_config eac
    JOIN public.profiles p ON p.empresa_id = eac.empresa_id
    WHERE eac.id = whatsapp_profiles.instance_id 
    AND p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evolution_api_config eac
    JOIN public.profiles p ON p.empresa_id = eac.empresa_id
    WHERE eac.id = whatsapp_profiles.instance_id 
    AND p.id = auth.uid()
  )
);

-- Policies para logs de webhook
CREATE POLICY "Super admins can manage all webhook logs" 
ON public.webhook_delivery_logs 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their company webhook logs" 
ON public.webhook_delivery_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.evolution_api_config eac
    JOIN public.profiles p ON p.empresa_id = eac.empresa_id
    WHERE eac.id = webhook_delivery_logs.instance_id 
    AND p.id = auth.uid()
  )
);

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_evolution_api_instance_stats_instance_id 
ON public.evolution_api_instance_stats(instance_id);

CREATE INDEX IF NOT EXISTS idx_evolution_api_instance_stats_last_activity 
ON public.evolution_api_instance_stats(last_activity);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_empresa_id 
ON public.whatsapp_groups(empresa_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_instance_id 
ON public.whatsapp_groups(instance_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_group_jid 
ON public.whatsapp_groups(group_jid);

CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_group_id 
ON public.whatsapp_group_participants(group_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_participant_jid 
ON public.whatsapp_group_participants(participant_jid);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_instance_id 
ON public.webhook_delivery_logs(instance_id);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at 
ON public.webhook_delivery_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event_type 
ON public.webhook_delivery_logs(event_type);

-- 13. Inserir configuração global padrão se não existir
INSERT INTO public.evolution_api_global_config (
  server_url,
  api_key,
  webhook_base_url,
  ativo,
  timeout_ms,
  retry_attempts,
  rate_limit_per_minute,
  environment
) VALUES (
  'https://evolution-api.example.com',
  'your-api-key-here',
  'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1',
  false,
  30000,
  3,
  60,
  'production'
) ON CONFLICT DO NOTHING;

-- 14. Limpar logs antigos automaticamente (função de manutenção)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.webhook_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.evolution_api_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.evolution_api_instance_stats IS 'Estatísticas detalhadas de cada instância da Evolution API';
COMMENT ON TABLE public.whatsapp_groups IS 'Grupos do WhatsApp gerenciados pela Evolution API';
COMMENT ON TABLE public.whatsapp_group_participants IS 'Participantes dos grupos do WhatsApp';
COMMENT ON TABLE public.whatsapp_profiles IS 'Configurações de perfil do WhatsApp por instância';
COMMENT ON TABLE public.webhook_delivery_logs IS 'Logs detalhados de entrega de webhooks';

COMMENT ON FUNCTION public.update_instance_stats IS 'Atualiza estatísticas de uma instância da Evolution API';
COMMENT ON FUNCTION public.reset_daily_stats IS 'Reseta estatísticas diárias das instâncias';
COMMENT ON FUNCTION public.cleanup_old_webhook_logs IS 'Remove logs antigos de webhook e Evolution API';