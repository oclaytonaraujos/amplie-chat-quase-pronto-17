
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationState {
  isConfigured: boolean;
  isConnected: boolean;
  hasWebhook: boolean;
  instanceName?: string;
  error?: string;
}

export function useEvolutionApiValidation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [validationState, setValidationState] = useState<ValidationState>({
    isConfigured: false,
    isConnected: false,
    hasWebhook: false
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateConfiguration = useCallback(async () => {
    if (!user) {
      setValidationState({
        isConfigured: false,
        isConnected: false,
        hasWebhook: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // Buscar configuração da empresa
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Usuário não está associado a uma empresa');
      }

      // Verificar configuração global da Evolution API
      const { data: globalConfig, error: globalConfigError } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (globalConfigError && globalConfigError.code !== 'PGRST116') {
        throw globalConfigError;
      }

      // Verificar se há instâncias Evolution API ativas para a empresa
      const { data: instances, error: instancesError } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true);

      if (instancesError && instancesError.code !== 'PGRST116') {
        throw instancesError;
      }

      const isConfigured = !!globalConfig;
      const hasConnectedInstance = instances?.some(i => i.status === 'open') || false;
      const hasWebhook = !!globalConfig?.webhook_base_url;

      setValidationState({
        isConfigured,
        isConnected: hasConnectedInstance,
        hasWebhook,
        instanceName: instances?.[0]?.instance_name,
        error: undefined
      });

    } catch (error) {
      console.error('Erro na validação da Evolution API:', error);
      setValidationState({
        isConfigured: false,
        isConnected: false,
        hasWebhook: false,
        error: (error as Error).message
      });
    } finally {
      setIsValidating(false);
    }
  }, [user]);

  const isValid = validationState.isConfigured && validationState.isConnected && validationState.hasWebhook;

  useEffect(() => {
    validateConfiguration();
  }, [validateConfiguration]);

  return {
    ...validationState,
    isValid,
    isValidating,
    refresh: validateConfiguration
  };
}
