-- Atualizar a configuração global da Evolution API com os dados mais recentes
-- Verificar se já existe uma configuração ativa
UPDATE evolution_api_global_config 
SET 
  api_key = '429683C4C977415CAAFCCE10F7D57E11',
  server_url = 'https://evolutionapi.amplie-marketing.com',
  webhook_base_url = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution',
  ativo = true,
  updated_at = now()
WHERE ativo = true;

-- Se não existe configuração ativa, inserir uma nova
INSERT INTO evolution_api_global_config (api_key, server_url, webhook_base_url, ativo)
SELECT 
  '429683C4C977415CAAFCCE10F7D57E11', 
  'https://evolutionapi.amplie-marketing.com',
  'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution',
  true
WHERE NOT EXISTS (SELECT 1 FROM evolution_api_global_config WHERE ativo = true);

-- Adicionar campos necessários para melhor integração com Evolution API se não existirem
ALTER TABLE evolution_api_config 
ADD COLUMN IF NOT EXISTS profile_name TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS connection_state TEXT DEFAULT 'DISCONNECTED',
ADD COLUMN IF NOT EXISTS battery_level INTEGER,
ADD COLUMN IF NOT EXISTS platform TEXT;

-- Atualizar triggers para funcões com search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversa_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND cargo = 'super_admin'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;