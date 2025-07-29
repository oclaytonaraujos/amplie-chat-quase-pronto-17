export enum TriggerType {
  MESSAGE_RECEIVED = 'message_received',
  KEYWORD_DETECTED = 'keyword_detected',
  FIRST_MESSAGE = 'first_message',
  SCHEDULE_TIME = 'schedule_time',
  INACTIVITY_TIMEOUT = 'inactivity_timeout',
  BUSINESS_HOURS = 'business_hours',
  USER_RETURN = 'user_return',
  CONVERSATION_END = 'conversation_end',
  TRANSFER_REQUESTED = 'transfer_requested',
  WEBHOOK_RECEIVED = 'webhook_received',
  API_CALL = 'api_call',
  FORM_SUBMITTED = 'form_submitted',
  MANUAL_TRIGGER = 'manual_trigger',
  FLOW_COMPLETED = 'flow_completed'
}

export interface TriggerConditions {
  keywords?: string[];
  timeRange?: { 
    start: string; 
    end: string; 
    timezone?: string;
  };
  userTags?: string[];
  lastInteraction?: { 
    operator: 'gt' | 'lt' | 'eq'; 
    value: number; 
    unit: 'minutes' | 'hours' | 'days' 
  };
  sourceChannel?: 'whatsapp' | 'telegram' | 'web' | 'api';
  userSegment?: string;
  newContact?: boolean;
  outsideHours?: {
    start: string;
    end: string;
  };
  messageContent?: {
    contains?: string[];
    startsWith?: string[];
    equals?: string[];
    regex?: string;
  };
}

export interface TriggerActions {
  startFlow?: string; // Flow ID
  transferToAgent?: boolean;
  transferToQueue?: string;
  addUserTag?: string[];
  removeUserTag?: string[];
  sendMessage?: string;
  sendTemplate?: {
    templateId: string;
    parameters?: Record<string, string>;
  };
  createTicket?: boolean;
  updateUserData?: Record<string, any>;
  callWebhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
  scheduleMessage?: {
    message: string;
    delayMinutes: number;
  };
  notifyAgent?: {
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  logEvent?: {
    eventName: string;
    properties?: Record<string, any>;
  };
}

export interface AutomationTrigger {
  id?: string;
  empresa_id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number; // 1-10 (1 = highest priority)
  trigger_type: TriggerType;
  conditions: TriggerConditions;
  actions: TriggerActions;
  cooldown_minutes?: number;
  max_activations_per_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TriggerActivation {
  id?: string;
  trigger_id: string;
  contact_phone: string;
  activation_reason: string;
  conditions_met: Record<string, any>;
  actions_executed: Record<string, any>;
  success: boolean;
  error_message?: string;
  created_at?: string;
}

export interface TriggerEvaluationContext {
  contact_phone: string;
  message: {
    content: string;
    from: string;
    messageId: string;
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document';
  };
  conversation: {
    isNew: boolean;
    lastInteraction?: string;
    status: string;
    tags: string[];
    assignedAgent?: string;
  };
  user: {
    tags: string[];
    segment?: string;
    firstContact?: string;
    totalInteractions: number;
  };
  context: {
    currentTime: string;
    businessHours: {
      start: string;
      end: string;
      timezone: string;
    };
    channel: string;
  };
}