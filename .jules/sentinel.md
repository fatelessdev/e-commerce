## 2024-10-25 - [Insecure Random Number Generation in Sensitive Codes]
**Vulnerability:** `Math.random()` was being used to generate coupon codes (BRG- codes) and store credit codes (CREDIT- codes). This is an insecure source of entropy.
**Learning:** `Math.random()` generates predictable sequences, making it vulnerable to brute force and prediction attacks where attackers could guess valid coupon or store credit codes.
**Prevention:** Always use the Web Crypto API (`globalThis.crypto.getRandomValues`) for cryptographically secure random number generation when generating tokens, secrets, passwords, or coupon codes. The `generateSecureCode` utility from `lib/utils.ts` encapsulates this securely.
