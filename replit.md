# My Ai Gpt - Beta Release 1

## Overview
AI chat site called "My Ai Gpt" powered by Quantum Pulse Intelligence. Features two chat modes: general assistant and coding assistant. Uses Groq API with llama-3.1-8b-instant model, Discord channels for knowledge base, and DuckDuckGo for web search. Created by Billy Banks.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (single-file App.tsx)
- **Backend**: Express.js + PostgreSQL (Drizzle ORM)
- **AI**: Groq SDK (llama-3.1-8b-instant)
- **Search**: duck-duck-scrape for web context
- **Knowledge**: Discord.js bot fetches from 17 knowledge channels
- **Weather**: Open-Meteo API (geocoding + forecast, free, no key)
- **Finance**: CoinGecko API (crypto) + Yahoo Finance API (stocks), free, no key

## Key Files
- `client/src/App.tsx` - ALL frontend code (consolidated single file)
- `client/src/index.css` - All styles and CSS variables
- `server/routes.ts` - API routes + AI logic + Discord + search + execution engine
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema (chats, messages tables)
- `shared/routes.ts` - API contract definitions

## Code Playground (Full IDE - PowerShell Level)
- Route: /playground with sidebar navigation link
- Multi-language: JavaScript, HTML, CSS, Python, TypeScript, SQL, JSON, Bash, Rust, Go, Java, C++
- JavaScript execution via sandboxed iframe with console.log capture
- Python execution via Pyodide (WebAssembly) - real Python in browser
- HTML/CSS live preview in iframe panel
- Tab key indentation, Ctrl+Enter to run, Ctrl+S to save
- Code metrics in status bar (lines, functions, classes, complexity)
- VS Code-style editor with syntax highlighting overlay
- Keyboard shortcut: Ctrl+P to open playground

## 5 POWER Features (PowerShell-Level)
1. **Server-Side Execution** - Toggle Browser/Server mode. Server mode runs JS/TS/Python/Bash on actual Node.js/Python runtime with real file system access, `require()`, full npm packages. 15s timeout, temp file cleanup.
2. **Interactive Terminal** - Built-in terminal panel with command history (arrow keys), runs real shell commands (ls, pwd, node -v, pip list, etc.). Safety-blocked destructive commands. Green prompt with command history.
3. **Multi-File Project System** - Create projects with multiple files, file tree sidebar, switch between files, save/load per-file. Server-persisted in playground_projects/ directory.
4. **Package Manager** - Install npm or pip packages from the playground. Select manager, type package names, install button. Output log shows progress. Packages available for server-side execution.
5. **Code Snippet Templates** - 8 pre-built templates: HTTP Server, Web Scraper, Data Analysis, REST API Client, Sorting Algorithms, Discord Bot, React Component, Dashboard UI. One-click load into editor.

## 5 Futuristic AI Features
1. Voice-to-Code - Web Speech API captures voice, inserts as code comments
2. AI Code Review - Sends code to AI for quality rating (1-10) with improvements
3. AI Auto-Fix Engine - On error, automatically sends code+error to AI, gets fixed version, re-runs. Up to 3 attempts. Works in browser AND server mode.
4. AI Code Explainer - Step-by-step AI breakdown of what code does
5. AI Code Converter - Transforms code between patterns/paradigms

## Auto-Fix Engine
- Toggle ON/OFF in toolbar (green button)
- Catches JS errors from iframe sandbox, Python errors from Pyodide, server execution errors
- Sends broken code + error message to AI Coder endpoint
- AI returns fixed code in code block, engine extracts and replaces editor content
- Automatically re-runs fixed code (recursive for Python/server, setTimeout for JS)
- MAX_FIX_ATTEMPTS = 3, resets on success or exhaustion

## Coder Features (30 Transcendence-class upgrades)
1-30: Code themes, language icons, metrics analyzer, live preview, fullscreen, collapsible blocks, search, settings, templates, paste detection, categorized suggestions, saved codes manager, persistent settings, keyboard shortcuts, etc.

## Live Data Features
- **Weather**: Detects weather queries, extracts location, maps US state names to major cities, uses Open-Meteo geocoding + forecast API. Returns current conditions + 3-day forecast injected into AI context.
- **Finance/Stocks**: Detects stock/crypto queries by company name or ticker. Uses Yahoo Finance v8 chart API for stocks (price, change, high/low, volume). Uses CoinGecko API for crypto (price, 24h change, market cap, ATH, description). 60+ company names mapped to tickers, 25+ crypto names mapped to CoinGecko IDs.
- **Web Search**: DuckDuckGo search for general knowledge queries (who/what/when/where/how/latest/news).

## General Features
- Two chat modes: My Ai Gpt (general) and My Ai Coder (coding)
- Chat rename, search, clear all, grouped by date
- Message reactions, copy, regenerate, retry on error
- Export conversation as markdown
- Responsive design with white theme

## News Feed (MSN-Style)
- Route: /feed with sidebar "Feed" link (orange accent, LIVE badge)
- Sources: NY Times (2 feeds), BBC World (2 feeds), CNN, NPR, TechCrunch, The Verge, Ars Technica
- Video sources: MKBHD, Fireship, freeCodeCamp, Net Ninja, Veritasium, Traversy Media (YouTube RSS)
- Pagination: 20 items per page, infinite scroll loads more on scroll
- Auto-refresh: 2-min cache TTL on server, 2-min auto-refresh on client
- Refresh button + "Load fresh content" at bottom of feed
- Filter buttons: All, Videos, and per-source filters
- Video cards: YouTube thumbnail, red play button overlay, VIDEO badge, embedded player on expand
- Image fallback: Articles without images get source-colored gradient placeholder with icon
- OG Image Fetcher: Background async fetcher scrapes og:image from article pages (BBC, NPR, Ars Technica work; NYT blocks scraping)
- Comments: DB-backed public comments per article (username stored in localStorage)
- Source colors: Each source has a branded color for badges and placeholders
- Discord "Join" button: Small indigo badge in sidebar header
- Feed Search Bar: DuckDuckGo-powered search (news + web + videos), fills feed with results for any topic
  - API: GET /api/feed/search?q=... returns articles in same FeedArticle format
  - Sources: DuckDuckGo News, DuckDuckGo Web, DuckDuckGo Videos (includes YouTube, TikTok, etc.)
  - SafeSearch: STRICT mode enabled for safe content
  - Caching: 5-min cache per query to avoid rate limits
  - Tracking: "search" interaction type sent to personalization engine (tracks what users search for)
  - UI: Search bar with orange accent, clear button, "Back to Live Feed" link, result count badge

## SEO & Google Indexing (60 GODMIND AI LEVEL — Absolute Dominance)

### First 30 (Foundation — already built):
- robots.txt, sitemap.xml, manifest.json, rss.xml, JSON-LD (WebApplication, WebSite, ProfilePage, SocialMediaPosting, CollectionPage, BreadcrumbList, FAQPage), dynamic meta tags, updateSEO(), 30+ meta tags in index.html

### FINAL 30 GODMIND Upgrades:
1. **Sitemap Index Architecture** — Master sitemap.xml links to 3 sub-sitemaps (sitemap-pages.xml, sitemap-profiles.xml, sitemap-posts.xml) for unlimited scale
2. **Sitemap Image Extensions** — Every sitemap URL includes image:image with loc, title, caption for Google Image indexing
3. **Sitemap News Extensions** — Social posts include news:news with publication name, language, date, title for Google News eligibility
4. **Sitemap hreflang Tags** — xhtml:link alternate tags for en + x-default language targeting (universal regional coverage)
5. **OpenSearch.xml** — Browser search bar integration. Users can add My Ai Gpt as a search engine in Chrome/Firefox/Edge
6. **Atom 1.0 Feed** — Secondary syndication format (in addition to RSS 2.0) for maximum feed reader compatibility
7. **humans.txt** — Team/site credits page recognized by search engines, shows creator, technology stack, features
8. **security.txt** — .well-known/security.txt for security contact disclosure (recognized by Google)
9. **ads.txt / app-ads.txt** — Authorized digital sellers files (prevents ad fraud flags in Google's crawler)
10. **WebFinger Protocol** — .well-known/webfinger for ActivityPub/Fediverse social discovery
11. **NodeInfo Protocol** — .well-known/nodeinfo + /nodeinfo/2.1 for decentralized social network discovery (Mastodon/Pleroma compatible)
12. **SSR Prerender Endpoint** — /api/seo/prerender/:page serves full HTML with content for crawlers that can't render JavaScript
13. **SEO Stats API** — /api/seo/stats returns live site statistics (profiles, posts, features, languages, news sources)
14. **Multi-Bot robots.txt** — Specific directives for Googlebot, Googlebot-Image, Googlebot-Video, Bingbot, Slurp (Yahoo), DuckDuckBot, Yandex, Baiduspider, facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp, Discordbot, Slackbot, TelegramBot
15. **Enhanced PWA Manifest** — 9 icon sizes, 5 app shortcuts (Chat, Coder, Feed, Social, Code), display_override, launch_handler, edge_side_panel, multiple categories
16. **Dublin Core Meta Tags** — dc.title, dc.creator, dc.subject, dc.description, dc.publisher, dc.language, dc.coverage, dc.rights for academic/library indexing
17. **Schema.org Microdata** — itemscope itemtype on <html> tag + itemprop meta tags for name, description, image (dual structured data strategy)
18. **10+ OG Locale Alternates** — og:locale:alternate for en_US, en_GB, es_ES, fr_FR, de_DE, ja_JP, zh_CN, pt_BR, hi_IN, ar_SA, ko_KR (global audience targeting)
19. **Organization Schema** — Separate JSON-LD Organization entity with founder, foundingDate, contactPoint, knowsAbout
20. **Person Schema (Creator)** — Dedicated JSON-LD Person entity for Billy Banks with jobTitle, knowsAbout, makesOffer
21. **SoftwareApplication Schema** — Additional JSON-LD schema type for app store-style rich results
22. **ItemList Schema** — JSON-LD ItemList of all 5 platform features (Chat, Coder, Feed, Social, Code) for rich list snippets
23. **HowTo Schema** — JSON-LD HowTo with 4 steps for "How to Get Started" rich snippet eligibility
24. **8 FAQ Questions** — Expanded FAQPage schema from 4 to 8 Q&A pairs covering all features
25. **Noscript Content** — Full HTML fallback in <noscript> tag so crawlers that don't execute JS still get content, keywords, and site description
26. **Enhanced Keywords per Page** — Each page gets unique, deeply-researched keyword sets (15-25 keywords each) instead of generic keywords
27. **Page-Level JSON-LD** — Each page navigation injects page-specific WebPage + BreadcrumbList JSON-LD via dynamic script
28. **Article Tags** — og:article:tag meta for key topics (AI, Chat, Coding, News, Social, Billy Banks)
29. **Well-Known Change Password** — .well-known/change-password redirect for browser credential management
30. **Profile-Boosted Sitemap Priority** — Verified profiles get priority 0.8 (vs 0.6 for regular), high-liked posts get priority 0.7 (vs 0.5)

### SEO Endpoints Summary:
- GET /robots.txt — Multi-bot crawl directives with 3 sitemap references
- GET /sitemap.xml — Sitemap index (master) linking to sub-sitemaps
- GET /sitemap-pages.xml — Main pages with image/hreflang extensions
- GET /sitemap-profiles.xml — All social profiles with avatars
- GET /sitemap-posts.xml — All social posts with news/image extensions
- GET /rss.xml — RSS 2.0 feed
- GET /atom.xml — Atom 1.0 feed
- GET /manifest.json — Enhanced PWA manifest with shortcuts
- GET /opensearch.xml — Browser search integration
- GET /humans.txt — Team/site credits
- GET /ads.txt — Ad authorization
- GET /app-ads.txt — App ad authorization
- GET /.well-known/security.txt — Security contact
- GET /.well-known/webfinger — ActivityPub discovery
- GET /.well-known/nodeinfo — Decentralized social discovery
- GET /nodeinfo/2.1 — NodeInfo protocol data
- GET /.well-known/change-password — Credential management
- GET /api/seo/jsonld — Dynamic JSON-LD structured data
- GET /api/seo/meta/:page — Dynamic meta tags
- GET /api/seo/prerender/:page — SSR HTML for crawlers
- GET /api/seo/stats — Live site statistics

## AI-Powered User Personalization (20 OMEGA S-Class Best Friend Logic)
- DB tables: userPreferences (sector/topic/source/contentType scores, behavior profile, chat topics), userInteractions (event log)
- User ID: Auto-generated in localStorage (myaigpt_user_id), passed via x-user-id header to chat
- GICS Sector Mapping: 15 sectors (Energy, Materials, Industrials, Consumer Discretionary, Consumer Staples, Health Care, Financials, IT, Communication Services, Real Estate, Utilities, Government & Politics, Science & Education, Sports & Fitness, Arts & Culture) with keyword matching
- 20 Learning Signals:
  1. Article click tracking (topic/source/category)
  2. Time-on-article tracking (duration in seconds)
  3. Chat topic analysis (what they ask about)
  4. Search query tracking
  5. Social post topic analysis
  6. Feed source preference (which sources they click most)
  7. Category affinity scoring (weighted decay)
  8. GICS sector mapping (auto-classify content)
  9. Industry interest profiling
  10. Activity time patterns (hour-of-day tracking)
  11. Content type preference (articles vs videos)
  12. Engagement style (reader vs commenter vs poster)
  13. Topic velocity (trending interests vs stable)
  14. Social like pattern analysis
  15. Bookmark topic analysis
  16. Feed comment tracking
  17. Chat response context injection
  18. Code playground tracking
  19. Duration-weighted learning (longer read = stronger signal)
  20. Adaptive AI personality tuning (system prompt injection)
- Personalized Feed: /api/feed/personalized?userId=X reorders articles by affinity score
- AI Chat Integration: User preferences injected into Groq system prompt (top sectors, topics, chat focus)
- Score Decay: 0.98 decay factor prevents stale preferences, keeps profile fresh
- API: POST /api/user/track, GET /api/user/preferences/:userId, GET /api/feed/personalized

## Public Social Page (Twitter/Facebook-style)
- Route: /social with sidebar "Social" link (purple accent, SOCIAL badge)
- DB tables: socialProfiles, socialPosts, socialComments, socialFollows, socialLikes, socialBookmarks
- localStorage-based auth (profileId + username stored locally, no passwords)
- Profile system: username, display name, bio, avatar, cover image, location, website, verified badge
- Post system: 280 char limit, media attachments (image/video/link), @mentions, #hashtags, auto-linked URLs
- Social features: Like (with animation), Comment, Repost, Bookmark, Share (copy link), Pin, Delete
- Feed tabs: For You (all), Following (from followed users), Trending (by likes in 24h)
- Profile view: Cover image, avatar, stats, posts/likes/media tabs, follow/unfollow
- Who to follow suggestions sidebar
- Profile search with autocomplete
- Follower/Following lists as modals
- Infinite scroll on all feeds, skeleton loading, refresh button
- 30 OMEGA upgrades: verified badges, char counter, pinning, trending algo, bookmarks, reposts, lightbox, video embeds, link previews, search, follower modals, view counter, infinite scroll, suggestions, relative time, @mention linking, #hashtag highlighting, cover images, edit profile, delete confirmation, empty states, skeleton loading, refresh, post count, media grid, like animation, responsive, share button, comment sections, sidebar badge

## Voice Input/Output (Web Speech API)
- **Speech-to-Text**: `useSpeechRecognition()` hook using Web Speech API
- Mic button in ChatInput (between templates and send), red pulsing animation when listening
- Transcript auto-fills input, auto-sends after 2s silence
- "Listening... speak now" floating indicator banner
- **Text-to-Speech**: `speakText()` function using SpeechSynthesis API
- Speaker button (Volume2/VolumeX icons) on every AI message hover bar
- Prefers natural voices (Google, Samantha, Natural), falls back to first available
- Toggle to stop speaking mid-sentence

## AI Studio (Image + Video Generation)
- Route: /create with sidebar "AI Studio" link (pink accent, CREATE badge)
- **Image Generation**: Canvas-based algorithmic art engine (`generateAIImage()`)
  - Analyzes prompt keywords (sunset, ocean, city, space, abstract, flowers, etc.)
  - Generates unique art using gradient layers, particle effects, geometric shapes, seeded RNG
  - 6 art styles: Realistic, Abstract, Cosmic, Urban, Nature, Floral
  - Resolution options: 256x256, 512x512, 768x768, 1024x1024
- **Video Generation**: Canvas + MediaRecorder API (`generateAIVideo()`)
  - Creates animated WebM clips with particle systems and wave animations
  - Duration options: 2s, 4s, 6s, 8s
- Gallery: Persistent localStorage gallery (up to 50 items), lightbox viewer, download support
- 100% free, no API keys — all generation happens client-side in browser

## Device Permissions System
- Route: /permissions with sidebar "Permissions" link (teal accent)
- `useDevicePermissions()` hook manages: geolocation, camera, microphone, notifications, clipboard, persistent-storage, accelerometer, gyroscope
- Categorized permission cards with grant/deny status, request buttons
- GPS: Shows lat/lng/accuracy with "Open in Google Maps" link
- Privacy notice: "No tracking, no selling data"

## API Endpoints
- GET/POST /api/chats - List/create chats
- GET/DELETE /api/chats/:id - Get/delete chat
- PATCH /api/chats/:id/rename - Rename chat
- DELETE /api/chats - Delete all chats
- GET /api/chats/search/:query - Search chats
- GET /api/stats - Get stats
- GET/POST /api/chats/:chatId/messages - List/send messages
- POST /api/chats/:chatId/export - Export as markdown
- POST /api/save-code - Save code to server
- GET /api/saved-codes - List saved codes
- POST /api/execute - Server-side code execution (JS/TS/Python/Bash)
- POST /api/terminal - Run shell commands
- POST /api/packages/install - Install npm/pip packages
- GET /api/packages/list - List installed packages
- GET/POST /api/projects - List/create projects
- GET /api/projects/:id/files - Get project files
- PUT /api/projects/:id/files/:filename - Update file
- POST /api/projects/:id/files - Create file
- DELETE /api/projects/:id/files/:filename - Delete file
- DELETE /api/projects/:id - Delete project
- GET /api/templates - Get code templates

## Token Management
- Discord knowledge truncated to 800 chars max
- Message history limited to last 8 messages
- Individual messages truncated to 500 chars in API calls
- Groq free tier limit: 6000 TPM
- Graceful fallback on rate limit errors
