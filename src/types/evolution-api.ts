// Evolution API v2 Types - Baseado na documentação oficial
export interface EvolutionApiConfig {
  apiKey: string;
  serverUrl: string;
  instanceName: string;
  webhookUrl?: string;
  webhookEvents?: string[];
}

// ===== MENSAGENS =====
export interface EvolutionApiTextMessage {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  quoted?: {
    key: {
      id: string;
    };
    message: {
      conversation: string;
    };
  };
}

export interface EvolutionApiMediaMessage {
  number: string;
  mediatype: 'image' | 'document' | 'audio' | 'video';
  media: string; // URL ou base64
  caption?: string;
  fileName?: string;
  delay?: number;
}

export interface EvolutionApiTemplateMessage {
  number: string;
  templateName: string;
  parameters: string[];
  language?: string;
}

export interface EvolutionApiStatusMessage {
  text?: string;
  backgroundColor?: string;
  media?: string;
  caption?: string;
}

export interface EvolutionApiStickerMessage {
  number: string;
  sticker: string;
}

export interface EvolutionApiLocationMessage {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface EvolutionApiContactMessage {
  number: string;
  contact: {
    name: string;
    phone: string;
  };
}

export interface EvolutionApiReactionMessage {
  messageId: string;
  reaction: string;
}

export interface EvolutionApiPollMessage {
  number: string;
  question: string;
  options: string[];
  multipleSelect?: boolean;
}

export interface EvolutionApiButtonMessage {
  number: string;
  buttonMessage: {
    text: string;
    buttons: Array<{
      id: string;
      text: string;
    }>;
    footer?: string;
  };
}

export interface EvolutionApiListMessage {
  number: string;
  listMessage: {
    title: string;
    description: string;
    buttonText: string;
    footerText?: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

// ===== INSTÂNCIAS =====
export interface EvolutionApiInstanceCreate {
  instanceName: string;
  qrcode?: boolean;
  token?: string;
  webhook?: string;
  webhookByEvents?: boolean;
  events?: string[];
  rejectCalls?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
}

export interface EvolutionApiWebhookMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
      documentMessage?: {
        url: string;
        mimetype: string;
        title: string;
        fileName: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
      };
      videoMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
      };
      contactMessage?: {
        displayName: string;
        vcard: string;
      };
      locationMessage?: {
        degreesLatitude: number;
        degreesLongitude: number;
        name?: string;
        address?: string;
      };
      buttonsResponseMessage?: {
        selectedButtonId: string;
        selectedDisplayText: string;
      };
      listResponseMessage?: {
        singleSelectReply: {
          selectedRowId: string;
        };
      };
    };
    messageTimestamp: number;
    status?: string;
  };
}

export interface EvolutionApiStatus {
  connected: boolean;
  instanceStatus: string;
  lastCheck: Date | null;
}

export interface ProcessedMessage {
  id: string;
  phone: string;
  fromMe: boolean;
  timestamp: Date;
  senderName: string;
  senderPhoto?: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'contact' | 'location' | 'button_response' | 'list_response';
  content: string;
  attachment?: {
    type: 'image' | 'document' | 'audio' | 'video';
    url: string;
    fileName?: string;
    mimeType?: string;
  };
  buttonResponse?: {
    selectedButtonId: string;
    selectedDisplayText: string;
  };
  listResponse?: {
    selectedRowId: string;
  };
}

export interface EvolutionApiInstance {
  instanceName: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'qr' | 'close';
  serverUrl: string;
  apikey: string;
  qrcode?: string;
}

// ===== WEBHOOKS =====
export interface EvolutionApiWebhookConfig {
  url: string;
  events: string[];
  webhookByEvents?: boolean;
}

// ===== CONFIGURAÇÕES =====
export interface EvolutionApiSettings {
  rejectCalls?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
}

// ===== CHAT CONTROLE =====
export interface EvolutionApiChatAction {
  number?: string;
  chatId?: string;
  messageId?: string;
}

export interface EvolutionApiPresence {
  chatId: string;
  presence: 'typing' | 'recording' | 'paused';
}

// ===== PERFIL =====
export interface EvolutionApiProfile {
  name?: string;
  status?: string;
  pictureUrl?: string;
}

export interface EvolutionApiPrivacySettings {
  lastSeen?: 'all' | 'contacts' | 'nobody';
  profilePicture?: 'all' | 'contacts' | 'nobody';
  status?: 'all' | 'contacts' | 'nobody';
  readReceipts?: 'all' | 'nobody';
  groups?: 'all' | 'contacts' | 'nobody';
}

// ===== GRUPOS =====
export interface EvolutionApiGroupCreate {
  subject: string;
  participants: string[];
  description?: string;
}

export interface EvolutionApiGroupUpdate {
  groupId: string;
  subject?: string;
  description?: string;
  pictureUrl?: string;
}

export interface EvolutionApiGroupMembers {
  groupId: string;
  participants: string[];
  action: 'add' | 'remove' | 'promote' | 'demote';
}

export interface EvolutionApiGroupSetting {
  groupId: string;
  setting: 'sendMessages' | 'editInfo';
  value: 'all' | 'admins';
}

// ===== INTEGRAÇÕES =====
export interface EvolutionApiTypebotConfig {
  url: string;
  typebot: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
}

export interface EvolutionApiChatwootConfig {
  url: string;
  accountId: string;
  token: string;
  signMsg?: boolean;
  reopenConversation?: boolean;
  conversationPending?: boolean;
}

export interface EvolutionApiSQSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  queueUrl: string;
}

export interface EvolutionApiRabbitMQConfig {
  url: string;
  exchange: string;
  routingKey?: string;
}

export interface EvolutionApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  instance?: any;
  qrcode?: string;
  key?: any;
  webhook?: any;
}
