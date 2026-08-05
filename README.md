# Ripartenza

Coach di corsa AI-assistito che unisce pianificazione dell'allenamento (in stile Runna: piano settimanale, allenamenti strutturati, sincronizzazione con l'orologio) e **principi di riabilitazione evidence-based** per chi vuole tornare o continuare a correre con infortuni pregressi, condizioni ortopediche (es. artrosi dell'anca) o dopo una lunga pausa.

Tre caratteristiche chiave:

1. **Base di conoscenza medica curata**, sintetizzata da letteratura scientifica (vedi `src/lib/medical/knowledgeBase.ts`), iniettata nel prompt dell'assistente così che ogni piano/consiglio resti ancorato a un protocollo graduato reale.
2. **Chiave API a scelta dell'utente (BYOK)**: inserisci la tua chiave OpenAI, Anthropic, Google o OpenRouter dalla pagina Impostazioni. La chiave viene cifrata (AES-256-GCM) prima di essere salvata.
3. **Integrazione diretta Garmin Connect**: l'assistente legge gli allenamenti svolti direttamente dal tuo account Garmin Connect e invia nuovi allenamenti strutturati al tuo orologio. Le credenziali vengono inserite dalla pagina Impostazioni e cifrate in modo sicuro.

---

## Stack tecnico

- **Next.js 14** (App Router, TypeScript) — frontend + API routes.
- **Supabase** — autenticazione utenti, Postgres con Row Level Security, storage delle chiavi cifrate.
- **Tailwind CSS** — design system custom.
- **Garmin Connect API** — integrazione diretta per il recupero attività e invio allenamenti.

---

## Setup

### 1. Requisiti
- Node.js 20+
- Un progetto [Supabase](https://supabase.com)
- Una chiave API di un provider AI (OpenAI, Anthropic, Google AI Studio o OpenRouter)
- Credenziali Garmin Connect (Email e Password)

### 2. Installazione

```bash
npm install
cp .env.example .env.local
```

Compila `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...        # dal tuo progetto Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

APP_ENCRYPTION_KEY=$(openssl rand -hex 32)

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Supabase

Nell'SQL editor di Supabase, esegui il contenuto di `supabase/schema.sql` e le eventuali migrazioni presenti in `supabase/migrations/`.

### 4. Avvio in locale

```bash
npm run dev
```

Vai su `http://localhost:3000`, registrati, poi accedi alla pagina **Impostazioni** per configurare la chiave AI e le credenziali Garmin Connect.
