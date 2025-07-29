
-- Criar tabela específica para conversas internas
CREATE TABLE IF NOT EXISTS public.conversas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  participante_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participante_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupo')),
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participante_1_id, participante_2_id)
);

-- Criar tabela específica para mensagens internas
CREATE TABLE IF NOT EXISTS public.mensagens_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_interna_id UUID NOT NULL REFERENCES public.conversas_internas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo_mensagem TEXT DEFAULT 'texto' CHECK (tipo_mensagem IN ('texto', 'imagem', 'documento', 'audio')),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.conversas_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_internas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversas_internas - usuários só podem ver conversas onde participam
CREATE POLICY "Users can view their own conversations" ON public.conversas_internas
  FOR SELECT USING (
    auth.uid() = participante_1_id OR 
    auth.uid() = participante_2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversas_internas
  FOR INSERT WITH CHECK (
    auth.uid() = participante_1_id OR 
    auth.uid() = participante_2_id
  );

CREATE POLICY "Users can update their conversations" ON public.conversas_internas
  FOR UPDATE USING (
    auth.uid() = participante_1_id OR 
    auth.uid() = participante_2_id
  );

-- Políticas RLS para mensagens_internas
CREATE POLICY "Users can view messages from their conversations" ON public.mensagens_internas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversas_internas ci 
      WHERE ci.id = conversa_interna_id 
      AND (ci.participante_1_id = auth.uid() OR ci.participante_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.mensagens_internas
  FOR INSERT WITH CHECK (
    auth.uid() = remetente_id AND
    EXISTS (
      SELECT 1 FROM public.conversas_internas ci 
      WHERE ci.id = conversa_interna_id 
      AND (ci.participante_1_id = auth.uid() OR ci.participante_2_id = auth.uid())
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_internas_participantes ON public.conversas_internas(participante_1_id, participante_2_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_internas_conversa ON public.mensagens_internas(conversa_interna_id, created_at);

-- Trigger para atualizar updated_at nas conversas internas
CREATE OR REPLACE FUNCTION update_conversa_interna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversas_internas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_interna_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversa_interna_on_message
  AFTER INSERT ON public.mensagens_internas
  FOR EACH ROW
  EXECUTE FUNCTION update_conversa_interna_updated_at();

-- Habilitar realtime para as novas tabelas
ALTER TABLE public.conversas_internas REPLICA IDENTITY FULL;
ALTER TABLE public.mensagens_internas REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas_internas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_internas;
