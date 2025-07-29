
-- Adicionar campo remetente_nome à tabela mensagens para armazenar o nome do atendente
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS remetente_nome TEXT;

-- Adicionar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_conversas_status ON public.conversas(status);
CREATE INDEX IF NOT EXISTS idx_conversas_empresa_status ON public.conversas(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_created ON public.mensagens(conversa_id, created_at);

-- Adicionar trigger para atualizar updated_at da conversa quando uma nova mensagem é inserida
CREATE OR REPLACE FUNCTION update_conversa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_conversa_on_message ON public.mensagens;
CREATE TRIGGER trigger_update_conversa_on_message
  AFTER INSERT ON public.mensagens
  FOR EACH ROW
  EXECUTE FUNCTION update_conversa_updated_at();

-- Habilitar realtime para as tabelas necessárias
ALTER TABLE public.conversas REPLICA IDENTITY FULL;
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime se ainda não estiverem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'mensagens'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
    END IF;
END $$;
