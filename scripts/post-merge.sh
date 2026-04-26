#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# POST-MERGE SETUP
# Runs automatically after a task is merged into the main branch.
# Stdin is closed (interactive prompts will fail) — use --yes / --force flags.
# ─────────────────────────────────────────────────────────────────────────────
set -e

# 1) Sync npm dependencies (fast no-op when nothing changed).
npm install --no-audit --no-fund --prefer-offline

# 2) DO NOT run `npm run db:push` here.
#
#    Many tables in this project (pyramid_*, omni_net_*, invention_*,
#    forgeai_*, forge_factory_*, anomaly_inventions, agent_search_history,
#    pulse_pc_sessions, pulse_ai_chat_logs, etc.) are created at runtime by
#    the engines themselves via `CREATE TABLE IF NOT EXISTS` and are NOT
#    declared in shared/schema.ts. Running drizzle-kit push will see them
#    as "drift" and propose to DROP them — destroying production data
#    (48k+ labor tasks, 10k+ chat logs, 1.2k+ Gumroad inventions, etc.).
#
#    If a merged task legitimately needs a schema change, run
#      npm run db:push --force
#    MANUALLY after reviewing the proposed diff in the dev console.

echo "[post-merge] ✅ Dependencies synced. Schema push intentionally skipped (see comment in script)."
