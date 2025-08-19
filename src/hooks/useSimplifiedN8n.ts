import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SimplifiedN8nService } from '@/services/SimplifiedN8nService';
import { supabase } from '@/integrations/supabase/client';

interface N8nStatus {
  messages_enabled: boolean;
  instances_enabled: boolean;
  chatbot_enabled: boolean;
  overall_enabled: boolean;
}

export function useSimplifiedN8n() {
  const [status, setStatus] = useState<N8nStatus>({
    messages_enabled: false,
    instances_enabled: false,
    chatbot_enabled: false,
    overall_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkN8nStatus();
    }
  }, [user]);

  const checkN8nStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) return;

      const { data: config } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('status', 'active')
        .single();

      if (config) {
        setStatus({
          messages_enabled: !!(config.webhook_send_url || config.webhook_receive_url),
          instances_enabled: !!(config.webhook_create_connection || config.webhook_delete_instance),
          chatbot_enabled: !!config.webhook_chatbot,
          overall_enabled: config.status === 'active'
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status n8n:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para envio de mensagens
  const sendMessage = async (phone: string, message: string, type: 'text' | 'image' | 'document' = 'text', options?: any) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const success = await SimplifiedN8nService.sendMessage(profile.empresa_id, {
        phone,
        message,
        type,
        ...options
      });

      if (success) {
        toast({
          title: "Mensagem enviada",
          description: "Mensagem enviada para processamento no n8n",
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Falha ao enviar mensagem para n8n",
          variant: "destructive",
        });
      }

      return success;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Funções para gerenciamento de instâncias
  const createInstance = async (instanceName: string, settings?: any) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const success = await SimplifiedN8nService.createInstance(profile.empresa_id, {
        instanceName,
        settings
      });

      if (success) {
        toast({
          title: "Instância criando",
          description: "Solicitação de criação enviada para n8n",
        });
      } else {
        toast({
          title: "Erro ao criar instância",
          description: "Falha ao criar instância via n8n",
          variant: "destructive",
        });
      }

      return success;
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteInstance = async (instanceName: string) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const success = await SimplifiedN8nService.deleteInstance(profile.empresa_id, {
        instanceName
      });

      if (success) {
        toast({
          title: "Instância removendo",
          description: "Solicitação de exclusão enviada para n8n",
        });
      } else {
        toast({
          title: "Erro ao remover instância",
          description: "Falha ao remover instância via n8n",
          variant: "destructive",
        });
      }

      return success;
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro ao remover instância",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Funções para chatbot
  const startChatbotFlow = async (phone: string, flowId: string, triggerType: 'manual' | 'automatic' | 'keyword' = 'manual') => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const success = await SimplifiedN8nService.startChatbotFlow(profile.empresa_id, {
        phone,
        flowId,
        triggerType
      });

      if (success) {
        toast({
          title: "Chatbot iniciado",
          description: "Fluxo de chatbot iniciado via n8n",
        });
      }

      return success;
    } catch (error: any) {
      console.error('Erro ao iniciar chatbot:', error);
      toast({
        title: "Erro ao iniciar chatbot",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const processChatbotInteraction = async (phone: string, message: string, sessionData?: any) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      return await SimplifiedN8nService.processChatbotInteraction(profile.empresa_id, {
        phone,
        message,
        sessionData
      });
    } catch (error: any) {
      console.error('Erro ao processar interação do chatbot:', error);
      return false;
    }
  };

  return {
    status,
    loading,
    refetch: checkN8nStatus,
    
    // Mensagens
    sendMessage,
    
    // Instâncias
    createInstance,
    deleteInstance,
    
    // Chatbot
    startChatbotFlow,
    processChatbotInteraction
  };
}