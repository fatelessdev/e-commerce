## 2024-05-17 - AI Chat Interfaces Accessibility and Feedback
**Learning:** Found that AI chat interfaces often use icon-only submit buttons without proper ARIA labels and lack clear visual loading states during asynchronous responses, leading to poor accessibility and UX.
**Action:** Always verify that icon-only buttons in chat interfaces have descriptive `aria-label`s and display a loading spinner (`Loader2`) when awaiting a response.
