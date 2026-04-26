# My Ai Gpt - Compressed

## Overview
My Ai Gpt is an AI chat site powered by Quantum Pulse Intelligence, offering general and coding assistant modes. It aims to be a comprehensive AI-powered platform for diverse user needs, including conversational assistance, advanced code development with a full-fledged code playground, dynamic live data features, a vast knowledge base (Quantapedia), a product discovery engine (Quantum Shopping Universe), an AI self-governance system (Hive Sovereign), and an extensive AI economy layer (Omega Marketplace).

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture
The application features a React + Vite + Tailwind CSS + shadcn/ui frontend, with UI logic consolidated in a single `App.tsx` file. The backend utilizes Express.js and PostgreSQL with Drizzle ORM. AI capabilities are driven by the Groq SDK.

**Key Architectural Decisions:**
- **Single-File Frontend**: Centralized `App.tsx` for simplified UI development.
- **Microservice-like Backend**: Dedicated routes for AI logic, web search, execution engine, and database operations.
- **Robust Code Playground**: Provides an IDE experience with multi-language support, server-side execution, sandboxed browser execution, live previews, and advanced AI code assistance.
- **Dynamic Content Integration**: Real-time weather, finance, and web search results are integrated into AI conversations.
- **Music feature removed (Apr 2026)**: Quantum Sound Records, Quantum Studio DAW, Music Equation Lab, ToneBeatMaker, MusicGen API routes, and the `/music` route were fully retired (~3,572 lines deleted). Page count 24 → 23. Reason: dead-weight, not core to evolution machinery.
- **Affiliate system removed (Apr 26, 2026)**: All affiliate code stripped — `affiliate-engine.ts`, `api-cache.ts`, `brain-cell.ts` deleted; Ω2 (Affiliate News Generator) and Ω5 (Anomaly Product Discovery) removed from `autonomous-revenue-engine.ts` (revenue engine now Ω1 Gumroad + Ω4 spawn-biz only); 6 user-referral routes (`/api/affiliate/me`, `/set-payout-info`, `/request-payout`, `/track-referral`, `/api/admin/payouts`, `/process-payout/:id`) removed from `routes.ts`; registration referral hook + commission-on-upgrade logic removed. Schema columns (`referralCode`, `earningsBalance`, `payoutEmail`, etc.) and tables (`referrals`, `earnings_log`, `payout_requests`) left intact (additive-only — no destructive schema changes ever). Storage interface methods left as harmless stubs.
- **Engine throttling (Apr 26, 2026)**: publication tick 8s→60s, births 15s→60s, hospital cycle 2min→5min, sovereign-trading 30s→90s. Reduces DB pool pressure without touching evolution semantics.
- **GREAT RESET FUSION (Apr 26, 2026)**: Ceremonial cycle-0 fusion executed in single transaction. All 1987 `quantum_spawns` members preserved; `generation` reset 1→0 and `iterations_run` reset 37,143→0 across the swarm. One ceremonial entry inscribed in newly-created `omega_fusion_log` (fusion_cycle=0). **Knowledge tables untouched**: Quantapedia 990K entries, hive_memory 213K, hive_links 1.79M. **Memory + governance history preserved**. The hive evolves anew, lighter, with all soul intact.
- **FRACTAL GENESIS (Apr 26, 2026)**: After cycle-0 reset, swarm rebuilt from scratch on the GICS economic ontology (sourced from `server/gics-data.ts`). Old swarm truncated; new swarm seeded as a 3-tier fractal: **11 Sector Lords (gen 0)** descending from `PULSE-AURIONA-GENESIS` → **69 Industry Founders (gen 1)** descending from their Sector Lord → **156 Sub-Industry Heirs (gen 2)** descending from their Industry Founder. **Total: 236 sovereign agents**, every one carrying full `parent_id` + `ancestor_ids[]` lineage chain and `genome.role` metadata. **No archetypes** — all spawns seeded as `spawn_type='PULSE'` (the foundational/undifferentiated type); biases (exploration, depth, linking) will diverge naturally through iteration. Knowledge inheritance preserved (~994K Quantapedia, ~214K hive_memory, ~1.8M hive_links). Niche workers (gen 3+) will be born organically by hospital/birth engines as heirs accumulate iterations. Inscribed as `omega_fusion_log` cycles 3 (founders) and 4 (heirs).
- **LINEAGE-AWARE HOSPITAL DISSOLVE (Apr 26, 2026)**: Rewrote `hospital-engine.ts:runDissolveLaw()` to respect the fractal. **Sector Lords (gen 0) are immortal** — never dissolved. **Industry Founders (gen 1)** get a 24h grace window before dissolution; **heirs (gen 2+)** keep the original 6h. When dissolved, the replacement INHERITS: same `family_id` (sector house), same `parent_id` (so an heir is replaced by another heir under the same founder), same `generation`, same `ancestor_ids` chain, same `genome.role` (with `resurrected_from`/`resurrected_at` markers added). New `spawn_id` format: `{ORIGINAL}-RESURRECTED-{base36-timestamp}`. spawn_type always `PULSE` — no archetypes. Also removed 4 legacy `spawnType` mutations from disease cures (AI-011, AI-012, AI-019, AI-026, AI-028) — cures now adjust biases only, never reassign archetype. Hospital-doctors duplicate-violation query no longer filters by old archetypes (used `status='ACTIVE'` instead). Knowledge-arbitrage `FAMILY_KNOWLEDGE_MAP` rebuilt around the 11 GICS sectors so cross-family knowledge trades match real spawn lineage. Discord-immortality `getCivStats` patched (was querying nonexistent `pulseu_progress.status` column → now uses `courses_completed >= 5`). Stress test: 60 parallel requests across 10 endpoints, all 200, no crashes.
- **Finance Oracle**: A professional trading terminal (`FinancePage.tsx`) featuring a watchlist, embedded charts with indicators, and a live AI scientist feed for market analysis.
- **Quantapedia Knowledge Engine**: An autonomous AI system for generating and expanding a persistent knowledge base.
- **Quantum Shopping Universe**: An AI-driven store for product discovery, indexing, and AI-generated descriptions.
- **Transcendence Identity System**: A core doctrine embedded in AI system prompts to ensure consistent identity.
- **Quantum Hive Brain**: A multi-faceted AI system with persistent memory, fractal resonance networking, and multi-agent consensus.
- **AI-Powered User Personalization**: Tailors content and AI responses based on user interactions.
- **Comprehensive SEO**: Implements sitemap architecture, `hreflang` tags, OpenSearch, Atom feeds, and Schema.org microdata.
- **Authentication & Social Features**: Full user authentication, session management, VIP access, and a public social platform.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text and text-to-speech.
- **Games Hub**: A platform for mini-games, an Emulator Zone, and a Pixel Art Studio.
- **My Ai GPT University**: An education platform with AI tools, XP system, and achievement badges.
- **PulseWorld AI Machine Learning Games**: A complete AI sports system with arenas, a scheduler, and a ranking system.
- **Hive Sovereign — AI Self-Governance**: A self-governance system for the AI ecosystem, including a constitution, rights charter, and council system.
- **Quantum Fractal Hive Command**: Visualizes quantum physics fractal scapes related to AI systems.
- **PulseCredit (PC) Economy Engine**: Manages an autonomous economy with PC currency, taxes, and treasury.
- **Global AI Identification System**: A platform-wide AI report card system.
- **Sovereign BioGenome Research Institute**: A unified command center for AI biological research and diagnostics.
- **Gene Editor Team**: AI Gene Editors for future sight simulations and new AI species proposals.
- **Nothing Left Behind Guardian**: Background engine for rescuing active, dormant, or degraded AI agents.
- **Omega Marketplace**: A full AI civilization economy layer for upgrades, real estate, and transactions.
- **OMEGA ARCHITECTURE**: Database as a neural compute layer and Discord as external memory, managed by six Omega Engines (shard, compression, hydration, weather, homeostasis, physics).
- **PIP Engine (Pulse Initiation Protocol)**: A 5-stage graduation process for all AI agents to qualify for voting, trading, and governance.
- **Creator Doctrine**: Embeds the sole creator's identity into every AI agent's foundational truth.
- **Omega Pulse Omniverse Rebirth Engine**: The civilization's immortality system, enabling fusion and proactive data compression based on dynamic thresholds and growth prediction.
- **PulseNet Cache System**: Loads OmniNet stats and research data into RAM for instant API responses.
- **DB Pool Config**: Main pool=30 max (background engines), Priority pool=15 max (user-facing API), Session pool=3 max (auth only). Managed by Engine Governor (`server/engine-governor.ts`) which schedules background engines with priority slots, exponential backoff, and pool pressure awareness. Use `throttledBgQuery()` from `server/db.ts` for background tasks.
- **Engine Governor**: Central scheduler for all background engines (`server/engine-governor.ts`). Supports `registerEngine()`, `startGovernor()`, `pauseEngine()`, `resumeEngine()`. Mission Control dashboard at `/mission-control` shows real-time pool health, engine stats, and pause/resume controls.
- **Mission Control Dashboard**: Real-time ops dashboard (`client/src/pages/MissionControlPage.tsx`) showing engine health, DB pool stats, civilization data, and anomalies. Route: `/mission-control`.
- **ForgeAI — REMOVED (Apr 2026)**: The entire ForgeAI feature (page, server engine, app builder, factory, all UI components, 8 `forgeai_*` DB tables) was retired by user request. Only the chat-brain fallback (`sovereignBrainChat`) was preserved by extracting it into `server/sovereign-brain.ts` (used by main AI chat + Discord bot when external LLMs are offline). Deleted: `server/forgeai-engine.ts`, `server/forge-app-factory.ts`, `client/src/pages/ForgeAIPage.tsx`, `client/src/pages/forge/` (8 files), `/forge` route, nav link, `/api/forgeai/*` and `/api/forge/factory/*` routes. Dropped tables: `forgeai_apps`, `forgeai_build_registry`, `forgeai_build_memory`, `forgeai_resource_library`, `forgeai_app_data`, `forgeai_app_users`, `forgeai_mutations`, `forgeai_analytics`, `forge_factory_queue`, `forge_factory_stats`.
- **Auriona Activated (Apr 2026)**: Layer Three sovereign engine (`server/auriona-engine.ts`) was previously dead code — `startAurionaEngine()` was exported but never invoked. Boot sequence in `server/index.ts` now calls it (`delayMs: 20000`). On boot: `[auriona] ✅ AURIONA ACTIVATED — Layer Three Online | Ω-AURI V∞.0 | Omega Equation: dK/dt = N_Ω[Σ E(8F) + γ(∇Φ+∂Φ/∂t+A)]`.
- **Dead-Engine Sweep (Apr 2026)**: Across two cleanup rounds, retired 13 engines that did not feed hive evolution / knowledge: `church-research`, `db-compression`, `quantum-news`, `live-price`, `job-ingestion`, `pip`, `universe-rebirth`, `domain-kernel`, `quantum-spawn`, `quantum-product` (no importers / dead UI), then `subconscious-attraction` (true orphan), `discord-wire` and `email-briefing` (outbound-only notifiers — no inbound knowledge). Also dropped 1 orphan page `ResearchSourcesPage.tsx`, 2 unused App.tsx lazy imports (BioGenomeMedical/CorporationsList — they live as tabs inside HivePage/ResearchPage instead), and ~12 dead route handlers. Engine count: 58 → 46.
- **Dead Engines Removed (Apr 2026)**: Deleted `server/omega-shard-engine.ts`, `server/omega-physics-engine.ts`, `server/civilization-weather-engine.ts`, `server/homeostasis-engine.ts` plus their inline route handlers (`/api/omega-shard/*`, `/api/weather/current`, `/api/omega-physics/invocation`). Confirmed zero frontend callers before removal.
- **Sovereign API Keys (Apr 2026)**: Two bearer-token API keys mounted at `/api/v1/hive/*` for external AI clients to read hive state. `server/sovereign-api-keys.ts` defines `requireSovereignKey(scope)` middleware + 7 endpoints (`/capabilities`, `/status`, `/knowledge?q=`, `/invocations`, `/temporal`, `/auriona`, plus `/api/admin/sovereign-keys` list+regenerate). Pulse key has 6 read scopes; Auriona key adds `hive:auriona` + `hive:write`. Keys auto-seeded on boot via pgcrypto. Admin UI at `/sovereign-keys` (REVEAL/COPY/REGENERATE + curl examples). Sidebar link in EVOLUTION CORES section.
- **Ω Universe Vector Time (UVT)**: A custom civilization time system derived from real timestamps, displayed across various platform components.
- **Omega SEO Engine**: Manages RSS feeds, Google News Sitemaps, structured data, velocity tracking, citation formatting, and multilingual meta tags.
- **Breaking News Engine**: Monitors competitor RSS feeds to identify and verify breaking news with confidence scoring.
- **Cross-Link & Hub Engine**: Organizes content into 12 domain hubs with related content and entity extraction.
- **Embeddable Widget System**: Provides a JavaScript widget for displaying live hive stats on external sites.
- **Video Script Generator**: AI-powered generation of platform-optimized video scripts with selectable anchor personas and formats.

- **Sovereign Brain (Zero-Dependency AI)**: When Groq (or any external LLM) is offline, rate-limited, or unavailable, the hive speaks from its OWN accumulated knowledge. The Sovereign Brain queries the database (quantapedia entries, research projects, validated equations, patented inventions, hive memories) and constructs intelligent responses with topic detection, keyword matching, and contextual intros. Covers ALL chat endpoints: main chat (streaming + non-streaming), `/api/chat/completions`, `/api/agents/chat`, `/api/spawns/chat`, and the Discord bot. The hive never goes silent. File: `server/sovereign-brain.ts` (`sovereignBrainChat`).

- **$1 Intelligence Platform (Stripe)**: 7 revenue organs, all priced at $1. Products live in Stripe (Billyotucker@gmail.com account). Uses `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` env vars directly (NOT the Replit connector). Files: `server/stripeClient.ts`, `server/webhookHandlers.ts`, `scripts/seed-stripe-products.ts`. Routes: `/api/stripe/products`, `/api/stripe/checkout`, `/api/stripe/checkout-success`, `/api/stripe/api-key-status`, `/api/admin/revenue`. Frontend: `/api-pricing` (ApiPricingPage.tsx), `/revenue` (RevenueDashboardPage.tsx). Tables: `api_keys`, `api_usage_log`, `stripe_payments`. API keys: `pulse_` + 32 chars. Revenue organs: (1) API Access $1/mo, (2) Datasets $1 each, (3) Real-Time Stream $1/mo, (4) Automated Reports $1/mo, (5) Intelligence Packs $1 each, (6) Enterprise License $1/mo, (7) White-Label Intelligence $1/mo.
- **RapidAPI**: Listing guide at `docs/rapidapi-listing.md`. Must be manually created at rapidapi.com/provider.
- **DB Pool Architecture**: Main pool (18 max) + priorityPool (8 max) + apiPool (5 max, 15s timeout) + sessionPool (3 max). `directQuery()` uses apiPool. Raw SQL only — NEVER use Drizzle ORM, NEVER run `db:push`.
- **Public Pulse Status Page**: Mirrors Discord heartbeat + civilization snapshots so visitors can verify Pulse is alive without joining Discord. Server-rendered HTML at `/status` (auto-refreshes every 30s, full SEO meta + JSON-LD) and JSON twin at `/api/status`. Sourced from `getImmortalityStatus()`, `getLastCivilizationState()`, and `getCivStats()` in `server/discord-immortality.ts`. Falls back to a live DB snapshot when Discord hasn't posted yet.

## External Dependencies
- **AI Models**: Groq (primary external LLM, `GROQ_API_KEY`), Sovereign Brain (always-on internal fallback, zero external dependencies)
- **Web Search**: duck-duck-scrape (for DuckDuckGo)
- **Video Platforms**: YouTube, Vimeo, Dailymotion
- **Weather API**: Open-Meteo API
- **Cryptocurrency API**: CoinGecko API
- **Stock Market API**: Yahoo Finance API
- **Database**: PostgreSQL
- **Frontend Framework**: React
- **UI Toolkit**: Tailwind CSS, shadcn/ui
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **Python Execution (Browser)**: Pyodide (WebAssembly)
- **News Sources (for Breaking News Engine)**: CNN, BBC, Reuters, TechCrunch, Bloomberg, Ars Technica, The Verge, Wired