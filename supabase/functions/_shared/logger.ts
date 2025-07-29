
export interface LogEntry {
  correlationId: string;
  functionName: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  contactPhone?: string;
  currentStage?: string;
  metadata?: Record<string, any>;
}

export class StructuredLogger {
  private supabase: any;
  private correlationId: string;
  private functionName: string;

  constructor(supabase: any, correlationId: string, functionName: string) {
    this.supabase = supabase;
    this.correlationId = correlationId;
    this.functionName = functionName;
  }

  private async log(entry: Omit<LogEntry, 'correlationId' | 'functionName'>) {
    const logEntry: LogEntry = {
      ...entry,
      correlationId: this.correlationId,
      functionName: this.functionName,
    };

    // Log to console for immediate debugging
    console.log(`[${entry.level.toUpperCase()}] ${this.functionName}:`, {
      correlationId: this.correlationId,
      message: entry.message,
      contactPhone: entry.contactPhone,
      currentStage: entry.currentStage,
      metadata: entry.metadata,
    });

    // Log to database for persistence and monitoring
    try {
      await this.supabase
        .from('chatbot_logs')
        .insert({
          correlation_id: this.correlationId,
          function_name: this.functionName,
          level: entry.level,
          message: entry.message,
          contact_phone: entry.contactPhone,
          current_stage: entry.currentStage,
          metadata: entry.metadata || {},
        });
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  debug(message: string, contactPhone?: string, currentStage?: string, metadata?: Record<string, any>) {
    return this.log({ level: 'debug', message, contactPhone, currentStage, metadata });
  }

  info(message: string, contactPhone?: string, currentStage?: string, metadata?: Record<string, any>) {
    return this.log({ level: 'info', message, contactPhone, currentStage, metadata });
  }

  warn(message: string, contactPhone?: string, currentStage?: string, metadata?: Record<string, any>) {
    return this.log({ level: 'warn', message, contactPhone, currentStage, metadata });
  }

  error(message: string, contactPhone?: string, currentStage?: string, metadata?: Record<string, any>) {
    return this.log({ level: 'error', message, contactPhone, currentStage, metadata });
  }
}

export function createLogger(supabase: any, correlationId: string, functionName: string): StructuredLogger {
  return new StructuredLogger(supabase, correlationId, functionName);
}
