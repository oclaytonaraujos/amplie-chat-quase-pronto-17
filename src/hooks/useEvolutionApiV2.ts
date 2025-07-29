import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { logger } from '@/utils/logger';

interface EvolutionApiStatus {
  state: 'connected' | 'disconnected' | 'connecting' | 'qr_scanning' | 'validating_connection' | 'error';
  connected: boolean;
  instanceStatus: string;
  lastCheck: Date;
  qrActive?: boolean;
}

interface EvolutionApiConfig {
  id: string;
  instance_name: string;
  status: string;
  qr_code?: string;
  numero?: string;
  ativo: boolean;
  last_connected_at?: string;
}

export const useEvolutionApiV2 = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<EvolutionApiStatus>({
    state: 'disconnected',
    connected: false,
    instanceStatus: 'disconnected',
    lastCheck: new Date()
  });
  const [config, setConfig] = useState<EvolutionApiConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar configuração global da Evolution API
  const loadGlobalConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configuração global:', error);
        throw error;
      }
      
      setGlobalConfig(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar configuração global:', error);
      logger.error('Erro ao carregar configuração global', { component: 'useEvolutionApiV2' }, error as Error);
      return null;
    }
  }, []);

  // Buscar configuração da instância da empresa
  const loadInstanceConfig = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      if (!profile?.empresa_id) return null;

      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar configuração da instância:', error);
        throw error;
      }
      
      setConfig(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar configuração da instância:', error);
      logger.error('Erro ao carregar configuração da instância', { component: 'useEvolutionApiV2' }, error as Error);
      return null;
    }
  }, [user]);

  // Verificar status real da instância via API
  const checkInstanceStatus = useCallback(async (instanceName: string) => {
    if (!globalConfig) return 'disconnected';

    try {
      console.log('🔍 Verificando status da instância:', instanceName);
      const url = `${globalConfig.server_url}/instance/fetchInstances?instanceName=${instanceName}`;
      console.log('📡 URL da API:', url);
      
      const response = await fetch(url, {
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Status da resposta:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Resposta completa da API:', data);
      
      // Verificar se é um array de instâncias
      let instanceData;
      if (Array.isArray(data)) {
        instanceData = data.find(inst => inst.name === instanceName);
      } else {
        instanceData = data;
      }
      
      // A Evolution API retorna connectionStatus, não state
      const status = instanceData?.connectionStatus || instanceData?.instance?.state || 'disconnected';
      console.log('✅ Status extraído:', status);
      console.log('📊 Dados da instância:', instanceData);
      
      return status;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      logger.error('Erro ao verificar status da instância', { component: 'useEvolutionApiV2' }, error as Error);
      return 'error';
    }
  }, [globalConfig]);

  // Função para obter dados completos da instância
  const getInstanceData = useCallback(async (instanceName: string) => {
    if (!globalConfig) return null;

    try {
      const url = `${globalConfig.server_url}/instance/fetchInstances?instanceName=${instanceName}`;
      const response = await fetch(url, {
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return Array.isArray(data) ? data.find(inst => inst.name === instanceName) : data;
    } catch (error) {
      console.error('❌ Erro ao obter dados da instância:', error);
      return null;
    }
  }, [globalConfig]);

  // Atualizar status da instância
  const updateInstanceStatus = useCallback(async () => {
    if (!config || !globalConfig) return;

    setLoading(true);
    try {
      const apiStatus = await checkInstanceStatus(config.instance_name);
      
      // Extrair número do WhatsApp se conectado
      const instanceData = await getInstanceData(config.instance_name);
      const whatsappNumber = instanceData?.ownerJid?.split('@')[0];
      
      // Atualizar no banco de dados
      await supabase
        .from('evolution_api_config')
        .update({ 
          status: apiStatus,
          numero: whatsappNumber || config.numero,
          last_connected_at: apiStatus === 'open' ? new Date().toISOString() : config.last_connected_at
        })
        .eq('id', config.id);

      // Atualizar estado local
      setStatus({
        state: apiStatus === 'open' ? 'connected' : apiStatus === 'connecting' ? 'connecting' : 'disconnected',
        connected: apiStatus === 'open',
        instanceStatus: apiStatus,
        lastCheck: new Date()
      });

      setConfig(prev => prev ? { ...prev, status: apiStatus } : null);
      setError(null);

    } catch (error) {
      setError((error as Error).message);
      setStatus(prev => ({ ...prev, state: 'error', lastCheck: new Date() }));
    } finally {
      setLoading(false);
    }
  }, [config, globalConfig, checkInstanceStatus]);

  // Inicializar configurações COM VERIFICAÇÃO IMEDIATA DE STATUS
  const initialize = useCallback(async () => {
    if (isInitializing || isInitialized) {
      return { success: isInitialized };
    }

    try {
      setIsInitializing(true);
      setLoading(true);
      setError(null);
      
      console.log('🔄 Iniciando carregamento das configurações...');
      
      // Carregar configurações sequencialmente para evitar conflitos
      const globalConf = await loadGlobalConfig();
      if (!globalConf) {
        setError('Configuração global da Evolution API não encontrada');
        return { success: false };
      }

      console.log('📋 Configuração global carregada:', globalConf);

      const instanceConf = await loadInstanceConfig();
      console.log('📋 Configuração da instância carregada:', instanceConf);
      
      // VERIFICAÇÃO IMEDIATA E CONTÍNUA DE STATUS se configuração existe
      if (instanceConf && globalConf) {
        console.log('⚡ Verificando status IMEDIATAMENTE após carregamento...');
        
        // Primeira verificação imediata
        await updateInstanceStatus();
        
        // Iniciar verificação contínua se não estiver conectado
        if (instanceConf.status !== 'open') {
          console.log('🔄 Status não é "open", iniciando monitoramento contínuo...');
          startContinuousMonitoring(instanceConf.instance_name);
        } else {
          console.log('✅ Já conectado, mantendo polling normal');
        }
      }

      setIsInitialized(true);
      return { success: !!(instanceConf && globalConf) };
    } catch (error) {
      console.error('❌ Erro ao inicializar configurações:', error);
      setError('Erro ao carregar configurações');
      return { success: false };
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  }, [loadGlobalConfig, loadInstanceConfig, updateInstanceStatus, isInitializing, isInitialized]);

  // Monitoramento contínuo mesmo quando não há QR ativo
  const startContinuousMonitoring = useCallback((instanceName: string) => {
    console.log('🔄 Iniciando monitoramento contínuo de conexão...');
    
    let monitoringActive = true;
    let attempts = 0;
    const maxAttempts = 1000; // Muito tempo para monitoramento contínuo
    
    const continuousCheck = async () => {
      if (!monitoringActive) return;
      
      attempts++;
      console.log(`🔍 Verificação contínua ${attempts} - Status da conexão...`);
      
      try {
        const apiStatus = await checkInstanceStatus(instanceName);
        console.log('📊 Status detectado:', apiStatus);
        
        if (apiStatus === 'open') {
          console.log('✅ CONEXÃO DETECTADA pelo monitoramento contínuo!');
          
          // Processar conexão detectada
          const instanceData = await getInstanceData(instanceName);
          const whatsappNumber = instanceData?.ownerJid?.split('@')[0];
          
          // Atualizar banco e estado
          await supabase
            .from('evolution_api_config')
            .update({ 
              status: 'open',
              numero: whatsappNumber,
              last_connected_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);
          
          setConfig(prev => prev ? { 
            ...prev, 
            status: 'open',
            numero: whatsappNumber
          } : null);
          
          setStatus({
            state: 'connected',
            connected: true,
            instanceStatus: 'open',
            lastCheck: new Date(),
            qrActive: false
          });
          
          monitoringActive = false; // Parar monitoramento
          return;
        }
        
        // Continuar verificando a cada 3 segundos se não conectado
        if (attempts < maxAttempts && monitoringActive) {
          setTimeout(continuousCheck, 3000);
        }
      } catch (error) {
        console.error('❌ Erro no monitoramento contínuo:', error);
        if (attempts < maxAttempts && monitoringActive) {
          setTimeout(continuousCheck, 5000); // Intervalo maior em caso de erro
        }
      }
    };
    
    // Iniciar verificação em 2 segundos
    setTimeout(continuousCheck, 2000);
    
    return () => {
      monitoringActive = false;
    };
  }, [checkInstanceStatus, getInstanceData]);

  // Conectar instância com verificação contínua
  const connect = useCallback(async (instanceName?: string) => {
    if (!globalConfig) return { success: false };
    
    const targetInstance = instanceName || config?.instance_name;
    if (!targetInstance) return { success: false };

    try {
      console.log('🔗 Iniciando conexão da instância:', targetInstance);
      
      // Definir estado de QR scanning
      setStatus(prev => ({ 
        ...prev, 
        state: 'qr_scanning', 
        qrActive: true 
      }));

      const response = await fetch(`${globalConfig.server_url}/instance/connect/${targetInstance}`, {
        method: 'GET',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('📱 Resposta do connect:', result);
      
      if (result.base64) {
        // Atualizar QR Code no banco
        await supabase
          .from('evolution_api_config')
          .update({ qr_code: result.base64 })
          .eq('instance_name', targetInstance);
        
        setConfig(prev => prev ? { ...prev, qr_code: result.base64 } : null);
        
        // Iniciar verificação contínua após gerar QR
        startConnectionMonitoring(targetInstance);
      }

      return { success: response.ok, qrCode: result.base64 };
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error);
      logger.error('Erro ao conectar instância', { component: 'useEvolutionApiV2' }, error as Error);
      return { success: false };
    }
  }, [globalConfig, config]);

  // Monitoramento ULTRA-RÁPIDO da conexão - CONTÍNUO E PERSISTENTE
  const startConnectionMonitoring = useCallback((instanceName: string) => {
    let attempts = 0;
    const maxAttempts = 300; // 15 minutos com verificações muito frequentes
    let intervalTime = 1000; // Começar verificando a cada 1 segundo
    let monitoringActive = true;
    
    console.log('🚀 INICIANDO MONITORAMENTO ULTRA-RÁPIDO E CONTÍNUO...');
    
    const checkConnection = async () => {
      if (!monitoringActive) return;
      
      attempts++;
      console.log(`🔄 Verificação ULTRA-RÁPIDA ${attempts}/${maxAttempts} da conexão...`);
      
      try {
        const apiStatus = await checkInstanceStatus(instanceName);
        console.log('📊 Status detectado:', apiStatus);
        
        if (apiStatus === 'open') {
          console.log('✅ CONEXÃO DETECTADA IMEDIATAMENTE! Processando...');
          
          // Obter dados completos da instância
          const instanceData = await getInstanceData(instanceName);
          const whatsappNumber = instanceData?.ownerJid?.split('@')[0];
          
          console.log('📱 Número WhatsApp detectado:', whatsappNumber);
          
          // ATUALIZAÇÃO IMEDIATA E PRIORITÁRIA
          const { error } = await supabase
            .from('evolution_api_config')
            .update({ 
              qr_code: null,
              status: 'open',
              numero: whatsappNumber,
              last_connected_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);
          
          if (error) {
            console.error('❌ Erro ao atualizar banco:', error);
          } else {
            console.log('✅ Banco atualizado INSTANTANEAMENTE!');
          }
          
          // ATUALIZAÇÃO IMEDIATA DO ESTADO LOCAL
          setConfig(prev => prev ? { 
            ...prev, 
            qr_code: null, 
            status: 'open',
            numero: whatsappNumber
          } : null);
          
          setStatus({
            state: 'connected',
            connected: true,
            instanceStatus: 'open',
            lastCheck: new Date(),
            qrActive: false
          });
          
          toast({
            title: "✅ WhatsApp Conectado!",
            description: `Número: ${whatsappNumber || 'Detectado'}`,
          });
          
          monitoringActive = false; // Parar este monitoramento específico
          console.log('🎉 Monitoramento finalizado - CONEXÃO ESTABELECIDA!');
          return;
        }
        
        // Manter intervalo MUITO baixo para detecção imediata
        if (attempts <= 60) {
          intervalTime = 1000; // 1 segundo pelos primeiros 60 tentativas (1 minuto)
        } else if (attempts <= 120) {
          intervalTime = 1500; // 1.5 segundos até 2 minutos
        } else {
          intervalTime = 2000; // 2 segundos depois disso
        }
        
        if (attempts < maxAttempts && apiStatus !== 'error' && monitoringActive) {
          setTimeout(checkConnection, intervalTime);
        } else if (monitoringActive) {
          console.log('⏰ Timeout ou erro - mantendo polling normal');
          setStatus(prev => ({ 
            ...prev, 
            state: 'disconnected', 
            qrActive: false 
          }));
          monitoringActive = false;
        }
      } catch (error) {
        console.error('❌ Erro na verificação de conexão:', error);
        if (attempts < maxAttempts && monitoringActive) {
          setTimeout(checkConnection, intervalTime);
        }
      }
    };
    
    // PRIMEIRA verificação IMEDIATA (500ms apenas)
    console.log('🚀 Primeira verificação em 500ms...');
    setTimeout(checkConnection, 500);
    
    // Retornar função para parar o monitoramento se necessário
    return () => {
      monitoringActive = false;
      console.log('🛑 Monitoramento interrompido externamente');
    };
  }, [checkInstanceStatus, getInstanceData, toast]);

  // Outros métodos da API
  const disconnect = useCallback(async (instanceName?: string) => {
    if (!globalConfig) return { success: false };
    
    const targetInstance = instanceName || config?.instance_name;
    if (!targetInstance) return { success: false };

    try {
      const response = await fetch(`${globalConfig.server_url}/instance/logout/${targetInstance}`, {
        method: 'DELETE',
        headers: {
          'apikey': globalConfig.api_key
        }
      });

      if (response.ok) {
        await updateInstanceStatus();
      }

      return { success: response.ok };
    } catch (error) {
      return { success: false };
    }
  }, [globalConfig, config, updateInstanceStatus]);

  const sendText = useCallback(async (instanceName?: string, data?: any) => {
    if (!globalConfig) return { success: false };
    
    const targetInstance = instanceName || config?.instance_name;
    if (!targetInstance || !data) return { success: false };

    try {
      const response = await fetch(`${globalConfig.server_url}/message/sendText/${targetInstance}`, {
        method: 'POST',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false };
    }
  }, [globalConfig, config]);

  // Polling ULTRA-AGRESSIVO baseado no estado - DETECÇÃO EM TEMPO REAL
  useEffect(() => {
    if (!config || !globalConfig) return;

    let pollInterval: number;
    let intervalId: NodeJS.Timeout;
    
    // Polling SUPER RÁPIDO quando QR está ativo - VERIFICAÇÃO CONTÍNUA
    if (status.qrActive) {
      pollInterval = 800; // 800ms (ainda mais rápido)
      console.log('🔥 MODO QR ATIVO - Polling ultra-rápido a cada 800ms');
    } 
    // Polling RÁPIDO quando conectado (detectar desconexões rapidamente)
    else if (status.connected) {
      pollInterval = 10000; // 10 segundos (reduzido de 15s)
      console.log('✅ CONECTADO - Polling de manutenção a cada 10s');
    } 
    // Polling MUITO RÁPIDO quando desconectado (detectar reconexões)
    else {
      pollInterval = 2000; // 2 segundos (muito rápido)
      console.log('🔍 DESCONECTADO - Polling de detecção a cada 2s');
    }

    console.log(`⏱️ Configurando polling ${status.state} a cada ${pollInterval}ms`);

    intervalId = setInterval(() => {
      console.log(`🔄 Executando polling automático (${status.state})...`);
      updateInstanceStatus();
    }, pollInterval);

    return () => {
      console.log('🛑 Limpando interval de polling');
      clearInterval(intervalId);
    };
  }, [config, globalConfig, status.qrActive, status.connected, status.state, updateInstanceStatus]);

  // VERIFICAÇÃO IMEDIATA quando usuário conecta
  useEffect(() => {
    if (user && !isInitialized && !isInitializing) {
      console.log('👤 Usuário conectado - Inicializando IMEDIATAMENTE...');
      initialize();
    }
  }, [user, initialize, isInitialized, isInitializing]);

  // VERIFICAÇÃO DE STATUS A CADA 2 SEGUNDOS quando há configuração
  useEffect(() => {
    if (!config || !globalConfig || isInitializing) return;

    console.log('⚡ Iniciando verificação contínua de status...');
    
    const statusCheckInterval = setInterval(() => {
      console.log('💫 Verificação de status em background...');
      updateInstanceStatus();
    }, 2000); // A cada 2 segundos

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [config, globalConfig, updateInstanceStatus, isInitializing]);

  return {
    loading,
    status,
    config,
    error,
    isConfigured: !!(config && globalConfig),
    connectionState: status.state,
    
    // Métodos principais
    initialize,
    connect,
    disconnect,
    sendText,
    updateInstanceStatus,
    
    // Método para forçar verificação imediata
    forceStatusCheck: async () => {
      if (config) {
        console.log('🚀 Verificação FORÇADA solicitada pelo usuário');
        await updateInstanceStatus();
      }
    },
    
    // Configurar conexão
    configure: (configData: { apiKey: string; serverUrl: string; instanceName: string; webhookUrl?: string }) => {
      // Salvar configuração local
      localStorage.setItem('evolution-api-config', JSON.stringify(configData));
      console.log('✅ Configuração Evolution API salva localmente');
    },

    // Verificar status
    checkStatus: async () => {
      console.log('🔍 Verificação de status solicitada');
      await updateInstanceStatus();
      return status;
    },

    // Obter QR Code
    getQRCode: async () => {
      if (!config || !globalConfig) {
        console.log('❌ Configuração não disponível para QR Code');
        return null;
      }

      try {
        console.log('📱 Obtendo QR Code para:', config.instance_name);
        
        // Se já temos um QR code válido, retornar
        if (config.qr_code) {
          return config.qr_code;
        }

        // Conectar para gerar novo QR Code
        const result = await connect();
        return result.qrCode || null;
      } catch (error) {
        console.error('❌ Erro ao obter QR Code:', error);
        return null;
      }
    },

    // Conectar instância
    connectInstance: async () => {
      if (!config) {
        console.log('❌ Nenhuma configuração encontrada para conectar');
        return;
      }
      
      console.log('🔗 Conectando instância:', config.instance_name);
      await connect(config.instance_name);
    },

    // Reiniciar instância
    restartInstance: async () => {
      if (!config || !globalConfig) return;
      
      try {
        console.log('🔄 Reiniciando instância:', config.instance_name);
        
        const response = await fetch(`${globalConfig.server_url}/instance/restart/${config.instance_name}`, {
          method: 'PUT',
          headers: {
            'apikey': globalConfig.api_key,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast({
            title: "Instância reiniciada",
            description: "A instância foi reiniciada com sucesso",
          });
          
          // Aguardar um pouco e verificar status
          setTimeout(() => updateInstanceStatus(), 3000);
        }
      } catch (error) {
        console.error('❌ Erro ao reiniciar instância:', error);
        toast({
          title: "Erro ao reiniciar",
          description: "Não foi possível reiniciar a instância",
          variant: "destructive",
        });
      }
    },

    // Logout da instância
    logoutInstance: async () => {
      if (!config || !globalConfig) return;
      
      try {
        console.log('🚪 Fazendo logout da instância:', config.instance_name);
        
        const response = await fetch(`${globalConfig.server_url}/instance/logout/${config.instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': globalConfig.api_key
          }
        });

        if (response.ok) {
          // Limpar QR Code e atualizar status
          await supabase
            .from('evolution_api_config')
            .update({ 
              qr_code: null,
              status: 'disconnected',
              numero: null
            })
            .eq('id', config.id);

          setConfig(prev => prev ? { 
            ...prev, 
            qr_code: null, 
            status: 'disconnected',
            numero: null
          } : null);

          setStatus({
            state: 'disconnected',
            connected: false,
            instanceStatus: 'disconnected',
            lastCheck: new Date(),
            qrActive: false
          });

          toast({
            title: "Logout realizado",
            description: "A instância foi desconectada com sucesso",
          });
        }
      } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        toast({
          title: "Erro no logout",
          description: "Não foi possível desconectar a instância",
          variant: "destructive",
        });
      }
    },

    // Configurar webhook
    setWebhook: async (webhookUrl: string) => {
      if (!config || !globalConfig || !webhookUrl) return false;
      
      try {
        console.log('🔗 Configurando webhook:', webhookUrl);
        
        const response = await fetch(`${globalConfig.server_url}/webhook/set/${config.instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': globalConfig.api_key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: webhookUrl,
            events: ['messages', 'connection']
          })
        });

        if (response.ok) {
          toast({
            title: "Webhook configurado",
            description: "Webhook configurado com sucesso",
          });
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('❌ Erro ao configurar webhook:', error);
        toast({
          title: "Erro no webhook",
          description: "Não foi possível configurar o webhook",
          variant: "destructive",
        });
        return false;
      }
    },

    // Enviar mensagem de texto
    sendTextMessage: async (number: string, text: string, instance?: string) => {
      const targetInstance = instance || config?.instance_name;
      if (!targetInstance || !globalConfig) return false;

      try {
        const response = await fetch(`${globalConfig.server_url}/message/sendText/${targetInstance}`, {
          method: 'POST',
          headers: {
            'apikey': globalConfig.api_key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: number,
            text: text
          })
        });

        return response.ok;
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem de texto:', error);
        return false;
      }
    },

    // Enviar mensagem de mídia
    sendMediaMessage: async (number: string, media: any, instance?: string) => {
      const targetInstance = instance || config?.instance_name;
      if (!targetInstance || !globalConfig) return false;

      try {
        const response = await fetch(`${globalConfig.server_url}/message/sendMedia/${targetInstance}`, {
          method: 'POST',
          headers: {
            'apikey': globalConfig.api_key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: number,
            ...media
          })
        });

        return response.ok;
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem de mídia:', error);
        return false;
      }
    }
  };
};
