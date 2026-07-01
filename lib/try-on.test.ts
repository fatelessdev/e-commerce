import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_TRY_ON_MODEL_ID,
  getRequiredTryOnMode,
  getTryOnModelId,
  isTryOnBodyModeAllowed,
  TRY_ON_PROMPT_VERSION,
  buildTryOnPrompt,
  buildTryOnAssetPublicId,
  validateTryOnImageFile,
} from "./try-on.ts";

test("try-on mode maps apparel categories to strict body photo requirements", () => {
  assert.equal(getRequiredTryOnMode("tshirt"), "upper");
  assert.equal(getRequiredTryOnMode("shirt"), "upper");
  assert.equal(getRequiredTryOnMode("hoodie"), "upper");
  assert.equal(getRequiredTryOnMode("jacket"), "upper");

  assert.equal(getRequiredTryOnMode("jeans"), "lower");
  assert.equal(getRequiredTryOnMode("cargo"), "lower");
  assert.equal(getRequiredTryOnMode("jogger"), "lower");
  assert.equal(getRequiredTryOnMode("shorts"), "lower");

  assert.equal(getRequiredTryOnMode("accessory"), "unsupported");
});

test("full body photos are allowed for tops and bottoms but mismatched crops are rejected", () => {
  assert.equal(isTryOnBodyModeAllowed("upper", "upper"), true);
  assert.equal(isTryOnBodyModeAllowed("upper", "full"), true);
  assert.equal(isTryOnBodyModeAllowed("upper", "lower"), false);

  assert.equal(isTryOnBodyModeAllowed("lower", "lower"), true);
  assert.equal(isTryOnBodyModeAllowed("lower", "full"), true);
  assert.equal(isTryOnBodyModeAllowed("lower", "upper"), false);

  assert.equal(isTryOnBodyModeAllowed("unsupported", "full"), false);
});

test("try-on model defaults to the verified OpenRouter image model and supports env override", () => {
  assert.equal(getTryOnModelId({ OPENROUTER_TRYON_MODEL: "" }), DEFAULT_TRY_ON_MODEL_ID);
  assert.equal(
    getTryOnModelId({ OPENROUTER_TRYON_MODEL: "openai/custom-tryon" }),
    "openai/custom-tryon",
  );
});

test("try-on image validation accepts only supported image types within the size limit", () => {
  assert.deepEqual(validateTryOnImageFile({ type: "image/jpeg", size: 5_000_000 }), { ok: true });
  assert.deepEqual(validateTryOnImageFile({ type: "image/png", size: 5_000_000 }), { ok: true });
  assert.deepEqual(validateTryOnImageFile({ type: "image/webp", size: 5_000_000 }), { ok: true });

  assert.deepEqual(validateTryOnImageFile({ type: "image/gif", size: 5_000_000 }), {
    ok: false,
    error: "Upload a JPEG, PNG, or WebP image.",
  });
  assert.deepEqual(validateTryOnImageFile({ type: "image/jpeg", size: 11_000_000 }), {
    ok: false,
    error: "Image must be 10MB or smaller.",
  });
});

test("try-on prompt is preset-only and fit-focused", () => {
  const prompt = buildTryOnPrompt({
    productName: "Seoul Black Tee",
    category: "tshirt",
    requiredMode: "upper",
  });

  assert.equal(TRY_ON_PROMPT_VERSION, "try-on-v1");
  assert.match(prompt, /Seoul Black Tee/);
  assert.match(prompt, /preserve the person/i);
  assert.match(prompt, /pose/i);
  assert.match(prompt, /proportions/i);
  assert.match(prompt, /replace only the upper-body garment/i);
  assert.doesNotMatch(prompt, /admin/i);
});

test("try-on asset public ids are stable and safe for Cloudinary paths", () => {
  assert.equal(
    buildTryOnAssetPublicId({
      productId: "product/one",
      userId: "user@example.com",
      timestamp: 123,
      kind: "output",
    }),
    "product-one-user-example-com-123-output",
  );
});
