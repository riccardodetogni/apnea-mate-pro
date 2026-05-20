## Obiettivo
Rendere il feedback/segnalazione bug sempre raggiungibile tramite un FAB globale persistente, mantenendolo discreto per non disturbare l'UX mobile-first.

## Cosa aggiungere

### 1. Nuovo componente `FeedbackFab`
`src/components/feedback/FeedbackFab.tsx`
- Piccolo bottone fluttuante circolare (40-44px), posizionato `fixed bottom-20 left-3` (sopra la BottomNav, lato opposto rispetto ai FAB esistenti come "+spot" che stanno a destra).
- Icona `MessageSquareWarning` (o `Bug`) da lucide-react.
- Stile glassmorphism coerente con il tema: `bg-card/80 backdrop-blur border border-border/50 shadow-lg text-card-foreground`.
- Tap → apre la `FeedbackSheet` esistente (stesso componente già usato in Profile, nessun cambio alla logica di invio).
- Nasconde se utente non autenticato (`useAuth`), in route di onboarding/auth, o quando `hideNav` è attivo (training/breathing).

### 2. Integrazione in `AppLayout`
`src/components/layout/AppLayout.tsx`
- Render `<FeedbackFab />` accanto a `<BottomNav />`, rispettando lo stesso flag `hideNav`.
- Così il bottone compare automaticamente in tutte le pagine autenticate principali (Community, Spots, Sessions, Groups, Profile, dettagli) senza toccarle una per una.

### 3. Mantenere l'entry esistente nel Profilo
La riga "Invia feedback" in `Profile.tsx` resta — chi cerca lì la trova. Il FAB è scoperta visiva, il menu profilo è il punto di riferimento.

### 4. i18n
Aggiungere in `src/lib/i18n.ts`:
- `feedbackFabLabel` → "Feedback" / "Feedback" (aria-label e tooltip).

## Non-goals (intenzionalmente esclusi)
- Niente nudge/tooltip una tantum (può essere aggiunto in seguito se serve).
- Niente modifiche alla `FeedbackSheet`, alla edge function di invio o allo schema DB.
- Niente nuova voce nella BottomNav (vincolo memory: 5 tab fisse).
- Niente FAB su /spots overlay mappa? → Va valutato: c'è già il FAB "+ Aggiungi spot" a destra; il feedback FAB sta a sinistra quindi non collide.

## Dettagli tecnici
- Z-index: sotto eventuali Dialog/Sheet (`z-30` basta; BottomNav è già `z-40`+).
- Safe-area: usare `pb-[env(safe-area-inset-bottom)]` nel calcolo del bottom su iOS Capacitor.
- Accessibilità: `aria-label` localizzato, `role="button"`, focus ring tematizzato.
