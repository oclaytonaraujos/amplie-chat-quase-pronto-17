import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AgenteInfo {
  id: string;
  nome: string;
  status: string;
  atendimentos_ativos: number;
  limite_atendimentos: number;
  setor: string;
  is_online: boolean;
  last_activity: string | null;
}

interface ConversaDistribuicao {
  id: string;
  contato_id: string;
  empresa_id: string;
  agente_preferido_id?: string;
  canal: string;
  prioridade: string;
  setor?: string;
}

export function useAtendimentoDistribution() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agentesDisponiveis, setAgentesDisponiveis] = useState<AgenteInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar agentes disponíveis para distribuição
  const buscarAgentesDisponiveis = async (empresaId: string, setorPreferido?: string) => {
    try {
      setLoading(true);

      // Buscar todos os agentes da empresa que podem atender
      const { data: agentes, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          status,
          setor,
          cargo,
          created_at,
          updated_at
        `)
        .eq('empresa_id', empresaId)
        .in('cargo', ['agente', 'supervisor', 'admin'])
        .eq('status', 'online');

      if (error) throw error;

      if (!agentes || agentes.length === 0) {
        return [];
      }

      // Para cada agente, contar atendimentos ativos
      const agentesComContadores = await Promise.all(
        agentes.map(async (agente) => {
          const { count: atendimentosAtivos } = await supabase
            .from('conversas')
            .select('*', { count: 'exact', head: true })
            .eq('agente_id', agente.id)
            .in('status', ['ativo', 'em-atendimento']);

          // Verificar última atividade (últimos 15 minutos = online)
          const ultimaAtividade = agente.updated_at;
          const agora = new Date();
          const limiteOnline = new Date(agora.getTime() - 15 * 60 * 1000); // 15 minutos atrás
          const isOnline = ultimaAtividade ? new Date(ultimaAtividade) > limiteOnline : false;

          return {
            id: agente.id,
            nome: agente.nome,
            status: agente.status,
            atendimentos_ativos: atendimentosAtivos || 0,
            limite_atendimentos: agente.cargo === 'agente' ? 5 : agente.cargo === 'supervisor' ? 8 : 10,
            setor: agente.setor || 'Geral',
            is_online: isOnline && agente.status === 'online',
            last_activity: ultimaAtividade
          };
        })
      );

      // Filtrar agentes que podem receber novos atendimentos
      const agentesDisponiveis = agentesComContadores.filter(agente => 
        agente.is_online && 
        agente.atendimentos_ativos < agente.limite_atendimentos
      );

      // Priorizar por setor se especificado
      let agentesOrdenados = agentesDisponiveis;
      if (setorPreferido) {
        const agentesMesmoSetor = agentesDisponiveis.filter(a => a.setor === setorPreferido);
        const agentesOutrosSetores = agentesDisponiveis.filter(a => a.setor !== setorPreferido);
        agentesOrdenados = [...agentesMesmoSetor, ...agentesOutrosSetores];
      }

      // Ordenar por número de atendimentos (menor carga primeiro)
      agentesOrdenados.sort((a, b) => a.atendimentos_ativos - b.atendimentos_ativos);

      setAgentesDisponiveis(agentesOrdenados);
      return agentesOrdenados;
    } catch (error) {
      console.error('Erro ao buscar agentes disponíveis:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Distribuir conversa para o melhor agente disponível
  const distribuirConversa = async (conversa: ConversaDistribuicao): Promise<string | null> => {
    try {
      console.log('Iniciando distribuição da conversa:', conversa.id);

      // Primeiro, verificar se o agente preferido está disponível
      if (conversa.agente_preferido_id) {
        const { data: agentePreferido, error } = await supabase
          .from('profiles')
          .select('id, nome, status, setor, cargo, updated_at')
          .eq('id', conversa.agente_preferido_id)
          .eq('empresa_id', conversa.empresa_id)
          .single();

        if (!error && agentePreferido) {
          // Verificar se está online
          const ultimaAtividade = agentePreferido.updated_at;
          const agora = new Date();
          const limiteOnline = new Date(agora.getTime() - 15 * 60 * 1000);
          const isOnline = ultimaAtividade ? new Date(ultimaAtividade) > limiteOnline : false;

          if (isOnline && agentePreferido.status === 'online') {
            // Verificar limite de atendimentos
            const { count: atendimentosAtivos } = await supabase
              .from('conversas')
              .select('*', { count: 'exact', head: true })
              .eq('agente_id', agentePreferido.id)
              .in('status', ['ativo', 'em-atendimento']);

            const limite = agentePreferido.cargo === 'agente' ? 5 : 
                          agentePreferido.cargo === 'supervisor' ? 8 : 10;

            if ((atendimentosAtivos || 0) < limite) {
              // Agente preferido disponível, atribuir conversa
              const { error: updateError } = await supabase
                .from('conversas')
                .update({
                  agente_id: agentePreferido.id,
                  status: 'em-atendimento',
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversa.id);

              if (!updateError) {
                console.log('Conversa atribuída ao agente preferido:', agentePreferido.nome);
                return agentePreferido.id;
              }
            } else {
              console.log('Agente preferido está no limite de atendimentos');
            }
          } else {
            console.log('Agente preferido não está online');
          }
        }
      }

      // Agente preferido não disponível, buscar outros agentes
      const agentesDisponiveis = await buscarAgentesDisponiveis(conversa.empresa_id, conversa.setor);

      if (agentesDisponiveis.length === 0) {
        console.log('Nenhum agente disponível, conversa ficará na fila');
        
        // Atualizar conversa para status pendente
        await supabase
          .from('conversas')
          .update({
            status: 'pendente',
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa.id);

        toast({
          title: "Conversa na fila",
          description: "Nenhum agente disponível no momento. A conversa foi colocada na fila.",
          variant: "default",
        });

        return null;
      }

      // Selecionar o primeiro agente disponível (já ordenado por carga)
      const agenteEscolhido = agentesDisponiveis[0];

      // Atribuir conversa ao agente escolhido
      const { error: updateError } = await supabase
        .from('conversas')
        .update({
          agente_id: agenteEscolhido.id,
          status: 'em-atendimento',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa.id);

      if (updateError) {
        console.error('Erro ao atribuir conversa:', updateError);
        return null;
      }

      console.log('Conversa distribuída para:', agenteEscolhido.nome);
      
      toast({
        title: "Conversa distribuída",
        description: `Conversa atribuída para ${agenteEscolhido.nome}`,
      });

      return agenteEscolhido.id;
    } catch (error) {
      console.error('Erro ao distribuir conversa:', error);
      toast({
        title: "Erro na distribuição",
        description: "Erro ao distribuir conversa para agente",
        variant: "destructive",
      });
      return null;
    }
  };

  // Processar fila de conversas pendentes
  const processarFilaConversas = async () => {
    if (!user) return;

    try {
      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) return;

      // Buscar conversas pendentes
      const { data: conversasPendentes, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error || !conversasPendentes) return;

      console.log(`Processando ${conversasPendentes.length} conversas pendentes`);

      // Distribuir cada conversa pendente
      for (const conversa of conversasPendentes) {
        await distribuirConversa({
          id: conversa.id,
          contato_id: conversa.contato_id,
          empresa_id: conversa.empresa_id,
          agente_preferido_id: conversa.agente_id,
          canal: conversa.canal,
          prioridade: conversa.prioridade,
          setor: conversa.setor
        });

        // Aguardar um pouco entre distribuições
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Erro ao processar fila:', error);
    }
  };

  // Verificar periodicamente se há conversas para distribuir
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      processarFilaConversas();
    }, 30000); // A cada 30 segundos

    // Executar uma vez imediatamente
    processarFilaConversas();

    return () => clearInterval(interval);
  }, [user]);

  return {
    agentesDisponiveis,
    loading,
    buscarAgentesDisponiveis,
    distribuirConversa,
    processarFilaConversas
  };
}