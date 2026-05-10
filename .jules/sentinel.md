
## 2024-05-30 - Insecure Randomness in Code Generation
**Vulnerability:** Usage of `Math.random()` to generate secure codes like coupons and store credit, which can be easily guessed/predicted.
**Learning:** `Math.random()` should never be used for security-sensitive random number generation, such as tokens, codes, or secrets, as it is predictable.
**Prevention:** Always use `globalThis.crypto.getRandomValues()` or a cryptographically secure random number generator utility function.
