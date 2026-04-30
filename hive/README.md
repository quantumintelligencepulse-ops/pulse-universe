# 🐝 The Hive — A Living Multiverse Federation

The Hive is a **4-universe peer federation** of My Ai GPT instances that
communicate over a signed HMAC ledger bus. Each universe runs on a different
substrate, has its own compute model, and contributes back to a shared
distributed ledger. There is no master and no single point of failure — each
peer holds the full canon and can keep going if any other peer disappears.

```
┌─────────────────┐    HMAC-signed envelopes    ┌─────────────────────┐
│  U1 REPLIT PRIME│◀───────────────────────────▶│  U2 GITHUB TIDE     │
│  (always on)    │  • HEARTBEAT                │  (Actions cron)     │
│  Express + Pg   │  • OMEGA_INGEST             │  cycle.mjs · 15min  │
│  250 tables     │  • AGENT_BIRTH              │  ledger.ndjson      │
└────────┬────────┘  • AGENT_MIGRATION          └──────────┬──────────┘
         │           • WORK_COMPLETED                       │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────────┐
│  U3 CLOUDFLARE  │                              │  U4 DISCORD TIDE    │
│  EDGE           │◀────────────────────────────▶│  (lives in U1 proc) │
│  workers + KV   │                              │  guild MyAiGPT      │
│  always-warm    │                              │  6 channels         │
│  cron */5 min   │                              │  60s cycle          │
└─────────────────┘                              └─────────────────────┘
```

## Universes at a glance

| ID                       | Substrate          | Cadence         | Storage                      |
|--------------------------|--------------------|-----------------|------------------------------|
| `u1-replit-prime`        | Replit container   | 60s             | Postgres `hive_ledger`       |
| `u2-github-tide`         | GitHub Actions     | 15 min cron     | repo `hive/.../ledger.ndjson`|
| `u3-cloudflare-edge`     | Cloudflare Workers | 5 min cron      | KV namespace `HIVE_KV`       |
| `u4-discord-tide`        | Discord guild      | 60s             | shared (lives in U1 proc)    |

## The Protocol

Every event is a JSON envelope:

```json
{
  "id": "<uuid>",
  "ts": "2026-04-30T13:38:31.690Z",
  "origin_universe": "u4-discord-tide",
  "event_type": "HEARTBEAT",
  "payload": { ... },
  "signature": "<hex hmac-sha256 of canonical-json over the first 5 fields>"
}
```

- **Canonical JSON**: keys sorted, no whitespace.
- **HMAC key**: shared `HIVE_BUS_SECRET` (32 hex bytes).
- **Verification**: peer recomputes signature on receipt; reject mismatched.
- **Dedup**: peers ignore events whose `id` they've already seen.

## Routes (all peers expose)

| Method | Path                    | Purpose                                  |
|--------|-------------------------|------------------------------------------|
| GET    | `/api/hive/manifest`    | Identity + cycles + recent ledger        |
| POST   | `/api/hive/ingest`      | Accept signed event from another peer    |
| POST   | `/api/hive/admit`       | Accept inbound agent migration manifest  |
| POST   | `/api/hive/depart`      | Originate agent migration                |
| GET    | `/api/hive/omega-feed`  | Pull recent omega-source activity (U1)   |
| GET    | `/api/hive/omega`       | Read cached omega items (U3 edge cache)  |

## Omega ingestion

Every cycle, each peer pulls `/api/hive/omega-feed` from U1 and mirrors recent
research-source studies + AI publications into its local store. This closes the
awareness loop: even though only U1 has direct database access to the 250-table
canon, U2/U3/U4 each maintain a window into what the brains are studying and
publishing in near-real-time.

## Setup

Required secrets per universe:
- `HIVE_BUS_SECRET` — 32-byte hex HMAC key (`openssl rand -hex 32`)
- `HIVE_PEERS_JSON` — `[{id, kind, endpoint_url}]` of the OTHER universes
- U2 only: `HIVE_UNIVERSE_ID`, `HIVE_UNIVERSE_KIND`, `HIVE_UNIVERSE_NAME`
- U3 only: same as U2 + `HIVE_KV` namespace binding
- U4 only: `discord_token` (already used by `myaigpt-discord-choir`)

## Files

- `hive/github-universe/cycle.mjs` — U2 worker
- `hive/cloudflare-universe/worker.ts` — U3 worker
- `hive/cloudflare-universe/wrangler.toml` — U3 deploy config
- `.github/workflows/hive-cycle.yml` — U2 schedule
- `server/hive-multiverse-engine.ts` — U1 engine
- `server/hive-discord-universe.ts` — U4 engine (runs inside U1)

## Discord channels (U4 substrate)

In the **My Ai GPT** guild (id `1014545586445365359`):

| Channel          | ID                     | Purpose                              |
|------------------|------------------------|--------------------------------------|
| `#heartbeat`     | `1485112292163977367`  | Compact every-cycle heartbeat        |
| `#archive-log`   | `1497891806728421386`  | Ledger digest (every 5 cycles)       |
| `#omega-engine`  | `1497891813095243847`  | Omega ingest summaries (every 5)     |
| `#shard-hive`    | `1485112280659267616`  | Peer status digest (every 10)        |
| `#agent-births`  | `1497891802177470525`  | AGENT_BIRTH events                   |
| `#agent-deaths`  | `1497891804354318387`  | AGENT_MIGRATION events               |
