
-- Remover o trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover a função existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna empresa_id na tabela profiles
ALTER TABLE public.profiles ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- Adicionar coluna empresa_id nas demais tabelas para isolamento
ALTER TABLE public.contatos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.conversas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.setores ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.zapi_config ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- Habilitar RLS na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas (usuários só veem sua própria empresa)
CREATE POLICY "Usuários podem ver própria empresa" ON public.empresas 
  FOR SELECT TO authenticated 
  USING (id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Atualizar políticas RLS existentes para incluir isolamento por empresa
DROP POLICY IF EXISTS "Usuários autenticados podem ver contatos" ON public.contatos;
CREATE POLICY "Usuários podem ver contatos da própria empresa" ON public.contatos 
  FOR SELECT TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem criar contatos" ON public.contatos;
CREATE POLICY "Usuários podem criar contatos na própria empresa" ON public.contatos 
  FOR INSERT TO authenticated 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar contatos" ON public.contatos;
CREATE POLICY "Usuários podem atualizar contatos da própria empresa" ON public.contatos 
  FOR UPDATE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem deletar contatos" ON public.contatos;
CREATE POLICY "Usuários podem deletar contatos da própria empresa" ON public.contatos 
  FOR DELETE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas similares para outras tabelas
DROP POLICY IF EXISTS "Usuários autenticados podem ver conversas" ON public.conversas;
CREATE POLICY "Usuários podem ver conversas da própria empresa" ON public.conversas 
  FOR SELECT TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem criar conversas" ON public.conversas;
CREATE POLICY "Usuários podem criar conversas na própria empresa" ON public.conversas 
  FOR INSERT TO authenticated 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar conversas" ON public.conversas;
CREATE POLICY "Usuários podem atualizar conversas da própria empresa" ON public.conversas 
  FOR UPDATE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas para setores
DROP POLICY IF EXISTS "Usuários autenticados podem ver setores" ON public.setores;
CREATE POLICY "Usuários podem ver setores da própria empresa" ON public.setores 
  FOR SELECT TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem criar setores" ON public.setores;
CREATE POLICY "Usuários podem criar setores na própria empresa" ON public.setores 
  FOR INSERT TO authenticated 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar setores" ON public.setores;
CREATE POLICY "Usuários podem atualizar setores da própria empresa" ON public.setores 
  FOR UPDATE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados podem deletar setores" ON public.setores;
CREATE POLICY "Usuários podem deletar setores da própria empresa" ON public.setores 
  FOR DELETE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas para zapi_config
DROP POLICY IF EXISTS "Usuários podem ver próprias configurações Z-API" ON public.zapi_config;
CREATE POLICY "Usuários podem ver configurações Z-API da própria empresa" ON public.zapi_config 
  FOR SELECT TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem inserir próprias configurações Z-API" ON public.zapi_config;
CREATE POLICY "Usuários podem inserir configurações Z-API na própria empresa" ON public.zapi_config 
  FOR INSERT TO authenticated 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar próprias configurações Z-API" ON public.zapi_config;
CREATE POLICY "Usuários podem atualizar configurações Z-API da própria empresa" ON public.zapi_config 
  FOR UPDATE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem deletar próprias configurações Z-API" ON public.zapi_config;
CREATE POLICY "Usuários podem deletar configurações Z-API da própria empresa" ON public.zapi_config 
  FOR DELETE TO authenticated 
  USING (empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Criar trigger para atualizar updated_at na tabela empresas
CREATE TRIGGER update_empresas_updated_at 
  BEFORE UPDATE ON public.empresas 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir empresa padrão para testes
INSERT INTO public.empresas (nome, email) VALUES ('Empresa Demo', 'admin@empresademo.com');
