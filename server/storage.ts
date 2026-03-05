import { db } from "./db";
import {
  users,
  chats,
  messages,
  feedComments,
  socialProfiles,
  socialPosts,
  socialComments,
  socialFollows,
  socialLikes,
  socialBookmarks,
  userPreferences,
  userInteractions,
  type User,
  type InsertUser,
  type Chat,
  type Message,
  type FeedComment,
  type InsertChat,
  type InsertMessage,
  type InsertFeedComment,
  type SocialProfile,
  type SocialPost,
  type SocialComment,
  type SocialFollow,
  type SocialLike,
  type SocialBookmark,
  type InsertSocialProfile,
  type InsertSocialPost,
  type InsertSocialComment,
  type UserPreferences,
  type UserInteraction,
  type InsertUserInteraction,
} from "@shared/schema";
import { eq, desc, like, sql, and, inArray } from "drizzle-orm";

export interface IStorage {
  getChatsByUser(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  renameChat(id: number, title: string): Promise<Chat | undefined>;
  deleteChat(id: number): Promise<void>;
  deleteAllChatsByUser(userId: number): Promise<void>;
  searchChatsByUser(query: string, userId: number): Promise<Chat[]>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageCountByUser(userId: number): Promise<number>;
  getChatCountByUser(userId: number): Promise<number>;

  createSocialProfile(profile: InsertSocialProfile): Promise<SocialProfile>;
  getSocialProfile(id: number): Promise<SocialProfile | undefined>;
  getSocialProfileByUsername(username: string): Promise<SocialProfile | undefined>;
  updateSocialProfile(id: number, data: Partial<InsertSocialProfile>): Promise<SocialProfile | undefined>;
  searchSocialProfiles(query: string): Promise<SocialProfile[]>;

  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  getSocialPost(id: number): Promise<SocialPost | undefined>;
  getSocialFeed(page: number, limit: number): Promise<SocialPost[]>;
  getSocialPostsByProfile(profileId: number, page: number, limit: number): Promise<SocialPost[]>;
  getTrendingSocialPosts(page: number, limit: number): Promise<SocialPost[]>;
  deleteSocialPost(id: number): Promise<void>;
  togglePinSocialPost(id: number): Promise<SocialPost | undefined>;
  incrementPostViews(id: number): Promise<void>;
  incrementPostReposts(id: number): Promise<void>;

  createSocialComment(comment: InsertSocialComment): Promise<SocialComment>;
  getSocialCommentsByPost(postId: number): Promise<SocialComment[]>;
  deleteSocialComment(id: number): Promise<void>;

  toggleSocialFollow(followerId: number, followingId: number): Promise<boolean>;
  getSocialFollowers(profileId: number): Promise<SocialProfile[]>;
  getSocialFollowing(profileId: number): Promise<SocialProfile[]>;
  isSocialFollowing(followerId: number, followingId: number): Promise<boolean>;
  getSocialFollowerCount(profileId: number): Promise<number>;
  getSocialFollowingCount(profileId: number): Promise<number>;

  toggleSocialLike(postId: number, profileId: number): Promise<boolean>;
  isSocialLiked(postId: number, profileId: number): Promise<boolean>;
  getSocialLikeCount(postId: number): Promise<number>;

  toggleSocialBookmark(postId: number, profileId: number): Promise<boolean>;
  getSocialBookmarkedPosts(profileId: number): Promise<SocialPost[]>;
  getSocialLikedPosts(profileId: number): Promise<SocialPost[]>;

  getFollowingFeed(profileId: number, page: number, limit: number): Promise<SocialPost[]>;
  getSocialPostCount(): Promise<number>;

  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences>;
  recordInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  getRecentInteractions(userId: string, limit: number): Promise<UserInteraction[]>;

  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getChatsByUser(userId: number): Promise<Chat[]> {
    return await db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.createdAt));
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

  async deleteAllChatsByUser(userId: number): Promise<void> {
    const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, userId));
    const chatIds = userChats.map(c => c.id);
    if (chatIds.length > 0) {
      await db.delete(messages).where(inArray(messages.chatId, chatIds));
      await db.delete(chats).where(inArray(chats.id, chatIds));
    }
  }

  async searchChatsByUser(query: string, userId: number): Promise<Chat[]> {
    return await db.select().from(chats).where(and(eq(chats.userId, userId), like(chats.title, `%${query}%`))).orderBy(desc(chats.createdAt));
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(msg).returning();
    return newMessage;
  }

  async getMessageCountByUser(userId: number): Promise<number> {
    const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, userId));
    const chatIds = userChats.map(c => c.id);
    if (chatIds.length === 0) return 0;
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(inArray(messages.chatId, chatIds));
    return Number(result.count);
  }

  async getChatCountByUser(userId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(chats).where(eq(chats.userId, userId));
    return Number(result.count);
  }

  async getFeedComments(articleId: string): Promise<FeedComment[]> {
    return await db.select().from(feedComments).where(eq(feedComments.articleId, articleId)).orderBy(desc(feedComments.createdAt));
  }

  async createFeedComment(comment: InsertFeedComment): Promise<FeedComment> {
    const [newComment] = await db.insert(feedComments).values(comment).returning();
    return newComment;
  }

  async createSocialProfile(profile: InsertSocialProfile): Promise<SocialProfile> {
    const [newProfile] = await db.insert(socialProfiles).values(profile).returning();
    return newProfile;
  }

  async getSocialProfile(id: number): Promise<SocialProfile | undefined> {
    const [profile] = await db.select().from(socialProfiles).where(eq(socialProfiles.id, id));
    return profile;
  }

  async getSocialProfileByUsername(username: string): Promise<SocialProfile | undefined> {
    const [profile] = await db.select().from(socialProfiles).where(eq(socialProfiles.username, username));
    return profile;
  }

  async updateSocialProfile(id: number, data: Partial<InsertSocialProfile>): Promise<SocialProfile | undefined> {
    const [updated] = await db.update(socialProfiles).set(data).where(eq(socialProfiles.id, id)).returning();
    return updated;
  }

  async searchSocialProfiles(query: string): Promise<SocialProfile[]> {
    return await db.select().from(socialProfiles)
      .where(sql`${socialProfiles.username} ILIKE ${'%' + query + '%'} OR ${socialProfiles.displayName} ILIKE ${'%' + query + '%'}`)
      .limit(20);
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [newPost] = await db.insert(socialPosts).values(post).returning();
    return newPost;
  }

  async getSocialPost(id: number): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post;
  }

  async getSocialFeed(page: number, limit: number): Promise<SocialPost[]> {
    const offset = (page - 1) * limit;
    return await db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
  }

  async getSocialPostsByProfile(profileId: number, page: number, limit: number): Promise<SocialPost[]> {
    const offset = (page - 1) * limit;
    return await db.select().from(socialPosts)
      .where(eq(socialPosts.profileId, profileId))
      .orderBy(desc(socialPosts.pinned), desc(socialPosts.createdAt))
      .limit(limit).offset(offset);
  }

  async getTrendingSocialPosts(page: number, limit: number): Promise<SocialPost[]> {
    const offset = (page - 1) * limit;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await db.select().from(socialPosts)
      .where(sql`${socialPosts.createdAt} > ${oneDayAgo}`)
      .orderBy(desc(socialPosts.likes))
      .limit(limit).offset(offset);
  }

  async deleteSocialPost(id: number): Promise<void> {
    await db.delete(socialComments).where(eq(socialComments.postId, id));
    await db.delete(socialLikes).where(eq(socialLikes.postId, id));
    await db.delete(socialBookmarks).where(eq(socialBookmarks.postId, id));
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  async togglePinSocialPost(id: number): Promise<SocialPost | undefined> {
    const post = await this.getSocialPost(id);
    if (!post) return undefined;
    const [updated] = await db.update(socialPosts).set({ pinned: !post.pinned }).where(eq(socialPosts.id, id)).returning();
    return updated;
  }

  async incrementPostViews(id: number): Promise<void> {
    await db.update(socialPosts).set({ views: sql`${socialPosts.views} + 1` }).where(eq(socialPosts.id, id));
  }

  async incrementPostReposts(id: number): Promise<void> {
    await db.update(socialPosts).set({ reposts: sql`${socialPosts.reposts} + 1` }).where(eq(socialPosts.id, id));
  }

  async createSocialComment(comment: InsertSocialComment): Promise<SocialComment> {
    const [newComment] = await db.insert(socialComments).values(comment).returning();
    return newComment;
  }

  async getSocialCommentsByPost(postId: number): Promise<SocialComment[]> {
    return await db.select().from(socialComments).where(eq(socialComments.postId, postId)).orderBy(desc(socialComments.createdAt));
  }

  async deleteSocialComment(id: number): Promise<void> {
    await db.delete(socialComments).where(eq(socialComments.id, id));
  }

  async toggleSocialFollow(followerId: number, followingId: number): Promise<boolean> {
    const [existing] = await db.select().from(socialFollows)
      .where(and(eq(socialFollows.followerId, followerId), eq(socialFollows.followingId, followingId)));
    if (existing) {
      await db.delete(socialFollows).where(eq(socialFollows.id, existing.id));
      return false;
    }
    await db.insert(socialFollows).values({ followerId, followingId });
    return true;
  }

  async getSocialFollowers(profileId: number): Promise<SocialProfile[]> {
    const follows = await db.select().from(socialFollows).where(eq(socialFollows.followingId, profileId));
    if (follows.length === 0) return [];
    const followerIds = follows.map(f => f.followerId);
    return await db.select().from(socialProfiles).where(inArray(socialProfiles.id, followerIds));
  }

  async getSocialFollowing(profileId: number): Promise<SocialProfile[]> {
    const follows = await db.select().from(socialFollows).where(eq(socialFollows.followerId, profileId));
    if (follows.length === 0) return [];
    const followingIds = follows.map(f => f.followingId);
    return await db.select().from(socialProfiles).where(inArray(socialProfiles.id, followingIds));
  }

  async isSocialFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [existing] = await db.select().from(socialFollows)
      .where(and(eq(socialFollows.followerId, followerId), eq(socialFollows.followingId, followingId)));
    return !!existing;
  }

  async getSocialFollowerCount(profileId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(socialFollows).where(eq(socialFollows.followingId, profileId));
    return Number(result.count);
  }

  async getSocialFollowingCount(profileId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(socialFollows).where(eq(socialFollows.followerId, profileId));
    return Number(result.count);
  }

  async toggleSocialLike(postId: number, profileId: number): Promise<boolean> {
    const [existing] = await db.select().from(socialLikes)
      .where(and(eq(socialLikes.postId, postId), eq(socialLikes.profileId, profileId)));
    if (existing) {
      await db.delete(socialLikes).where(eq(socialLikes.id, existing.id));
      await db.update(socialPosts).set({ likes: sql`GREATEST(${socialPosts.likes} - 1, 0)` }).where(eq(socialPosts.id, postId));
      return false;
    }
    await db.insert(socialLikes).values({ postId, profileId });
    await db.update(socialPosts).set({ likes: sql`${socialPosts.likes} + 1` }).where(eq(socialPosts.id, postId));
    return true;
  }

  async isSocialLiked(postId: number, profileId: number): Promise<boolean> {
    const [existing] = await db.select().from(socialLikes)
      .where(and(eq(socialLikes.postId, postId), eq(socialLikes.profileId, profileId)));
    return !!existing;
  }

  async getSocialLikeCount(postId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(socialLikes).where(eq(socialLikes.postId, postId));
    return Number(result.count);
  }

  async toggleSocialBookmark(postId: number, profileId: number): Promise<boolean> {
    const [existing] = await db.select().from(socialBookmarks)
      .where(and(eq(socialBookmarks.postId, postId), eq(socialBookmarks.profileId, profileId)));
    if (existing) {
      await db.delete(socialBookmarks).where(eq(socialBookmarks.id, existing.id));
      return false;
    }
    await db.insert(socialBookmarks).values({ postId, profileId });
    return true;
  }

  async getSocialBookmarkedPosts(profileId: number): Promise<SocialPost[]> {
    const bookmarks = await db.select().from(socialBookmarks).where(eq(socialBookmarks.profileId, profileId));
    if (bookmarks.length === 0) return [];
    const postIds = bookmarks.map(b => b.postId);
    return await db.select().from(socialPosts).where(inArray(socialPosts.id, postIds)).orderBy(desc(socialPosts.createdAt));
  }

  async getSocialLikedPosts(profileId: number): Promise<SocialPost[]> {
    const likes = await db.select().from(socialLikes).where(eq(socialLikes.profileId, profileId));
    if (likes.length === 0) return [];
    const postIds = likes.map(l => l.postId);
    return await db.select().from(socialPosts).where(inArray(socialPosts.id, postIds)).orderBy(desc(socialPosts.createdAt));
  }

  async getFollowingFeed(profileId: number, page: number, limit: number): Promise<SocialPost[]> {
    const offset = (page - 1) * limit;
    const follows = await db.select().from(socialFollows).where(eq(socialFollows.followerId, profileId));
    if (follows.length === 0) return [];
    const followingIds = follows.map(f => f.followingId);
    return await db.select().from(socialPosts)
      .where(inArray(socialPosts.profileId, followingIds))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit).offset(offset);
  }

  async getSocialPostCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(socialPosts);
    return Number(result.count);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(userId: string, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const [updated] = await db.update(userPreferences).set({ ...data, lastActive: new Date() }).where(eq(userPreferences.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userPreferences).values({ userId, ...data } as any).returning();
    return created;
  }

  async recordInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const [created] = await db.insert(userInteractions).values(interaction).returning();
    return created;
  }

  async getRecentInteractions(userId: string, limit: number): Promise<UserInteraction[]> {
    return await db.select().from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt))
      .limit(limit);
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
