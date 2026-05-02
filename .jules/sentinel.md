## 2024-05-02 - Insecure Randomness in Code Generation
**Vulnerability:** Weak pseudo-random number generator `Math.random()` was used for generating sensitive items like coupon codes and store credits.
**Learning:** `Math.random()` is not cryptographically secure and its outputs can be predicted, allowing an attacker to potentially guess valid coupon codes or store credit codes.
**Prevention:** Always use `generateSecureCode()` from `@/lib/utils` which leverages the Web Crypto API (`crypto.getRandomValues()`) for cryptographically secure randomness.
