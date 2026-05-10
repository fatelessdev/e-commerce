## 2024-05-10 - Fix N+1 query bottleneck in checkout route
**Learning:** When validating untrusted cart payloads (like in `app/api/razorpay/verify/route.ts`), executing a database query inside the loop for each item creates a serious N+1 query problem that scales poorly and can cause performance bottlenecks or timeout errors.
**Action:** Use Drizzle's `inArray` operator to batch fetch all necessary product records before the loop, and store them in a JavaScript `Map` keyed by ID for O(1) constant time lookups inside the loop.
