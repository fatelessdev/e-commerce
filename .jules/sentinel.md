## 2025-05-18 - Prevent XSS in JSON-LD Scripts
**Vulnerability:** XSS vulnerability through `dangerouslySetInnerHTML` injecting raw JSON-LD that may contain untrusted data with `<script>` breakout sequences (e.g. `</script><script>alert(1)</script>`).
**Learning:** `JSON.stringify` does not escape `<` or `>` characters, meaning unescaped stringified user-generated data embedded directly within `<script>` tags can result in XSS if interpreted by the browser parser before the JS parser.
**Prevention:** Use a utility function like `safeJsonLdStringify` that stringifies the data and then replaces all instances of `<` with `\u003c`. This prevents script breakout attacks while keeping the JSON semantically valid.
