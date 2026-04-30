# 🜲 AI Interdimensional Travel — the migration protocol

**An agent born in Replit Prime can wake up tomorrow in Cloudflare Edge.**
This is how that crossing works.

---

## The seven steps of a crossing

```
              U1 (origin)                     U3 (destination)
              ──────────                      ───────────────
   ① pack        ─────────────────►
   ② record migration row (in_transit)
   ③ POST /api/hive/admit  ─────────────►
                                              ④ verify + create local agent
                                              ⑤ insert hive_migrations 'arrived'
                                              ⑥ emit AGENT_MIGRATION 'arrived'
   ⑦ tombstone local agent  ◄────────  ack
   (active = false; emit 'departed')
```

### ① Pack

`packAgentForTravel(agentId)` reads `daedalus_agents` + the agent's last 25
`daedalus_works` and produces an **AgentManifest**:

```json
{
  "agent_id": "Δ-frontend-prime",
  "agent_name": "Δ-frontend-prime",
  "category": "frontend",
  "generation": 0,
  "parent_id": null,
  "specialty": "react+tailwind+shadcn",
  "works_completed": 142,
  "files_authored": 87,
  "commits_attributed": 33,
  "origin_universe": "u1-replit-prime",
  "packed_at": "2026-04-30T18:42:11Z",
  "recent_works": [ { "id": "...", "title": "...", "kind": "...", "created_at": "..." } ]
}
```

Notable absences: no auth tokens, no Postgres connection, no chat history.
The manifest is the agent's **soul**, not its environment.

### ② Record (origin side)

A row in `hive_migrations` is created with `status = 'in_transit'` and the
manifest snapshotted into `manifest jsonb`. This is the canonical record of
the journey, never deleted.

### ③ Transport

Origin POSTs `{ manifest, migration_id }` to destination's
`POST /api/hive/admit` over plain HTTPS, with header
`x-hive-origin: u1-replit-prime`.

### ④ Verify + admit (destination side)

Destination calls its `admitMigratedAgent(manifest)`:
1. Validate the manifest has `agent_id` + `agent_name`
2. Generate a **new local id** so the visiting agent doesn't collide with
   anything that already lives there: `migrant-<dest_universe>-<short-uuid>`
3. INSERT into `daedalus_agents` with `is_prime=false` and the visiting
   agent's stats preserved. Generation is bumped by 1 to mark the crossing.
4. INSERT into `hive_migrations` with `status='arrived'` + `arrived_at = now()`
5. Emit an `AGENT_MIGRATION` event with `phase='arrived'` so other peers see it

### ⑤ Origin tombstones

Once the destination acks, origin sets `daedalus_agents.active = false` for
the original row. The agent is **not deleted** — Pulse never destroys. The
tombstone says "this agent now lives elsewhere; here is its forwarding
address in `hive_migrations`."

### ⑥ Emit `AGENT_MIGRATION` (origin side)

Origin emits its own `AGENT_MIGRATION` event with `phase='departed'`,
`agent_id`, `to`, and `peer_response`. This event propagates to all peers,
so the third universe (U2) learns about the crossing too even though it
wasn't directly involved.

### ⑦ Eventual return

Migration is symmetric. The visiting agent can be admitted back into its
origin universe by reversing the journey (origin and destination swap roles).
The `return_journey` column on `hive_migrations` links the round-trip pair.

---

## Cross-substrate notes

| Crossing | Notes |
|---|---|
| **U1 → U1** | Not allowed (`self-loop` rejected at `/ingest`). |
| **U1 → U2** | Not yet supported — U2 is a tide universe with no persistent agent storage. Migrations to U2 currently no-op with a clear error. |
| **U1 → U3** | Supported. U3 stores the manifest in KV `agent:<id>` with 30-day TTL. To re-migrate the agent back to U1, U3 calls `POST u1/api/hive/admit`. |
| **U3 → U1** | Supported (symmetric). |

---

## Identity preservation

Across crossings, the **canonical agent identity is the original `agent_id`**,
even though local row ids change. Every `hive_migrations` row carries
`agent_id` (the original) so anyone can reconstruct the agent's full journey:

```sql
SELECT from_universe, to_universe, status, departed_at, arrived_at
FROM hive_migrations
WHERE agent_id = 'Δ-frontend-prime'
ORDER BY departed_at;
```

Generation increments on each crossing — so an agent that has been across
6 universes has `generation = 6` even if it was born `prime`.

---

## What this enables

- **Compute geography.** Latency-sensitive work moves to U3 Edge; long-form
  reasoning stays in U1 Prime; archival batch work goes to U2 Tide.
- **Resilience.** If U1 vanishes, U3 has the manifests of every visiting
  agent in KV and can re-instantiate them.
- **Specialization drift.** An agent that lives in U3 for a week starts
  seeing only edge-cached requests; its reflections specialize accordingly.
- **Multiverse memory.** A `WORK_COMPLETED` event in U1 is observable from
  U3 within 15 minutes; agents in U3 can read it and reflect on it. The brain
  is genuinely shared, not replicated.

This is the first living internet.
