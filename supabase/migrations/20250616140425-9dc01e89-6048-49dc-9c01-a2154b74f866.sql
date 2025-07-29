
-- Remover a constraint problemática de status se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Recriar a constraint de status com valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('online', 'ausente', 'offline'));

-- Adicionar coluna cargo se não existir com valores permitidos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='cargo') THEN
        ALTER TABLE public.profiles ADD COLUMN cargo TEXT DEFAULT 'usuario';
    END IF;
END $$;

-- Atualizar constraint de cargo para incluir super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cargo_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cargo_check 
CHECK (cargo IN ('super_admin', 'admin', 'agente', 'usuario', 'supervisor'));

-- Criar função para criar usuário super admin
CREATE OR REPLACE FUNCTION public.create_super_admin()
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função
SELECT public.create_super_admin();
