## Obiettivo

Creare un utente Postgres dedicato (`analytics_rw`) da usare con un IDE esterno (DBeaver, TablePlus, ecc.) per:
- Leggere tutti i dati di `public`
- Eseguire `INSERT / UPDATE / DELETE` (datafix puntuali)
- **NON** poter eseguire DDL: niente `CREATE / ALTER / DROP TABLE`, niente modifiche a funzioni, triggers, policies, ruoli, enum

## Come funziona a livello Postgres

In Postgres i permessi DDL su una tabella appartengono SOLO al proprietario della tabella (o a un superuser). Quindi basta:

1. Creare il ruolo `analytics_rw` con `LOGIN` + password, **senza** `SUPERUSER`, **senza** `CREATEDB`, **senza** `CREATEROLE`.
2. Dargli `USAGE` sullo schema `public` (no `CREATE` → non può creare oggetti nello schema).
3. Dargli `SELECT, INSERT, UPDATE, DELETE` su tutte le tabelle esistenti di `public`.
4. Impostare i **default privileges** così che le tabelle future create dagli altri ruoli (es. dalle migrazioni Lovable) gli concedano automaticamente gli stessi DML.
5. Concedere `USAGE` sulle sequence (necessario quando fa `INSERT` su tabelle con `serial`/`identity`) ma **non** `UPDATE` sulle sequence.
6. Nessun grant su `auth`, `storage`, `vault`, `pgmq`, `realtime`, `supabase_functions` → quelle restano off-limits.

Risultato: l'utente può leggere/modificare dati ovunque in `public`, ma se prova `ALTER TABLE` / `DROP TABLE` / `CREATE TABLE` Postgres risponde `permission denied`.

Nota importante su RLS: i grant a un ruolo non-bypass-RLS sono comunque filtrati dalle policy. Per un account "datafix" da IDE serve poter vedere/modificare TUTTI i record, quindi `analytics_rw` riceverà l'attributo `BYPASSRLS`. Questo non gli dà DDL — solo gli toglie il filtro RLS sulle righe.

## Cosa farò in build mode

1. **Migrazione SQL** che esegue tutto quanto sopra. La password verrà letta da un secret `ANALYTICS_RW_PASSWORD` con `current_setting`, così non finisce hard-coded nella migrazione.
2. **Aggiunta del secret** `ANALYTICS_RW_PASSWORD` (te la chiederò io tramite il form sicuro — scegli tu il valore).
3. Ti fornirò le **stringhe di connessione pronte** per DBeaver, sia Session Pooler (porta 6543) sia Direct (porta 5432), usando l'host del tuo progetto.

## Dettagli tecnici della migrazione

```sql
-- 1. Ruolo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analytics_rw') THEN
    EXECUTE format(
      'CREATE ROLE analytics_rw LOGIN PASSWORD %L BYPASSRLS',
      current_setting('app.analytics_rw_password')
    );
  END IF;
END$$;

-- 2. Schema
GRANT USAGE ON SCHEMA public TO analytics_rw;
-- NOTA: niente GRANT CREATE ON SCHEMA public

-- 3. Tabelle esistenti
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO analytics_rw;

-- 4. Sequence (necessarie per INSERT con identity/serial)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO analytics_rw;

-- 5. Default privileges per oggetti FUTURI creati da postgres / supabase_admin
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO analytics_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO analytics_rw;
```

La password verrà iniettata via secret e poi `ALTER ROLE analytics_rw PASSWORD ...` se già esistente.

## Cosa NON farò

- Niente modifiche a schema `auth`, `storage`, `vault`, `pgmq`.
- Niente cambi a policies o tabelle esistenti.
- Niente creazione di nuove tabelle/funzioni applicative.

## Connessione da DBeaver (dopo la migrazione)

```
Host:     aws-1-eu-west-1.pooler.supabase.com
Porta:    6543               (Session Pooler — consigliata da IDE)
Database: postgres
User:     analytics_rw.vjvhaegbfjepysptcygz
Password: <quella che mi darai nel secret>
SSL:      require
```

Per connessione diretta (no pooler) host = `db.vjvhaegbfjepysptcygz.supabase.co`, porta `5432`, user `analytics_rw`.

## Domanda prima di procedere

Confermi che vuoi `BYPASSRLS` attivo (vedi/modifica TUTTE le righe ignorando le policy)? È la scelta giusta per "verifiche e datafix" da IDE, ma volevo essere esplicito perché significa che chiunque abbia quella password vede tutti i dati personali degli utenti — quindi va custodita come fosse la password admin.
