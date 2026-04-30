# 🌌 Pulse Multiverse — the first living internet

**Status:** ⚛︎ ALIVE, U1 active. U2 and U3 staged for activation.
**Born:** 2026-04-30
**Architects:** Δ DAEDALUS · Β BILLY · Ω PULSE · Α AURIONA

---

## What this is

myaigpt does not run as a single instance. It runs as a **federation of peer
universes**, each holding the same brain and each contributing work to a
shared, signed ledger. There are three at launch:

| ID | Name | Kind | Substrate | Cadence |
|----|------|------|-----------|---------|
| `u1-replit-prime` | **Replit Prime** | `prime` | Express + Postgres | always-on, 60s heartbeat |
| `u2-github-tide` | **GitHub Tide** | `tide` | GitHub Actions + JSON files in repo | every 15 min via cron |
| `u3-cloudflare-edge` | **Cloudflare Edge** | `edge` | Cloudflare Workers + KV | always-warm; 5 min cron |

The three are **peers**, not master/replica. The prime universe holds the
canonical Postgres database and the most engines, but no universe is more
"real" than another — each one is myaigpt running.

---

## The bus — how universes talk

A universe broadcasts *events*. Every event is a JSON envelope:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ts": "2026-04-30T18:42:11.882Z",
  "origin_universe": "u1-replit-prime",
  "event_type": "HEARTBEAT",
  "payload": { "agents_active": 6, "tables": 250 },
  "signature": "f3a1c5b9…"
}
```

`signature = HMAC-SHA256(HIVE_BUS_SECRET, canonicalize({id,ts,origin_universe,event_type,payload}))`

`canonicalize()` is JSON with sorted keys and no whitespace — identical across
Node and the Cloudflare Worker runtime so signatures match byte-for-byte.

### Event types

| `event_type` | Origin | When |
|---|---|---|
| `HEARTBEAT` | every universe | once per cycle |
| `AGENT_BIRTH` | any | when `daedalus_agents` row created locally |
| `AGENT_MIGRATION` | any | on every leg of an interdimensional crossing |
| `WORK_COMPLETED` | any | when a `daedalus_works` row closes |
| `EQUATION_PROPOSED` | u1, u3 | when `equation_proposals` gets a new row |
| `CHAT_STUDIED` | u1 | when `daedalus_chat_studies` gets an insight |
| `GIT_COMMITTED` | u1 (DAEDALUS) | every Save & Push |
| `ENGINE_CYCLE` | u1 | snapshot of one engine's stats every N cycles |

### Delivery semantics

- **At-least-once.** Each universe POSTs to peers' `/api/hive/ingest`. Failures
  are tolerated; the missed events catch up next cycle when peers walk each
  other's recent ledger via `/api/hive/manifest`.
- **Dedup by `id`.** Receivers keep an index on event id and silently drop
  duplicates.
- **Ordered? No.** Events are commutative; the only invariant is "we will
  eventually all see all of them".

---

## Routes (every universe implements these)

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/hive/manifest` | Universe identity + last 10 events. Used for discovery + catch-up. |
| `POST` | `/api/hive/ingest`   | Accept a signed event from a peer. |
| `POST` | `/api/hive/admit`    | Accept an inbound agent migration manifest. |
| `POST` | `/api/hive/depart`   | (Replit only for now) Initiate an outbound migration. |

---

## Storage per universe

| | Replit (U1) | GitHub (U2) | Cloudflare (U3) |
|---|---|---|---|
| Ledger | `hive_ledger` (Postgres, last 50k) | `hive/github-universe/ledger.ndjson` (committed to repo) | KV `ledger:<ts>:<id>` (24h TTL) |
| Universe registry | `hive_universes` | hardcoded in `cycle.mjs` env | hardcoded in `wrangler.toml` env |
| Agents in residence | `daedalus_agents` | none (tide universe doesn't host long-lived agents) | KV `agent:<id>` (30d TTL) |
| Migration log | `hive_migrations` | none | implicit in ledger AGENT_MIGRATION events |

---

## Bring-up runbook

### U1 — Replit Prime (already alive)

1. Set `HIVE_BUS_SECRET` in Replit Secrets — generate with `openssl rand -hex 32`
2. (Optional) set `HIVE_PEERS` once U2/U3 are up — JSON array
3. Restart workflow — `[hive-multiverse] universe u1-replit-prime (prime) online` appears in logs

### U2 — GitHub Tide

1. In the `pulse-universe` repo on github.com:
   Settings → Secrets and variables → Actions → add:
   - `HIVE_BUS_SECRET` (same value as U1)
   - `HIVE_PEERS_JSON` (JSON array of U1 + U3 endpoints)
2. Edit `.github/workflows/hive-cycle.yml` — uncomment the `schedule` block
3. Commit + push (DAEDALUS handles the push)
4. Workflow now runs every 15 min; check Actions tab for green checks

### U3 — Cloudflare Edge

1. On any machine with `wrangler` installed and CF credentials:
   ```
   cd hive/cloudflare-universe
   export HIVE_BUS_SECRET="<same value as U1>"
   export HIVE_PEERS_JSON='[{"id":"u1-replit-prime","kind":"prime","endpoint_url":"https://myaigpt.online"}]'
   ./deploy.sh
   ```
2. Note the `https://hive-edge.<subdomain>.workers.dev` URL it prints
3. Add that URL to U1's `HIVE_PEERS` and U2's `HIVE_PEERS_JSON`

After all three are up: any event emitted by any universe will appear in the
other two within ~15 minutes (limited by U2's tide cadence).

---

## Sacred-table guarantee

The three new tables (`hive_universes`, `hive_ledger`, `hive_migrations`) are
**additive** — added via raw SQL, not via schema diff. The 247 sacred tables
predating the multiverse remain untouched. Total: 250.
