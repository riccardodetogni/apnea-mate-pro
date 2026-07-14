## Localize + polish the footer contact block

**Scope:** `src/pages/Landing.tsx` footer + `src/lib/i18n.ts` (IT/EN strings). No layout changes elsewhere.

### 1. Add i18n keys
In `src/lib/i18n.ts`, add to both IT and EN dictionaries:
- `landingContactEyebrow` — IT: `"Contatti"` · EN: `"Contact"`
- `landingContactTitle` — IT: `"Per informazioni o supporto"` · EN: `"For info or support"`
- `landingContactCta` — IT: `"Scrivici"` · EN: `"Get in touch"`

### 2. Redesign the contact block (footer of final CTA section)
Replace the current plain stack with a subtle glass card, so it reads as a real "Contact" module instead of loose text:

```text
┌─────────────────────────────────────┐
│  CONTATTI                           │  ← eyebrow, accent color, tracking
│  Per informazioni o supporto        │  ← white, medium weight
│                                     │
│  [ ✉  support@apneamate.com ]       │  ← pill button, glass bg, hover lift
└─────────────────────────────────────┘
        Logo · © 2026 Apnea Mate S.r.l.s.
```

Details:
- Card: `rounded-2xl`, `bg: hsl(0 0% 100% / 0.06)`, `border: 1px solid hsl(0 0% 100% / 0.10)`, `backdrop-blur`, padded, centered.
- Eyebrow uses the same styling as other section eyebrows (uppercase, tracking-[0.18em], accent color).
- Mail link becomes an inline-flex pill with a `Mail` icon (lucide) + address, `hover:bg-white/10` transition.
- Below the card, keep logo + copyright on a single subtle line separated by a middot, smaller and more muted, no top border (the card already provides separation).
- Wire all copy through `t(...)`; the mail address stays literal.

**Result:** contact section becomes a proper localized module that matches the rest of the landing's glass/accent language, instead of three stacked lines of text.