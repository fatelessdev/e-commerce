## 2025-04-26 - Insecure Randomness in Coupon Codes
**Vulnerability:** Found `Math.random()` being used to generate coupon codes with financial value (e.g. store credit codes and bargain codes).
**Learning:** `Math.random()` is not cryptographically secure, and the sequence of generated numbers could potentially be predicted, exposing the app to brute-forcing or generation of valid unissued coupon codes.
**Prevention:** Always use cryptographically secure random number generators (e.g. `crypto.getRandomValues()`) when generating values associated with authorization, financial credits, or security contexts.
