import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InstanciaGlobal {
  id: string;
  instance_name: string;
  status: string;
  numero?: string;
  ativo: boolean;
  empresa_id?: string;
  empresa_nome?: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface InstanciaEmpresa extends InstanciaGlobal {
  webhook_status?: 'ativo' | 'inativo' | 'erro';
}

export function useAllInstances() {
  const [instances, setInstances] = useState<InstanciaGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const loadInstances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: instancesData, error: instancesError } = await supabase
        .from('evolution_api_config')
        .select(`
          *,
          empresas:empresa_id (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;

      const formattedInstances: InstanciaGlobal[] = (instancesData || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        status: 'disconnected', // Será atualizado via Evolution API
        numero: instance.numero,
        ativo: instance.ativo,
        empresa_id: instance.empresa_id,
        empresa_nome: instance.empresas?.nome,
        descricao: instance.descricao,
        created_at: instance.created_at,
        updated_at: instance.updated_at
      }));

      setInstances(formattedInstances);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      setError(error.message || 'Erro ao carregar instâncias');
      toast({
        title: "Erro",
        description: "Erro ao carregar instâncias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar instâncias por empresa (para usar no painel das empresas)
  const getInstancesByCompany = (empresaId: string): InstanciaGlobal[] => {
    return instances.filter(instance => instance.empresa_id === empresaId);
  };

  // Obter estatísticas
  const getStats = () => {
    const total = instances.length;
    const connected = instances.filter(i => i.status === 'open' || i.status === 'connected').length;
    const active = instances.filter(i => i.ativo).length;
    
    return {
      total,
      connected,
      disconnected: total - connected,
      active,
      inactive: total - active
    };
  };

  // Sincronizar status de uma instância específica
  const syncInstanceStatus = async (instanceName: string, newStatus: string) => {
    try {
      // Para evolution_api_config, não temos campo status na tabela
      // O status é sempre obtido via API da Evolution
      // Apenas atualizamos o timestamp para mostrar atividade

      // Atualizar estado local
      setInstances(prev => prev.map(instance => 
        instance.instance_name === instanceName 
          ? { ...instance, status: newStatus }
          : instance
      ));
    } catch (error: any) {
      console.error('Erro ao sincronizar status:', error);
    }
  };

  // Remover instância da lista local
  const removeInstanceFromList = (instanceName: string) => {
    setInstances(prev => prev.filter(instance => instance.instance_name !== instanceName));
  };

  // Adicionar nova instância à lista local
  const addInstanceToList = (newInstance: InstanciaGlobal) => {
    setInstances(prev => [newInstance, ...prev]);
  };

  useEffect(() => {
    loadInstances();
  }, []);

  return {
    instances,
    loading,
    error,
    loadInstances,
    getInstancesByCompany,
    getStats,
    syncInstanceStatus,
    removeInstanceFromList,
    addInstanceToList
  };
}