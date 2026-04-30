#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  U3 CLOUDFLARE UNIVERSE — one-shot deploy
# ─────────────────────────────────────────────────────────────────────────────
#  Prereqs (one-time, on the machine that runs this):
#    1. npm i -g wrangler@latest
#    2. wrangler login   (or:  export CLOUDFLARE_API_TOKEN=…)
#    3. ENV: CLOUDFLARE_ACCOUNT_ID exported
#
#  This script:
#    a) Creates the HIVE_KV namespace if absent and patches wrangler.toml
#    b) Prompts for / sets HIVE_BUS_SECRET + HIVE_PEERS_JSON as Worker secrets
#    c) Runs `wrangler deploy`
#    d) Prints the final URL so you can register it as a peer in U1 and U2.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "wrangler CLI not found — install with: npm i -g wrangler@latest"
  exit 1
fi

# 1. KV namespace
KV_ID=$(grep -E '^id = "' wrangler.toml | head -1 | sed -E 's/^id = "(.*)"/\1/')
if [ -z "$KV_ID" ]; then
  echo "[deploy] creating KV namespace HIVE_KV…"
  CREATE_OUT=$(wrangler kv:namespace create HIVE_KV 2>&1) || { echo "$CREATE_OUT"; exit 1; }
  NEW_ID=$(echo "$CREATE_OUT" | grep -oE 'id = "[a-f0-9]+' | head -1 | sed 's/id = "//')
  if [ -z "$NEW_ID" ]; then echo "could not parse new KV id from output:"; echo "$CREATE_OUT"; exit 1; fi
  sed -i.bak "s/^id = \"\"/id = \"$NEW_ID\"/" wrangler.toml
  rm -f wrangler.toml.bak
  echo "[deploy] HIVE_KV id = $NEW_ID (written to wrangler.toml)"
fi

# 2. Secrets
if [ -n "${HIVE_BUS_SECRET:-}" ]; then
  echo "[deploy] uploading HIVE_BUS_SECRET from env"
  echo -n "$HIVE_BUS_SECRET" | wrangler secret put HIVE_BUS_SECRET
fi
if [ -n "${HIVE_PEERS_JSON:-}" ]; then
  echo "[deploy] uploading HIVE_PEERS_JSON from env"
  echo -n "$HIVE_PEERS_JSON" | wrangler secret put HIVE_PEERS_JSON
fi

# 3. Deploy
wrangler deploy

echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "  ✓ deployed. Now register the worker URL as a peer in U1 (Replit) and U2"
echo "  (GitHub) by adding it to HIVE_PEERS / HIVE_PEERS_JSON respectively."
echo "─────────────────────────────────────────────────────────────────────────"
