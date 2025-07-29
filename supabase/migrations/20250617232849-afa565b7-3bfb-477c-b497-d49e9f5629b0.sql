
-- Tabela para armazenar os fluxos de chatbot (configuração geral)
CREATE TABLE IF NOT EXISTS public.chatbot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  mensagem_inicial TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inativo' CHECK (status IN ('ativo', 'inativo')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os nós do fluxo
CREATE TABLE IF NOT EXISTS public.chatbot_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- ID interno do nó (ex: 'no-inicial', 'no-1', etc.)
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo_resposta TEXT NOT NULL CHECK (tipo_resposta IN ('opcoes', 'texto-livre', 'anexo', 'apenas-mensagem')),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flow_id, node_id)
);

-- Tabela para armazenar as opções de cada nó
CREATE TABLE IF NOT EXISTS public.chatbot_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.chatbot_nodes(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL, -- ID interno da opção
  texto TEXT NOT NULL,
  proxima_acao TEXT NOT NULL CHECK (proxima_acao IN ('proximo-no', 'transferir', 'finalizar', 'mensagem-finalizar')),
  proximo_node_id TEXT, -- ID do próximo nó se proxima_acao = 'proximo-no'
  setor_transferencia TEXT, -- Setor para transferir se proxima_acao = 'transferir'
  mensagem_final TEXT, -- Mensagem final se proxima_acao = 'mensagem-finalizar'
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_id, option_id)
);

-- Tabela para controlar o estado das conversas no chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  current_node_id TEXT NOT NULL,
  session_data JSONB DEFAULT '{}', -- Para armazenar dados coletados durante o fluxo
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'transferido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversa_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chatbot_flows
CREATE POLICY "Users can view flows from their company" ON public.chatbot_flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.empresa_id = chatbot_flows.empresa_id
    )
  );

CREATE POLICY "Users can manage flows from their company" ON public.chatbot_flows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.empresa_id = chatbot_flows.empresa_id
    )
  );

-- Políticas RLS para chatbot_nodes
CREATE POLICY "Users can view nodes from their company flows" ON public.chatbot_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_flows cf
      JOIN public.profiles p ON p.empresa_id = cf.empresa_id
      WHERE cf.id = chatbot_nodes.flow_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage nodes from their company flows" ON public.chatbot_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_flows cf
      JOIN public.profiles p ON p.empresa_id = cf.empresa_id
      WHERE cf.id = chatbot_nodes.flow_id AND p.id = auth.uid()
    )
  );

-- Políticas RLS para chatbot_options
CREATE POLICY "Users can view options from their company flows" ON public.chatbot_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_nodes cn
      JOIN public.chatbot_flows cf ON cf.id = cn.flow_id
      JOIN public.profiles p ON p.empresa_id = cf.empresa_id
      WHERE cn.id = chatbot_options.node_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage options from their company flows" ON public.chatbot_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_nodes cn
      JOIN public.chatbot_flows cf ON cf.id = cn.flow_id
      JOIN public.profiles p ON p.empresa_id = cf.empresa_id
      WHERE cn.id = chatbot_options.node_id AND p.id = auth.uid()
    )
  );

-- Políticas RLS para chatbot_sessions
CREATE POLICY "Users can view sessions from their company" ON public.chatbot_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversas c
      JOIN public.profiles p ON p.empresa_id = c.empresa_id
      WHERE c.id = chatbot_sessions.conversa_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "System can manage all sessions" ON public.chatbot_sessions
  FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_empresa_status ON public.chatbot_flows(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_chatbot_nodes_flow_node ON public.chatbot_nodes(flow_id, node_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_options_node ON public.chatbot_options(node_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_conversa ON public.chatbot_sessions(conversa_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_flow_status ON public.chatbot_sessions(flow_id, status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chatbot_flows_updated_at
  BEFORE UPDATE ON public.chatbot_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

CREATE TRIGGER trigger_chatbot_sessions_updated_at
  BEFORE UPDATE ON public.chatbot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

-- Habilitar realtime
ALTER TABLE public.chatbot_flows REPLICA IDENTITY FULL;
ALTER TABLE public.chatbot_nodes REPLICA IDENTITY FULL;
ALTER TABLE public.chatbot_options REPLICA IDENTITY FULL;
ALTER TABLE public.chatbot_sessions REPLICA IDENTITY FULL;

-- Adicionar às publicações realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_flows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_sessions;

-- Função para garantir apenas um fluxo padrão por empresa
CREATE OR REPLACE FUNCTION ensure_single_default_flow()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o novo registro está sendo marcado como padrão
  IF NEW.is_default = TRUE THEN
    -- Desmarcar todos os outros fluxos da mesma empresa como padrão
    UPDATE public.chatbot_flows 
    SET is_default = FALSE 
    WHERE empresa_id = NEW.empresa_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_flow
  BEFORE INSERT OR UPDATE ON public.chatbot_flows
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_flow();
