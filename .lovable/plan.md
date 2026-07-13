Installazione Google Tag Manager (container `GTM-P2Q3226K`) in `index.html`.

## Modifiche

**File:** `index.html` (unico file toccato)

1. Aggiungere lo snippet `<script>` GTM in cima al `<head>`, subito dopo `<meta name="viewport">` (il più in alto possibile, prima di title/meta/OG così viene caricato per primo).

2. Aggiungere lo snippet `<noscript><iframe>` subito dopo `<body>`, prima di `<div id="root">`.

## Codice inserito

Nel `<head>`:
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P2Q3226K');</script>
<!-- End Google Tag Manager -->
```

Nel `<body>`:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P2Q3226K"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Note

- Il `<noscript>` va nel `<body>`, non nel `<head>` (vincolo HTML5 già rispettato nelle istruzioni di Google).
- Nessuna modifica a React, routing, auth, o codice applicativo.
- Nessun impatto su iOS/Android/webview: script async standard.
- Dopo il deploy, GTM sarà attivo su tutte le pagine (web e Capacitor webview). Da GTM Console potrai poi collegare GA4 o altri tag senza toccare il codice.
- Se in futuro serve tracciare eventi custom (login, join session, ecc.), si potrà pushare su `window.dataLayer` — ma non fa parte di questo task.
