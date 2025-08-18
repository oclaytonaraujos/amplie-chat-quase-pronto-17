import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email = 'ampliemarketing.mkt@gmail.com', password = 'Amplie123@' } = await req.json()

    console.log('Verificando se usuário super admin existe...')

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(user => user.email === email)

    if (userExists) {
      console.log('Usuário super admin já existe')
      
      // Verificar se o perfil existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userExists.id)
        .single()
      
      if (!profile) {
        console.log('Criando perfil para super admin existente...')
        // Criar perfil se não existir
        await supabase.from('profiles').insert({
          id: userExists.id,
          nome: 'Super Administrador',
          email: email,
          empresa_id: '00000000-0000-0000-0000-000000000001', // UUID padrão para Amplie
          cargo: 'super_admin',
          setor: 'administracao',
          status: 'ativo',
          permissoes: ['all'],
          limite_atendimentos: 999999,
          aceita_novos_atendimentos: true
        })
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Super admin já existe e está configurado',
          user_id: userExists.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log('Criando usuário super admin...')

    // Garantir que existe uma empresa padrão para Amplie
    let empresaId = '00000000-0000-0000-0000-000000000001'
    
    const { data: empresaExiste } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .single()

    if (!empresaExiste) {
      console.log('Criando empresa Amplie Marketing...')
      const { error: empresaError } = await supabase.from('empresas').insert({
        id: empresaId,
        nome: 'Amplie Marketing',
        email: email,
        telefone: '+55 11 99999-9999',
        cnpj: '00.000.000/0001-00',
        endereco: 'São Paulo, SP',
        ativo: true,
        plano: 'enterprise',
        limite_usuarios: 999999,
        limite_whatsapp_connections: 999999
      })
      
      if (empresaError) {
        console.error('Erro ao criar empresa:', empresaError)
        throw new Error('Erro ao criar empresa padrão')
      }
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'Super Administrador',
        empresa_id: empresaId,
        cargo: 'super_admin'
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário:', authError)
      throw authError
    }

    console.log('Usuário super admin criado com sucesso:', authData.user?.id)

    // Criar perfil do super admin
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user!.id,
      nome: 'Super Administrador',
      email: email,
      empresa_id: empresaId,
      cargo: 'super_admin',
      setor: 'administracao',
      status: 'ativo',
      permissoes: ['all'],
      limite_atendimentos: 999999,
      aceita_novos_atendimentos: true
    })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Não falhar aqui pois o trigger pode criar o perfil
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super admin criado com sucesso',
        user_id: authData.user?.id,
        credentials: { email, password }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})