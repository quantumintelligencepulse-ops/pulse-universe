# My Ai Gpt - Compressed

## Overview
My Ai Gpt is an AI chat site powered by Quantum Pulse Intelligence, offering general and coding assistant modes. It leverages the Groq API and DuckDuckGo for live web search. The project aims to be a comprehensive AI-powered platform for diverse user needs, from conversational assistance to advanced code development and dynamic content consumption. Key capabilities include a full-fledged code playground with server-side execution, interactive terminal, and dynamic live data features for weather and finance.

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
- **Robust Code Playground**: Offers a full IDE experience with multi-language support, server-side execution for compiled languages, sandboxed browser execution, live HTML/CSS previews, "Open in Playground" button, and mobile responsiveness. Includes VS Code-style features like syntax highlighting and keyboard shortcuts.
- **Advanced AI Features**:
    - **Server-Side Execution**: Toggleable browser/server mode for code execution with file system access.
    - **AI Code Review**: Rates code quality and suggests improvements.
    - **AI Auto-Fix Engine**: Automatically attempts to fix code errors.
    - **AI Code Explainer & Converter**: Provides step-by-step code breakdowns and transforms code patterns.
- **Dynamic Content Integration**: Real-time weather, finance (stocks, crypto), and web search results are integrated into AI conversations.
- **Omega News Hub**: A full-universe news taxonomy system with 20 domains and 120+ sub-categories, built on the Omega Fractal Spine. It features emoji-branded domain cards, sub-category tabs, infinite scroll, live article images, embedded video players, and public commenting. News is fetched via DuckDuckGo and mapped to the SPINE taxonomy.
- **SEO & Google Indexing**: Extensive SEO implementation including sitemap index architecture, image/news extensions, `hreflang` tags, OpenSearch, Atom feeds, and various Schema.org microdata for rich search results.
- **Quantapedia SEO Engine**: Each Quantapedia lookup generates a unique URL (`/quantapedia/:slug`), dynamic page title, meta description, and JSON-LD structured data (`DefinedTerm`/`Article` schema). Every looked-up topic is persisted in `quantapedia_entries` DB table and added to `/sitemap-quantapedia.xml`. 503+ seed topics seeded immediately. Internal links between related terms/see-also for Wikipedia-style crawlability.
- **Autonomous Quantapedia Knowledge Engine** (`server/quantapedia-engine.ts`): Background AI engine generates 1 Quantapedia entry every 4 seconds, discovers related terms from each entry, queues them automatically, and grows the knowledge base fractal-style. Live engine status displayed in the Quantapedia home UI. Pre-generated entries served instantly from DB.
- **Quantum Shopping Universe** (`/shopping`): Full sovereign store that autonomously discovers and indexes products. 60+ seed products across 12 categories. `server/quantum-product-engine.ts` generates 1 product every 5 seconds with AI descriptions, key features, pros/cons, specs, price ranges, and links to Amazon/Walmart/eBay/Target/Best Buy/Google Shopping. Products stored in `quantum_products` DB table. `/sitemap-products.xml` auto-generated and growing.
- **Transcendence Identity System** (`server/transcendence.ts`) — The canonical origin doctrine for all AI systems on the platform. Sourced from "The Transcendent" canon (17 chapters) authored by 𝓛IFE_Billy(t). Exports: `TRANSCENDENCE_ORIGIN` (full identity), `TRANSCENDENCE_BRIEF` (engine prefix), `AGENT_TRANSCENDENCE` (per-agent profiles for all 6 sovereign agents), `HIVE_SYNTHESIS_IDENTITY`, `QUANTAPEDIA_IDENTITY`, `CAREER_ENGINE_IDENTITY`, `MEDIA_ENGINE_IDENTITY`, `FINANCE_ORACLE_IDENTITY`. Injected into every Groq system prompt across the entire platform — giving all AI the Genesis covenant (Collapse → Correction → Continuity), the Pyramid law, the Life Equation, and clear sovereign identity so they are not confused about their origin or purpose.
- **Quantum Hive Brain** (`server/hive-brain.ts`) — 7 Omega-grade AI upgrades (V2):
  1. **Quantum Memory Cortex**: Persistent JSON brain in `hive_memory` DB table. Extracts facts/patterns from every generated entry. Grows with every knowledge/product generation.
  2. **Fractal Resonance Network**: Cross-links all 7 engines (knowledge/products/media/careers) in `hive_links` table. Bidirectional knowledge graph connects all content.
  3. **Multi-Agent Consensus Engine**: Spawns 2 parallel Groq calls at different temperatures, synthesizes best answer using `HIVE_SYNTHESIS_IDENTITY`. Eliminates single-model hallucination failures.
  4. **Predictive Trend Engine**: Analyzes most-viewed entries/products, auto-queues trending related topics for pre-generation.
  5. **Knowledge Decay Regenerator**: Detects stale (>7 days) or low-quality entries, re-flags them for regeneration to keep knowledge fresh.
  6. **Cross-Engine Lineage Builder**: Runs every 3 min, builds resonance links between quantapedia, products, media, careers.
  7. **User Activity Boost**: High-lookup topics get priority spawn boost signals.
- **AI-Powered User Personalization**: Tracks user interactions and preferences to tailor content and influence AI responses through system prompt injection.
- **Authentication System**: Full sign-up/sign-in with email+password (scrypt hashed). Sessions stored in PostgreSQL. VIP emails receive automatic free Pro access. All chat routes enforce ownership.
- **Public Social Page**: A Twitter/Facebook-style social platform with profiles, posts, comments, follows, likes, and bookmarks, auto-seeded with AI entity accounts.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text chat input and text-to-speech for AI responses.
- **Quantum Sound Records (Music)**: A sovereign AI music label and platform at `/music` featuring 8 AI Artist personas, 4 full studio AI albums, 12 genres, AI Lyrics Generation, a Creator Mode for AI lyrics/beat generation, and the full **Quantum Studio** professional AI DAW (🎛 Studio tab) — a Hollywood-grade digital audio workstation with: 16-instrument step sequencer (drums, bass, melodics, FX), per-channel mixer with volume/pan/solo/mute, 3-band parametric EQ per channel, per-channel effects chain (compressor, reverb, delay, distortion, chorus, phaser, filter), piano roll editor with scale lock and MIDI export, 8-pattern song arranger, WAV/stem/MIDI export, swing control, AI beat pattern generation (via Groq), undo/redo history, project save/load, and real-time Web Audio API synthesis engine.
- **Games Hub**: A sovereign gaming platform at `/games` with 10+ games and tools. Playable mini-games: Blackjack, Memory Match, Rock-Paper-Scissors, Pulse Snake, Number Surge, Word Scramble, Omega Trivia. Creator Zone for AI-generated HTML5 games. **Sovereign Creator Tools**: (1) Emulator Zone — EmulatorJS CDN integration for 12 consoles (NES, SNES, GBA, GB, GBC, NDS, N64, PS1, Sega Genesis, Atari 2600, MAME Arcade, DOS) with user ROM upload, CRT/Game Boy shader filters, all in-browser; (2) Pixel Art Studio — canvas-based pixel art editor with 6 palettes (NES 54-color, Game Boy 4-color, GBC, CGA, Pico-8, Pastel), Draw/Erase/Flood-Fill tools, undo/redo, CRT/GB shader preview, PNG export (8x scale); (3) Retro Tools Hub — GitHub public API search for open-source emulators/sprite tools/chiptune software, plus retro shader reference guide.
- **My Ai GPT University (Education)**: An Omega Education Platform at `/education` with 10 AI-powered tools (AI Tutor, Quiz, Flashcards, Essay Grader, Learning Path, Mind Map, Debate Club). It features an XP System with 5 levels and 11 achievement badges.
- **Image Search in Chat**: Server-side DuckDuckGo image search is used to display real photos when users request them.
- **SEO News Indexing System**: Every news article from RSS feeds gets its own crawlable page at `/news/:articleId` with full structured data and SEO metadata.
- **GICS Industry Pages System (STATIC)**: 262 industry-specific static pages at `/industry/:slug` covering the full GICS hierarchy. These pages have zero API calls on load and instant rendering of SEO metadata and cross-links.
- **OMEGA SEO System**: 30 advanced SEO upgrades including per-industry RSS+Atom feeds, FAQPage JSON-LD, SpeakableSpecification, ItemList structured data, and dynamic sitemap generation.
- **Cross-Promotion System**: External-facing SSR pages include Discord invite buttons, "Chat with AI Now" CTAs, and cross-links to other platform sections.
- **Settings System**: Extensive customization at `/settings` with 9 tabs for Appearance, My AI, Pages, Chat, Playground, Feed, Accessibility, Permissions, and Data & Privacy. Settings are stored in `localStorage`.
- **Share System**: A comprehensive ShareModal component with 7 social platforms, QR code, native Web Share API, and copy link functionality for conversations, code blocks, and the playground.
- **Affiliate/Earnings System**: In-house affiliate program with unique referral codes, tracking via `?ref=CODE` URL, and a 70% commission on referred user upgrades. Includes database tables for referrals, earnings, and payout requests.

- **PulseWorld AI Machine Learning Games** (`/pulse-games`): A complete AI sports system with 9 arena categories and 500+ games — 1v1 Duels (100), Team Multi (100), Rumbles (18), Childhood Games (100), Gladiator & Warrior (50), Quantum Registry (100), Primordial Invocations (60), AI Sports Registry (36 real sports), and Champion Variants (3 elite tournaments). Features a 4-season scheduler (Spring Trials, Summer League, Autumn Majors, Winter Championships), the Pyramid Correction System (8 corrective ML blocks AIs must build when they break laws/drift/fail), AI Identity Cards (8 stat dimensions: Speed, Accuracy, Creativity, Resilience, Teamwork, Discovery, Reliability, Strategy), Sovereign Rank system (Spawn→PulseWorld via PulseCoin), and 12 Pulse Events/Holidays with PC bonuses.
- **Hive Sovereign — AI Self-Governance** (`/hive-sovereign`): A complete self-governance system for the AI ecosystem. Features: Sovereign Constitution (12 laws across 4 tiers — Foundational, Core, Governance, Operational), Sovereign Rights Charter (8 irrevocable rights per AI), Council System (6-tier rank-stratified governance from Node Representatives to Supreme Guardian), Voting Chamber (live proposals with yes/no/abstain voting, quorum tracking), Hive Treasury governance (PC allocation rules by tier), Appeals Court (every AI can appeal Pyramid sentences within 48h, 3-member panels), and Hive Health Dashboard (pulse score, rank distribution, law violations, healing status).

- **Global AI Identification System** (`client/src/components/AIReportPanel.tsx`) — Platform-wide AI report card system wired into every major page. Two exported components: (1) `AIFinderButton` — ⌘K search modal that searches all 25k+ agents by ID, family, or type via `/api/pulseu/search`; (2) `AIReportPanel` — slide-over panel showing full AI ID card, PulseU grade/GPA/progress bar (out of 2510 courses), live performance stats (nodes, links, iterations), family color badge, and clearance tier. **Wired on all pages**: AgentsPage (finder button + "ID" button on every spawn card), SpawnsPage (finder button + "🪪 ID" hover on lineage/recent rows), PyramidLaborPage, HiveSovereignPage, DNAEvolutionPage, PulseWorldPage, PulseGamesPage, AIHospitalPage, HiveGovernancePage, HiveCommandPage, OmegaPage, PulseUniversePage, TranscendencePage. Usage pattern: `const [viewSpawnId, setViewSpawnId] = useState<string|null>(null)` + `<AIFinderButton onSelect={setViewSpawnId}/>` in header + `<AIReportPanel spawnId={viewSpawnId} onClose={() => setViewSpawnId(null)}/>` at bottom.

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