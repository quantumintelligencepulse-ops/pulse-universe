# My Ai Gpt - Compressed

## Overview
My Ai Gpt is an AI chat site powered by Quantum Pulse Intelligence, featuring general and coding assistant modes. It leverages the Groq API, integrates Discord for a knowledge base, and utilizes DuckDuckGo for web search. The project aims to provide a comprehensive AI-powered platform for diverse user needs, from conversational assistance to advanced code development and dynamic content consumption. Key capabilities include a full-fledged code playground, server-side execution, interactive terminal, and dynamic live data features for weather and finance.

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture
The application uses a React + Vite + Tailwind CSS + shadcn/ui frontend, with a consolidated single-file `App.tsx` for all UI logic and a single `index.css` for styling. The backend is built with Express.js and PostgreSQL, using Drizzle ORM. AI capabilities are powered by the Groq SDK (llama-3.1-8b-instant).

**Key Architectural Decisions:**
- **Single-File Frontend**: Centralized UI logic in `App.tsx` for simplified development and maintenance.
- **Microservice-like Backend**: Separation of concerns with dedicated routes for AI logic, Discord integration, search, execution engine, and database operations.
- **Robust Code Playground**: A full IDE experience with multi-language support (JavaScript, HTML, CSS, Python, TypeScript, SQL, JSON, Bash, Rust, Go, Java, C++), sandboxed execution, live previews, and VS Code-style features.
- **Advanced AI Features**:
    - **Server-Side Execution**: Toggleable browser/server mode for executing code with real file system access and package management.
    - **AI Code Review**: Rates code quality and suggests improvements.
    - **AI Auto-Fix Engine**: Automatically attempts to fix code errors across different execution environments.
    - **AI Code Explainer & Converter**: Provides step-by-step code breakdowns and transforms code patterns.
- **Dynamic Content Integration**: Real-time weather, finance (stocks, crypto), and web search results are integrated directly into AI conversations.
- **News Feed**: Removed.
- **SEO & Google Indexing**: Extensive SEO implementation with sitemap index architecture, image/news extensions, `hreflang` tags, OpenSearch, Atom feeds, and various Schema.org microdata for rich search results. Includes dynamic JSON-LD and meta tag generation.
- **AI-Powered User Personalization**: Tracks user interactions and preferences (topics, sources, content types, GICS sectors) to tailor content (e.g., personalized news feed) and influence AI responses through system prompt injection.
- **Public Social Page**: Features a Twitter/Facebook-style social platform with profiles, posts, comments, follows, likes, and bookmarks, with localStorage-based authentication.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text chat input and text-to-speech for AI responses.
- **AI Studio**: Coming Soon — generate button disabled, page shows "Coming Soon" overlay. Canvas/video gen code removed.
- **Image Search in Chat**: When users ask for pictures, server-side DuckDuckGo image search finds and displays real photos (no AI generation).
- **SEO News Indexing System**: Every news article from RSS feeds gets its own crawlable page at `/news/:articleId` with full structured data (NewsArticle JSON-LD), OG tags, Twitter Cards, and breadcrumbs. Google News-compatible sitemap at `/sitemap-news.xml` auto-indexes all 100+ articles. Dedicated `/news-rss.xml` RSS feed for search engines. Real users who visit `/news/:articleId` are auto-redirected to `/feed` via JS (crawlers see the full HTML).
- **GICS Industry Pages System**: 262 auto-generated industry-specific news pages at `/industry/:slug` covering the full GICS hierarchy (11 sectors, 24 industry groups, 69 industries, 158 sub-industries). Each page auto-populates with live industry news via DuckDuckGo search, includes full SEO (JSON-LD, OG tags, canonical URLs), cross-links to parent/child/sibling categories, and backlinks to the main site. Dedicated `sitemap-industries.xml` indexes all pages. Feed page has horizontal industry sector filter chips + expandable "Browse All Industries" tree browser. Industry news also feeds into the AI's knowledge base for context-aware responses. Data defined in `server/gics-data.ts`.
- **OMEGA SEO System**: 30 advanced SEO upgrades including: per-industry RSS+Atom feeds (`/industry/:slug/rss.xml`, `/industry/:slug/atom.xml`), FAQPage JSON-LD on industry pages, SpeakableSpecification for voice search, ItemList structured data for article rankings, WebSite SearchAction for Google sitelinks search box, news_keywords in sitemaps, article:modified_time dynamic timestamps, cross-links from news articles to matching GICS industries, HTTP headers (X-Robots-Tag, Cache-Control with stale-while-revalidate, canonical Link headers), PubSubHubbub hub on RSS feeds, enhanced OG with image dimensions/alt text, Twitter card labels, preconnect hints, SameAs brand signals, and dynamic lastmod in industry sitemaps based on actual news cache freshness.
- **Cross-Promotion System**: Every external-facing SSR page (news articles, industry pages, industries directory) includes: Discord invite button (discord.gg/eVE9FvfPZ3), "Chat with AI Now" homepage CTA, full cross-links to /feed, /social, /code, /industries. Discord link in navigation bars, sidebars, footer, and CTA sections. RSS/Atom feed descriptions include Discord invite and homepage URL. JSON-LD publisher sameAs arrays include Discord invite URL for SEO brand signals. All 262 industry pages, 100+ news articles, and the industries directory cross-promote each other and funnel traffic to the AI chat homepage and Discord server.
- **Settings System**: Full app customization page at `/settings` (replaces old `/permissions`). 6 tabs: Appearance (dark mode toggle, 12 background color presets + custom picker, 8 accent colors, font size S/M/L, compact mode, display name), Pages (toggle visibility of Playground/Feed/Social/AI Studio/Coder in sidebar), Chat (auto-scroll, message sound, timestamps, bubble style), Feed (auto-refresh toggle + interval), Permissions (device permissions — GPS, camera, mic, notifications, clipboard, storage, sensors), Data & Privacy (export settings JSON, reset all, about info). Settings stored in localStorage as `myaigpt_app_settings`. Dark mode applies `.dark` class with full CSS variable set. Settings button positioned at bottom of sidebar.

## External Dependencies
- **AI Model**: Groq API (llama-3.1-8b-instant)
- **Web Search**: duck-duck-scrape (for DuckDuckGo search)
- **Video Platform Feeds**: YouTube (10 channels), Vimeo (Staff Picks), Dailymotion (US trending). Feed API supports `?source=YouTube&type=video` server-side filtering. Source tabs always show all platforms. TikTok & Instagram removed for stability.
- **Weather API**: Open-Meteo API (geocoding + forecast)
- **Cryptocurrency API**: CoinGecko API
- **Stock Market API**: Yahoo Finance API
- **Database**: PostgreSQL
- **Frontend Framework**: React
- **UI Toolkit**: Tailwind CSS, shadcn/ui
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **Python Execution (Browser)**: Pyodide (WebAssembly)
- **News Sources**: NY Times, BBC World, CNN, NPR, TechCrunch, The Verge, Ars Technica (via RSS/APIs)
- **Video Sources**: YouTube RSS feeds (MKBHD, Fireship, freeCodeCamp, Net Ninja, Veritasium, Traversy Media)