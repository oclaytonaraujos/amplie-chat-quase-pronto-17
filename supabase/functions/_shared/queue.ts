
export interface QueueMessage {
  id?: string;
  correlationId: string;
  messageType: string;
  payload: Record<string, any>;
  priority?: number;
  maxRetries?: number;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export class MessageQueue {
  private supabase: any;
  private logger: any;

  constructor(supabase: any, logger: any) {
    this.supabase = supabase;
    this.logger = logger;
  }

  async enqueue(message: QueueMessage): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('message_queue')
        .insert({
          correlation_id: message.correlationId,
          message_type: message.messageType,
          payload: message.payload,
          priority: message.priority || 0,
          max_retries: message.maxRetries || 3,
          scheduled_at: message.scheduledAt || new Date(),
          metadata: message.metadata || {}
        })
        .select('id')
        .single();

      if (error) {
        await this.logger.error('Failed to enqueue message', undefined, undefined, { error: error.message, message });
        return null;
      }

      await this.logger.info('Message enqueued successfully', undefined, undefined, { messageId: data.id, messageType: message.messageType });
      return data.id;
    } catch (error) {
      await this.logger.error('Error enqueuing message', undefined, undefined, { error: error.message, message });
      return null;
    }
  }

  async dequeue(): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_next_queue_message');

      if (error) {
        await this.logger.error('Failed to dequeue message', undefined, undefined, { error: error.message });
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const message = data[0];
      await this.logger.debug('Message dequeued', undefined, undefined, { messageId: message.id, messageType: message.message_type });
      return message;
    } catch (error) {
      await this.logger.error('Error dequeuing message', undefined, undefined, { error: error.message });
      return null;
    }
  }

  async markCompleted(messageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('message_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date()
        })
        .eq('id', messageId);

      if (error) {
        await this.logger.error('Failed to mark message as completed', undefined, undefined, { error: error.message, messageId });
        return false;
      }

      await this.logger.debug('Message marked as completed', undefined, undefined, { messageId });
      return true;
    } catch (error) {
      await this.logger.error('Error marking message as completed', undefined, undefined, { error: error.message, messageId });
      return false;
    }
  }

  async markFailed(messageId: string, errorMessage: string, shouldRetry: boolean = false): Promise<boolean> {
    try {
      const status = shouldRetry ? 'retrying' : 'failed';
      const scheduledAt = shouldRetry ? new Date(Date.now() + 60000) : undefined; // Retry in 1 minute

      const updateData: any = {
        status,
        error_message: errorMessage,
        processed_at: new Date()
      };

      if (shouldRetry) {
        updateData.scheduled_at = scheduledAt;
      }

      const { error } = await this.supabase
        .from('message_queue')
        .update(updateData)
        .eq('id', messageId);

      if (error) {
        await this.logger.error('Failed to mark message as failed', undefined, undefined, { error: error.message, messageId });
        return false;
      }

      await this.logger.debug('Message marked as failed', undefined, undefined, { messageId, status, shouldRetry });
      return true;
    } catch (error) {
      await this.logger.error('Error marking message as failed', undefined, undefined, { error: error.message, messageId });
      return false;
    }
  }
}
