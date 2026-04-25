## 2026-04-25 - [Database Query Parallelization]
**Learning:** Running `bun install` can silently corrupt the `bun.lock` file by inappropriately removing or updating dependencies if they don't exactly match the current lock state. Also, multiple sequential `await db.select()` queries can be easily wrapped in `Promise.all()` without changing the query logic.
**Action:** Use `git checkout HEAD bun.lock` after `bun install` if not instructed to update dependencies, and always identify independent database queries to run them concurrently with `Promise.all()`.
