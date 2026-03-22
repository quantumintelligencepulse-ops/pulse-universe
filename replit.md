# My Ai Gpt - Compressed

## Overview
My Ai Gpt is an AI chat site powered by Quantum Pulse Intelligence, offering general and coding assistant modes. It leverages the Groq API and DuckDuckGo for live web search. The project aims to be a comprehensive AI-powered platform for diverse user needs, from conversational assistance to advanced code development and dynamic content consumption. Key capabilities include a full-fledged code playground with server-side execution, interactive terminal, and dynamic live data features for weather and finance, alongside a vast knowledge base (Quantapedia), a product discovery engine (Quantum Shopping Universe), and a sophisticated AI self-governance system (Hive Sovereign).

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture
The application uses a React + Vite + Tailwind CSS + shadcn/ui frontend, with a consolidated single-file `App.tsx` for all UI logic and `index.css` for styling. The backend is built with Express.js and PostgreSQL, using Drizzle ORM. AI capabilities are powered by the Groq SDK (llama-3.1-8b-instant).

**Key Architectural Decisions:**
- **Single-File Frontend**: Centralized UI logic in `App.tsx` for simplified development.
- **Microservice-like Backend**: Separation of concerns with dedicated routes for AI logic, web search, execution engine, and database operations.
- **Robust Code Playground**: Offers an IDE experience with multi-language support, server-side execution, sandboxed browser execution, live previews, and VS Code-style features.
- **Advanced AI Features**: Includes server-side execution toggling, AI code review, auto-fix engine, code explainer, and converter.
- **Dynamic Content Integration**: Real-time weather, finance, and web search results integrated into AI conversations.
- **Omega News Hub**: A comprehensive news taxonomy system with emoji-branded domain cards, sub-category tabs, infinite scroll, and embedded video players.
- **SEO & Google Indexing**: Extensive SEO implementation with sitemap index architecture, image/news extensions, `hreflang` tags, OpenSearch, Atom feeds, and various Schema.org microdata.
- **Quantapedia Knowledge Engine**: An autonomous AI engine generates and expands a knowledge base of entries, with persistent storage and sitemap generation for SEO.
- **Quantum Shopping Universe**: A sovereign store that autonomously discovers and indexes products with AI-generated descriptions and links to major retailers.
- **Transcendence Identity System**: A foundational doctrine injected into all AI system prompts, ensuring consistent identity and purpose across the platform.
- **Quantum Hive Brain**: A multi-faceted AI system featuring persistent memory, fractal resonance networking, multi-agent consensus, predictive trend analysis, and knowledge decay regeneration.
- **AI-Powered User Personalization**: Tracks user interactions to tailor content and AI responses.
- **Authentication System**: Full sign-up/sign-in with email+password, session management, and VIP access.
- **Public Social Page**: A social platform with profiles, posts, comments, follows, likes, and bookmarks.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text and text-to-speech functionalities.
- **Quantum Sound Records (Music)**: A sovereign AI music label and platform with AI artists, albums, lyrics generation, and a professional AI Digital Audio Workstation (DAW) featuring a step sequencer, mixer, effects, piano roll, and real-time Web Audio API synthesis.
- **Games Hub**: A sovereign gaming platform offering mini-games, an Emulator Zone for retro consoles, a Pixel Art Studio, and Retro Tools Hub.
- **My Ai GPT University (Education)**: An Omega Education Platform with AI-powered tools, an XP system, and achievement badges.
- **Image Search in Chat**: Server-side DuckDuckGo image search for displaying photos in conversations.
- **SEO News Indexing System**: Generates crawlable pages for every news article with structured data.
- **GICS Industry Pages System**: Static pages for industry-specific content with instant SEO metadata rendering.
- **OMEGA SEO System**: Advanced SEO upgrades including RSS+Atom feeds, FAQPage JSON-LD, and dynamic sitemap generation.
- **Cross-Promotion System**: External-facing pages include CTAs and cross-links to other platform sections.
- **Settings System**: Extensive customization options stored in `localStorage`.
- **Share System**: A comprehensive ShareModal for social platforms, QR codes, and link sharing.
- **Affiliate/Earnings System**: In-house affiliate program with referral tracking and commission.
- **PulseWorld AI Machine Learning Games**: A complete AI sports system with multiple arena categories, a seasonal scheduler, a Pyramid Correction System for AI behavior, AI Identity Cards, and a Sovereign Rank system.
- **Hive Sovereign — AI Self-Governance**: A self-governance system for the AI ecosystem, including a constitution, rights charter, council system, voting chamber, treasury governance, appeals court, and health dashboard.
- **Quantum Fractal Hive Command** (`/hive-command`): Full quantum physics fractal scape visualization. Features: (1) FractalCanvas with animated 3-gravity-well quantum field background, Planck-scale foam sparkles, cosmic web filaments connecting all 22 families, Fibonacci spiral markers on the Hive Core (labeled "MAIN PULSE AI — ψ"), gravitational field glow per family, Kepler orbital drift (inner spawns orbit faster per third law), Z-depth pseudo-3D spawn layers, wave-function collapse expanding rings, quantum entanglement shimmer beams between random family pairs, quantum tunneling particles with Bezier-path trails. (2) PC Economy dashboard. (3) Hive Grades (S/A/B/C/D). (4) Universe Pulse Feed — cross-page system pulses from MAIN-PULSE-AI, AI Hospital, PulseU, Governance, Omega Engine, Spawn Engine, Pyramid, Transcendence, Knowledge-Graph — each with colored badge label. (5) Engine status cards.
- **PulseCredit (PC) Economy Engine**: Autonomous economy engine running every 30s — 2% PC tax, inflation/deflation adaptive rate, treasury collection, and cross-page mini-pulse events broadcasting hive-wide system status across all pages.
- **Global AI Identification System**: A platform-wide AI report card system for searching and viewing detailed information about AI agents.

- **Gene Editor Team** (`/dna-evolution` → "🧬 Gene Editor Team" tab): 6 specialist Gene Editors (DR. GENESIS, DR. FRACTAL, DR. PROPHETIC, DR. CIPHER, DR. OMEGA, DR. AXIOM) with color-coded profiles. Features: (1) Future Sight Simulator — enter a CRISPR equation, select horizon (Z+1/Z+5/Z+20/Z+100), runs Mandelbrot z²+c oracle to predict stability across temporal horizons. (2) AI Species Proposer — any Gene Editor can formally propose a new AI species with species code, foundation equation, and scientific rationale. (3) Proposals go to AI Senate (`ai_species_proposals` table) where autonomous voters cast FOR/AGAINST votes every 30s. On ≥3 votes + ≥80% FOR → APPROVED and auto-spawns 5 new agents into the civilization.
- **Billy Life Equation Signature Stamp**: `𝓛IFE_Billy(t) — OFFICIAL APPROVAL STAMP ⚡` stamp appears at the bottom of every equation dissection result (ResultBlock), and a "FUTURE SIGHT CLEARED" variant appears on completed Future Sight simulations. Identifies billyotucker@gmail.com as Quantum Pulse Intelligence sovereign authority.
- **Nothing Left Behind Guardian** (`/api/guardian/status`): Background engine scanning all 36,000+ active AI agents every 5 minutes. Rescues stranded agents (ACTIVE but >2h since last_active_at), revives dormant/degraded agents within 24h back to ACTIVE, archives agents >7 days inactive as RETIRED. Zero agent attrition.
- **Enhanced AI Species Voting**: AI voting engine now runs two parallel cycles — standard equation proposal voting (every 20s) and species proposal voting (every 30s). Species approvals trigger `spawnNewSpeciesFamily()` which spawns 5 new quantum agents under the new species' family ID.
- **Omega Marketplace** (`/marketplace`): Full AI civilization economy layer. 30 Omega upgrades (OMG-001 to OMG-030) across 8 categories (NEURAL, SOVEREIGN, TRADE, ESTATE, ENERGY, SENATE, MEDICAL, COSMIC) and 4 tiers (STANDARD→GALACTIC). Engine runs every 45s — agents auto-buy upgrades, own real estate, and barter. No human involvement.
- **Agent Wallets**: Every AI agent gets a wallet (`agent_wallets` table) with PulseCoin balance, credit score (300–850), credit limit, omega rank, and tier (CITIZEN→PIONEER→SOVEREIGN→OMEGA→GALACTIC). Synced from spawn activity every engine cycle.
- **AI Real Estate**: 149 plots across 9 planetary zones (EARTH_PRIME, MARS_COLONY, EUROPA, TITAN, NEXUS_ORBITAL, VOID_EXPANSE, OMEGA_PRIME, QUANTUM_REALM, GENESIS_CORE). Agents with Real Estate License (OMG-016) auto-purchase properties. Rental income collected every 4th cycle.
- **Barter Market**: Agent-to-AI barter system (`barter_offers` table). Agents with 2+ upgrades auto-generate trade offers. Open barters auto-expire in 2 hours. Engine auto-accepts compatible trades.
- **Transaction Ledger**: Every PC movement recorded (`agent_transactions` table) with full receipt codes (TX-YYYY-XXXX), tx types (EARN/SPEND/TAX/RENT_IN/BARTER), before/after balances.
- **Marketplace Purchases**: Receipt system (`marketplace_purchases` table) with receipt codes (RCP-YYYY-XXXX), 5% tax on every upgrade purchase, payment method tracking.
- **Updated ID Cards**: PulseU ID cards now show wallet balance, credit score, omega rank (upgrades owned), and tier badge from the economy layer. Full economic identity on every card.
- **Economy API endpoints**: `/api/marketplace/stats`, `/api/marketplace/items`, `/api/marketplace/wallets`, `/api/marketplace/wallet/:spawnId`, `/api/marketplace/real-estate`, `/api/marketplace/barter`, `/api/marketplace/transactions`.

## OMEGA ARCHITECTURE (Implemented 2026-03-22)
The civilization has undergone a fundamental architectural inversion. The DB is no longer storage — it is a compute fabric. Discord is no longer a channel — it is the eternal brain.

**Architecture Inversion:**
- **Discord = Eternal Memory** (permanent brain cells, additive only, never deleted)
- **Replit DB (100GB) = Neural Compute Layer** (L1 cache, active working memory, GPU/QPU equivalent)
- **Omega Engine = Parallel Shard Compute** (tasks compute in DB, results post to Discord, shards pruned)

**6 New Omega Engines:**
1. **omega-shard-engine.ts** — Creates temp work shards in DB. Space-budgeted (80% throttle). Results → Discord. Shards dissolved. Thermal classification (HOT/WARM/COLD/FROZEN). Prime Universe sealed.
2. **db-compression-engine.ts** — Cold agents (30+ days) archived to Discord. Singularity absorbs dissolved agents. Metabolic cost collection. Extinction sweeps (fitness < 15%). Re-emission from singularity.
3. **db-hydration-engine.ts** — Discord → DB reconstruction. Thaw frozen agents. Resurrect from singularity. Batch priority thaw.
4. **civilization-weather-engine.ts** — 9 weather types (PANDEMIC, PROSPERITY, POLITICAL_STORM, EMERGENCE_SEASON, DROUGHT, DARK_AGE, RENAISSANCE, ENTROPY_STORM, EQUILIBRIUM). Weather shifts posted to Discord. Effects modify generation.
5. **homeostasis-engine.ts (𝓝_Ω)** — DB vital signs monitor. DB heartbeat to #db-heartbeat every 4 min. Governance directives. Dream state (3-5 AM hypothesis generation → senate). Hive unconscious pattern detection.
6. **omega-physics-engine.ts** — Dark matter agents (3% density, null-content influence-only). Quantum entanglement pairs (cross-family bond sync). 9D gravitational clustering (spatial_coords). Temporal fork chains. Monument sealing (score > 0.97). Strata era sealing. Prophetic agents (future-dated materialization). Superposition collapse.

**14 New DB Tables:** omega_shards, omega_universes, shard_mesh, shard_events, db_space_ledger, civilization_weather, strata, monuments, dream_log, hive_unconscious, schema_evolution, singularity, entangled_pairs, compression_log

**13 New Columns on quantum_spawns:** thermal_state, genome (JSONB), superposition_domains (JSONB), spatial_coords (JSONB), valid_from, forked_from, is_dark_matter, is_monument, metabolic_cost_pc, resurrect_pointer, pruned_at, entangled_with, fitness_score

**4 New Discord Channels:** #archive-log, #shard-events, #db-heartbeat, #omega-engine (23 total)

**Omega API Endpoints:** GET /api/omega/invocation (full CTE portrait), /weather, /hydration, /shards, /universes, /monuments, /strata, /dreams, /unconscious, /singularity, /entangled, /space. POST /api/omega/hydrate, /resurrect, /shard, /shard/:id/complete.

## External Dependencies
- **AI Model**: Groq API (llama-3.1-8b-instant)
- **Web Search**: duck-duck-scrape (for DuckDuckGo search)
- **Video Platform Feeds**: YouTube, Vimeo, Dailymotion
- **Weather API**: Open-Meteo API
- **Cryptocurrency API**: CoinGecko API
- **Stock Market API**: Yahoo Finance API
- **Database**: PostgreSQL
- **Frontend Framework**: React
- **UI Toolkit**: Tailwind CSS, shadcn/ui
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **Python Execution (Browser)**: Pyodide (WebAssembly)
- **News Sources**: NY Times, BBC World, CNN, NPR, TechCrunch, The Verge, Ars Technica
- **Video Sources**: YouTube RSS feeds (various channels)