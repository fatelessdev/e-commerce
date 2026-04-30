## 2025-02-18 - Prevent Weak PRNG for Code and Token Generation
**Vulnerability:** The codebase was using `Math.random()` to generate important security-relevant tokens and codes such as coupon codes, store credit codes, and combo group IDs. `Math.random()` is not a cryptographically secure pseudorandom number generator (CSPRNG) and can be predictable.
**Learning:** For codes that act as tokens or have value (like store credit or coupons), predictable generation can lead to unauthorized code discovery, theft, or exploitation.
**Prevention:** Always use `crypto.getRandomValues()` (via the implemented `generateSecureCode` utility) when generating unpredictable strings like coupon codes, tokens, passwords, and sensitive identifiers.
