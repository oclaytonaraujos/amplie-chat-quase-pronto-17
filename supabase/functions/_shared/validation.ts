
// Validation schemas using Zod-like validation
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export interface WhatsAppMessage {
  messageId: string;
  from: string;
  to: string;
  text: {
    message: string;
  };
  timestamp: number;
  fromMe: boolean;
  senderName: string;
  pushName: string;
}

export interface WebhookPayload {
  event: string;
  instanceId: string;
  data: WhatsAppMessage;
}

export function validateWebhookPayload(payload: any): ValidationResult<WebhookPayload> {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { success: false, errors };
  }

  if (!payload.event || typeof payload.event !== 'string') {
    errors.push('Event field is required and must be a string');
  }

  if (!payload.instanceId || typeof payload.instanceId !== 'string') {
    errors.push('InstanceId field is required and must be a string');
  }

  if (!payload.data || typeof payload.data !== 'object') {
    errors.push('Data field is required and must be an object');
  } else {
    const data = payload.data;
    
    if (!data.messageId || typeof data.messageId !== 'string') {
      errors.push('Data.messageId is required and must be a string');
    }

    if (!data.from || typeof data.from !== 'string') {
      errors.push('Data.from is required and must be a string');
    }

    if (!data.to || typeof data.to !== 'string') {
      errors.push('Data.to is required and must be a string');
    }

    if (!data.text || typeof data.text !== 'object' || !data.text.message || typeof data.text.message !== 'string') {
      errors.push('Data.text.message is required and must be a string');
    }

    if (typeof data.timestamp !== 'number') {
      errors.push('Data.timestamp must be a number');
    }

    if (typeof data.fromMe !== 'boolean') {
      errors.push('Data.fromMe must be a boolean');
    }

    if (!data.senderName || typeof data.senderName !== 'string') {
      errors.push('Data.senderName is required and must be a string');
    }

    if (!data.pushName || typeof data.pushName !== 'string') {
      errors.push('Data.pushName is required and must be a string');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: payload as WebhookPayload };
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function validateApiKey(apiKey: string | undefined, serviceName: string): ValidationResult<string> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return {
      success: false,
      errors: [`${serviceName} API key is not configured or is empty`]
    };
  }

  return { success: true, data: apiKey.trim() };
}
