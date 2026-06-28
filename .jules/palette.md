## 2024-03-24 - Missing id/htmlFor attribute pattern in admin forms
**Learning:** Found a recurring pattern in `app/admin/products/new/page.tsx` where form inputs lacked `id` attributes and their associated `<label>` tags lacked `htmlFor` attributes. This breaks accessibility for screen readers and prevents users from clicking labels to focus inputs.
**Action:** Always ensure that form inputs have unique `id` attributes and are explicitly associated with their labels using `htmlFor`. This is a crucial accessibility pattern for complex admin forms with many fields.
