import assert from "node:assert/strict"
import test from "node:test"
import { parsePublicProductPagination, validateCartQuantities } from "./checkout/validation.ts"

test("clamps public product pagination to safe bounds", () => {
  assert.deepEqual(parsePublicProductPagination("1000", "-20"), {
    limit: 50,
    offset: 0,
  })
})

test("falls back when pagination params are invalid", () => {
  assert.deepEqual(parsePublicProductPagination("oops", "NaN"), {
    limit: 50,
    offset: 0,
  })
})

test("rejects invalid or abusive cart quantities", () => {
  assert.equal(validateCartQuantities([{ quantity: 1 }, { quantity: 10 }]), true)
  assert.equal(validateCartQuantities([{ quantity: 0 }]), false)
  assert.equal(validateCartQuantities([{ quantity: 11 }]), false)
  assert.equal(validateCartQuantities([{ quantity: 1.5 }]), false)
})
