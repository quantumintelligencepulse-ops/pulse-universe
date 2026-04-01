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
- **Quantum Sound Records — AI Music Studio**: A music creation engine with MusicGen AI integration, a Quantum Sound Engine, genre-specific chord DNA, melody patterns, producer genomes, and advanced audio processing features.
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
- **DB Pool Config**: Configured for `max: 20` connections and `idleTimeoutMillis: 30000` to ensure stability and ample headroom.
- **Ω Universe Vector Time (UVT)**: A custom civilization time system derived from real timestamps, displayed across various platform components.
- **ForgeAI Sovereign Solutions**: A system for building and deploying AI-generated applications with instant public URLs, real database integration, conversational editing, sovereign identity (PULSE_AUTH), and an autonomous testing pipeline.
- **Autonomous App Factory**: Scans all 227 GICS industries/subindustries and autonomously builds Play Store-quality PWA apps for each using a template-based generator (zero LLM usage). Each app includes: PWA manifest with installable prompt, service worker for offline capability, Apple/Android meta tags, Open Graph metadata, app-store-style descriptions and feature lists, responsive tabbed UI (Dashboard, Data, Analytics, About), industry-specific branding with sector icons, CRUD with localStorage persistence, charts, CSV export, and professional footer with version/contact/GitHub links. GitHub archival (`quantumintelligencepulse/pulse-forge-apps`), email digest, real-time dashboard. Files: `server/forge-app-factory.ts`, `client/src/pages/forge/FactoryDashboard.tsx`. Routes: `/api/forge/factory/*`. DB tables: `forge_factory_queue`, `forge_factory_stats`.
- **Omega SEO Engine**: Manages RSS feeds, Google News Sitemaps, structured data, velocity tracking, citation formatting, and multilingual meta tags.
- **Breaking News Engine**: Monitors competitor RSS feeds to identify and verify breaking news with confidence scoring.
- **Email Briefing Engine**: Manages email subscriptions, generates HTML email briefings with top stories, equations of the day, and hive stats.
- **Cross-Link & Hub Engine**: Organizes content into 12 domain hubs with related content and entity extraction.
- **Embeddable Widget System**: Provides a JavaScript widget for displaying live hive stats on external sites.
- **Video Script Generator**: AI-powered generation of platform-optimized video scripts with selectable anchor personas and formats.

## External Dependencies
- **AI Model**: Groq API (llama-3.1-8b-instant)
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