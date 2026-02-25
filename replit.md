# My Ai Gpt - Beta Release 1

## Overview
AI chat site called "My Ai Gpt" powered by Quantum Pulse Intelligence. Features two chat modes: general assistant and coding assistant. Uses Groq API with llama-3.1-8b-instant model, Discord channels for knowledge base, and DuckDuckGo for web search. Created by Billy Banks.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (single-file App.tsx)
- **Backend**: Express.js + PostgreSQL (Drizzle ORM)
- **AI**: Groq SDK (llama-3.1-8b-instant)
- **Search**: duck-duck-scrape for web context
- **Knowledge**: Discord.js bot fetches from 17 knowledge channels

## Key Files
- `client/src/App.tsx` - ALL frontend code (consolidated single file)
- `server/routes.ts` - API routes + AI logic + Discord + search
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema (chats, messages tables)
- `shared/routes.ts` - API contract definitions

## Features
- Two chat modes: My Ai Gpt (general) and My Ai Coder (coding)
- Code syntax highlighting with copy/save/download buttons
- Live HTML/CSS/JS code preview (run button)
- Line numbers in code blocks
- Discord knowledge base integration (17 channels)
- DuckDuckGo web search for real-time info
- Chat history with sidebar navigation (grouped by Today/This Week/Older)
- Server-side code saving (saved_codes/ directory)
- Responsive design with white theme
- Markdown rendering with GFM support
- Chat rename (inline editing in sidebar)
- Clear all chats
- Search/filter chats in sidebar
- Message reactions (thumbs up/down)
- Copy full AI response
- Regenerate last response
- Error retry button
- Export conversation as markdown
- Scroll to bottom button
- Input history (up/down arrow keys)
- Character count on input
- Word count on messages
- Timestamps on messages
- Dynamic page titles
- Stats dashboard in sidebar (chat count, message count, code files, connection status)
- Keyboard shortcut: Ctrl+K for new chat
- SEO meta tags (Open Graph, description, theme-color)

## API Endpoints
- GET/POST /api/chats - List/create chats
- GET/DELETE /api/chats/:id - Get/delete chat
- PATCH /api/chats/:id/rename - Rename a chat
- DELETE /api/chats - Delete all chats
- GET /api/chats/search/:query - Search chats
- GET /api/stats - Get stats (chat count, message count, code files, discord status)
- GET /api/chats/:chatId/messages - List messages
- POST /api/chats/:chatId/messages - Send message (triggers AI response)
- POST /api/chats/:chatId/export - Export conversation as markdown
- POST /api/save-code - Save code to server
- GET /api/saved-codes - List saved code files
- GET /api/saved-codes/:filename - Download saved code file

## Token Management
- Discord knowledge truncated to 800 chars max
- Message history limited to last 8 messages
- Individual messages truncated to 500 chars in API calls
- Groq free tier limit: 6000 TPM
- Graceful fallback on rate limit errors
