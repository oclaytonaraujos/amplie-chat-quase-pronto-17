
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { NLPProcessor } from '../_shared/nlp.ts';

// Mock supabase and logger for testing
const mockSupabase = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: [], error: null })
        })
      })
    })
  })
};

const mockLogger = {
  debug: () => Promise.resolve(),
  info: () => Promise.resolve(),
  warn: () => Promise.resolve(),
  error: () => Promise.resolve()
};

Deno.test("NLPProcessor - process message without OpenAI", async () => {
  const processor = new NLPProcessor(mockSupabase, mockLogger);
  
  const result = await processor.processMessage(
    "Olá, gostaria de saber sobre produtos",
    "5511999999999",
    "test-empresa-id"
  );

  assertExists(result);
  assertEquals(typeof result.confidence, "number");
  assertEquals(typeof result.shouldOverrideFlow, "boolean");
});

Deno.test("NLPProcessor - handle empty message", async () => {
  const processor = new NLPProcessor(mockSupabase, mockLogger);
  
  const result = await processor.processMessage(
    "",
    "5511999999999",
    "test-empresa-id"
  );

  assertExists(result);
  assertEquals(result.confidence, 0);
  assertEquals(result.shouldOverrideFlow, false);
});

Deno.test("NLPProcessor - handle null empresa_id", async () => {
  const processor = new NLPProcessor(mockSupabase, mockLogger);
  
  const result = await processor.processMessage(
    "Hello world",
    "5511999999999",
    ""
  );

  assertExists(result);
  assertEquals(result.confidence, 0);
  assertEquals(result.shouldOverrideFlow, false);
});
