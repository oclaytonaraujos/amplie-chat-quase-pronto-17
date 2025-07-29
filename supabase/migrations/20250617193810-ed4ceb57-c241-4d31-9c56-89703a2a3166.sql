
-- Criar tabela para chatbots
CREATE TABLE IF NOT EXISTS public.chatbots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inativo',
  mensagem_inicial TEXT NOT NULL,
  fluxo JSONB DEFAULT '[]'::jsonb,
  interacoes INTEGER DEFAULT 0,
  transferencias INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para chatbots
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;

-- Política para chatbots - usuários podem ver apenas os da sua empresa
CREATE POLICY "Users can view company chatbots" ON public.chatbots
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Política para criar chatbots
CREATE POLICY "Users can create company chatbots" ON public.chatbots
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Política para atualizar chatbots
CREATE POLICY "Users can update company chatbots" ON public.chatbots
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Política para deletar chatbots
CREATE POLICY "Users can delete company chatbots" ON public.chatbots
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Habilitar realtime para as tabelas relevantes (somente se necessário)
ALTER TABLE public.mensagens REPLICA IDENTITY FULL;
ALTER TABLE public.chatbots REPLICA IDENTITY FULL;
ALTER TABLE public.contatos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime somente se não existirem
DO $$
BEGIN
    -- Adicionar mensagens se não estiver na publicação
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'mensagens'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
    END IF;
    
    -- Adicionar chatbots
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chatbots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbots;
    END IF;
    
    -- Adicionar contatos
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'contatos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contatos;
    END IF;
END $$;

-- Habilitar RLS nas tabelas que ainda não têm (usando IF NOT EXISTS equivalente)
DO $$
BEGIN
    -- Para conversas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversas' 
        AND policyname = 'Users can view company conversations'
    ) THEN
        CREATE POLICY "Users can view company conversations" ON public.conversas
          FOR SELECT USING (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversas' 
        AND policyname = 'Users can create company conversations'
    ) THEN
        CREATE POLICY "Users can create company conversations" ON public.conversas
          FOR INSERT WITH CHECK (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversas' 
        AND policyname = 'Users can update company conversations'
    ) THEN
        CREATE POLICY "Users can update company conversations" ON public.conversas
          FOR UPDATE USING (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    -- Para mensagens
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mensagens' 
        AND policyname = 'Users can view company messages'
    ) THEN
        CREATE POLICY "Users can view company messages" ON public.mensagens
          FOR SELECT USING (
            conversa_id IN (
              SELECT id FROM public.conversas 
              WHERE empresa_id IN (
                SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
              )
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mensagens' 
        AND policyname = 'Users can create company messages'
    ) THEN
        CREATE POLICY "Users can create company messages" ON public.mensagens
          FOR INSERT WITH CHECK (
            conversa_id IN (
              SELECT id FROM public.conversas 
              WHERE empresa_id IN (
                SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
              )
            )
          );
    END IF;
    
    -- Para contatos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contatos' 
        AND policyname = 'Users can view company contacts'
    ) THEN
        CREATE POLICY "Users can view company contacts" ON public.contatos
          FOR SELECT USING (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contatos' 
        AND policyname = 'Users can create company contacts'
    ) THEN
        CREATE POLICY "Users can create company contacts" ON public.contatos
          FOR INSERT WITH CHECK (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contatos' 
        AND policyname = 'Users can update company contacts'
    ) THEN
        CREATE POLICY "Users can update company contacts" ON public.contatos
          FOR UPDATE USING (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contatos' 
        AND policyname = 'Users can delete company contacts'
    ) THEN
        CREATE POLICY "Users can delete company contacts" ON public.contatos
          FOR DELETE USING (
            empresa_id IN (
              SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
            )
          );
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_chatbots_updated_at BEFORE UPDATE ON public.chatbots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
