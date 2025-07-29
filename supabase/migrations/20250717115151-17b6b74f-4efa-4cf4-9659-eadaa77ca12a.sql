-- Migração para Evolution API: Remover Z-API e adicionar Evolution API

-- Primeira, criar nova tabela para configurações da Evolution API
CREATE TABLE public.evolution_api_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  api_key TEXT NOT NULL,
  server_url TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  webhook_url TEXT,
  webhook_events TEXT[] DEFAULT ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']::TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar foreign key para empresas
ALTER TABLE public.evolution_api_config
ADD CONSTRAINT evolution_api_config_empresa_id_fkey
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Adicionar RLS policies
ALTER TABLE public.evolution_api_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company evolution api config"
ON public.evolution_api_config
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

-- Super admins podem ver tudo
CREATE POLICY "Super admins can manage all evolution api configs"
ON public.evolution_api_config
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Atualizar tabela whatsapp_connections para incluir campos da Evolution API
ALTER TABLE public.whatsapp_connections 
ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT,
ADD COLUMN IF NOT EXISTS evolution_status TEXT DEFAULT 'disconnected',
ADD COLUMN IF NOT EXISTS evolution_qr_code TEXT;

-- Criar índices para melhor performance
CREATE INDEX idx_evolution_api_config_empresa_id ON public.evolution_api_config(empresa_id);
CREATE INDEX idx_evolution_api_config_ativo ON public.evolution_api_config(ativo);
CREATE INDEX idx_whatsapp_connections_evolution_instance ON public.whatsapp_connections(evolution_instance_name);

-- Trigger para updated_at
CREATE TRIGGER update_evolution_api_config_updated_at
BEFORE UPDATE ON public.evolution_api_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();