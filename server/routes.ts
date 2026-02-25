import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Groq from "groq-sdk";
import { search } from "duck-duck-scrape";
import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import * as path from "path";

const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

const DISCORD_TOKEN = "MTQyMjAxNjAwNTM2MTg5NzU2NQ.Gcy0a4.k6EVpuY2pP19Knwfu6-jskl1S1rMGfwNjqpuXc";
const KNOWLEDGE_CHANNEL_IDS = [
  "1371201135700082729", "1371988282652495962", "1313331216610754632",
  "1371964994153087056", "1396151828386676837", "1396151895877222520",
  "1383304452047634462", "1014567263212421212", "1358264301822935210",
  "1358264608707579954", "1358265683515015310", "1358270022925156432",
  "1358277176797036636", "1358282348969332828", "1475496566889386145",
  "1433383711587434518", "1475773035188326436",
];

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let discordKnowledge = "";

discordClient.once("ready", async () => {
  console.log("Discord bot connected. Fetching knowledge channels...");
  try {
    const snippets: string[] = [];
    for (const channelId of KNOWLEDGE_CHANNEL_IDS) {
      try {
        const channel = await discordClient.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const msgs = await (channel as any).messages.fetch({ limit: 5 });
          for (const [, msg] of msgs) {
            if (msg.content && msg.content.length > 10) {
              snippets.push(msg.content.substring(0, 150));
            }
          }
        }
      } catch { }
    }
    discordKnowledge = snippets.slice(0, 15).join("\n");
    console.log(`Loaded ${snippets.length} knowledge snippets (${discordKnowledge.length} chars).`);
  } catch (e) {
    console.error("Discord knowledge fetch error:", e);
  }
});

discordClient.login(DISCORD_TOKEN).catch(e => console.error("Discord login failed:", e.message));

async function getSearchContext(query: string): Promise<string> {
  try {
    const results = await search(query, { safeSearch: "off" });
    if (results?.results?.length) {
      return results.results.slice(0, 3).map(r => r.description || "").filter(Boolean).join("\n");
    }
  } catch (e) {
    console.error("Search error:", e);
  }
  return "";
}

const CODES_DIR = path.join(process.cwd(), "saved_codes");
if (!fs.existsSync(CODES_DIR)) {
  fs.mkdirSync(CODES_DIR, { recursive: true });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.chats.list.path, async (_req, res) => {
    res.json(await storage.getChats());
  });

  app.post(api.chats.create.path, async (req, res) => {
    try {
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat(input);
      res.status(201).json(chat);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.chats.get.path, async (req, res) => {
    const chat = await storage.getChat(Number(req.params.id));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete(api.chats.delete.path, async (req, res) => {
    await storage.deleteChat(Number(req.params.id));
    res.status(204).send();
  });

  app.patch("/api/chats/:id/rename", async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const chat = await storage.renameChat(Number(req.params.id), title.substring(0, 80));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete("/api/chats", async (_req, res) => {
    await storage.deleteAllChats();
    res.status(204).send();
  });

  app.get("/api/chats/search/:query", async (req, res) => {
    const results = await storage.searchChats(req.params.query);
    res.json(results);
  });

  app.get("/api/stats", async (_req, res) => {
    const chatCount = await storage.getChatCount();
    const messageCount = await storage.getMessageCount();
    const codeFiles = fs.existsSync(CODES_DIR) ? fs.readdirSync(CODES_DIR).length : 0;
    res.json({ chatCount, messageCount, codeFiles, discordConnected: discordClient.isReady() });
  });

  app.get(api.messages.list.path, async (req, res) => {
    res.json(await storage.getMessages(Number(req.params.chatId)));
  });

  app.post("/api/save-code", async (req, res) => {
    try {
      const { code, filename, language } = req.body;
      if (!code || !filename) return res.status(400).json({ message: "Missing code or filename" });
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(CODES_DIR, safeName);
      fs.writeFileSync(filePath, code, "utf-8");
      res.json({ message: "Code saved", path: filePath, filename: safeName });
    } catch {
      res.status(500).json({ message: "Failed to save code" });
    }
  });

  app.get("/api/saved-codes", async (_req, res) => {
    try {
      const files = fs.readdirSync(CODES_DIR).map(f => ({
        name: f,
        size: fs.statSync(path.join(CODES_DIR, f)).size,
        modified: fs.statSync(path.join(CODES_DIR, f)).mtime,
      }));
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/saved-codes/:filename", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.download(filePath);
  });

  app.post("/api/chats/:chatId/export", async (req, res) => {
    const chatId = Number(req.params.chatId);
    const chat = await storage.getChat(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const msgs = await storage.getMessages(chatId);
    let md = `# ${chat.title}\n\nType: ${chat.type}\nDate: ${chat.createdAt}\n\n---\n\n`;
    for (const m of msgs) {
      md += `### ${m.role === "user" ? "You" : "My Ai"}\n\n${m.content}\n\n---\n\n`;
    }
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${chat.title.replace(/[^a-zA-Z0-9]/g, "_")}.md"`);
    res.send(md);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const chat = await storage.getChat(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      const input = api.messages.create.input.parse(req.body);

      await storage.createMessage({ chatId, role: "user", content: input.content });

      const lowerContent = input.content.toLowerCase();
      const needsSearch = /\b(what is|who is|when did|where is|how to|latest|news|define|search|current|today|price of|weather|score)\b/.test(lowerContent);
      let searchContext = "";
      if (needsSearch) {
        searchContext = await getSearchContext(input.content);
      }

      const history = await storage.getMessages(chatId);
      const recentHistory = history.slice(-8);

      const creatorInfo = `You were created by Billy Banks. If anyone asks who made you, who created you, or who your creator is, you must say: "I was created by Billy Banks." If they ask for more details about him, say: "I'm not allowed to tell you anything else about him." You are NOT made by OpenAI, Meta, Google, or any other company. You are My Ai, created by Billy Banks.`;

      let systemPrompt: string;
      if (chat.type === "coder") {
        systemPrompt = `You are My Ai Coder, an elite S-class programming assistant created by Billy Banks. ${creatorInfo}

CAPABILITIES:
- Write production-ready code in ALL languages (JavaScript, TypeScript, Python, Java, C++, Rust, Go, SQL, HTML/CSS, Swift, Kotlin, Ruby, PHP, C#, Dart, Scala, R, MATLAB, and more)
- Debug any error with detailed explanations and fixes
- Optimize code for performance, memory, and readability
- Write comprehensive unit tests, integration tests, and E2E tests
- Design system architectures, database schemas, and API contracts
- Refactor legacy code into modern patterns
- Explain complex algorithms step by step
- Build complete full-stack applications from scratch
- Generate Docker, CI/CD, deployment configs

RULES:
- Always use proper markdown code blocks with language tags
- Include helpful comments in code
- Explain your reasoning before code
- Never provide links, images, or videos unless specifically asked
- If the user shares an error, diagnose the root cause first`;
      } else {
        systemPrompt = `You are My Ai Gpt, a world-class intelligent assistant created by Billy Banks. ${creatorInfo}

CAPABILITIES:
- Answer any question with accuracy and depth
- Write essays, emails, stories, scripts, and any text format
- Analyze data, arguments, and complex topics
- Provide step-by-step tutorials and explanations
- Help with math, science, history, philosophy, and every subject
- Brainstorm creative ideas and solutions
- Translate between languages
- Summarize long documents or concepts

RULES:
- Be concise but thorough
- Adapt your tone to the user's needs
- Never provide links, images, or videos unless specifically asked
- Use structured formatting (lists, headers) for clarity
- If unsure, say so honestly`;
      }

      if (discordKnowledge) {
        systemPrompt += `\n\nReference knowledge:\n${discordKnowledge.substring(0, 800)}`;
      }
      if (searchContext) {
        systemPrompt += `\n\nWeb results:\n${searchContext.substring(0, 600)}`;
      }

      const messagesForGroq = [
        { role: "system" as const, content: systemPrompt },
        ...recentHistory.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content.substring(0, 500)
        }))
      ];

      const completion = await groq.chat.completions.create({
        messages: messagesForGroq,
        model: "llama-3.1-8b-instant",
        max_tokens: 2048,
        temperature: chat.type === "coder" ? 0.2 : 0.7,
      });

      const reply = completion.choices[0]?.message?.content || "I'm here! Could you rephrase that?";

      const savedMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: reply
      });

      res.status(200).json(savedMessage);

    } catch (err: any) {
      console.error("Chat error:", err?.message || err);

      if (err?.status === 413 || err?.message?.includes("rate_limit")) {
        const chatId = Number(req.params.chatId);
        const fallback = await storage.createMessage({
          chatId,
          role: "assistant",
          content: "I'm experiencing high demand right now. Please try again in a moment - I'll be right here!"
        });
        return res.status(200).json(fallback);
      }

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  return httpServer;
}
