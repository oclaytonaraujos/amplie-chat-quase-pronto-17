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
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Super admin já existe',
          user_id: userExists.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log('Criando usuário super admin...')

    // Buscar empresa Amplie Marketing
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('email', email)
      .single()

    if (empresaError) {
      console.error('Erro ao buscar empresa:', empresaError)
      throw new Error('Empresa não encontrada')
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome: 'Super Administrador',
        empresa_id: empresa.id,
        cargo: 'super_admin'
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário:', authError)
      throw authError
    }

    console.log('Usuário super admin criado com sucesso:', authData.user?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super admin criado com sucesso',
        user_id: authData.user?.id 
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