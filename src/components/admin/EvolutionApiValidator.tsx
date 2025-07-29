
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string;
}

interface EvolutionApiValidatorProps {
  onValidationChange?: (isValid: boolean) => void;
}

export function EvolutionApiValidator({ onValidationChange }: EvolutionApiValidatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [validationResults, setValidationResults] = useState<{
    config: ValidationResult;
    connection: ValidationResult;
    webhook: ValidationResult;
  }>({
    config: { isValid: false, message: 'Não validado' },
    connection: { isValid: false, message: 'Não validado' },
    webhook: { isValid: false, message: 'Não validado' }
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateConfiguration = async () => {
    if (!user) return;

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

      // Validar configuração global
      const { data: globalConfig, error: globalConfigError } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      // Validar instâncias da empresa
      const { data: instances, error: instancesError } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true);

      const configResult: ValidationResult = {
        isValid: !!globalConfig && !globalConfigError,
        message: globalConfig ? 'Configuração global encontrada' : 'Configuração global não encontrada',
        details: globalConfigError?.message
      };

      // Validar conexão (instâncias conectadas)
      const connectedInstances = instances?.filter(i => i.status === 'connected') || [];
      const connectionResult: ValidationResult = {
        isValid: connectedInstances.length > 0,
        message: connectedInstances.length > 0 ? `${connectedInstances.length} instância(s) conectada(s)` : 'Nenhuma instância conectada',
        details: connectedInstances.length > 0 ? `Instâncias: ${connectedInstances.map(i => i.nome).join(', ')}` : undefined
      };

      // Validar webhook
      const webhookResult: ValidationResult = {
        isValid: !!globalConfig?.webhook_base_url,
        message: globalConfig?.webhook_base_url ? 'Webhook configurado' : 'Webhook não configurado',
        details: globalConfig?.webhook_base_url
      };

      setValidationResults({
        config: configResult,
        connection: connectionResult,
        webhook: webhookResult
      });

      const overallValid = configResult.isValid && connectionResult.isValid && webhookResult.isValid;
      onValidationChange?.(overallValid);

    } catch (error) {
      console.error('Erro na validação:', error);
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar a configuração da Evolution API.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateConfiguration();
  }, [user]);

  const getStatusIcon = (result: ValidationResult) => {
    if (result.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (result.message === 'Não validado') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (result: ValidationResult) => {
    if (result.isValid) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Válido</Badge>;
    } else if (result.message === 'Não validado') {
      return <Badge variant="secondary">Pendente</Badge>;
    } else {
      return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Validação da Evolution API</span>
          <Button
            variant="outline"
            size="sm"
            onClick={validateConfiguration}
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Validar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuração */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(validationResults.config)}
            <div>
              <p className="font-medium">Configuração</p>
              <p className="text-sm text-gray-600">{validationResults.config.message}</p>
              {validationResults.config.details && (
                <p className="text-xs text-gray-500">{validationResults.config.details}</p>
              )}
            </div>
          </div>
          {getStatusBadge(validationResults.config)}
        </div>

        {/* Conexão */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(validationResults.connection)}
            <div>
              <p className="font-medium">Conexão</p>
              <p className="text-sm text-gray-600">{validationResults.connection.message}</p>
              {validationResults.connection.details && (
                <p className="text-xs text-gray-500">{validationResults.connection.details}</p>
              )}
            </div>
          </div>
          {getStatusBadge(validationResults.connection)}
        </div>

        {/* Webhook */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(validationResults.webhook)}
            <div>
              <p className="font-medium">Webhook</p>
              <p className="text-sm text-gray-600">{validationResults.webhook.message}</p>
              {validationResults.webhook.details && (
                <p className="text-xs text-gray-500 break-all">{validationResults.webhook.details}</p>
              )}
            </div>
          </div>
          {getStatusBadge(validationResults.webhook)}
        </div>
      </CardContent>
    </Card>
  );
}
