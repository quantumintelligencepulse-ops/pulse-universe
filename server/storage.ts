import { db } from "./db";
import {
  chats,
  messages,
  type Chat,
  type Message,
  type InsertChat,
  type InsertMessage,
} from "@shared/schema";
import { eq, desc, like, sql } from "drizzle-orm";

export interface IStorage {
  getChats(): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  renameChat(id: number, title: string): Promise<Chat | undefined>;
  deleteChat(id: number): Promise<void>;
  deleteAllChats(): Promise<void>;
  searchChats(query: string): Promise<Chat[]>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageCount(): Promise<number>;
  getChatCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getChats(): Promise<Chat[]> {
    return await db.select().from(chats).orderBy(desc(chats.createdAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async renameChat(id: number, title: string): Promise<Chat | undefined> {
    const [updated] = await db.update(chats).set({ title }).where(eq(chats.id, id)).returning();
    return updated;
  }

  async deleteChat(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.chatId, id));
    await db.delete(chats).where(eq(chats.id, id));
  }

  async deleteAllChats(): Promise<void> {
    await db.delete(messages);
    await db.delete(chats);
  }

  async searchChats(query: string): Promise<Chat[]> {
    return await db.select().from(chats).where(like(chats.title, `%${query}%`)).orderBy(desc(chats.createdAt));
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(msg).returning();
    return newMessage;
  }

  async getMessageCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(messages);
    return Number(result.count);
  }

  async getChatCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(chats);
    return Number(result.count);
  }
}

export const storage = new DatabaseStorage();
