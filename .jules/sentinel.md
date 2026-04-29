## 2025-02-27 - Replace Insecure Math.random with CSPRNG
**Vulnerability:** Weak PRNG `Math.random()` was being used to generate coupon codes, store credit codes, and combo IDs. `Math.random()` is not cryptographically secure and can be predictable.
**Learning:** For any code, token, or ID generation that requires uniqueness and unguessability, a cryptographically secure pseudo-random number generator (CSPRNG) must be used.
**Prevention:** Always use `crypto.getRandomValues()` (via `generateSecureCode` from `lib/utils.ts`) instead of `Math.random()` for code, token, and secret generation to ensure cryptographically secure randomness.
