-- Adicionar coluna whatsapp_connection_id na tabela automations
ALTER TABLE public.automations 
ADD COLUMN whatsapp_connection_id uuid REFERENCES public.whatsapp_connections(id);

-- Adicionar coluna send_webhook_url na tabela whatsapp_connections
ALTER TABLE public.whatsapp_connections 
ADD COLUMN send_webhook_url text;

-- Criar índice para performance
CREATE INDEX idx_automations_whatsapp_connection ON public.automations(whatsapp_connection_id);

-- Atualizar políticas RLS para incluir as novas colunas
DROP POLICY IF EXISTS "Users can create company automations" ON public.automations;
DROP POLICY IF EXISTS "Users can update company automations" ON public.automations;
DROP POLICY IF EXISTS "Users can view company automations" ON public.automations;

-- Recriar políticas RLS para automations
CREATE POLICY "Users can create company automations" 
ON public.automations 
FOR INSERT 
WITH CHECK (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can update company automations" 
ON public.automations 
FOR UPDATE 
USING (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can view company automations" 
ON public.automations 
FOR SELECT 
USING (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- Garantir que as conexões WhatsApp também tenham RLS adequado
DROP POLICY IF EXISTS "Users can view company whatsapp connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Users can update company whatsapp connections" ON public.whatsapp_connections;

CREATE POLICY "Users can view company whatsapp connections" 
ON public.whatsapp_connections 
FOR SELECT 
USING (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Users can update company whatsapp connections" 
ON public.whatsapp_connections 
FOR UPDATE 
USING (empresa_id = (
  SELECT profiles.empresa_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));