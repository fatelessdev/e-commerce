
## $(date +%Y-%m-%d) - Resolving N+1 queries during checkout validation
**Learning:** During checkout payload validation, untrusted arrays of cart items were iterating and performing individual database lookups (N+1 queries) to verify prices. This significantly hurts performance when the database latency is high or when verifying large carts.
**Action:** Always batch these database queries using Drizzle ORM's `inArray` operator before the loop, and store the results in a JavaScript `Map` for O(1) lookups during iteration. Remember to check if the input array is empty before executing the query to avoid invalid SQL with an empty IN clause.
