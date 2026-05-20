## Messaggi in tempo reale

Le notifiche già funzionano in realtime (`useNotifications` sottoscrive `postgres_changes`). I **messaggi chat** invece fanno polling ogni 10 s e la lista conversazioni non si aggiorna affatto — da qui la sensazione di "fermo".

### Cosa fare

1. **Abilitare Realtime sulle tabelle chat** (migration):
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`
   - `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;`
   - Impostare `REPLICA IDENTITY FULL` su entrambe per ricevere i payload completi.

2. **`src/hooks/useChat.ts`** — sostituire `refetchInterval: 10000` con una subscription:
   - Canale `messages-{conversationId}` con filter `conversation_id=eq.{id}`, evento `INSERT`.
   - Su evento → `queryClient.invalidateQueries(["chat-messages", conversationId])`.
   - Cleanup con `removeChannel` allo unmount / cambio conversazione.

3. **`src/hooks/useConversations.ts`** — aggiungere subscription globale all'utente:
   - Canale `conversations-{userId}` su `messages` (INSERT) per refresh della lista e badge "non letti".
   - Invalidare `["conversations"]` ad ogni evento.

### Note tecniche
- RLS già garantisce che i payload Realtime arrivino solo ai partecipanti della conversazione (policy `is_conversation_participant`).
- Nessuna modifica al DB schema o alle policy.
- Il polling viene rimosso: la subscription è sufficiente.
