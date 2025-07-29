-- Corrigir vulnerabilidades de segurança: Function Search Path Mutable
-- Adicionar search_path='public' a todas as funções que não têm

-- 1. Corrigir função create_notification
CREATE OR REPLACE FUNCTION public.create_notification(title text, message text, notification_type text DEFAULT 'info'::text, user_id uuid DEFAULT NULL::uuid, empresa_id uuid DEFAULT NULL::uuid, data jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (title, message, type, user_id, empresa_id, data)
  VALUES (title, message, notification_type, user_id, empresa_id, data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- 2. Corrigir função update_updated_at_notifications
CREATE OR REPLACE FUNCTION public.update_updated_at_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;