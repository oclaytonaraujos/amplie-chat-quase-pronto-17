-- Criar tabela para relacionamento N:N entre automações e conexões WhatsApp
CREATE TABLE public.automation_whatsapp_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  whatsapp_connection_id uuid NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(automation_id, whatsapp_connection_id)
);

-- Enable RLS
ALTER TABLE public.automation_whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem conexões de automações da própria empresa
CREATE POLICY "Users can view automation connections from their company"
ON public.automation_whatsapp_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.automations a
    JOIN public.profiles p ON p.empresa_id = a.empresa_id
    WHERE a.id = automation_whatsapp_connections.automation_id
    AND p.id = auth.uid()
  )
);

-- Política para usuários criarem conexões de automações da própria empresa
CREATE POLICY "Users can create automation connections from their company"
ON public.automation_whatsapp_connections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.automations a
    JOIN public.profiles p ON p.empresa_id = a.empresa_id
    WHERE a.id = automation_whatsapp_connections.automation_id
    AND p.id = auth.uid()
  )
);

-- Política para usuários atualizarem conexões de automações da própria empresa
CREATE POLICY "Users can update automation connections from their company"
ON public.automation_whatsapp_connections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.automations a
    JOIN public.profiles p ON p.empresa_id = a.empresa_id
    WHERE a.id = automation_whatsapp_connections.automation_id
    AND p.id = auth.uid()
  )
);

-- Política para usuários excluírem conexões de automações da própria empresa
CREATE POLICY "Users can delete automation connections from their company"
ON public.automation_whatsapp_connections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.automations a
    JOIN public.profiles p ON p.empresa_id = a.empresa_id
    WHERE a.id = automation_whatsapp_connections.automation_id
    AND p.id = auth.uid()
  )
);

-- Super admins podem fazer tudo
CREATE POLICY "Super admins can manage all automation connections"
ON public.automation_whatsapp_connections
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());