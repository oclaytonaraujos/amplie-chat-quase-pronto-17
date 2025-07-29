import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EvolutionApiConfig {
  id?: string;
  server_url: string;
  api_key: string;
  webhook_base_url?: string;
  ativo: boolean;
}

interface EvolutionApiContextType {
  config: EvolutionApiConfig | null;
  isLoading: boolean;
  isConfigured: boolean;
  updateConfig: (newConfig: Omit<EvolutionApiConfig, 'id' | 'ativo'>) => Promise<boolean>;
  loadConfig: () => Promise<void>;
}

const EvolutionApiContext = createContext<EvolutionApiContextType | undefined>(undefined);

interface EvolutionApiProviderProps {
  children: ReactNode;
}

export function EvolutionApiProvider({ children }: EvolutionApiProviderProps) {
  const [config, setConfig] = useState<EvolutionApiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      console.log('Carregando configuração global da Evolution API...');
      
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao carregar configuração:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const configData = data[0];
        console.log('Configuração carregada:', configData);
        
        setConfig({
          id: configData.id,
          server_url: configData.server_url,
          api_key: configData.api_key,
          webhook_base_url: configData.webhook_base_url,
          ativo: configData.ativo
        });
      } else {
        console.log('Nenhuma configuração ativa encontrada');
        setConfig(null);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração global:', error);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig: Omit<EvolutionApiConfig, 'id' | 'ativo'>): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Atualizando configuração global:', newConfig);

      // Testar conexão primeiro
      const testResponse = await fetch(`${newConfig.server_url}/manager/findInstance`, {
        method: 'GET',
        headers: {
          'apikey': newConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Não foi possível conectar com a Evolution API. Verifique a URL e API Key.');
      }

      // Desativar configurações existentes
      await supabase
        .from('evolution_api_global_config')
        .update({ ativo: false })
        .eq('ativo', true);

      // Inserir nova configuração
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .insert({
          server_url: newConfig.server_url,
          api_key: newConfig.api_key,
          webhook_base_url: newConfig.webhook_base_url,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar configuração:', error);
        throw error;
      }

      console.log('Configuração salva com sucesso:', data);

      // Atualizar estado local
      setConfig({
        id: data.id,
        server_url: data.server_url,
        api_key: data.api_key,
        webhook_base_url: data.webhook_base_url,
        ativo: true
      });

      toast({
        title: "Configuração salva",
        description: "Evolution API configurada com sucesso e disponível em todo o sistema!",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: "Erro na configuração",
        description: error.message || "Não foi possível conectar com a Evolution API",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar configuração ao inicializar
  useEffect(() => {
    loadConfig();
  }, []);

  const isConfigured = Boolean(config !== null && config?.server_url && config?.api_key);

  const value: EvolutionApiContextType = {
    config,
    isLoading,
    isConfigured,
    updateConfig,
    loadConfig
  };

  return (
    <EvolutionApiContext.Provider value={value}>
      {children}
    </EvolutionApiContext.Provider>
  );
}

export function useEvolutionApiConfig() {
  const context = useContext(EvolutionApiContext);
  if (context === undefined) {
    throw new Error('useEvolutionApiConfig must be used within an EvolutionApiProvider');
  }
  return context;
}