import assert from "node:assert/strict"
import test from "node:test"
import { formatBargainDiscountLabel } from "./bargain-discount.ts"
import { BARGAIN_SYSTEM_PROMPT } from "./bargain-prompt.ts"
import { BARGAIN_BOT_BANNER_MESSAGE } from "./constants.ts"

test("returns null label when max bargain discount is missing or zero", () => {
  assert.equal(formatBargainDiscountLabel(null), null)
  assert.equal(formatBargainDiscountLabel(undefined), null)
  assert.equal(formatBargainDiscountLabel("0"), null)
})

test("formats bargain strip label from server max discount", () => {
  assert.equal(formatBargainDiscountLabel("250"), "Bargain up to ₹250")
  assert.equal(formatBargainDiscountLabel("250.5"), "Bargain up to ₹250.5")
})

test("uses a short bargain bot announcement copy", () => {
  assert.ok(BARGAIN_BOT_BANNER_MESSAGE.includes("Bargain Bot"))
  assert.ok(BARGAIN_BOT_BANNER_MESSAGE.toLowerCase().includes("negotiate"))
})

test("bargain bot prompt disallows vulgar abuse and slurs", () => {
  const prompt = BARGAIN_SYSTEM_PROMPT.toLowerCase()

  assert.ok(prompt.includes("slurs"))
  assert.ok(prompt.includes("profanity"))
  assert.ok(prompt.includes("hindi"))
  assert.ok(!prompt.includes("bakchodi"))
  assert.ok(!prompt.includes("extreme abuse"))
})
