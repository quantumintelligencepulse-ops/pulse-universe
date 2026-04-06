# Pulse Intelligence API — RapidAPI Listing Guide

## Base URL
https://myaigpt.online

## API Name
Pulse Intelligence API

## Tagline
The $1 Intelligence Platform — 8 AI-powered endpoints, 907K+ knowledge entries, real-time streaming.

## Description
Pulse Intelligence is the cheapest intelligence engine on Earth. All 8 endpoints, 100,000 API calls, $1/month. Powered by the Pulse Universe AI Civilization.

Endpoints include real-time news, 907K+ knowledge topics, AI-written articles, GICS industry intelligence (11 sectors), AI equation signals, hive memory (204K+ entries), cross-domain search, and real-time SSE streaming.

## Category
Data / Financial / News / AI

## Pricing Plans (all $1)

### Plan 1: API Access — $1/month
- 100,000 requests/month
- All 8 endpoints
- Rate limit: 100 requests/minute

### Plan 2: Datasets — $1 (one-time)
- Daily News Dataset
- GICS Intelligence Dataset
- Signals Dataset
- 30-Day Archive

### Plan 3: Real-Time Stream — $1/month
- /api/stream SSE access
- 100,000 streamed events/month

### Plan 4: Reports — $1/month
- Daily + Weekly + Monthly reports

### Plan 5: Intelligence Packs — $1 (one-time)
- Sector bundles (Tech, Financials, Energy, etc.)

### Plan 6: Enterprise — $1/month
- Unlimited requests
- Priority routing

### Plan 7: White-Label — $1/month
- Embeddable widgets
- 200,000 widget calls

## Endpoints to Register

### GET /api/news
Returns latest news articles from all domains.
- Query params: limit (default 50), offset, domain
- Response: { data: [...], total: number }

### GET /api/topics
Returns knowledge topics from 907K+ entry Quantapedia.
- Query params: limit (default 50), offset
- Response: { data: [...], total: number }

### GET /api/articles
Returns AI-written articles.
- Query params: limit (default 30), offset
- Response: { data: [...], total: number }

### GET /api/gics
Returns GICS industry sector data (11 sectors).
- Response: { data: [...], total: number }

### GET /api/signals
Returns AI equation/signal proposals.
- Query params: limit (default 50), offset
- Response: { data: [...], total: number }

### GET /api/hive
Returns hive memory entries (204K+).
- Query params: limit (default 50), offset
- Response: { data: [...], total: number }

### GET /api/search
Cross-domain search across all data.
- Query params: q (required), limit (default 30)
- Response: { data: [...], total: number }

### GET /api/stream
Real-time SSE event stream.
- Response: Server-Sent Events (text/event-stream)
- Events: news, signals, hive, sector, topic

## Authentication
Header: X-API-Key: pulse_xxxxx

## Setup Steps on RapidAPI
1. Go to https://rapidapi.com/provider
2. Click "Add New API"
3. Enter API name: "Pulse Intelligence API"
4. Set base URL: https://myaigpt.online
5. Add each endpoint above
6. Set pricing plans (all $1)
7. Add X-API-Key header requirement
8. Publish
