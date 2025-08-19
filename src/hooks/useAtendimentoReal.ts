// Simplified version without Evolution API - now uses n8n webhooks
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useAtendimentoReal() {
  const [loading, setLoading] = useState(false);
  const [conversas, setConversas] = useState([]);
  const { toast } = useToast();

  // Fetch conversas from Supabase
  const fetchConversas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos:contato_id (
            id,
            nome,
            telefone,
            email
          ),
          profiles:agente_id (
            id,
            nome,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversas(data || []);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load conversas on mount
  useEffect(() => {
    fetchConversas();
  }, [fetchConversas]);

  const atualizarStatusConversa = useCallback(async (conversaId: string, novoStatus: string, resumo?: string) => {
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

      // Update local state
      setConversas(prev => prev.map(conv => 
        conv.id === conversaId ? { ...conv, status: novoStatus, resumo } : conv
      ));

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
    }
  }, [toast]);

  return {
    conversas,
    atualizarStatusConversa,
    loading,
    refetch: fetchConversas
  };
}