-- Criar tabela para tipos de gatilhos de automação
CREATE TABLE public.automation_triggers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'message_received', 'keyword_detected', 'first_message',
    'schedule_time', 'inactivity_timeout', 'business_hours',
    'user_return', 'conversation_end', 'transfer_requested',
    'webhook_received', 'api_call', 'form_submitted',
    'manual_trigger', 'flow_completed'
  )),
  conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '{}',
  cooldown_minutes integer DEFAULT 0,
  max_activations_per_day integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários verem gatilhos da própria empresa
CREATE POLICY "Users can view company triggers" 
ON public.automation_triggers 
FOR SELECT 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Políticas para usuários criarem gatilhos na própria empresa
CREATE POLICY "Users can create company triggers" 
ON public.automation_triggers 
FOR INSERT 
WITH CHECK (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Políticas para usuários atualizarem gatilhos da própria empresa
CREATE POLICY "Users can update company triggers" 
ON public.automation_triggers 
FOR UPDATE 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Políticas para usuários deletarem gatilhos da própria empresa
CREATE POLICY "Users can delete company triggers" 
ON public.automation_triggers 
FOR DELETE 
USING (empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_automation_triggers_updated_at
  BEFORE UPDATE ON public.automation_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Política para super admins
CREATE POLICY "Super admins acesso triggers" 
ON public.automation_triggers 
FOR ALL 
USING (is_super_admin() OR empresa_id = (SELECT profiles.empresa_id FROM profiles WHERE profiles.id = auth.uid()));

-- Tabela para logs de ativação de gatilhos
CREATE TABLE public.trigger_activations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id uuid NOT NULL REFERENCES public.automation_triggers(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  activation_reason text NOT NULL,
  conditions_met jsonb DEFAULT '{}',
  actions_executed jsonb DEFAULT '{}',
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para logs
ALTER TABLE public.trigger_activations ENABLE ROW LEVEL SECURITY;

-- Política para logs de gatilhos
CREATE POLICY "Users can view company trigger logs" 
ON public.trigger_activations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM automation_triggers at 
  JOIN profiles p ON p.empresa_id = at.empresa_id 
  WHERE at.id = trigger_activations.trigger_id 
  AND p.id = auth.uid()
));

-- Inserir gatilhos padrão
INSERT INTO public.automation_triggers (empresa_id, name, description, trigger_type, priority, conditions, actions) 
SELECT 
  e.id,
  'Primeira Mensagem',
  'Ativar chatbot para novos contatos',
  'first_message',
  1,
  '{"new_contact": true}',
  '{"start_default_flow": true}'
FROM public.empresas e
WHERE e.ativo = true;

INSERT INTO public.automation_triggers (empresa_id, name, description, trigger_type, priority, conditions, actions) 
SELECT 
  e.id,
  'Fora do Horário Comercial',
  'Mensagem automática fora do expediente',
  'business_hours',
  2,
  '{"outside_hours": {"start": "08:00", "end": "18:00"}}',
  '{"send_message": "Obrigado pela mensagem! Nosso atendimento funciona das 8h às 18h. Retornaremos assim que possível.", "create_ticket": true}'
FROM public.empresas e
WHERE e.ativo = true;