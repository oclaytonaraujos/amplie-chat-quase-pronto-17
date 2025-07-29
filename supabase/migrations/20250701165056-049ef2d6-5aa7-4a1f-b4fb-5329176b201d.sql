
-- Criar tabela para sistema de filas de mensagens
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL DEFAULT 'whatsapp_message',
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled_at ON public.message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_correlation_id ON public.message_queue(correlation_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_priority ON public.message_queue(priority DESC);

-- Criar tabela para logs estruturados
CREATE TABLE IF NOT EXISTS public.chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  contact_phone TEXT,
  current_stage TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para logs
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_correlation_id ON public.chatbot_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_function_name ON public.chatbot_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_level ON public.chatbot_logs(level);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created_at ON public.chatbot_logs(created_at);

-- Criar tabela para integrações NLP
CREATE TABLE IF NOT EXISTS public.nlp_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  intent_name TEXT NOT NULL,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
  target_stage TEXT NOT NULL,
  training_phrases TEXT[] DEFAULT '{}',
  parameters JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para intents
CREATE INDEX IF NOT EXISTS idx_nlp_intents_empresa_id ON public.nlp_intents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nlp_intents_intent_name ON public.nlp_intents(intent_name);
CREATE INDEX IF NOT EXISTS idx_nlp_intents_active ON public.nlp_intents(active);

-- Adicionar colunas de metadados ao chatbot_state para suportar NLP
ALTER TABLE public.chatbot_state 
ADD COLUMN IF NOT EXISTS nlp_intent TEXT,
ADD COLUMN IF NOT EXISTS nlp_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS correlation_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS last_message_id UUID;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nlp_intents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para message_queue (apenas sistema pode acessar)
CREATE POLICY "System can manage message queue" ON public.message_queue
  FOR ALL USING (true);

-- Políticas RLS para chatbot_logs (apenas sistema pode acessar)
CREATE POLICY "System can manage chatbot logs" ON public.chatbot_logs
  FOR ALL USING (true);

-- Políticas RLS para nlp_intents
CREATE POLICY "Users can manage intents from their company" ON public.nlp_intents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.empresa_id = nlp_intents.empresa_id
    )
  );

-- Função para limpar filas antigas
CREATE OR REPLACE FUNCTION cleanup_old_queue_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.message_queue 
  WHERE status IN ('completed', 'failed') 
  AND created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM public.chatbot_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Função para processar próxima mensagem na fila
CREATE OR REPLACE FUNCTION get_next_queue_message()
RETURNS TABLE(
  id UUID,
  correlation_id UUID,
  message_type TEXT,
  payload JSONB,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.message_queue 
  SET 
    status = 'processing',
    processed_at = NOW()
  WHERE message_queue.id = (
    SELECT q.id 
    FROM public.message_queue q
    WHERE q.status = 'pending' 
    AND q.scheduled_at <= NOW()
    ORDER BY q.priority DESC, q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    message_queue.id,
    message_queue.correlation_id,
    message_queue.message_type,
    message_queue.payload,
    message_queue.retry_count;
END;
$$ LANGUAGE plpgsql;

-- Habilitar realtime nas novas tabelas
ALTER TABLE public.message_queue REPLICA IDENTITY FULL;
ALTER TABLE public.chatbot_logs REPLICA IDENTITY FULL;
ALTER TABLE public.nlp_intents REPLICA IDENTITY FULL;

-- Adicionar às publicações realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nlp_intents;
