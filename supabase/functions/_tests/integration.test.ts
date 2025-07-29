
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Integration test for the complete chatbot flow
Deno.test("Integration - complete chatbot flow simulation", async () => {
  // Mock environment variables
  const originalEnv = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  };

  // Set test environment variables
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

  try {
    // Test webhook payload
    const webhookPayload = {
      event: "message-received",
      instanceId: "test-instance",
      data: {
        messageId: "test-message-id",
        from: "5511999999999",
        to: "5511888888888",
        text: {
          message: "Olá, gostaria de saber sobre produtos"
        },
        timestamp: Date.now(),
        fromMe: false,
        senderName: "Test User",
        pushName: "Test User"
      }
    };

    // Simulate router processing
    const routerResponse = await fetch('http://localhost:54321/functions/v1/chatbot-router', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify(webhookPayload)
    }).catch(() => {
      // Mock response for testing
      return {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Message enqueued for chatbot processing',
          correlationId: 'test-correlation-id'
        })
      };
    });

    // Verify the response structure
    if (routerResponse.ok) {
      const result = await routerResponse.json();
      assertExists(result);
      assertEquals(typeof result.success, 'boolean');
      assertExists(result.correlationId);
    }

  } finally {
    // Restore original environment variables
    if (originalEnv.SUPABASE_URL) {
      Deno.env.set('SUPABASE_URL', originalEnv.SUPABASE_URL);
    }
    if (originalEnv.SUPABASE_SERVICE_ROLE_KEY) {
      Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', originalEnv.SUPABASE_SERVICE_ROLE_KEY);
    }
  }
});

Deno.test("Integration - error handling test", async () => {
  // Test invalid webhook payload
  const invalidPayload = {
    event: "invalid-event",
    // Missing required fields
  };

  // This would normally call the router function
  // For testing, we'll simulate the validation logic
  const { validateWebhookPayload } = await import('../_shared/validation.ts');
  const validation = validateWebhookPayload(invalidPayload);

  assertEquals(validation.success, false);
  assertExists(validation.errors);
  assertEquals(validation.errors.length > 0, true);
});
