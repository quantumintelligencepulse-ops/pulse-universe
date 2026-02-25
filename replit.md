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

## SEO & Google Indexing (30 OMEGA Transcendence Class)
- **robots.txt**: GET /robots.txt — crawl directives, Allow all pages, Disallow /api/, Sitemap reference
- **sitemap.xml**: GET /sitemap.xml — dynamic XML sitemap with all pages, social profiles (up to 500), social posts (up to 200), includes lastmod/changefreq/priority
- **manifest.json**: GET /manifest.json — PWA web app manifest (installable, categories: social/news/productivity/education)
- **rss.xml**: GET /rss.xml — RSS 2.0 feed of social posts with Atom namespace, enclosures for media
- **JSON-LD Structured Data**: GET /api/seo/jsonld?page=X&id=Y
  - WebApplication schema (home page) — name, author, features, ratings, SearchAction
  - ProfilePage schema (social profiles) — Person entity with followers, description
  - SocialMediaPosting schema (posts) — headline, author, likes, comments, shares, datePublished
  - CollectionPage schema (feed) — news feed as curated collection
  - WebSite schema with SearchAction for Google Search Box eligibility
  - BreadcrumbList schema for all pages
  - FAQPage schema with 4 Q&A pairs for rich snippet eligibility
- **Dynamic Meta Tags**: GET /api/seo/meta/:page?id=Y — per-page Open Graph + Twitter Card meta
  - Per-page titles: "My Ai Gpt - AI Chat Assistant | by Billy Banks", etc.
  - Per-page descriptions optimized for click-through
  - og:title, og:description, og:type, og:url, og:image, og:site_name, og:locale
  - twitter:card (summary_large_image), twitter:title, twitter:description, twitter:image
  - Profile-specific: og:type=profile, profile:username, avatar as og:image
  - Post-specific: og:type=article, article:published_time, article:author
  - Canonical URLs for every page
- **Frontend SEO**: updateSEO() function dynamically updates document.title, meta tags, canonical, and JSON-LD on each page navigation
- **index.html Enhanced**: 30+ meta tags including robots, googlebot, bingbot, rating, referrer, theme-color, color-scheme, mobile-web-app-capable, apple-mobile-web-app-capable, msapplication-TileColor, format-detection
- **Keywords**: AI chat, code playground, news feed, social network, Billy Banks, etc.
- **Link tags**: canonical, apple-touch-icon, manifest, alternate RSS, sitemap, dns-prefetch
- **Crawl optimization**: max-image-preview:large, max-snippet:-1, max-video-preview:-1 for rich results

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
