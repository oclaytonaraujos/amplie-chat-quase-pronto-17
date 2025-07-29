import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlowData {
  nodes: any[]
  edges: any[]
}

interface SaveFlowRequest {
  id?: string
  name: string
  flow_data: FlowData
  whatsapp_connection_ids?: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get user profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.empresa_id) {
      throw new Error('User profile not found or no company associated')
    }

    const body: SaveFlowRequest = await req.json()

    // Validate request body
    if (!body.name || !body.flow_data) {
      throw new Error('Name and flow_data are required')
    }

    let result

    if (body.id) {
      // Update existing automation
      const updateData: any = {
        name: body.name,
        flow_data: body.flow_data,
        updated_at: new Date().toISOString()
      }
      
      if (body.whatsapp_connection_id !== undefined) {
        updateData.whatsapp_connection_id = body.whatsapp_connection_id
      }

      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', body.id)
        .eq('empresa_id', profile.empresa_id)
        .select()
        .single()

      if (error) throw error
      result = data

      // Update WhatsApp connections if provided
      if (body.whatsapp_connection_ids) {
        // Delete existing connections
        await supabase
          .from('automation_whatsapp_connections')
          .delete()
          .eq('automation_id', body.id)

        // Insert new connections
        if (body.whatsapp_connection_ids.length > 0) {
          const connections = body.whatsapp_connection_ids.map(id => ({
            automation_id: body.id,
            whatsapp_connection_id: id
          }))

          await supabase
            .from('automation_whatsapp_connections')
            .insert(connections)
        }
      }
    } else {
      // Create new automation
      const insertData: any = {
        name: body.name,
        flow_data: body.flow_data,
        empresa_id: profile.empresa_id
      }
      
      if (body.whatsapp_connection_id) {
        insertData.whatsapp_connection_id = body.whatsapp_connection_id
      }

      const { data, error } = await supabase
        .from('automations')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    console.log(`Flow ${body.id ? 'updated' : 'created'} successfully for user ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error saving automation flow:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})