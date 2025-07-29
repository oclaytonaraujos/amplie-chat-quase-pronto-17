
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { MessageQueue } from '../_shared/queue.ts';

// Mock supabase and logger for testing
const mockSupabase = {
  from: (table: string) => ({
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ 
          data: { id: 'test-id' }, 
          error: null 
        })
      })
    }),
    update: (data: any) => ({
      eq: () => Promise.resolve({ error: null })
    })
  }),
  rpc: (functionName: string) => Promise.resolve({ 
    data: [{ 
      id: 'test-id',
      correlation_id: 'test-correlation-id',
      message_type: 'test-message',
      payload: { test: 'data' },
      retry_count: 0
    }], 
    error: null 
  })
};

const mockLogger = {
  debug: () => Promise.resolve(),
  info: () => Promise.resolve(),
  warn: () => Promise.resolve(),
  error: () => Promise.resolve()
};

Deno.test("MessageQueue - enqueue message", async () => {
  const queue = new MessageQueue(mockSupabase, mockLogger);
  
  const messageId = await queue.enqueue({
    correlationId: 'test-correlation-id',
    messageType: 'test-message',
    payload: { test: 'data' }
  });

  assertEquals(messageId, 'test-id');
});

Deno.test("MessageQueue - dequeue message", async () => {
  const queue = new MessageQueue(mockSupabase, mockLogger);
  
  const message = await queue.dequeue();

  assertExists(message);
  assertEquals(message.id, 'test-id');
  assertEquals(message.correlation_id, 'test-correlation-id');
});

Deno.test("MessageQueue - mark completed", async () => {
  const queue = new MessageQueue(mockSupabase, mockLogger);
  
  const result = await queue.markCompleted('test-id');
  assertEquals(result, true);
});

Deno.test("MessageQueue - mark failed", async () => {
  const queue = new MessageQueue(mockSupabase, mockLogger);
  
  const result = await queue.markFailed('test-id', 'Test error', false);
  assertEquals(result, true);
});
