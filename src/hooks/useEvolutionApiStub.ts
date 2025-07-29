import { useState, useCallback, useEffect } from 'react';
import { EvolutionApiConfig, EvolutionApiStatus, EvolutionApiResponse } from '@/types/evolution-api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Stub service for Evolution API until the real service is properly configured
class EvolutionApiStub {
  constructor(config: any) {}
  
  async getInstanceStatus() { 
    return { data: { instance: { state: 'open' } } }; 
  }
  
  async getQRCode() { 
    return { qrcode: null }; 
  }
  
  async setWebhook(...args: any[]) { 
    return { success: true, webhook: true }; 
  }
  
  async sendTextMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendImageMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendDocumentMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendAudioMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendVideoMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendButtonMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendListMessage(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async getWebhook() { 
    return { success: true }; 
  }
  
  async setSettings(...args: any[]) { 
    return { success: true }; 
  }
  
  async getSettings() { 
    return { success: true }; 
  }
  
  async sendStatus(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendSticker(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendLocation(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendContact(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendReaction(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async sendPoll(...args: any[]) { 
    return { success: true, key: true }; 
  }
  
  async checkWhatsApp(...args: any[]) { 
    return { success: true }; 
  }
  
  async markMessageAsRead(...args: any[]) { 
    return { success: true }; 
  }
  
  async archiveChat(...args: any[]) { 
    return { success: true }; 
  }
  
  async deleteMessageForEveryone(...args: any[]) { 
    return { success: true }; 
  }
  
  async sendPresence(...args: any[]) { 
    return { success: true }; 
  }
  
  async fetchProfilePictureUrl(...args: any[]) { 
    return { success: true }; 
  }
  
  async findContacts() { 
    return { success: true }; 
  }
  
  async findMessages(...args: any[]) { 
    return { success: true }; 
  }
  
  async findStatusMessage() { 
    return { success: true }; 
  }
  
  async updateMessage(...args: any[]) { 
    return { success: true }; 
  }
  
  async findChats() { 
    return { success: true }; 
  }
  
  async fetchBusinessProfile(...args: any[]) { 
    return { success: true }; 
  }
  
  async fetchProfile(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateProfileName(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateProfileStatus(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateProfilePicture(...args: any[]) { 
    return { success: true }; 
  }
  
  async removeProfilePicture() { 
    return { success: true }; 
  }
  
  async fetchPrivacySettings() { 
    return { success: true }; 
  }
  
  async updatePrivacySettings(...args: any[]) { 
    return { success: true }; 
  }
  
  async createGroup(...args: any[]) { 
    return { success: true, data: { groupJid: 'test' } }; 
  }
  
  async updateGroupPicture(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateGroupSubject(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateGroupDescription(...args: any[]) { 
    return { success: true }; 
  }
  
  async fetchInviteCode(...args: any[]) { 
    return { success: true }; 
  }
  
  async acceptInviteCode(...args: any[]) { 
    return { success: true }; 
  }
  
  async revokeInviteCode(...args: any[]) { 
    return { success: true }; 
  }
  
  async sendGroupInvite(...args: any[]) { 
    return { success: true }; 
  }
  
  async findGroupByInviteCode(...args: any[]) { 
    return { success: true }; 
  }
  
  async findGroupByJid(...args: any[]) { 
    return { success: true }; 
  }
  
  async fetchAllGroups() { 
    return { success: true }; 
  }
  
  async findGroupMembers(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateGroupMembers(...args: any[]) { 
    return { success: true }; 
  }
  
  async updateGroupSetting(...args: any[]) { 
    return { success: true }; 
  }
  
  async toggleEphemeral(...args: any[]) { 
    return { success: true }; 
  }
  
  async leaveGroup(...args: any[]) { 
    return { success: true }; 
  }
  
  async connectInstance() { 
    return { success: true, instance: true }; 
  }
  
  async restartInstance() { 
    return { success: true }; 
  }
  
  async logoutInstance() { 
    return { success: true }; 
  }
}

interface UseEvolutionApiReturn {
  evolutionApi: EvolutionApiStub | null;
  status: EvolutionApiStatus;
  isConfigured: boolean;
  config: EvolutionApiConfig | null;
  loading: boolean;
  conectando: boolean;
  configure: (config: EvolutionApiConfig) => void;
  sendMessage: (phone: string, message: string) => Promise<boolean>;
  sendTextMessage: (phone: string, message: string) => Promise<boolean>;
  sendMediaMessage: (phone: string, mediaUrl: string, mediaType: string, caption?: string, fileName?: string) => Promise<boolean>;
  sendButtonMessage: (phone: string, text: string, buttons: Array<{ id: string; text: string }>, footer?: string) => Promise<boolean>;
  sendListMessage: (
    phone: string, 
    title: string, 
    description: string, 
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    footerText?: string
  ) => Promise<boolean>;
  sendImageMessage: (phone: string, imageUrl: string, caption?: string) => Promise<boolean>;
  sendDocumentMessage: (phone: string, documentUrl: string, fileName: string) => Promise<boolean>;
  sendAudioMessage: (phone: string, audioUrl: string) => Promise<boolean>;
  sendVideoMessage: (phone: string, videoUrl: string, caption?: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  verificarStatus: () => Promise<any>;
  getQRCode: () => Promise<string | null>;
  obterQRCode: () => Promise<any>;
  // Novos métodos implementados
  getWebhook: () => Promise<EvolutionApiResponse>;
  setSettings: (settings: any) => Promise<EvolutionApiResponse>;
  getSettings: () => Promise<EvolutionApiResponse>;
  sendStatus: (text: string, backgroundColor?: string, font?: number, statusTextColor?: string) => Promise<boolean>;
  sendSticker: (phone: string, stickerUrl: string) => Promise<boolean>;
  sendLocation: (phone: string, latitude: number, longitude: number, name?: string, address?: string) => Promise<boolean>;
  sendContact: (phone: string, contactPhone: string, contactName: string) => Promise<boolean>;
  sendReaction: (phone: string, messageId: string, emoji: string) => Promise<boolean>;
  sendPoll: (phone: string, name: string, selectableCount: number, values: string[]) => Promise<boolean>;
  checkWhatsApp: (phones: string[]) => Promise<EvolutionApiResponse>;
  markMessageAsRead: (phone: string, messageIds: string[]) => Promise<boolean>;
  archiveChat: (phone: string, archive?: boolean) => Promise<boolean>;
  deleteMessageForEveryone: (phone: string, messageId: string) => Promise<boolean>;
  sendPresence: (phone: string, presence: 'unavailable' | 'available' | 'composing' | 'recording') => Promise<boolean>;
  fetchProfilePictureUrl: (phone: string) => Promise<EvolutionApiResponse>;
  findContacts: () => Promise<EvolutionApiResponse>;
  findMessages: (phone: string, limit?: number) => Promise<EvolutionApiResponse>;
  findStatusMessage: () => Promise<EvolutionApiResponse>;
  updateMessage: (phone: string, messageId: string, text: string) => Promise<boolean>;
  findChats: () => Promise<EvolutionApiResponse>;
  fetchBusinessProfile: (phone: string) => Promise<EvolutionApiResponse>;
  fetchProfile: (phone: string) => Promise<EvolutionApiResponse>;
  updateProfileName: (name: string) => Promise<boolean>;
  updateProfileStatus: (status: string) => Promise<boolean>;
  updateProfilePicture: (pictureUrl: string) => Promise<boolean>;
  removeProfilePicture: () => Promise<boolean>;
  fetchPrivacySettings: () => Promise<EvolutionApiResponse>;
  updatePrivacySettings: (settings: any) => Promise<boolean>;
  createGroup: (subject: string, participants: string[], description?: string) => Promise<boolean>;
  updateGroupPicture: (groupJid: string, pictureUrl: string) => Promise<boolean>;
  updateGroupSubject: (groupJid: string, subject: string) => Promise<boolean>;
  updateGroupDescription: (groupJid: string, description: string) => Promise<boolean>;
  fetchInviteCode: (groupJid: string) => Promise<EvolutionApiResponse>;
  acceptInviteCode: (inviteCode: string) => Promise<boolean>;
  revokeInviteCode: (groupJid: string) => Promise<boolean>;
  sendGroupInvite: (groupJid: string, phoneNumbers: string[], inviteCode: string, inviteExpiration?: number) => Promise<boolean>;
  findGroupByInviteCode: (inviteCode: string) => Promise<EvolutionApiResponse>;
  findGroupByJid: (groupJid: string) => Promise<EvolutionApiResponse>;
  fetchAllGroups: () => Promise<EvolutionApiResponse>;
  findGroupMembers: (groupJid: string) => Promise<EvolutionApiResponse>;
  updateGroupMembers: (groupJid: string, action: 'add' | 'remove' | 'promote' | 'demote', participants: string[]) => Promise<boolean>;
  updateGroupSetting: (groupJid: string, action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked') => Promise<boolean>;
  toggleEphemeral: (groupJid: string, expiration: number) => Promise<boolean>;
  leaveGroup: (groupJid: string) => Promise<boolean>;
  connectInstance: () => Promise<boolean>;
  restartInstance: () => Promise<boolean>;
  logoutInstance: () => Promise<boolean>;
  setWebhook: (webhookUrl: string, events?: string[]) => Promise<boolean>;
  configurarWebhook: () => Promise<boolean>;
  disconnect: () => void;
}

export function useEvolutionApi(): UseEvolutionApiReturn {
  const [evolutionApi, setEvolutionApi] = useState<EvolutionApiStub | null>(null);
  const [config, setConfig] = useState<EvolutionApiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [status, setStatus] = useState<EvolutionApiStatus>({
    connected: false,
    instanceStatus: 'disconnected',
    lastCheck: null,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  // Carregar configuração do banco de dados
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Get global config for API key and server URL
        const { data: globalConfig } = await supabase
          .from('evolution_api_global_config')
          .select('api_key, server_url')
          .eq('ativo', true)
          .single();

        if (globalConfig) {
          const evolutionConfig: EvolutionApiConfig = {
            apiKey: globalConfig.api_key,
            serverUrl: globalConfig.server_url,
            instanceName: data.instance_name,
            webhookUrl: data.webhook_url,
            webhookEvents: data.webhook_events
          };
          setConfig(evolutionConfig);
          configure(evolutionConfig);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração Evolution API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar configuração ao inicializar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const configure = useCallback((config: EvolutionApiConfig) => {
    console.log('Configurando Evolution API:', config);
    
    const evolutionApiService = new EvolutionApiStub(config);
    setEvolutionApi(evolutionApiService);
    setConfig(config);
    setIsConfigured(true);
    
    // Verificar status inicial
    checkStatusInternal(evolutionApiService);
  }, []);

  const checkStatusInternal = async (service: EvolutionApiStub) => {
    try {
      const statusResponse = await service.getInstanceStatus();
      console.log('Status Evolution API:', statusResponse);
      
      const connected = statusResponse.data?.instance?.state === 'open';
      
      setStatus({
        connected,
        instanceStatus: statusResponse.data?.instance?.state || 'unknown',
        lastCheck: new Date(),
      });
    } catch (error) {
      console.error('Erro ao verificar status Evolution API:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        instanceStatus: 'error',
        lastCheck: new Date(),
      }));
    }
  };

  const checkStatus = useCallback(async () => {
    if (!evolutionApi) return;
    await checkStatusInternal(evolutionApi);
  }, [evolutionApi]);

  const verificarStatus = useCallback(async () => {
    if (!evolutionApi) return { value: false, status: 'disconnected' };
    
    try {
      const response = await evolutionApi.getInstanceStatus();
      return {
        value: response.data?.instance?.state === 'open',
        status: response.data?.instance?.state || 'disconnected'
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { value: false, status: 'error' };
    }
  }, [evolutionApi]);

  const obterQRCode = useCallback(async () => {
    if (!evolutionApi) return { qrcode: null };
    
    try {
      setConectando(true);
      const response = await evolutionApi.getQRCode();
      return {
        qrcode: response.qrcode || null
      };
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return { qrcode: null };
    } finally {
      setConectando(false);
    }
  }, [evolutionApi]);

  const configurarWebhook = useCallback(async (): Promise<boolean> => {
    if (!evolutionApi || !config?.webhookUrl) return false;

    try {
      const response = await evolutionApi.setWebhook(config.webhookUrl, config.webhookEvents);
      return !!(response.success || response.webhook);
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      return false;
    }
  }, [evolutionApi, config]);

  const sendTextMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
    return sendMessage(phone, message);
  }, []);

  const sendMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
    if (!evolutionApi) {
      toast({
        title: "Evolution API não configurada",
        description: "Configure a integração Evolution API primeiro",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await evolutionApi.sendTextMessage(phone, message);
      return !!(response.success || response.key);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem via Evolution API",
        variant: "destructive",
      });
      return false;
    }
  }, [evolutionApi, toast]);

  // All other methods are simplified stubs that just return success
  const stubMethod = useCallback(async (): Promise<boolean> => true, []);
  const stubMethodWithResponse = useCallback(async (): Promise<EvolutionApiResponse> => ({ success: true }), []);

  const disconnect = useCallback(() => {
    setEvolutionApi(null);
    setIsConfigured(false);
    setConfig(null);
    setStatus({
      connected: false,
      instanceStatus: 'disconnected',
      lastCheck: null,
    });
    
    toast({
      title: "Evolution API desconectada",
      description: "A integração foi desconectada com sucesso",
    });
  }, [toast]);

  return {
    evolutionApi,
    status,
    isConfigured,
    config,
    loading,
    conectando,
    configure,
    sendMessage,
    sendTextMessage,
    sendMediaMessage: stubMethod,
    sendButtonMessage: stubMethod,
    sendListMessage: stubMethod,
    sendImageMessage: stubMethod,
    sendDocumentMessage: stubMethod,
    sendAudioMessage: stubMethod,
    sendVideoMessage: stubMethod,
    checkStatus,
    verificarStatus,
    getQRCode: async () => null,
    obterQRCode,
    getWebhook: stubMethodWithResponse,
    setSettings: stubMethodWithResponse,
    getSettings: stubMethodWithResponse,
    sendStatus: stubMethod,
    sendSticker: stubMethod,
    sendLocation: stubMethod,
    sendContact: stubMethod,
    sendReaction: stubMethod,
    sendPoll: stubMethod,
    checkWhatsApp: stubMethodWithResponse,
    markMessageAsRead: stubMethod,
    archiveChat: stubMethod,
    deleteMessageForEveryone: stubMethod,
    sendPresence: stubMethod,
    fetchProfilePictureUrl: stubMethodWithResponse,
    findContacts: stubMethodWithResponse,
    findMessages: stubMethodWithResponse,
    findStatusMessage: stubMethodWithResponse,
    updateMessage: stubMethod,
    findChats: stubMethodWithResponse,
    fetchBusinessProfile: stubMethodWithResponse,
    fetchProfile: stubMethodWithResponse,
    updateProfileName: stubMethod,
    updateProfileStatus: stubMethod,
    updateProfilePicture: stubMethod,
    removeProfilePicture: stubMethod,
    fetchPrivacySettings: stubMethodWithResponse,
    updatePrivacySettings: stubMethod,
    createGroup: stubMethod,
    updateGroupPicture: stubMethod,
    updateGroupSubject: stubMethod,
    updateGroupDescription: stubMethod,
    fetchInviteCode: stubMethodWithResponse,
    acceptInviteCode: stubMethod,
    revokeInviteCode: stubMethod,
    sendGroupInvite: stubMethod,
    findGroupByInviteCode: stubMethodWithResponse,
    findGroupByJid: stubMethodWithResponse,
    fetchAllGroups: stubMethodWithResponse,
    findGroupMembers: stubMethodWithResponse,
    updateGroupMembers: stubMethod,
    updateGroupSetting: stubMethod,
    toggleEphemeral: stubMethod,
    leaveGroup: stubMethod,
    connectInstance: stubMethod,
    restartInstance: stubMethod,
    logoutInstance: stubMethod,
    setWebhook: stubMethod,
    configurarWebhook,
    disconnect,
  };
}