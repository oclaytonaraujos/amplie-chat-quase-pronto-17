-- Criar tabela para logs de conectividade e monitoramento de sistema
CREATE TABLE IF NOT EXISTS public.connectivity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL, -- 'connection_lost', 'connection_restored', 'offline_mode_enabled', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.connectivity_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem logs da própria empresa
CREATE POLICY "Users can view company connectivity logs" 
ON public.connectivity_logs 
FOR SELECT 
USING (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- Política para sistema inserir logs
CREATE POLICY "System can insert connectivity logs" 
ON public.connectivity_logs 
FOR INSERT 
WITH CHECK (true);

-- Criar tabela para configurações de service worker por usuário
CREATE TABLE IF NOT EXISTS public.user_service_worker_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  offline_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  cache_expiry_hours INTEGER NOT NULL DEFAULT 24,
  sync_on_connection BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_service_worker_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem suas próprias configurações
CREATE POLICY "Users can manage their own service worker settings" 
ON public.user_service_worker_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar tabela para logs de sincronização offline
CREATE TABLE IF NOT EXISTS public.offline_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL, -- 'manual', 'automatic', 'on_connection'
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  error_details JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.offline_sync_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios logs de sincronização
CREATE POLICY "Users can view their own sync logs" 
ON public.offline_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para sistema inserir logs de sincronização
CREATE POLICY "System can insert sync logs" 
ON public.offline_sync_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar função para trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_service_worker_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_service_worker_settings_updated_at
  BEFORE UPDATE ON public.user_service_worker_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_worker_settings_updated_at();

-- Adicionar coluna para rastrear tentativas de login falhadas (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adicionar coluna para último login (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Criar tabela para cache de dados offline
CREATE TABLE IF NOT EXISTS public.offline_data_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- Habilitar RLS
ALTER TABLE public.offline_data_cache ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem seu próprio cache
CREATE POLICY "Users can manage their own cache" 
ON public.offline_data_cache 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar função para limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.offline_data_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para atualizar estatísticas de conectividade
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
$$ LANGUAGE plpgsql SECURITY DEFINER;