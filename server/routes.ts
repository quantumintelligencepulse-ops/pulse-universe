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
    } catch (err) {
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

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const chat = await storage.getChat(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      const input = api.messages.create.input.parse(req.body);

      await storage.createMessage({ chatId, role: "user", content: input.content });

      const lowerContent = input.content.toLowerCase();
      const needsSearch = /\b(what is|who is|when did|where is|how to|latest|news|define|search|current|today)\b/.test(lowerContent);
      let searchContext = "";
      if (needsSearch) {
        searchContext = await getSearchContext(input.content);
      }

      const history = await storage.getMessages(chatId);
      const recentHistory = history.slice(-8);

      let systemPrompt: string;
      if (chat.type === "coder") {
        systemPrompt = `You are My Ai Coder, an elite programming assistant. You write clean, production-ready code with comments. When generating code, always use proper markdown code blocks with language tags (e.g. \`\`\`python). You explain your reasoning. You can debug, optimize, refactor, write tests, and build full applications. You support all major languages: JavaScript, TypeScript, Python, Java, C++, Rust, Go, SQL, HTML/CSS, and more. When asked, provide complete working files. Never provide links, images, or videos unless the user specifically asks for them.`;
      } else {
        systemPrompt = `You are My Ai Gpt, a knowledgeable and friendly assistant. You provide clear, accurate, and helpful answers. You adapt your tone to the user's needs. Never provide links, images, or videos unless the user specifically asks for them. Be concise but thorough.`;
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
        temperature: chat.type === "coder" ? 0.3 : 0.7,
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
