

# Add "Sessione a Pagamento" Checkbox to Create Session

## Summary

Add a "Paid session" checkbox with an info tooltip to the session creation form. This requires a new `is_paid` boolean column on the `sessions` table and UI changes to CreateSession, EditSession, and SessionDetails pages.

## Changes

### 1. Database migration
- Add `is_paid boolean not null default false` to `sessions` table

### 2. `src/pages/CreateSession.tsx`
- Add `is_paid: false` to form state
- Add a checkbox row after the "Creator joins" checkbox with:
  - Checkbox labeled "Sessione a pagamento"
  - An "ⓘ" icon wrapped in a Tooltip showing the disclaimer text
- Pass `is_paid: form.is_paid` in the insert call

### 3. `src/pages/EditSession.tsx`
- Add `is_paid` to form state, prefill from session data
- Add same checkbox + tooltip UI
- Include `is_paid` in the update call

### 4. `src/pages/SessionDetails.tsx`
- Show a "Sessione a pagamento" badge/indicator when `session.is_paid` is true

### 5. `src/lib/i18n.ts`
- Add keys:
  - `paidSession`: IT "Sessione a pagamento" / EN "Paid session"
  - `paidSessionDisclaimer`: IT (the full disclaimer text) / EN (translated version)

### Technical details
- Tooltip uses existing `Tooltip`/`TooltipTrigger`/`TooltipContent` from `@/components/ui/tooltip`
- Info icon: `Info` from lucide-react, sized `w-4 h-4`, styled `text-muted-foreground cursor-help`

