## Code-audit fix plan

I'll work through your audit in priority order. Where appropriate I batch related fixes; where a fix would be too speculative or touches business decisions, I flag it for confirmation instead of doing it.

### Critical
1. **Route ordering (`App.tsx`)** — Move `/team/:employeeId` after `/team/beschikbaarheid`, `/team/verlof`, `/team/roosters` so the static routes win.
2. **Invoice download (`Subscription.tsx`)** — Wire the button to download the Stripe `hosted_invoice_url` / `invoice_pdf`. Plan: add an `invoice_pdf_url` (and/or `hosted_url`) column to `invoices`, populate from the existing Stripe webhook, and link the button to it. Disable only when no URL is present. *(Need confirmation: do you want me to also extend the Stripe webhook handler to backfill these columns on the next event, or generate a one-off backfill?)*
3. **Hardcoded Supabase creds (`client.ts`)** — Switch to `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env`). Note: the anon key is a publishable key so leaking it is not itself a security incident, but env-driven config is cleaner and required for multi-environment.

### High
4. **`flowType: "implicit"` → `"pkce"`** in `client.ts`. Verify the auth redirect flow on `auth.mydotts.nl` still completes (PKCE requires the code-exchange step `supabase.auth.exchangeCodeForSession` in `AuthCallback.tsx` — I'll add it).
5. **Query-key mismatch** — Align `AuthContext` invalidation to `["my_employee_id"]` (the key used by the hook). Also invalidate without orgId so all variants are refetched.
6. **Shift TZ bug (`ShiftDialog.tsx`)** — Replace `setHours` with `date-fns-tz` `fromZonedTime(..., "Europe/Amsterdam")` so shifts always store correct UTC regardless of the browser's TZ. Add `date-fns-tz` dependency.
7. **`as any` on `create_sale` (`Register.tsx:366`)** — Remove cast, type the params from `Database["public"]["Functions"]["create_sale"]["Args"]` and the return value from `Returns`.
8. **Storno reload preserves filters (`Sales.tsx`)** — After void, refetch in place using current filter state instead of resetting.
9. **`fetchGroups` loop (`ModifierGroups.tsx`)** — Remove `selectedId` from the `useCallback` deps; use a ref or move the selection sync into a separate effect.
10. **`manager` role permissions** — Update `useTeamPermissions` so `manager` gets `canEdit: true` and `canReviewTimeOff: true` (keeping `canSeeFinancial` owner-only). I'll grep for other `currentRole === "owner" || "admin"` checks in the team area and align them.
11. **CORS scoping (`email-receipt`)** — Replace wildcard with allow-list: `https://app.mydotts.nl`, `https://dotts-backoffice-core.lovable.app`, and the preview origin. Echo back matching `Origin`.

### Medium
12. **`sort_order` calc (`ProductEditor.tsx:432`)** — Use `Math.max(...c.map(x => x.sort_order ?? 0)) + 1`.
13. **Sequence dialog defaults (`Closing.tsx:169`)** — Fetch `cash_envelope_sequences` for current org and prefill.
14. **`loadShiftSales` org_id filter (`Closing.tsx:234`)** — Add `.eq("org_id", currentOrg.id)` defense-in-depth.
17. **`COALESCE(NULLIF(...))` migration** — Add a new migration that switches employee-update RPC to distinguish "field omitted" vs "explicit empty" (use a sentinel or separate "clear" flag). *(Need confirmation: which fields should be clearable? Email/phone/notes only, or everything?)*
18. **N+1 modifier-group save (`ProductEditor.tsx`)** — Replace loop with a single `upsert`/RPC. I'll batch into one `delete` + one `insert`.
19. **Last-category delete warning (`Categories.tsx:206`)** — Show a confirm dialog noting "X products will lose their category" with the affected count.

### Low (quick wins I'll include)
20. Read price from the active plan instead of hardcoding `€79`.
21. Replace `Record<string, any>` in `email-receipt` with proper interfaces.
22. Add a top-level `<ErrorBoundary>` in `App.tsx` rendering a friendly fallback + reload button.
23. Add `QueryClient` `defaultOptions.queries.onError` (and a mutation cache handler) that toasts errors via Sonner.
25. In `usePositionPermissions`, expose `loading` separately so callers can render a skeleton instead of "no access" while loading. Update the POS callsites that gate buttons.
26. Delete `src/pages/Index.tsx` (dead code).

### Skipping / needs your input
- **15 (Recente verkopen widget)** — implementing this is a feature, not a bugfix. Skipping unless you want it built now.
- **16 (DST calc in `Dashboard.tsx`)** — replace the manual offset code with `date-fns-tz` `fromZonedTime("YYYY-MM-DDT00:00:00", "Europe/Amsterdam")`. I'll include this; flagged here because the audit listed it medium.
- **24 (Welcome `setTimeout` race)** — replace with a polling `select` on `org_members` until the new membership is visible (max ~3s, then fail with a toast).

### Technical notes
- New dep: `date-fns-tz` (used in #6, #16).
- DB migrations: invoice URL column (#2), employee-update RPC change (#17 — pending answer).
- Edge function redeploy: `email-receipt` (#11, #21).
- No changes to RLS policies are required.

### Questions before I start
1. **Invoice PDFs**: OK to add `invoice_pdf_url` + `hosted_invoice_url` columns and populate from the Stripe webhook going forward (old invoices stay disabled until next event)? Or do you want a backfill?
2. **Clearable employee fields (#17)**: which fields should support being cleared back to NULL?
3. **`manager` role (#10)**: confirm managers should have full team edit + time-off review, but no financial visibility.
