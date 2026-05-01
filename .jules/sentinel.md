## 2026-05-01 - Insecure Randomness in Coupon Code Generation
**Vulnerability:** Weak PRNG (`Math.random()`) was being used to generate coupon and store credit codes, which could allow attackers to predict token values.
**Learning:** Security tokens and keys generated with Math.random() can expose logic vulnerabilities when the generated string is used for store credits or unique group IDs.
**Prevention:** Use a cryptographically secure pseudo-random number generator (CSPRNG), specifically `globalThis.crypto.getRandomValues`, implemented via the new `generateSecureCode` utility.
