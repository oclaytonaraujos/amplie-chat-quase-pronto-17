
-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  setor TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'ausente', 'offline')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de contatos/clientes
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  empresa TEXT,
  tags TEXT[],
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de conversas
CREATE TABLE public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID REFERENCES public.contatos(id) ON DELETE CASCADE,
  agente_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'finalizado', 'transferido')),
  canal TEXT DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp', 'email', 'chat')),
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  setor TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de mensagens
CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_tipo TEXT NOT NULL CHECK (remetente_tipo IN ('agente', 'contato', 'sistema')),
  remetente_id UUID,
  conteudo TEXT NOT NULL,
  tipo_mensagem TEXT DEFAULT 'texto' CHECK (tipo_mensagem IN ('texto', 'imagem', 'audio', 'documento', 'localizacao')),
  metadata JSONB,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de setores
CREATE TABLE public.setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transferências
CREATE TABLE public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES public.conversas(id) ON DELETE CASCADE,
  de_agente_id UUID REFERENCES public.profiles(id),
  para_agente_id UUID REFERENCES public.profiles(id),
  motivo TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'recusada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configurações da Z-API
CREATE TABLE public.zapi_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL,
  token TEXT NOT NULL,
  webhook_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir setores padrão
INSERT INTO public.setores (nome, descricao, cor) VALUES
('Vendas', 'Equipe de vendas e prospecção', '#10B981'),
('Suporte', 'Atendimento ao cliente e suporte técnico', '#F59E0B'),
('Financeiro', 'Departamento financeiro e cobrança', '#EF4444'),
('Geral', 'Atendimento geral', '#6366F1');

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapi_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuários podem inserir próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para contatos
CREATE POLICY "Usuários autenticados podem ver contatos" ON public.contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar contatos" ON public.contatos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar contatos" ON public.contatos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar contatos" ON public.contatos FOR DELETE TO authenticated USING (true);

-- Políticas RLS para conversas
CREATE POLICY "Usuários autenticados podem ver conversas" ON public.conversas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar conversas" ON public.conversas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar conversas" ON public.conversas FOR UPDATE TO authenticated USING (true);

-- Políticas RLS para mensagens
CREATE POLICY "Usuários autenticados podem ver mensagens" ON public.mensagens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar mensagens" ON public.mensagens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar mensagens" ON public.mensagens FOR UPDATE TO authenticated USING (true);

-- Políticas RLS para setores
CREATE POLICY "Usuários autenticados podem ver setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar setores" ON public.setores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem deletar setores" ON public.setores FOR DELETE TO authenticated USING (true);

-- Políticas RLS para transferências
CREATE POLICY "Usuários podem ver transferências relacionadas" ON public.transferencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar transferências" ON public.transferencias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar transferências" ON public.transferencias FOR UPDATE TO authenticated USING (true);

-- Políticas RLS para zapi_config
CREATE POLICY "Usuários podem ver próprias configurações Z-API" ON public.zapi_config FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Usuários podem inserir próprias configurações Z-API" ON public.zapi_config FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuários podem atualizar próprias configurações Z-API" ON public.zapi_config FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Usuários podem deletar próprias configurações Z-API" ON public.zapi_config FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Função para criar perfil automaticamente após cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contatos_updated_at BEFORE UPDATE ON public.contatos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversas_updated_at BEFORE UPDATE ON public.conversas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zapi_config_updated_at BEFORE UPDATE ON public.zapi_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para tabelas importantes
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transferencias;
