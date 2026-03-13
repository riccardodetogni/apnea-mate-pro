

## Chat Unificata -- Piano di Implementazione

### Concept

Una sezione **Messaggi** accessibile dalla bottom nav, che mostra tutte le conversazioni in un'unica lista (stile WhatsApp). Ogni conversazione può essere di 3 tipi:
- **Sessione**: chat tra i partecipanti di una sessione
- **Gruppo**: chat tra i membri di un gruppo
- **Diretta (DM)**: conversazione 1-a-1 tra due utenti

### Database (2 nuove tabelle)

**`conversations`** -- una riga per ogni chat
| Colonna | Tipo | Note |
|---------|------|-------|
| id | uuid PK | |
| type | text | `'session'`, `'group'`, `'dm'` |
| session_id | uuid nullable | FK → sessions, per type=session |
| group_id | uuid nullable | FK → groups, per type=group |
| created_at | timestamptz | |

**`messages`** -- i messaggi
| Colonna | Tipo | Note |
|---------|------|-------|
| id | uuid PK | |
| conversation_id | uuid FK | → conversations |
| sender_id | uuid | user id |
| content | text | testo del messaggio |
| created_at | timestamptz | |

**`conversation_participants`** -- chi partecipa (per DM e per tracking "ultimo letto")
| Colonna | Tipo | Note |
|---------|------|-------|
| id | uuid PK | |
| conversation_id | uuid FK | |
| user_id | uuid | |
| last_read_at | timestamptz nullable | per badge "non letto" |
| joined_at | timestamptz | |

### RLS Policies
- **conversations**: SELECT se l'utente è in `conversation_participants` OR è membro del gruppo/sessione collegata
- **messages**: SELECT/INSERT se l'utente partecipa alla conversazione
- **conversation_participants**: SELECT se user è partecipante, INSERT/UPDATE solo per il proprio record

### Logica di creazione conversazioni
- **Sessione**: la conversazione si crea automaticamente quando la sessione viene creata (o al primo messaggio). Tutti i partecipanti confermati + creatore vi accedono.
- **Gruppo**: la conversazione si crea quando il gruppo viene creato. Tutti i membri approvati vi accedono.
- **DM**: si crea al primo messaggio. Si cerca prima se esiste già una conversazione DM tra i due utenti.

### UI -- Nuove pagine e componenti

1. **`/messages`** -- Lista conversazioni (nuova tab nella bottom nav, icona `MessageCircle`)
   - Lista ordinata per ultimo messaggio
   - Ogni riga: avatar, nome (sessione/gruppo/utente), preview ultimo messaggio, timestamp, badge non letti
   - FAB per "Nuovo messaggio" (cerca utente per DM)

2. **`/messages/:conversationId`** -- Thread di chat
   - Header con nome conversazione e back button
   - Lista messaggi scrollabile (bubble layout, miei a destra, altri a sinistra)
   - Input in basso con bottone invio
   - Polling ogni 10s con `useQuery` + `refetchInterval`

3. **Accesso rapido da contesti esistenti**
   - **SessionDetails**: bottone "Chat" che naviga alla conversazione della sessione
   - **GroupDetails**: bottone "Chat" che naviga alla conversazione del gruppo
   - **UserProfile**: bottone "Messaggio" che crea/apre DM

### Polling
- Lista conversazioni: `refetchInterval: 15000` (15s)
- Thread attivo: `refetchInterval: 10000` (10s)
- Badge non letti nella bottom nav: `refetchInterval: 30000` (30s)

### Bottom Nav
Aggiungere icona **Messaggi** (con badge contatore non letti) alla barra inferiore. Attualmente ci sono 4 tab -- diventa 5: Community, Spots, Messaggi, Training, Profile.

### Files da creare/modificare
1. **Migration SQL**: crea `conversations`, `messages`, `conversation_participants` + RLS + indici
2. `src/hooks/useConversations.ts` -- lista conversazioni con ultimo messaggio
3. `src/hooks/useChat.ts` -- messaggi di una conversazione + invio + polling
4. `src/pages/Messages.tsx` -- lista conversazioni
5. `src/pages/ChatThread.tsx` -- thread singolo
6. `src/components/chat/ConversationItem.tsx` -- riga nella lista
7. `src/components/chat/ChatBubble.tsx` -- bolla messaggio
8. `src/components/chat/ChatInput.tsx` -- input messaggio
9. `src/components/layout/BottomNav.tsx` -- aggiungere tab Messaggi + badge
10. `src/pages/SessionDetails.tsx` -- bottone "Chat sessione"
11. `src/pages/GroupDetails.tsx` -- bottone "Chat gruppo"
12. `src/pages/UserProfile.tsx` -- bottone "Messaggio"
13. `src/App.tsx` -- nuove routes `/messages` e `/messages/:id`
14. `src/lib/i18n.ts` -- chiavi traduzione

### Ordine di implementazione
1. Migration DB (tabelle + RLS + indici)
2. Hooks (`useConversations`, `useChat`)
3. Componenti chat (bubble, input, item)
4. Pagine (Messages, ChatThread)
5. Integrazione (BottomNav, SessionDetails, GroupDetails, UserProfile, routes)

