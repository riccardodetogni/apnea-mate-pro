## Usare il pittogramma del logo come sfondo dell'hero

Hai ragione — nel prototipo lo sfondo non sono onde generiche, è **il pittogramma di Apnea Mate** ingrandito e ripetuto/decentrato in versione desaturata. Uso l'asset che già esiste (`apnea_mate_pittogramma_white.png` — la variante bianca è perfetta perché è mono-color e si può gestire con opacità/blend).

### Cosa faccio

1. **`src/pages/Landing.tsx` — hero**
   - Aggiungo un layer decorativo `absolute inset-0 pointer-events-none` dentro la `<section>` dell'hero, sotto ai radial-gradient esistenti.
   - Dentro, 2–3 `<img>` del pittogramma bianco posizionati assoluti:
     - uno grande a sinistra (~90–120% dell'altezza dell'hero), leggermente ruotato e traslato fuori bordo
     - uno più piccolo in alto a destra
     - uno molto grande in basso a destra tagliato dal viewport
   - Opacità bassa (~0.06–0.10) così restano "watermark" senza rubare leggibilità al testo bianco e alla CTA card.
   - `select-none`, `draggable={false}`, `alt=""`, `aria-hidden`.
   - Su mobile riduco numero/dimensione (nascondo i due secondari con `hidden sm:block`) per non affollare.

2. **Sezione finale (dark)** — stessa logica ma un solo pittogramma centrato dietro al titolo, opacità ~0.05, per chiudere coerente con l'hero.

3. **Import dell'asset**
   - L'immagine `/assets/icons/*` è già in `public/`. Verifico se `apnea_mate_pittogramma_white.png` esiste già nel progetto; se no, la aggiungo in `public/assets/brand/` (l'ho fra i file caricati da te) e la referenzio via path assoluto — nessun hash Vite necessario, comportamento identico a `BrandIcon`.

4. **Nessuna modifica** a token, i18n, routing, `Auth.tsx`, `index.html`, `Logo.tsx`.

### Note tecniche
- Uso la versione **bianca** del pittogramma perché è già mono-color: opacità bassa su sfondo scuro dà l'effetto azzurrino del prototipo senza filtri CSS (che sono vietati sui BrandIcon, e per coerenza non li uso nemmeno qui).
- Nessun colore hardcoded, nessun `text-white` nuovo, nessun asset base64 inline.
- `pointer-events-none` sul wrapper così non intercetta i click sui bottoni.

### Fuori scope
- Non ridisegno SVG di onde.
- Non tocco layout, copy, CTA, tab "come funziona", features, audience.