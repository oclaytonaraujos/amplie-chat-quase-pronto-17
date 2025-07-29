import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionApiSync } from '@/hooks/useEvolutionApiSync';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, RefreshCw, Wifi, QrCode } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export function EvolutionApiTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();
  const { syncInstanceStatus } = useEvolutionApiSync();

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests: TestResult[] = [];

    // Teste 1: Verificar configuração global
    tests.push({ test: 'Configuração Global', status: 'pending', message: 'Verificando configuração...' });
    setResults([...tests]);

    try {
      const { data: globalConfig, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error || !globalConfig) {
        tests[0] = { test: 'Configuração Global', status: 'error', message: 'Configuração não encontrada' };
      } else {
        tests[0] = { 
          test: 'Configuração Global', 
          status: 'success', 
          message: 'Configuração encontrada',
          details: { server_url: globalConfig.server_url }
        };

        // Teste 2: Conectividade com Evolution API
        tests.push({ test: 'Conectividade API', status: 'pending', message: 'Testando conexão...' });
        setResults([...tests]);

        try {
          const response = await fetch(`${globalConfig.server_url}/manager/findInstance`, {
            method: 'GET',
            headers: {
              'apikey': globalConfig.api_key,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            tests[1] = { 
              test: 'Conectividade API', 
              status: 'success', 
              message: 'Conexão bem-sucedida',
              details: data
            };

            // Teste 3: Verificar instâncias
            tests.push({ test: 'Instâncias', status: 'pending', message: 'Listando instâncias...' });
            setResults([...tests]);

            try {
              const instancesResponse = await fetch(`${globalConfig.server_url}/instance/fetchInstances`, {
                method: 'GET',
                headers: {
                  'apikey': globalConfig.api_key,
                  'Content-Type': 'application/json'
                }
              });

              if (instancesResponse.ok) {
                const instancesData = await instancesResponse.json();
                tests[2] = { 
                  test: 'Instâncias', 
                  status: 'success', 
                  message: `${instancesData.length || 0} instâncias encontradas`,
                  details: instancesData
                };

                // Teste 4: Verificar instâncias no banco
                tests.push({ test: 'Sincronização', status: 'pending', message: 'Verificando sincronização...' });
                setResults([...tests]);

                const { data: dbInstances } = await supabase
                  .from('evolution_api_config')
                  .select('*')
                  .eq('ativo', true);

                const syncIssues = [];
                if (dbInstances) {
                  for (const dbInstance of dbInstances) {
                    const apiInstance = instancesData.find((api: any) => api.instance.instanceName === dbInstance.instance_name);
                    if (!apiInstance) {
                      syncIssues.push(`Instância ${dbInstance.instance_name} não encontrada na API`);
                    }
                  }
                }

                tests[3] = { 
                  test: 'Sincronização', 
                  status: syncIssues.length > 0 ? 'error' : 'success', 
                  message: syncIssues.length > 0 ? `${syncIssues.length} problemas encontrados` : 'Instâncias sincronizadas',
                  details: syncIssues
                };

              } else {
                tests[2] = { test: 'Instâncias', status: 'error', message: 'Erro ao listar instâncias' };
              }
            } catch (error) {
              tests[2] = { test: 'Instâncias', status: 'error', message: 'Erro na comunicação' };
            }

          } else {
            tests[1] = { test: 'Conectividade API', status: 'error', message: 'Conexão falhou' };
          }
        } catch (error) {
          tests[1] = { test: 'Conectividade API', status: 'error', message: 'Erro de conexão' };
        }
      }
    } catch (error) {
      tests[0] = { test: 'Configuração Global', status: 'error', message: 'Erro ao verificar configuração' };
    }

    setResults([...tests]);
    setTesting(false);

    // Toast com resultado geral
    const hasErrors = tests.some(t => t.status === 'error');
    toast({
      title: hasErrors ? "Testes concluídos com erros" : "Todos os testes passaram",
      description: hasErrors ? "Verifique os resultados abaixo" : "Evolution API está funcionando corretamente",
      variant: hasErrors ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Teste de Conectividade Evolution API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 mr-2" />
              Executar Testes
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.test}</span>
                    <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status === 'success' ? 'Sucesso' : result.status === 'error' ? 'Erro' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                        Ver detalhes
                      </summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Este teste verifica a conectividade com a Evolution API, lista as instâncias disponíveis e 
            verifica se estão sincronizadas com o banco de dados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}