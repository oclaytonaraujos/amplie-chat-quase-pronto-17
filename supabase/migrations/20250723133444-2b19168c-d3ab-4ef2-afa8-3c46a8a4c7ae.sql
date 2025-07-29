-- Corrigir as últimas funções com problemas de search_path

CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, old_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, old_values, new_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      user_id, action, table_name, record_id, new_values
    ) VALUES (
      auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_profile(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Super admin pode acessar qualquer perfil
  IF public.is_super_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Usuário pode acessar seu próprio perfil
  RETURN profile_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar o ID da empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Buscar o usuário admin pelo email (caso já exista)
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se o usuário existir, atualizar seu perfil
    IF admin_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET 
            empresa_id = empresa_id,
            nome = 'Administrador',
            cargo = 'admin',
            setor = 'Administração'
        WHERE id = admin_user_id;
        
        -- Se o perfil não existir, criar
        IF NOT FOUND THEN
            INSERT INTO public.profiles (id, nome, email, empresa_id, cargo, setor)
            VALUES (admin_user_id, 'Administrador', 'ampliemarketing.mkt@gmail.com', empresa_id, 'admin', 'Administração');
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar a empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se não existe, criar empresa
    IF empresa_id IS NULL THEN
        INSERT INTO public.empresas (nome, email) 
        VALUES ('Amplie Marketing', 'ampliemarketing.mkt@gmail.com')
        RETURNING id INTO empresa_id;
    END IF;
    
    -- Verificar se já existe perfil para amplie-admin@ampliemarketing.com
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'amplie-admin@ampliemarketing.com';
    
    -- Se usuário existe, atualizar perfil
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, nome, email, empresa_id, cargo, setor, status)
        VALUES (admin_user_id, 'Amplie Admin', 'amplie-admin@ampliemarketing.com', empresa_id, 'super_admin', 'Administração', 'online')
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            empresa_id = EXCLUDED.empresa_id,
            cargo = EXCLUDED.cargo,
            setor = EXCLUDED.setor,
            status = EXCLUDED.status;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_super_admin_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_user_id UUID;
    empresa_id UUID;
BEGIN
    -- Buscar a empresa Amplie Marketing
    SELECT id INTO empresa_id FROM public.empresas WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Buscar o usuário pelo email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ampliemarketing.mkt@gmail.com';
    
    -- Se o usuário existir, criar/atualizar o perfil
    IF admin_user_id IS NOT NULL THEN
        -- Verificar se o perfil já existe
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
            -- Atualizar perfil existente
            UPDATE public.profiles 
            SET nome = 'Amplie Chat',
                empresa_id = empresa_id,
                cargo = 'super_admin',
                setor = 'Administração',
                status = 'online'
            WHERE id = admin_user_id;
        ELSE
            -- Criar novo perfil
            INSERT INTO public.profiles (id, nome, email, empresa_id, cargo, setor, status)
            VALUES (admin_user_id, 'Amplie Chat', 'ampliemarketing.mkt@gmail.com', empresa_id, 'super_admin', 'Administração', 'online');
        END IF;
    END IF;
END;
$$;