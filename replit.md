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
- `client/src/index.css` - All styles and CSS variables
- `server/routes.ts` - API routes + AI logic + Discord + search
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema (chats, messages tables)
- `shared/routes.ts` - API contract definitions

## Coder Features (30 Transcendence-class upgrades)
1. Code theme system - 5 themes (One Dark, VS Code, Dracula, Atom, Coldark)
2. Language-specific icons for 20+ languages
3. Code metrics analyzer (lines, functions, classes, imports, complexity)
4. Enhanced live preview with console output capture for JS
5. Fullscreen code viewer with Escape to close
6. Code metrics popup with complexity rating
7. Collapsible long code blocks (auto-collapse >50 lines)
8. In-code search with match highlighting
9. Search match counter
10. File size badge on code blocks
11. Configurable syntax highlighting (theme, font size, wrap, line numbers)
12. Code block count badge on messages
13. Auto-detect untagged code blocks
14. Quick code templates (React, API, DB, Tests, Debug, Refactor, Docker, Algorithm)
15. Paste code detection with visual indicator
16. Template popup triggered by / key
17. Pasted code analysis indicator
18. Categorized coder suggestions (Full Stack, Backend, Frontend, DevOps, Debug)
19. Saved codes file manager panel with viewer
20. Coder settings panel (theme, font size, word wrap, line numbers)
21. Open saved codes from toolbar
22. Settings accessible from toolbar
23. Code block extraction from entire conversation
24. Save all code blocks at once
25. Enhanced toolbar with code block counter
26. Feature badges on welcome screen (8 capability indicators)
27. Persistent settings via localStorage
28. Keyboard shortcuts: Ctrl+K (new chat), Ctrl+J (new coder)
29. Transcendence-level system prompt with 30+ language support
30. Lower temperature (0.15) for more precise code generation

## General Features
- Two chat modes: My Ai Gpt (general) and My Ai Coder (coding)
- Chat rename, search, clear all, grouped by date
- Message reactions, copy, regenerate, retry on error
- Export conversation as markdown
- Scroll to bottom button, input history, char/word count
- Timestamps, dynamic page titles, SEO meta tags
- Stats dashboard (chat count, message count, code files, connection status)
- Responsive design with white theme

## API Endpoints
- GET/POST /api/chats - List/create chats
- GET/DELETE /api/chats/:id - Get/delete chat
- PATCH /api/chats/:id/rename - Rename a chat
- DELETE /api/chats - Delete all chats
- GET /api/chats/search/:query - Search chats
- GET /api/stats - Get stats
- GET /api/chats/:chatId/messages - List messages
- POST /api/chats/:chatId/messages - Send message (triggers AI response)
- POST /api/chats/:chatId/export - Export conversation as markdown
- POST /api/save-code - Save code to server
- GET /api/saved-codes - List saved code files (with metadata)
- GET /api/saved-codes/:filename - Download saved code file
- GET /api/saved-codes/:filename/content - Read file content
- DELETE /api/saved-codes/:filename - Delete saved code file

## Token Management
- Discord knowledge truncated to 800 chars max
- Message history limited to last 8 messages
- Individual messages truncated to 500 chars in API calls
- Groq free tier limit: 6000 TPM
- Graceful fallback on rate limit errors
