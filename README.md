# Pizzora — Voice AI Ordering System

Pizzora is a production-ready Voice AI ordering system for pizzerias. It receives call transcripts from a voice AI service, uses Claude to parse the order, calculates totals, saves everything to Supabase, and routes the order to the pizzeria's POS system.

## How It Works

1. A customer calls the pizzeria
2. The voice AI service handles the call and sends a webhook to Pizzora
3. Pizzora looks up the pizzeria by phone number
4. Claude reads the transcript + menu and extracts the order as structured JSON
5. The order is saved to Supabase and sent to the POS (Toast, Square, or Clover)
6. If the POS fails, the order is flagged `pos_failed` — it is always saved

## Tech Stack

- **Frontend + API:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude claude-sonnet-4-20250514 via Anthropic API
- **Hosting:** Vercel

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
TOAST_API_KEY=
SQUARE_ACCESS_TOKEN=
CLOVER_API_KEY=
```

## How to Onboard a New Pizzeria

**Step 1 — Add the location**

POST to `/api/locations`:
```json
{
  "name": "Mario's Pizza",
  "phone_number": "+15551234567",
  "pos_type": "toast",
  "pos_api_key": "their-toast-api-key",
  "tax_rate": 0.0875
}
```

**Step 2 — Add the menu**

Insert rows into the `menus` table in Supabase using the `location_id` from Step 1. Each row needs: `item_name`, `base_price`, `category`, and optionally `available_modifiers`.

**Step 3 — Configure the voice AI webhook**

Point the voice AI to `https://your-domain.com/api/webhook/order`. Payload format:
```json
{
  "phone_number": "+15551234567",
  "caller_name": "John",
  "delivery_address": "123 Main St",
  "transcript": "I'd like a large pepperoni...",
  "call_recording_url": "https://...",
  "call_duration": 87
}
```

**Step 4 — Test it**

Send a test webhook and check the Dashboard to confirm the order appears.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/order` | Receive transcript, parse and route order |
| GET | `/api/locations` | List all locations |
| POST | `/api/locations` | Add a new location |
| PUT | `/api/locations/:id` | Update a location |
| GET | `/api/orders/:location_id` | Order history for a location |
| GET | `/api/health` | Health check |
