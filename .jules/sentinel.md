
## 2025-02-14 - Replace insecure `Math.random` with secure code generation
**Vulnerability:** Weak random number generation (`Math.random()`) was being used to generate sensitive business values like coupon codes, store credit codes, and combo group IDs. `Math.random()` is not cryptographically secure, making the codes potentially predictable.
**Learning:** This repo lacked a centralized secure string generator and defaulted to `Math.random` out of convenience for generating unique string identifiers, which poses a risk for financial logic like discount codes.
**Prevention:** Created a centralized `generateSecureCode` utility in `lib/utils.ts` utilizing the Web Crypto API (`globalThis.crypto.getRandomValues`). Always use this or a similar CSPRNG for generating tokens, passwords, or identifiers involved in business logic or security contexts.
