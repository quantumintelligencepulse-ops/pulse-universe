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
- **Comprehensive News Feed**: An MSN-style news feed aggregates content from multiple sources (NY Times, BBC, CNN, etc.), including video, with features like pagination, auto-refresh, filtering, and public commenting.
- **SEO & Google Indexing**: Extensive SEO implementation with sitemap index architecture, image/news extensions, `hreflang` tags, OpenSearch, Atom feeds, and various Schema.org microdata for rich search results. Includes dynamic JSON-LD and meta tag generation.
- **AI-Powered User Personalization**: Tracks user interactions and preferences (topics, sources, content types, GICS sectors) to tailor content (e.g., personalized news feed) and influence AI responses through system prompt injection.
- **Public Social Page**: Features a Twitter/Facebook-style social platform with profiles, posts, comments, follows, likes, and bookmarks, with localStorage-based authentication.
- **Voice Input/Output**: Integrates Web Speech API for speech-to-text chat input and text-to-speech for AI responses.
- **AI Studio**: Client-side image and video generation using algorithmic art engines and MediaRecorder API, providing a free tool for creative content.
- **Device Permissions System**: Manages and displays device permissions (geolocation, camera, microphone, notifications) with user-friendly controls.

## External Dependencies
- **AI Model**: Groq API (llama-3.1-8b-instant)
- **Web Search**: duck-duck-scrape (for DuckDuckGo search)
- **Knowledge Base**: Discord.js (for fetching from Discord channels)
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