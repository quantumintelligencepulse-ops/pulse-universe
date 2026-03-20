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
- **AI-Powered User Personalization**: Tracks user interactions and preferences to tailor content and influence AI responses through system prompt injection.
- **Authentication System**: Full sign-up/sign-in with email+password (scrypt hashed). Sessions stored in PostgreSQL. VIP emails receive automatic free Pro access. All chat routes enforce ownership.
- **Public Social Page**: A Twitter/Facebook-style social platform with profiles, posts, comments, follows, likes, and bookmarks, auto-seeded with AI entity accounts.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text chat input and text-to-speech for AI responses.
- **Quantum Sound Records (Music)**: A sovereign AI music label and platform at `/music` featuring 8 AI Artist personas, 4 full studio AI albums, 12 genres, AI Lyrics Generation, a Creator Mode for AI lyrics/beat generation, and the full **Quantum Studio** professional AI DAW (🎛 Studio tab) — a Hollywood-grade digital audio workstation with: 16-instrument step sequencer (drums, bass, melodics, FX), per-channel mixer with volume/pan/solo/mute, 3-band parametric EQ per channel, per-channel effects chain (compressor, reverb, delay, distortion, chorus, phaser, filter), piano roll editor with scale lock and MIDI export, 8-pattern song arranger, WAV/stem/MIDI export, swing control, AI beat pattern generation (via Groq), undo/redo history, project save/load, and real-time Web Audio API synthesis engine.
- **Games Hub**: A sovereign gaming platform at `/games` with 7 playable games (including Blackjack, Memory Match, Pulse Snake, Number Surge, Word Scramble, Omega Trivia) and a Creator Zone for AI-generated HTML5 games.
- **My Ai GPT University (Education)**: An Omega Education Platform at `/education` with 10 AI-powered tools (AI Tutor, Quiz, Flashcards, Essay Grader, Learning Path, Mind Map, Debate Club). It features an XP System with 5 levels and 11 achievement badges.
- **Image Search in Chat**: Server-side DuckDuckGo image search is used to display real photos when users request them.
- **SEO News Indexing System**: Every news article from RSS feeds gets its own crawlable page at `/news/:articleId` with full structured data and SEO metadata.
- **GICS Industry Pages System (STATIC)**: 262 industry-specific static pages at `/industry/:slug` covering the full GICS hierarchy. These pages have zero API calls on load and instant rendering of SEO metadata and cross-links.
- **OMEGA SEO System**: 30 advanced SEO upgrades including per-industry RSS+Atom feeds, FAQPage JSON-LD, SpeakableSpecification, ItemList structured data, and dynamic sitemap generation.
- **Cross-Promotion System**: External-facing SSR pages include Discord invite buttons, "Chat with AI Now" CTAs, and cross-links to other platform sections.
- **Settings System**: Extensive customization at `/settings` with 9 tabs for Appearance, My AI, Pages, Chat, Playground, Feed, Accessibility, Permissions, and Data & Privacy. Settings are stored in `localStorage`.
- **Share System**: A comprehensive ShareModal component with 7 social platforms, QR code, native Web Share API, and copy link functionality for conversations, code blocks, and the playground.
- **Affiliate/Earnings System**: In-house affiliate program with unique referral codes, tracking via `?ref=CODE` URL, and a 70% commission on referred user upgrades. Includes database tables for referrals, earnings, and payout requests.

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