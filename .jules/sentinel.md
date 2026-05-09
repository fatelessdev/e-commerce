## 2024-03-24 - Remove Insecure Hardcoded Authentication Secret
**Vulnerability:** Found a hardcoded fallback secret (`"xilar-local-dev-secret-change-in-production"`) for `BETTER_AUTH_SECRET` in `lib/auth.ts`.
**Learning:** Hardcoding secrets as fallbacks, even with comments like "change-in-production", is insecure because developers might deploy to production without setting the environment variable, leading to a weak, known secret being used.
**Prevention:** Always enforce required cryptographic secrets to be provided via environment variables. Throw an error at the module or startup level if they are missing, ensuring the application fails securely rather than starting with a known vulnerability.
