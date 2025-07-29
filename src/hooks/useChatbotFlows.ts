
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ChatbotFlow {
  id?: string;
  empresa_id?: string;
  nome: string;
  mensagem_inicial: string;
  status: 'ativo' | 'inativo';
  is_default?: boolean;
  trigger_conditions?: any;
  activation_mode?: 'manual' | 'automatic' | 'scheduled';
  priority?: number;
  n8n_webhook_url?: string;
  auto_start_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChatbotNode {
  id?: string;
  flow_id?: string;
  node_id: string;
  nome: string;
  mensagem: string;
  tipo_resposta: 'opcoes' | 'texto-livre' | 'anexo' | 'apenas-mensagem';
  ordem?: number;
}

export interface ChatbotOption {
  id?: string;
  node_id?: string;
  option_id: string;
  texto: string;
  proxima_acao: 'proximo-no' | 'transferir' | 'finalizar' | 'mensagem-finalizar';
  proximo_node_id?: string;
  setor_transferencia?: string;
  mensagem_final?: string;
  ordem?: number;
}

export interface ChatbotFlowComplete extends ChatbotFlow {
  nodes: (ChatbotNode & { options: ChatbotOption[] })[];
}

export function useChatbotFlows() {
  const { user } = useAuth();
  const [flows, setFlows] = useState<ChatbotFlow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlows = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_flows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for the data from Supabase
      const typedFlows = (data || []).map(flow => ({
        ...flow,
        status: flow.status as 'ativo' | 'inativo',
        activation_mode: flow.activation_mode as 'manual' | 'automatic' | 'scheduled' | undefined
      }));
      
      setFlows(typedFlows);
    } catch (error) {
      console.error('Erro ao buscar fluxos:', error);
      toast.error('Erro ao carregar fluxos de chatbot');
    } finally {
      setLoading(false);
    }
  };

  const getFlowById = async (flowId: string): Promise<ChatbotFlowComplete | null> => {
    try {
      // Buscar fluxo
      const { data: flow, error: flowError } = await supabase
        .from('chatbot_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError) throw flowError;

      // Buscar nós
      const { data: nodes, error: nodesError } = await supabase
        .from('chatbot_nodes')
        .select('*')
        .eq('flow_id', flowId)
        .order('ordem', { ascending: true });

      if (nodesError) throw nodesError;

      // Buscar opções para cada nó
      const nodesWithOptions = await Promise.all(
        (nodes || []).map(async (node) => {
          const { data: options, error: optionsError } = await supabase
            .from('chatbot_options')
            .select('*')
            .eq('node_id', node.id)
            .order('ordem', { ascending: true });

          if (optionsError) throw optionsError;

          return {
            ...node,
            tipo_resposta: node.tipo_resposta as 'opcoes' | 'texto-livre' | 'anexo' | 'apenas-mensagem',
            options: (options || []).map(option => ({
              ...option,
              proxima_acao: option.proxima_acao as 'proximo-no' | 'transferir' | 'finalizar' | 'mensagem-finalizar'
            }))
          };
        })
      );

      return {
        ...flow,
        status: flow.status as 'ativo' | 'inativo',
        activation_mode: flow.activation_mode as 'manual' | 'automatic' | 'scheduled' | undefined,
        nodes: nodesWithOptions
      };
    } catch (error) {
      console.error('Erro ao buscar fluxo:', error);
      toast.error('Erro ao carregar fluxo');
      return null;
    }
  };

  const saveFlow = async (flowData: {
    nome: string;
    mensagem_inicial: string;
    nos: Array<{
      id: string;
      nome: string;
      mensagem: string;
      tipoResposta: string;
      opcoes: Array<{
        id: string;
        texto: string;
        proximaAcao: string;
        proximoNoId?: string;
        setorTransferencia?: string;
        mensagemFinal?: string;
      }>;
    }>;
  }, flowId?: string) => {
    if (!user) return null;

    try {
      setLoading(true);

      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada');
      }

      let savedFlowId = flowId;

      if (flowId) {
        // Atualizar fluxo existente
        const { error: updateError } = await supabase
          .from('chatbot_flows')
          .update({
            nome: flowData.nome,
            mensagem_inicial: flowData.mensagem_inicial,
            updated_at: new Date().toISOString()
          })
          .eq('id', flowId);

        if (updateError) throw updateError;

        // Deletar nós e opções existentes
        await supabase
          .from('chatbot_nodes')
          .delete()
          .eq('flow_id', flowId);

      } else {
        // Criar novo fluxo
        const { data: newFlow, error: insertError } = await supabase
          .from('chatbot_flows')
          .insert({
            empresa_id: profile.empresa_id,
            nome: flowData.nome,
            mensagem_inicial: flowData.mensagem_inicial,
            status: 'inativo'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        savedFlowId = newFlow.id;
      }

      // Inserir nós
      for (let i = 0; i < flowData.nos.length; i++) {
        const no = flowData.nos[i];
        
        const { data: savedNode, error: nodeError } = await supabase
          .from('chatbot_nodes')
          .insert({
            flow_id: savedFlowId,
            node_id: no.id,
            nome: no.nome,
            mensagem: no.mensagem,
            tipo_resposta: no.tipoResposta,
            ordem: i
          })
          .select()
          .single();

        if (nodeError) throw nodeError;

        // Inserir opções do nó
        if (no.opcoes && no.opcoes.length > 0) {
          const opcoes = no.opcoes.map((opcao, opcaoIndex) => ({
            node_id: savedNode.id,
            option_id: opcao.id,
            texto: opcao.texto,
            proxima_acao: opcao.proximaAcao,
            proximo_node_id: opcao.proximoNoId,
            setor_transferencia: opcao.setorTransferencia,
            mensagem_final: opcao.mensagemFinal,
            ordem: opcaoIndex
          }));

          const { error: optionsError } = await supabase
            .from('chatbot_options')
            .insert(opcoes);

          if (optionsError) throw optionsError;
        }
      }

      toast.success(flowId ? 'Fluxo atualizado com sucesso!' : 'Fluxo criado com sucesso!');
      await fetchFlows();
      return savedFlowId;

    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      toast.error('Erro ao salvar fluxo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteFlow = async (flowId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('chatbot_flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;

      toast.success('Fluxo excluído com sucesso!');
      await fetchFlows();
    } catch (error) {
      console.error('Erro ao excluir fluxo:', error);
      toast.error('Erro ao excluir fluxo');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlowStatus = async (flowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
      
      const { error } = await supabase
        .from('chatbot_flows')
        .update({ 
          status: newStatus,
          is_default: newStatus === 'ativo' ? true : false 
        })
        .eq('id', flowId);

      if (error) throw error;

      toast.success(`Fluxo ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      await fetchFlows();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do fluxo');
    }
  };

  const updateFlowTriggers = async (flowId: string, triggerData: {
    trigger_conditions: any;
    activation_mode: 'manual' | 'automatic' | 'scheduled';
    priority: number;
    n8n_webhook_url?: string;
    auto_start_enabled: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .update({
          ...triggerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (error) throw error;

      toast.success('Configuração de gatilhos atualizada com sucesso!');
      await fetchFlows();
    } catch (error) {
      console.error('Erro ao atualizar gatilhos:', error);
      toast.error('Erro ao salvar configuração de gatilhos');
    }
  };

  const duplicateFlow = async (flowId: string) => {
    try {
      setLoading(true);
      const originalFlow = await getFlowById(flowId);
      
      if (!originalFlow) {
        throw new Error('Fluxo não encontrado');
      }

      // Preparar dados para duplicação
      const duplicatedData = {
        nome: `${originalFlow.nome} (Cópia)`,
        mensagem_inicial: originalFlow.mensagem_inicial,
        nos: originalFlow.nodes.map(node => ({
          id: node.node_id,
          nome: node.nome,
          mensagem: node.mensagem,
          tipoResposta: node.tipo_resposta,
          opcoes: node.options.map(option => ({
            id: option.option_id,
            texto: option.texto,
            proximaAcao: option.proxima_acao,
            proximoNoId: option.proximo_node_id,
            setorTransferencia: option.setor_transferencia,
            mensagemFinal: option.mensagem_final
          }))
        }))
      };

      await saveFlow(duplicatedData);
      toast.success('Fluxo duplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao duplicar fluxo:', error);
      toast.error('Erro ao duplicar fluxo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFlows();
    }
  }, [user]);

  return {
    flows,
    loading,
    fetchFlows,
    getFlowById,
    saveFlow,
    deleteFlow,
    toggleFlowStatus,
    duplicateFlow,
    updateFlowTriggers
  };
}
