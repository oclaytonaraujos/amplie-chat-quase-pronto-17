-- Fase 1: Correções Críticas de Segurança

-- 1. Corrigir política RLS insegura da tabela profiles
-- Remover política que permite ver todos os perfis
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- Criar política segura para visualização de perfis
CREATE POLICY "Users can view profiles from their company only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Super admin pode ver todos
  is_super_admin() OR 
  -- Usuários podem ver apenas perfis da própria empresa
  (empresa_id = (
    SELECT empresa_id FROM public.profiles 
    WHERE id = auth.uid()
  ))
);

-- 2. Adicionar auditoria para operações sensíveis
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info'::text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    details,
    severity,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    event_type,
    details,
    severity,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para auditoria de mudanças em perfis
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger AS $$
BEGIN
  -- Log mudanças de cargo/permissões
  IF TG_OP = 'UPDATE' AND (OLD.cargo IS DISTINCT FROM NEW.cargo OR OLD.permissoes IS DISTINCT FROM NEW.permissoes) THEN
    PERFORM public.log_security_event(
      'profile_permission_change',
      jsonb_build_object(
        'target_user_id', NEW.id,
        'target_user_email', NEW.email,
        'old_cargo', OLD.cargo,
        'new_cargo', NEW.cargo,
        'old_permissoes', OLD.permissoes,
        'new_permissoes', NEW.permissoes,
        'changed_by', auth.uid()
      ),
      'critical'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 4. Adicionar política para auditoria de segurança
CREATE POLICY "Super admins can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (is_super_admin());

CREATE POLICY "System can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);

-- 5. Função para validar acesso administrativo
CREATE OR REPLACE FUNCTION public.validate_admin_access(
  required_action text
) RETURNS boolean AS $$
BEGIN
  -- Log tentativa de acesso administrativo
  PERFORM public.log_security_event(
    'admin_access_attempt',
    jsonb_build_object(
      'action', required_action,
      'user_id', auth.uid()
    ),
    CASE WHEN is_super_admin() THEN 'info' ELSE 'warning' END
  );
  
  RETURN is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;