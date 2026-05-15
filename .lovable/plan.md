## Diagnosi

L'URL del link è corretto: `https://apnea-mate-pro.com/unsubscribe?token=...`

La rotta `/unsubscribe` **esiste già** in `src/App.tsx` ed è collegata alla pagina `src/pages/Unsubscribe.tsx` (l'abbiamo aggiunta in questa sessione). Funziona infatti in preview — il routing è corretto.

**Causa del 404:** la rotta `/unsubscribe` è stata aggiunta dopo l'ultima pubblicazione. Il sito live su `apnea-mate-pro.com` sta servendo la versione precedente del codice, che non conosce la rotta `/unsubscribe` → di conseguenza il server risponde 404.

## Fix

Non serve modificare codice. Basta **ripubblicare** il progetto. Una volta pubblicato:

- `apnea-mate-pro.com/unsubscribe?token=...` caricherà la pagina `Unsubscribe.tsx`
- Il token verrà validato dall'edge function `handle-email-unsubscribe` (già deployata)
- L'utente vedrà la conferma e potrà cancellarsi

## Verifica post-publish

1. Aprire il link del footer email su un browser → deve mostrare la card "Vuoi cancellarti?"
2. Cliccare "Conferma cancellazione" → deve mostrare "Fatto ✅"
3. Riapertura dello stesso link → deve mostrare "Già cancellato"
4. Controllo opzionale lato dati: la mail deve apparire in `suppressed_emails` con `reason = 'unsubscribe'`

## Note

- Tutti i nuovi link unsubscribe inviati da ora useranno l'URL corretto del custom domain (l'email infrastructure di Lovable usa il published URL del progetto).
- Le email **già inviate prima** del publish puntano comunque allo stesso URL `/unsubscribe`, quindi una volta pubblicato funzioneranno anche quelle (i token sono salvati in DB e non scadono).
