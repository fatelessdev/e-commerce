## 2024-05-26 - Add Security Headers

**Vulnerability:** Missing `Strict-Transport-Security` (HSTS) header and presence of `X-Powered-By` header exposing the tech stack.
**Learning:** These are common misconfigurations that can lead to man-in-the-middle attacks or provide attackers with unnecessary information about the server infrastructure.
**Prevention:** Added `poweredByHeader: false` and the `Strict-Transport-Security` header to `next.config.ts`.
