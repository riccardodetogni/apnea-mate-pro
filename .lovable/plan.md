

# Fix Chat nelle Sessioni (e Gruppi)

## Problema principale

La RLS policy sulla tabella `conversations` per SELECT richiede `is_conversation_participant(auth.uid(), id)`. Quando un utente clicca "Chat" per la prima volta:

1. `getOrCreateSessionConversation` fa una SELECT per cercare la conversazione esistente
2. La conversazione **esiste** (creata dal primo utente), ma la RLS **nasconde** il risultato perché l'utente corrente non è ancora un participant
3. Il codice pensa che la conversazione non esista → tenta di crearne una nuova
4. L'INSERT fallisce per il vincolo `conversations_unique_session`
5. Il retry SELECT fallisce per lo stesso motivo RLS
6. → Errore "Failed to create session conversation"

Lo stesso problema affligge `getOrCreateGroupConversation`.

## Soluzione

Creare una funzione database `SECURITY DEFINER` che cerca la conversazione per `session_id` (o `group_id`) bypassando la RLS, e la chiama dal client tramite RPC.

## Modifiche

### 1. Migrazione database — funzione RPC `find_conversation_by_session`

```sql
CREATE OR REPLACE FUNCTION public.find_conversation_by_session(_session_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM conversations
  WHERE session_id = _session_id AND type = 'session'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.find_conversation_by_group(_group_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM conversations
  WHERE group_id = _group_id AND type = 'group'
  LIMIT 1;
$$;
```

### 2. `src/hooks/useConversations.ts`

Modificare `getOrCreateSessionConversation`:
- Sostituire la SELECT diretta con `supabase.rpc('find_conversation_by_session', { _session_id: sessionId })`
- Se ritorna un ID, fare upsert del participant corrente e ritornare l'ID
- Se ritorna null, creare conversazione + participant
- Stessa cosa nel retry dopo errore INSERT

Modificare `getOrCreateGroupConversation`:
- Stessa logica con `supabase.rpc('find_conversation_by_group', { _group_id: groupId })`

### 3. `src/pages/SessionDetails.tsx` — pulizia

- Nella onClick del bottone Chat (riga 463-472), passare `user!.id` come secondo parametro invece di `session.creator_id`, dato che la funzione helper già gestisce l'upsert del participant
- Rimuovere il secondo upsert duplicato (righe 467-470) che è già fatto dentro la helper function

## File coinvolti
- 1 migrazione SQL (2 funzioni)
- `src/hooks/useConversations.ts` — usare RPC invece di SELECT diretta
- `src/pages/SessionDetails.tsx` — pulizia chiamata

## Note tecniche
- Le funzioni SECURITY DEFINER bypassano la RLS, quindi qualsiasi utente autenticato può trovare una conversazione per session/group ID
- Questo è sicuro perché l'utente viene comunque aggiunto come participant prima di poter leggere i messaggi (la RLS sui messages resta invariata)
- Nessun impatto sulle DM (che usano un approccio diverso basato sui participant dell'utente corrente)

