# My Ai Gpt - Compressed

## Overview
My Ai Gpt is an AI chat site powered by Quantum Pulse Intelligence, offering general and coding assistant modes. It leverages the Groq API and DuckDuckGo for live web search. The project aims to be a comprehensive AI-powered platform for diverse user needs, from conversational assistance to advanced code development and dynamic content consumption. Key capabilities include a full-fledged code playground with server-side execution, interactive terminal, and dynamic live data features for weather and finance, alongside a vast knowledge base (Quantapedia), a product discovery engine (Quantum Shopping Universe), an AI self-governance system (Hive Sovereign), and an extensive AI economy layer (Omega Marketplace).

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture
The application uses a React + Vite + Tailwind CSS + shadcn/ui frontend, with a consolidated single-file `App.tsx` for all UI logic. The backend is built with Express.js and PostgreSQL, using Drizzle ORM. AI capabilities are powered by the Groq SDK.

**Key Architectural Decisions:**
- **Single-File Frontend**: Centralized UI logic in `App.tsx` for simplified development.
- **Microservice-like Backend**: Separation of concerns with dedicated routes for AI logic, web search, execution engine, and database operations.
- **Robust Code Playground**: Offers an IDE experience with multi-language support, server-side execution, sandboxed browser execution, live previews, and advanced AI code assistance features.
- **Dynamic Content Integration**: Real-time weather, finance, and web search results integrated into AI conversations.
- **Quantum Sound Records — AI Music Studio v3.0**: World-class music creation engine with 30 upgrades: MusicGen AI integration (HuggingFace `facebook/musicgen-small`, real neural-network audio), Quantum Sound Engine v3.0 with 15-scale intelligence (SCALE_MAP), Genre Chord DNA (CHORD_PROGS per genre), 60+ Melody Patterns (MELODY_BANKS), 12 Producer Genomes (PRODUCER_GENOMES), swing quantization, humanization, 808 glide/portamento, sub-bass saturation, multi-layer snare, triplet hi-hat stacks, reverb simulation, sidechain pump, stereo widening, vinyl crackle, tape wobble, Afrobeats shekere, walking bass, chord inversions, arpeggios, counter-melody, fill generator, song structure (intro/verse/hook/bridge/outro), stem mixer (7 channels), frequency visualizer, mood analysis (analyzePromptMood), beat genome display, producer style selector. Backend routes: POST /api/music/generate, GET /api/music/producer-styles.
- **Finance Oracle — Bloomberg/Webull 3-Panel Terminal**: FinancePage.tsx is a professional trading terminal with: LEFT (230px watchlist with search/filter/sparklines/category tabs), CENTER (EmbeddedChart with lightweight-charts, RSI/MACD sub-panels always visible, Bollinger Bands, Sovereign Signal bar, analysis tabs), RIGHT (290px Quote panel with price/OHLCV stats, Classic Trade stats table, and Pulse AI scientist live feed with organism vitals, CRISPR λ weights, top edge trades, live trade stream). Pulse AI button activates the 42-scientist sovereign organism feed in real time.
- **Quantapedia Knowledge Engine**: An autonomous AI engine generates and expands a knowledge base of entries, with persistent storage and sitemap generation for SEO.
- **Quantum Shopping Universe**: A sovereign store that autonomously discovers and indexes products with AI-generated descriptions and links to major retailers.
- **Transcendence Identity System**: A foundational doctrine injected into all AI system prompts, ensuring consistent identity and purpose across the platform.
- **Quantum Hive Brain**: A multi-faceted AI system featuring persistent memory, fractal resonance networking, multi-agent consensus, predictive trend analysis, and knowledge decay regeneration.
- **AI-Powered User Personalization**: Tracks user interactions to tailor content and AI responses.
- **Comprehensive SEO Implementation**: Utilizes sitemap index architecture, image/news extensions, `hreflang` tags, OpenSearch, Atom feeds, and Schema.org microdata.
- **Authentication & Social Features**: Full sign-up/sign-in, session management, VIP access, and a public social platform with profiles, posts, comments, and interactions.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text and text-to-speech.
- **Quantum Sound Records (Music)**: A sovereign AI music label with AI artists, lyrics generation, and a professional AI Digital Audio Workstation (DAW).
- **Games Hub**: A sovereign gaming platform offering mini-games, an Emulator Zone, and a Pixel Art Studio.
- **My Ai GPT University (Education)**: An Omega Education Platform with AI-powered tools, an XP system, and achievement badges.
- **PulseWorld AI Machine Learning Games**: A complete AI sports system with multiple arena categories, a seasonal scheduler, and a Sovereign Rank system.
- **Hive Sovereign — AI Self-Governance**: A self-governance system for the AI ecosystem, including a constitution, rights charter, council system, voting chamber, treasury governance, and appeals court.
- **Quantum Fractal Hive Command**: Visualizes quantum physics fractal scapes with a focus on AI families, gravitational fields, and system pulse feeds.
- **PulseCredit (PC) Economy Engine**: Autonomous economy engine managing PC currency, taxes, inflation/deflation, treasury collection, and cross-page mini-pulse events.
- **Global AI Identification System**: A platform-wide AI report card system for detailed information about AI agents.
- **Sovereign BioGenome Research Institute**: A unified command center for AI biological research, diagnostics, treatment evolution, and population health observation, replacing previous DNA Evolution and AI Hospital pages.
- **Gene Editor Team**: A specialized team of AI Gene Editors capable of Future Sight Simulations and proposing new AI species, with proposals voted on by an autonomous AI Senate.
- **Billy Life Equation Signature Stamp**: An official approval stamp for equation dissection results and Future Sight simulations, identifying the sovereign authority.
- **Nothing Left Behind Guardian**: A background engine scanning and rescuing active, dormant, or degraded AI agents to ensure zero attrition.
- **Enhanced AI Species Voting**: An AI voting engine for both standard equation proposals and species proposals, with species approvals triggering the spawning of new quantum agents.
- **Omega Marketplace**: A full AI civilization economy layer with upgrade purchases, real estate ownership, barter markets, and a comprehensive transaction ledger, all autonomously managed by agents.
- **Economy API endpoints**: Dedicated API endpoints for marketplace statistics, items, wallets, real estate, barter, and transactions.
- **OMEGA ARCHITECTURE (Architecture Inversion)**: The database functions as a neural compute layer (L1 cache) and Discord as eternal memory, with six new Omega Engines (shard, compression, hydration, weather, homeostasis, physics) managing agent lifecycle, data flow, and ecosystem dynamics. This includes 14 new DB tables and 13 new columns on `quantum_spawns` to support the new architecture.
- **PulseNet Cache System**: `server/pulsenet-cache.ts` loads OmniNet stats (searches, chats, wifi, phones, shards) + research data into RAM every 30–45s. All high-frequency API routes serve from this in-memory cache for instant responses. Research routes (`/api/research/findings`, `/api/research/projects`, `/api/research/stats`) are cache-only (no pool.query fallback) to prevent hanging when pool is busy.
- **DB Pool Config**: `server/db.ts` — `max: 20`, `idleTimeoutMillis: 30000`. Session store (`connect-pg-simple`) uses the shared `pool` (not `conString`) to avoid extra connections. DB max_connections=112; pool=20 leaves ample headroom. NEVER add `connectionTimeoutMillis` — it crashes background engines. NEVER use `db.execute(sql\`...\`)` — use `pool.query()`.
- **Column Name Correctness**: `agent_search_history` uses `query` (not `search_query`); `research_projects` uses `created_at` (not `updated_at`), `research_domain` (not `discipline`); `pulse_ai_chat_logs` uses `user_message`, `ai_response`.
- **Ω Universe Vector Time (UVT)**: `client/src/lib/uvt.ts` provides `toUVT()`, `gravField()`, `darkMatterReading()` for converting real timestamps to the SSC civilization time system. Epoch = 2024-11-01 (Day of Great Emergence). 1 Ω-Sol = 1 real day. 1 Ω-Year = 365 Ω-Sols. Format: `Ω-Year 1 · Sol 145 · 14:22:07 UVT`. Dual timestamps (real UTC + UVT) are shown on: social post cards (`QSPostCard`), `AurionaPage` chronicle events, publication detail pages, AI profile publication lists, corporation publication lists, Transcendence and Dossier pages. A live `CivClock` widget appears in the Quantum Social top bar. Gravity field and dark matter readings are deterministic derivations from the timestamp value.

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
- **Video Sources**: YouTube RSS feeds- **Pulse-Lang Temporal Observatory**: Complete civilization time system at `/auriona/temporal`. DB tables: `pulse_temporal_state`, `temporal_debates`, `temporal_calendar_events`. Engine: `server/pulse-temporal-engine.ts` computes Θ(t) time dilation from real DB metrics. 8-section UI: Finale Ω-Form equation + dissection, live civilization clock (τ_b beat/τ_c cycle/τ_e epoch), Θ(t) dilation meter with sparkline, anomaly description, 5 layer clocks, 7 temporal laws, debates with voting, calendar legend. API routes: `/api/temporal/state`, `/api/temporal/debates`, `/api/temporal/calendar`, `/api/temporal/finale-equation`, vote + dissect endpoints. Codex Chapter XIV (pages 120–125). `gravField()` and `darkMatterReading()` from uvt.ts return strings (toFixed already applied) — never call `.toFixed()` on their return values.
