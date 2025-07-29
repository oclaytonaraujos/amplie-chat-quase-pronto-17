-- Fix the remaining function that still needs search_path configuration

CREATE OR REPLACE FUNCTION public.create_default_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.webhooks (empresa_id, nome, url, eventos, ativo, headers)
  VALUES (
    NEW.id,
    'Webhook Padrão',
    'https://exemplo.com/webhook',
    ARRAY['mensagem_recebida', 'mensagem_enviada'],
    false,
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$;