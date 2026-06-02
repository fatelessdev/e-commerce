import assert from "node:assert/strict"
import test from "node:test"
import { formatBargainDiscountLabel } from "./bargain/discount.ts"
import {
  calculateConfiguredDiscountCap,
  calculateMaxDiscount,
  calculateOfferAmount,
  shouldFinalizeThisRound,
} from "./bargain/logic.ts"
import { BARGAIN_SYSTEM_PROMPT } from "./bargain/prompt.ts"
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

test("bargain cap never exceeds configured product and combo limits", () => {
  const configuredCap = calculateConfiguredDiscountCap({
    cartItems: [
      { id: "p1", name: "Tee", quantity: 2, price: 700, comboId: "c1", comboGroupId: "g1" },
      { id: "p2", name: "Cargo", quantity: 2, price: 800, comboId: "c1", comboGroupId: "g1" },
      { id: "p3", name: "Cap", quantity: 1, price: 499 },
    ],
    productCaps: new Map([["p1", 80], ["p2", 90], ["p3", 40]]),
    combos: [{ id: "c1", productAId: "p2", productBId: "p1", discountAmount: "100" }],
  })

  assert.equal(configuredCap, 240)
  assert.equal(calculateMaxDiscount(3000, true, configuredCap).maxDiscount, 200)
})

test("bargain offers progress conservatively and finalize only after enough signal", () => {
  assert.equal(calculateOfferAmount(1, 200, null), 36)
  assert.equal(calculateOfferAmount(3, 200, 600), 18)
  assert.equal(shouldFinalizeThisRound(2, 200, 60, null, true, false), false)
  assert.equal(shouldFinalizeThisRound(3, 200, 68, null, true, false), true)
  assert.equal(shouldFinalizeThisRound(10, 200, 190, 500, false, true), true)
})
