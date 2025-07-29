import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversaData {
  id: string;
  contato_id: string;
  empresa_id: string;
  agente_id?: string;
  status: string;
  canal: string;
  prioridade: string;
  setor?: string;
}

interface AgenteInfo {
  id: string;
  nome: string;
  status: string;
  cargo: string;
  setor: string;
  updated_at: string;
  atendimentos_ativos: number;
  limite_atendimentos: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { conversa_id, nova_mensagem } = await req.json();

    if (!conversa_id) {
      return new Response(
        JSON.stringify({ error: 'conversa_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando distribuição para conversa: ${conversa_id}`);

    // Buscar dados da conversa
    const { data: conversa, error: conversaError } = await supabaseClient
      .from('conversas')
      .select('*')
      .eq('id', conversa_id)
      .single();

    if (conversaError || !conversa) {
      console.error('Erro ao buscar conversa:', conversaError);
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se a conversa já tem um agente e está ativa, não precisa redistribuir
    if (conversa.agente_id && ['ativo', 'em-atendimento'].includes(conversa.status)) {
      console.log('Conversa já tem agente ativo, verificando disponibilidade...');
      
      // Verificar se o agente atual ainda está disponível
      const { data: agenteAtual } = await supabaseClient
        .from('profiles')
        .select('id, nome, status, cargo, setor, updated_at')
        .eq('id', conversa.agente_id)
        .eq('empresa_id', conversa.empresa_id)
        .single();

      if (agenteAtual) {
        // Verificar se está online (atividade nos últimos 15 minutos)
        const ultimaAtividade = new Date(agenteAtual.updated_at);
        const agora = new Date();
        const limiteOnline = new Date(agora.getTime() - 15 * 60 * 1000);
        const isOnline = ultimaAtividade > limiteOnline && agenteAtual.status === 'online';

        if (isOnline) {
          // Verificar limite de atendimentos
          const { count: atendimentosAtivos } = await supabaseClient
            .from('conversas')
            .select('*', { count: 'exact', head: true })
            .eq('agente_id', agenteAtual.id)
            .in('status', ['ativo', 'em-atendimento']);

          const limite = agenteAtual.cargo === 'agente' ? 5 : 
                        agenteAtual.cargo === 'supervisor' ? 8 : 10;

          if ((atendimentosAtivos || 0) < limite) {
            console.log('Agente atual ainda disponível, mantendo atribuição');
            return new Response(
              JSON.stringify({ 
                success: true, 
                action: 'mantido',
                agente: agenteAtual.nome,
                message: 'Conversa mantida com agente atual'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.log('Agente atual no limite, redistribuindo...');
          }
        } else {
          console.log('Agente atual offline, redistribuindo...');
        }
      }
    }

    // Buscar agentes disponíveis
    const { data: agentes, error: agentesError } = await supabaseClient
      .from('profiles')
      .select('id, nome, status, cargo, setor, updated_at')
      .eq('empresa_id', conversa.empresa_id)
      .in('cargo', ['agente', 'supervisor', 'admin'])
      .eq('status', 'online');

    if (agentesError || !agentes || agentes.length === 0) {
      console.log('Nenhum agente disponível, colocando na fila');
      
      // Atualizar status para pendente
      await supabaseClient
        .from('conversas')
        .update({
          status: 'pendente',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'fila',
          message: 'Conversa colocada na fila - nenhum agente disponível'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar agentes realmente disponíveis
    const agentesDisponiveis: AgenteInfo[] = [];
    
    for (const agente of agentes) {
      // Verificar se está online (atividade nos últimos 15 minutos)
      const ultimaAtividade = new Date(agente.updated_at);
      const agora = new Date();
      const limiteOnline = new Date(agora.getTime() - 15 * 60 * 1000);
      const isOnline = ultimaAtividade > limiteOnline;

      if (!isOnline) continue;

      // Contar atendimentos ativos
      const { count: atendimentosAtivos } = await supabaseClient
        .from('conversas')
        .select('*', { count: 'exact', head: true })
        .eq('agente_id', agente.id)
        .in('status', ['ativo', 'em-atendimento']);

      const limite = agente.cargo === 'agente' ? 5 : 
                    agente.cargo === 'supervisor' ? 8 : 10;

      if ((atendimentosAtivos || 0) < limite) {
        agentesDisponiveis.push({
          ...agente,
          atendimentos_ativos: atendimentosAtivos || 0,
          limite_atendimentos: limite
        });
      }
    }

    if (agentesDisponiveis.length === 0) {
      console.log('Todos os agentes no limite, colocando na fila');
      
      await supabaseClient
        .from('conversas')
        .update({
          status: 'pendente',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'fila',
          message: 'Conversa colocada na fila - todos os agentes ocupados'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Priorizar por setor se especificado
    let agentesOrdenados = agentesDisponiveis;
    if (conversa.setor) {
      const agentesMesmoSetor = agentesDisponiveis.filter(a => a.setor === conversa.setor);
      const agentesOutrosSetores = agentesDisponiveis.filter(a => a.setor !== conversa.setor);
      agentesOrdenados = [...agentesMesmoSetor, ...agentesOutrosSetores];
    }

    // Ordenar por carga de trabalho (menor primeiro)
    agentesOrdenados.sort((a, b) => a.atendimentos_ativos - b.atendimentos_ativos);

    const agenteEscolhido = agentesOrdenados[0];

    // Atribuir conversa ao agente escolhido
    const { error: updateError } = await supabaseClient
      .from('conversas')
      .update({
        agente_id: agenteEscolhido.id,
        status: 'em-atendimento',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversa_id);

    if (updateError) {
      console.error('Erro ao atribuir conversa:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atribuir conversa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Conversa ${conversa_id} atribuída para ${agenteEscolhido.nome}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'atribuido',
        agente: agenteEscolhido.nome,
        agente_id: agenteEscolhido.id,
        message: `Conversa atribuída para ${agenteEscolhido.nome}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função auto-distribuir-conversas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});