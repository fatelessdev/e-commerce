
## 2024-05-18 - Insecure Random Number Generation for Security Tokens
**Vulnerability:** Weak PRNG (`Math.random()`) was being used for generating sensitive tokens, including coupon codes (`app/api/bargain/route.ts`), store credit codes (`lib/actions/admin.ts`), and combo group IDs (`lib/cart-context.tsx`).
**Learning:** `Math.random()` is not cryptographically secure, and the sequence of generated numbers could potentially be predicted, leading to possible generation of valid coupon codes or tokens.
**Prevention:** Use the Web Crypto API `globalThis.crypto.getRandomValues` implemented in `generateSecureCode` (in `lib/utils.ts`) to securely generate randomness for codes, tokens, or IDs that should not be predictable.
