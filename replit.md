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