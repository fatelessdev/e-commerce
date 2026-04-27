## 2025-04-27 - Predictable RNG for Discount Codes
**Vulnerability:** Use of `Math.random()` to generate bargain coupon codes and store credit codes. `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG), making codes predictable and susceptible to guessing or brute-force attacks if the internal state is compromised or patterns are analyzed.
**Learning:** For sensitive codes (like discounts or store credit), a cryptographically secure RNG must be used to ensure unpredictability.
**Prevention:** Created a reusable `generateSecureCode(prefix: string, length: number)` utility in `lib/utils.ts` utilizing `crypto.getRandomValues()`. Always use this pattern instead of `Math.random()` for code, token, and secret generation.
