
-- Criar tabela de planos com permissões granulares
CREATE TABLE public.planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) DEFAULT 0,
  limite_usuarios INTEGER DEFAULT 10,
  limite_armazenamento_gb INTEGER DEFAULT 5,
  limite_contatos INTEGER DEFAULT 1000,
  pode_usar_chatbot BOOLEAN DEFAULT false,
  pode_usar_kanban BOOLEAN DEFAULT true,
  pode_usar_api BOOLEAN DEFAULT false,
  pode_usar_chat_interno BOOLEAN DEFAULT true,
  pode_usar_automacao BOOLEAN DEFAULT false,
  pode_usar_relatorios BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna plano_id na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN plano_id UUID REFERENCES public.planos(id),
ADD COLUMN limite_usuarios INTEGER DEFAULT 10,
ADD COLUMN limite_armazenamento_gb INTEGER DEFAULT 5,
ADD COLUMN limite_contatos INTEGER DEFAULT 1000;

-- Criar tabela para conexões WhatsApp (se não existir)
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  numero TEXT NOT NULL,
  status TEXT DEFAULT 'desconectado',
  empresa_id UUID REFERENCES public.empresas(id),
  qr_code TEXT,
  ultimo_ping TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar cargo super_admin se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cargo'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cargo TEXT DEFAULT 'usuario';
  END IF;
END $$;

-- Inserir planos padrão
INSERT INTO public.planos (nome, descricao, preco_mensal, limite_usuarios, limite_armazenamento_gb, limite_contatos, pode_usar_chatbot, pode_usar_kanban, pode_usar_api, pode_usar_chat_interno, pode_usar_automacao, pode_usar_relatorios) VALUES
('Básico', 'Plano básico com funcionalidades essenciais', 29.90, 5, 2, 500, false, true, false, true, false, false),
('Profissional', 'Plano profissional com recursos avançados', 79.90, 15, 10, 2000, true, true, true, true, true, false),
('Enterprise', 'Plano empresarial com todos os recursos', 199.90, 50, 50, 10000, true, true, true, true, true, true);

-- Configurar RLS para as novas tabelas
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para super_admin
CREATE POLICY "Super admins can manage planos" ON public.planos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.cargo = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage whatsapp connections" ON public.whatsapp_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.cargo = 'super_admin'
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
