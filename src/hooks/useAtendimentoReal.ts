// Simplified version without Evolution API - now uses n8n webhooks
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useAtendimentoReal() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const atualizarStatusConversa = useCallback(async (conversaId: string, novoStatus: string, resumo?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('conversas')
        .update({ 
          status: novoStatus,
          resumo: resumo,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversaId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Conversa ${novoStatus === 'finalizado' ? 'finalizada' : 'atualizada'} com sucesso`,
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    atualizarStatusConversa,
    loading
  };
}