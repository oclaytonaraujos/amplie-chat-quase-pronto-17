-- Criar tabelas para suporte ao sistema de segurança e monitoramento

-- Tabela para logs de segurança
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  ip_address TEXT,
  user_agent TEXT,
  event_data JSONB DEFAULT '{}',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para monitoramento de performance e sistema
CREATE TABLE IF NOT EXISTS public.system_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de backup
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  backup_type TEXT NOT NULL,
  status TEXT NOT NULL,
  table_name TEXT,
  record_count INTEGER,
  file_size BIGINT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para configurações de segurança
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL UNIQUE,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  rate_limit_requests INTEGER DEFAULT 100,
  rate_limit_window_minutes INTEGER DEFAULT 15,
  enable_ip_blocking BOOLEAN DEFAULT true,
  enable_2fa BOOLEAN DEFAULT false,
  password_min_length INTEGER DEFAULT 8,
  password_require_symbols BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_uppercase BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para bloqueio de IPs
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  empresa_id UUID,
  created_by UUID
);

-- Habilitar RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para security_logs
CREATE POLICY "Users can view company security logs"
ON public.security_logs FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (true);

-- Políticas RLS para system_monitoring
CREATE POLICY "Users can view company monitoring data"
ON public.system_monitoring FOR SELECT
USING (empresa_id IS NULL OR empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert monitoring data"
ON public.system_monitoring FOR INSERT
WITH CHECK (true);

-- Políticas RLS para backup_logs
CREATE POLICY "Users can view company backup logs"
ON public.backup_logs FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can manage backup logs"
ON public.backup_logs FOR ALL
USING (true);

-- Políticas RLS para security_settings
CREATE POLICY "Users can view company security settings"
ON public.security_settings FOR SELECT
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage company security settings"
ON public.security_settings FOR ALL
USING (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid() AND cargo IN ('admin', 'super_admin')));

-- Políticas RLS para blocked_ips
CREATE POLICY "Super admins can manage blocked IPs"
ON public.blocked_ips FOR ALL
USING (is_super_admin());

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_empresa_created ON public.security_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_empresa_created ON public.system_monitoring(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_empresa_created ON public.backup_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remover logs de segurança com mais de 90 dias
  DELETE FROM public.security_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Remover dados de monitoramento com mais de 30 dias
  DELETE FROM public.system_monitoring 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Remover logs de backup com mais de 180 dias
  DELETE FROM public.backup_logs 
  WHERE created_at < NOW() - INTERVAL '180 days';
  
  -- Remover IPs bloqueados temporariamente que já expiraram
  DELETE FROM public.blocked_ips 
  WHERE blocked_until IS NOT NULL AND blocked_until < NOW();
END;
$$;