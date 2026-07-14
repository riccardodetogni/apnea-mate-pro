# Landing page marketing su `/`

## Analisi del prototipo

Il file caricato è un bundle HTML standalone: hero dark con blobs decorativi ciano/blu, headline "Trova il tuo buddy, spot, sessioni, gruppi e scuole", card CTA su sfondo chiaro con gradient blu→ciano, poi sezioni chiare con feature card, blocco "chi è Apnea Mate" (Apneisti / Istruttori / Scuole), timeline "3 passi" con due tab (apneista / istruttore), e footer scuro con CTA finale.

## Cosa NON è coerente con il progetto (da adattare)

- Colori hardcoded (`#04121e`, `#1ec8ff`, `#2f6bff`, `#f5f8fb`) → vanno mappati sui token HSL già definiti in `src/index.css` (background, primary, primary-glow, card, muted, ecc.). Nessun `text-white`/`bg-black` diretto.
- Font di sistema → sostituire con lo stack usato dall'app (font già configurati in `tailwind.config.ts` / `index.css`).
- Icone inline SVG feature → riusare `BrandIcon` (`spot`, `buddy`, `gruppi`, `scuole`) già usato in ComingSoon per coerenza.
- Logo → usare il componente `Logo` (varianti `horizontal-white` in header dark, `horizontal` nel footer chiaro se serve).
- Testi solo IT → tutte le stringhe vanno in `src/lib/i18n.ts` con chiavi `landing*` in `it` e `en`, e il toggle IT/EN va in alto a destra come su ComingSoon.
- Assenza di routing: va integrato con React Router e `useAuth` per il redirect degli utenti loggati.
- Gradient CTA e blobs decorativi si mantengono ma espressi come `linear-gradient(...)` con `hsl(var(--primary))` / `hsl(var(--primary-glow))` (stessa filosofia di `variant="primaryGradient"` già usato).

## Cosa si mantiene fedele

- Composizione hero (blob decorativi, badge "PER CHI VIVE DI APNEA", H1 con seconda riga in accent, sottotitolo, card CTA, link "Scopri come funziona").
- Sezione "Cosa trovi dentro" con 3 feature card (Mappa spot / Gruppi, scuole & club / Crea le tue sessioni).
- Sezione "Una casa per tutta la community" con 3 righe (Apneisti / Istruttori / Scuole & club).
- Sezione "Dal click alla prima immersione, in 3 passi" con due tab (apneista / istruttore-scuola) e timeline numerata.
- Footer dark con logo, headline finale, CTA "Iscriviti ad Apnea Mate", copyright.
- Gerarchia tipografica e proporzioni.

## Implementazione

### 1. Routing (`src/App.tsx`)
- Sostituire `<Route path="/" element={<Navigate to="/auth" replace />} />` con `<Route path="/" element={<Landing />} />` (nuova pagina lazy-loaded).
- `Landing` esegue lo stesso check di `ComingSoon`: se `user` è già loggato → redirect a `/community` (se profilo completo) o `/onboarding`.

### 2. Nuova pagina `src/pages/Landing.tsx`
- Struttura React con sezioni: `<Hero />`, `<CtaBanner />` ("Quante volte…"), `<Features />`, `<Audience />` (apneisti/istruttori/scuole), `<HowItWorks />` con tab state locale, `<FinalCta />`.
- Toggle IT/EN riusando `useLanguage()` (stesso componente inline di ComingSoon).
- Due CTA principali:
  - "Scopri Apnea Mate →" → `navigate("/auth?mode=register")`
  - "Accedi" (header + link "Hai già un account?") → `navigate("/auth?mode=login")`
- Link "Scopri come funziona ↓" fa scroll ancora alla sezione `#how-it-works`.

### 3. Preselezione tab in `src/pages/Auth.tsx`
- Leggere `useSearchParams()`; se `mode === "register"` inizializzare `useState<AuthMode>("register")`, altrimenti "login". Default invariato.

### 4. i18n (`src/lib/i18n.ts`)
- Aggiungere chiavi `landingBadge`, `landingH1_line1`, `landingH1_line2`, `landingSubtitle`, `landingCtaPrimary`, `landingCtaSecondary`, `landingCtaCardTitle`, `landingCtaCardSubtitle`, `landingHasAccount`, `landingScrollHint`, `landingBannerTitle`, `landingBannerBody`, `landingBannerCta`, `landingFeaturesEyebrow`, `landingFeaturesTitle`, `landingFeatureSpotTitle/Desc`, `landingFeatureGroupsTitle/Desc`, `landingFeatureSessionsTitle/Desc`, `landingAudienceEyebrow`, `landingAudienceTitle`, `landingAudienceApneistiTitle/Desc`, `landingAudienceInstructorsTitle/Desc`, `landingAudienceSchoolsTitle/Desc`, `landingHowEyebrow`, `landingHowTitle`, `landingTabApneista`, `landingTabInstructor`, `landingStep1/2/3Title/Desc` per entrambi i flussi, `landingFinalTitle_line1/line2`, `landingFinalSubtitle`, `landingFinalCta`, `landingCopyright`. Traduzioni IT + EN.

### 5. Stile
- Usare classi Tailwind + token semantici. Le due palette (hero/footer dark vs sezioni intermedie chiare) esistono già come `--background` (dark navy) e possiamo introdurre un `--surface-light` opzionale in `index.css`, oppure semplicemente usare `bg-card` per le sezioni chiare — decisione durante l'implementazione, senza aggiungere hex hardcoded.
- Gradient CTA: `bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-glow))]` oppure riuso diretto di `variant="primaryGradient"` del Button.
- Blobs: due `<div>` posizionati assoluti con `radial-gradient` su token HSL con opacity, come già fatto in ComingSoon.
- Responsive mobile-first (l'app è mobile-first; `app-container` non serve qui perché è pagina full-width marketing).

### 6. Metadata (`index.html`)
- Aggiornare `<title>` e `<meta name="description">` per riflettere la landing (attualmente puntano a un titolo generico app). Aggiornare og:title/og:description coerentemente. Nessuna modifica GTM.

## File toccati

- `src/App.tsx` — cambia route `/`, aggiunge lazy `Landing`.
- `src/pages/Landing.tsx` — **nuovo**.
- `src/pages/Auth.tsx` — legge `?mode=` per preselezionare tab.
- `src/lib/i18n.ts` — nuove chiavi IT/EN.
- `index.html` — title/description marketing.

## Fuori scope

- Nessuna modifica a onboarding, auth logic, backend, o al vecchio `ComingSoon.tsx` (rimane in codebase, non routato — lo lasciamo lì come faceva prima).
- Nessuna nuova immagine generata; si usano solo Logo e BrandIcon esistenti.
- Nessun cambio al GTM appena installato.
