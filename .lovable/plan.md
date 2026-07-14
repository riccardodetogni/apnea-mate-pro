## Rework the footer contact into a quiet, compact strip

**Problem:** The glass "CONTACT" card competes visually with the "Join Apnea Mate" CTA right above it. Contact is secondary info; it shouldn't look like a second call to action.

**Scope:** `src/pages/Landing.tsx` only (final dark section footer). No i18n changes — reuse `landingContactTitle` and drop the eyebrow + separate CTA button.

### New structure

Replace the glass card + separate logo/copyright row with a single, low-key footer strip separated from the CTA by a hairline divider:

```text
────────────────────────────────────────────
Logo   Per informazioni o supporto — support@apneamate.com   © 2026 Apnea Mate S.r.l.s.
```

- One flex row, wraps to stacked/centered on mobile (`flex-col sm:flex-row`, `justify-between`, `gap-3`).
- Top hairline border (`border-top: 1px solid hsl(0 0% 100% / 0.08)`), `mt-16 pt-6`.
- Left: `Logo variant="horizontal-white"` at `h-5`, `opacity-60`.
- Middle: `t("landingContactTitle")` in `text-xs text-white/50`, followed by an em-dash and the `mailto:` link. Link uses `text-white/70 hover:text-white underline-offset-4 hover:underline`, no pill, no icon, no background.
- Right: `text-xs text-white/40` copyright.
- Remove the glass card, the `Mail` icon usage, the accent-color eyebrow, and the standalone logo+©️ row.
- Drop `landingContactEyebrow` and `landingContactCta` usage from `Landing.tsx` (leave keys in `i18n.ts` untouched; harmless).
- Remove the now-unused `Mail` import.

**Result:** contact info is present and readable but visually recedes below the "Join Apnea Mate" CTA — one coherent footer line instead of a competing card.