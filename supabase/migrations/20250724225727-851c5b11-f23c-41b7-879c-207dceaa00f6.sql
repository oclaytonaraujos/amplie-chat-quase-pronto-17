-- Create advanced chat internal features
CREATE TABLE IF NOT EXISTS public.chat_internal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_room_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced automation triggers
CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  execution_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Templates system enhancement
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  shortcuts TEXT[] DEFAULT '{}'
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  metric_category TEXT NOT NULL,
  response_time_ms INTEGER,
  memory_usage_mb NUMERIC,
  cpu_usage_percent NUMERIC,
  active_users_count INTEGER,
  error_rate_percent NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_internal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat attachments
CREATE POLICY "Users can view company chat attachments"
ON public.chat_internal_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_room_messages crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    JOIN profiles p ON p.empresa_id = cr.empresa_id
    WHERE crm.id = chat_internal_attachments.message_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can create chat attachments"
ON public.chat_internal_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_messages crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    JOIN profiles p ON p.empresa_id = cr.empresa_id
    WHERE crm.id = chat_internal_attachments.message_id
    AND p.id = auth.uid()
  )
);

-- RLS Policies for automation logs
CREATE POLICY "Users can view company automation logs"
ON public.automation_execution_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM automations a
    JOIN profiles p ON p.empresa_id = a.empresa_id
    WHERE a.id = automation_execution_logs.automation_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "System can manage automation logs"
ON public.automation_execution_logs FOR ALL
USING (true);

-- RLS Policies for message templates
CREATE POLICY "Users can manage company templates"
ON public.message_templates FOR ALL
USING (
  empresa_id = (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for performance metrics
CREATE POLICY "Users can view company performance metrics"
ON public.performance_metrics FOR SELECT
USING (
  empresa_id = (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "System can create performance metrics"
ON public.performance_metrics FOR INSERT
WITH CHECK (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Create analytics functions
CREATE OR REPLACE FUNCTION get_company_analytics(
  p_empresa_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_conversations INTEGER,
  resolved_conversations INTEGER,
  avg_response_time_minutes NUMERIC,
  total_messages INTEGER,
  active_agents INTEGER,
  satisfaction_score NUMERIC
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::INTEGER FROM conversas c WHERE c.empresa_id = p_empresa_id AND c.created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM conversas c WHERE c.empresa_id = p_empresa_id AND c.status = 'finalizado' AND c.created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60) FROM conversas c WHERE c.empresa_id = p_empresa_id AND c.status = 'finalizado' AND c.created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    COALESCE((SELECT COUNT(*)::INTEGER FROM mensagens m JOIN conversas c ON c.id = m.conversa_id WHERE c.empresa_id = p_empresa_id AND m.created_at::DATE BETWEEN p_start_date AND p_end_date), 0),
    COALESCE((SELECT COUNT(DISTINCT p.id)::INTEGER FROM profiles p WHERE p.empresa_id = p_empresa_id AND p.status = 'online'), 0),
    COALESCE(4.2, 0); -- Placeholder for satisfaction score
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;