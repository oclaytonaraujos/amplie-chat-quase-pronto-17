
-- Criar tabela para gerenciar estado do chatbot
CREATE TABLE public.chatbot_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_phone TEXT NOT NULL UNIQUE,
  current_stage TEXT NOT NULL DEFAULT 'start',
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.chatbot_state ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso baseado na empresa (via system/webhook)
CREATE POLICY "System can manage chatbot state" 
  ON public.chatbot_state 
  FOR ALL 
  USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_chatbot_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_state_updated_at
  BEFORE UPDATE ON public.chatbot_state
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_state_updated_at();

-- Criar índices para otimizar consultas
CREATE INDEX idx_chatbot_state_phone ON public.chatbot_state(contact_phone);
CREATE INDEX idx_chatbot_state_stage ON public.chatbot_state(current_stage);
CREATE INDEX idx_chatbot_state_updated_at ON public.chatbot_state(updated_at);
