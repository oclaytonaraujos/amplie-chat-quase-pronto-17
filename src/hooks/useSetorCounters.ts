import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export function useSetorCounters() {
  const atualizarContadoresSetor = useCallback(async (setorId: string) => {
    try {
      logger.info('Atualizando contadores do setor', {
        component: 'useSetorCounters',
        metadata: { setorId }
      });

      // Contar agentes ativos no setor
      const { data: agentesAtivos, error: agentesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('setor', setorId)
        .eq('status', 'online');

      if (agentesError) throw agentesError;

      // Contar atendimentos ativos no setor
      const { data: atendimentosAtivos, error: atendimentosError } = await supabase
        .from('conversas')
        .select('id')
        .eq('setor', setorId)
        .in('status', ['ativo', 'aguardando']);

      if (atendimentosError) throw atendimentosError;

      // Atualizar contadores na tabela setores
      const { error: updateError } = await supabase
        .from('setores')
        .update({
          agentes_ativos: agentesAtivos?.length || 0,
          atendimentos_ativos: atendimentosAtivos?.length || 0
        })
        .eq('id', setorId);

      if (updateError) throw updateError;

      logger.info('Contadores do setor atualizados', {
        component: 'useSetorCounters',
        metadata: {
          setorId,
          agentesAtivos: agentesAtivos?.length || 0,
          atendimentosAtivos: atendimentosAtivos?.length || 0
        }
      });
    } catch (error) {
      logger.error('Erro ao atualizar contadores do setor', {
        component: 'useSetorCounters',
        metadata: { setorId }
      }, error as Error);
    }
  }, []);

  const incrementarAtendimentos = useCallback(async (setorId: string) => {
    try {
      const { error } = await supabase.rpc('increment_setor_atendimentos', {
        setor_id: setorId
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao incrementar atendimentos do setor', {
        component: 'useSetorCounters',
        metadata: { setorId }
      }, error as Error);
    }
  }, []);

  const decrementarAtendimentos = useCallback(async (setorId: string) => {
    try {
      const { error } = await supabase.rpc('decrement_setor_atendimentos', {
        setor_id: setorId
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao decrementar atendimentos do setor', {
        component: 'useSetorCounters',
        metadata: { setorId }
      }, error as Error);
    }
  }, []);

  return {
    atualizarContadoresSetor,
    incrementarAtendimentos,
    decrementarAtendimentos
  };
}