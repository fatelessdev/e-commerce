import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createGeminiKeyRotator,
  parseGeminiApiKeys,
  shouldRetryGeminiEmbeddingError,
} from "./gemini-key-rotation.ts";

test("parseGeminiApiKeys trims and drops empty values", () => {
  assert.deepEqual(parseGeminiApiKeys(" a, ,b ,, c "), ["a", "b", "c"]);
});

test("key rotator uses round-robin keys", async () => {
  const rotator = createGeminiKeyRotator({ keys: ["a", "b", "c"] });
  const used: string[] = [];

  await rotator.run(async (key) => {
    used.push(key);
    return key;
  });
  await rotator.run(async (key) => {
    used.push(key);
    return key;
  });
  await rotator.run(async (key) => {
    used.push(key);
    return key;
  });

  assert.deepEqual(used, ["a", "b", "c"]);
});

test("key rotator retries retryable provider errors on the next key", async () => {
  const rotator = createGeminiKeyRotator({ keys: ["a", "b"], maxAttempts: 2 });
  const used: string[] = [];

  const result = await rotator.run(async (key) => {
    used.push(key);
    if (key === "a") {
      throw Object.assign(new Error("rate limit"), { status: 429 });
    }
    return "ok";
  });

  assert.equal(result, "ok");
  assert.deepEqual(used, ["a", "b"]);
});

test("retry classifier handles transient status and message errors", () => {
  assert.equal(shouldRetryGeminiEmbeddingError({ status: 429 }), true);
  assert.equal(shouldRetryGeminiEmbeddingError(new Error("quota exceeded")), true);
  assert.equal(shouldRetryGeminiEmbeddingError({ status: 400 }), false);
});
