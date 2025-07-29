
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { validateWebhookPayload, sanitizePhone, validateApiKey } from '../_shared/validation.ts';

Deno.test("validateWebhookPayload - valid payload", () => {
  const validPayload = {
    event: "message-received",
    instanceId: "test-instance",
    data: {
      messageId: "test-message-id",
      from: "5511999999999",
      to: "5511888888888",
      text: {
        message: "Hello, world!"
      },
      timestamp: Date.now(),
      fromMe: false,
      senderName: "Test User",
      pushName: "Test User"
    }
  };

  const result = validateWebhookPayload(validPayload);
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.data.event, "message-received");
});

Deno.test("validateWebhookPayload - invalid payload", () => {
  const invalidPayload = {
    event: "message-received",
    // Missing instanceId
    data: {
      messageId: "test-message-id",
      from: "5511999999999",
      // Missing required fields
    }
  };

  const result = validateWebhookPayload(invalidPayload);
  assertEquals(result.success, false);
  assertExists(result.errors);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("sanitizePhone - removes non-numeric characters", () => {
  assertEquals(sanitizePhone("+55 11 99999-9999"), "5511999999999");
  assertEquals(sanitizePhone("(11) 99999-9999"), "11999999999");
  assertEquals(sanitizePhone("11999999999"), "11999999999");
});

Deno.test("validateApiKey - valid key", () => {
  const result = validateApiKey("valid-api-key", "Test Service");
  assertEquals(result.success, true);
  assertEquals(result.data, "valid-api-key");
});

Deno.test("validateApiKey - invalid key", () => {
  const result = validateApiKey("", "Test Service");
  assertEquals(result.success, false);
  assertExists(result.errors);
});

Deno.test("validateApiKey - undefined key", () => {
  const result = validateApiKey(undefined, "Test Service");
  assertEquals(result.success, false);
  assertExists(result.errors);
});
