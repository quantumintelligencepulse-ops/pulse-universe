import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Groq from "groq-sdk";
import { search } from "duck-duck-scrape";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";

const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

const DISCORD_TOKEN = "MTQyMjAxNjAwNTM2MTg5NzU2NQ.Gcy0a4.k6EVpuY2pP19Knwfu6-jskl1S1rMGfwNjqpuXc";
const KNOWLEDGE_CHANNEL_IDS = [
  "1371201135700082729",
  "1371988282652495962",
  "1313331216610754632",
  "1371964994153087056",
  "1396151828386676837",
  "1396151895877222520",
  "1383304452047634462",
  "1014567263212421212",
  "1358264301822935210",
  "1358264608707579954",
  "1358265683515015310",
  "1358270022925156432",
  "1358277176797036636",
  "1358282348969332828",
  "1475496566889386145",
  "1433383711587434518",
  "1475773035188326436",
];

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let discordKnowledge = "";

discordClient.once("ready", async () => {
  console.log("Discord bot logged in. Fetching knowledge...");
  try {
    let allKnowledge = [];
    for (const channelId of KNOWLEDGE_CHANNEL_IDS) {
      try {
        const channel = await discordClient.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const messages = await channel.messages.fetch({ limit: 10 });
          for (const [id, msg] of messages) {
             if (msg.content) allKnowledge.push(msg.content);
          }
        }
      } catch (err) {
        console.error("Could not fetch from channel", channelId, err.message);
      }
    }
    discordKnowledge = allKnowledge.join("\n\n");
    console.log("Fetched Discord knowledge.");
  } catch(e) {
    console.error("Error fetching Discord knowledge:", e);
  }
});

discordClient.login(DISCORD_TOKEN).catch(e => console.error("Discord login failed:", e.message));

async function getSearchContext(query: string) {
  try {
    const results = await search(query, { safeSearch: "off" });
    if (results && results.results && results.results.length > 0) {
      return results.results.slice(0, 3).map(r => `Source: ${r.url}\n${r.description}`).join("\n\n");
    }
  } catch (e) {
    console.error("Search failed:", e);
  }
  return "";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.chats.list.path, async (req, res) => {
    const chats = await storage.getChats();
    res.json(chats);
  });

  app.post(api.chats.create.path, async (req, res) => {
    try {
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat(input);
      res.status(201).json(chat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.chats.get.path, async (req, res) => {
    const chat = await storage.getChat(Number(req.params.id));
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  });

  app.delete(api.chats.delete.path, async (req, res) => {
    await storage.deleteChat(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.chatId));
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const input = api.messages.create.input.parse(req.body);
      
      // Save user message
      await storage.createMessage({
        chatId,
        role: "user",
        content: input.content
      });

      // Get search context if needed
      const isSearchQuery = input.content.toLowerCase().includes("what is") || input.content.toLowerCase().includes("who is") || input.content.toLowerCase().includes("search");
      let searchContext = "";
      if (isSearchQuery) {
        searchContext = await getSearchContext(input.content);
      }

      const history = await storage.getMessages(chatId);
      
      const systemPrompt = chat.type === 'coder' 
        ? "You are My Ai Coder, an expert programming assistant."
        : "You are My Ai Gpt, a helpful assistant.";

      let fullSystemPrompt = systemPrompt;
      if (discordKnowledge) {
        fullSystemPrompt += `\n\nExtra Knowledge base from our channels:\n${discordKnowledge}`;
      }
      if (searchContext) {
        fullSystemPrompt += `\n\nWeb Search Context:\n${searchContext}`;
      }

      const messagesForGroq = [
        { role: "system", content: fullSystemPrompt },
        ...history.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))
      ];

      const completion = await groq.chat.completions.create({
        messages: messagesForGroq,
        model: "llama-3.1-8b-instant",
      });

      const assistantMessage = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

      // Save assistant message
      const savedMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: assistantMessage
      });

      res.status(200).json(savedMessage);

    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
