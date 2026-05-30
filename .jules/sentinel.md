## 2024-05-30 - Prevent SQL Injection by Avoiding Raw SQL in Drizzle ORM
**Vulnerability:** Use of raw SQL template string `sql\`${coupons.code} LIKE 'CREDIT-%'\`` for string matching.
**Learning:** While Drizzle's `sql` template tag can sometimes automatically parameterize values, improper usage or future modifications where variables are concatenated directly instead of passed as parameters can lead to SQL injection vulnerabilities. Drizzle provides safer, built-in query builder methods for most operations.
**Prevention:** Always use Drizzle's built-in operators like `like(column, value)` instead of constructing raw SQL conditions when performing standard operations like string matching.
