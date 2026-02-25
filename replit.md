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

## General Features
- Two chat modes: My Ai Gpt (general) and My Ai Coder (coding)
- Chat rename, search, clear all, grouped by date
- Message reactions, copy, regenerate, retry on error
- Export conversation as markdown
- Responsive design with white theme

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
