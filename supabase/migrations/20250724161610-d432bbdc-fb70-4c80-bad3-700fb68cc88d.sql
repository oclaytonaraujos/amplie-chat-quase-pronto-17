-- Corrigir todas as funções restantes que ainda não têm search_path correto

CREATE OR REPLACE FUNCTION public.ensure_single_default_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se o novo registro está sendo marcado como padrão
  IF NEW.is_default = TRUE THEN
    -- Desmarcar todos os outros fluxos da mesma empresa como padrão
    UPDATE public.chatbot_flows 
    SET is_default = FALSE 
    WHERE empresa_id = NEW.empresa_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversa_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.conversas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chatbot_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversa_interna_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.conversas_internas 
  SET updated_at = NOW() 
  WHERE id = NEW.conversa_interna_id;
  RETURN NEW;
END;
$$;