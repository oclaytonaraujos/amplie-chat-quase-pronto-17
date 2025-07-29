-- Criar tabela de automações
CREATE TABLE public.automations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  flow_data jsonb DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'active', 'inactive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem automações da própria empresa
CREATE POLICY "Users can view company automations" 
ON public.automations 
FOR SELECT 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Política para usuários criarem automações na própria empresa
CREATE POLICY "Users can create company automations" 
ON public.automations 
FOR INSERT 
WITH CHECK (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Política para usuários atualizarem automações da própria empresa
CREATE POLICY "Users can update company automations" 
ON public.automations 
FOR UPDATE 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Política para usuários deletarem automações da própria empresa
CREATE POLICY "Users can delete company automations" 
ON public.automations 
FOR DELETE 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Política para super admins
CREATE POLICY "Super admins acesso automations" 
ON public.automations 
FOR ALL 
USING (is_super_admin() OR empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));