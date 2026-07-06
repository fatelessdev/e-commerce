## 2024-07-06 - Missing Authorization in Admin Route Action
**Vulnerability:** The server action `getUserStoreCredits` in `lib/actions/admin.ts` lacked an authorization check.
**Learning:** Next.js server actions are publicly accessible API endpoints by default. Even if they reside in an admin-specific file like `lib/actions/admin.ts`, they must independently enforce authorization checks. The file location provides no inherent security boundary.
**Prevention:** Always add `await requireAdmin();` (or equivalent authorization checks) at the entry point of every sensitive server action, regardless of which file it is located in.
