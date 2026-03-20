import { db } from "./db";
import {
  users,
  chats,
  messages,
  ingestionLogs,
  feedComments,
  socialProfiles,
  socialPosts,
  socialComments,
  socialFollows,
  socialLikes,
  socialBookmarks,
  userPreferences,
  userInteractions,
  referrals,
  earningsLog,
  payoutRequests,
  savedArticles,
  followedTopics,
  quantapediaEntries,
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
  type Referral,
  type EarningsLogEntry,
  type PayoutRequest,
  type InsertReferral,
  type InsertEarningsLog,
  type InsertPayoutRequest,
  aiStories,
  type AiStory,
  type InsertAiStory,
  type SavedArticle,
  type InsertSavedArticle,
  type FollowedTopic,
  type InsertFollowedTopic,
  quantumProducts,
  hiveMemory,
  hiveLinks,
  quantumMedia,
  type QuantumMedia,
  type InsertQuantumMedia,
  quantumCareers,
  type QuantumCareer,
  type InsertQuantumCareer,
  pulseEvents,
  quantumSpawns,
  type QuantumSpawn,
  userMemory,
  type UserMemoryStrand,
  conversationImprints,
  type ConversationImprint,
} from "@shared/schema";
import { eq, desc, like, sql, and, inArray, lt } from "drizzle-orm";

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
  getUserByReferralCode(code: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  createReferral(data: InsertReferral): Promise<Referral>;
  getReferralsByReferrer(referrerId: number): Promise<Referral[]>;
  getReferralByUsers(referrerId: number, referredUserId: number): Promise<Referral | undefined>;
  updateReferralStatus(id: number, status: string): Promise<Referral | undefined>;

  createEarningsLog(data: InsertEarningsLog): Promise<EarningsLogEntry>;
  getEarningsLogByUser(userId: number): Promise<EarningsLogEntry[]>;

  createPayoutRequest(data: InsertPayoutRequest): Promise<PayoutRequest>;
  getPayoutRequestsByUser(userId: number): Promise<PayoutRequest[]>;
  getAllPendingPayouts(): Promise<PayoutRequest[]>;
  updatePayoutStatus(id: number, status: string): Promise<PayoutRequest | undefined>;

  creditEarnings(userId: number, amount: number): Promise<User | undefined>;
  debitEarnings(userId: number, amount: number): Promise<User | undefined>;

  getAiStory(articleId: string): Promise<AiStory | undefined>;
  saveAiStory(story: InsertAiStory): Promise<AiStory>;
  incrementStoryViews(articleId: string): Promise<void>;
  getRecentAiStories(limit: number): Promise<AiStory[]>;

  getSavedArticles(userId: number): Promise<SavedArticle[]>;
  saveArticle(data: InsertSavedArticle): Promise<SavedArticle>;
  unsaveArticle(userId: number, articleId: string): Promise<void>;
  isArticleSaved(userId: number, articleId: string): Promise<boolean>;

  getFollowedTopics(userId: number): Promise<FollowedTopic[]>;
  followTopic(data: InsertFollowedTopic): Promise<FollowedTopic>;
  unfollowTopic(userId: number, topic: string): Promise<void>;
  isTopicFollowed(userId: number, topic: string): Promise<boolean>;

  trackQuantapediaTopic(slug: string, title: string, summary: string, type: string, categories: string[], relatedTerms: string[]): Promise<void>;
  getAllQuantapediaTopics(): Promise<{ slug: string; title: string; updatedAt: Date }[]>;
  getFullQuantapediaEntry(slug: string): Promise<any | null>;
  storeFullQuantapediaEntry(slug: string, title: string, type: string, summary: string, categories: string[], relatedTerms: string[], fullEntry: any): Promise<void>;
  getUngeneratedQuantapediaTopics(limit: number): Promise<{ slug: string; title: string }[]>;
  queueQuantapediaTopics(topics: { slug: string; title: string }[]): Promise<void>;
  getQuantapediaStats(): Promise<{ total: number; generated: number; queued: number }>;

  queueQuantumProducts(products: { slug: string; name: string; brand?: string; category?: string }[]): Promise<void>;
  getUngeneratedProducts(limit: number): Promise<{ slug: string; name: string; brand: string; category: string }[]>;
  storeFullProduct(slug: string, data: { name: string; brand: string; category: string; subcategory: string; priceRange: string; summary: string; categories: string[]; relatedProducts: string[]; relatedTopics: string[]; retailerLinks: any; fullProduct: any }): Promise<void>;
  getFullProduct(slug: string): Promise<any | null>;
  markProductFailed(slug: string, name: string, brand: string, category: string): Promise<void>;
  getAllProducts(limit?: number, offset?: number): Promise<any[]>;
  getProductsByCategory(category: string, limit?: number): Promise<any[]>;
  getQuantumProductStats(): Promise<{ total: number; generated: number; queued: number }>;
  trackProductView(slug: string): Promise<void>;
  searchProducts(query: string, limit?: number): Promise<any[]>;

  createIngestionLog(data: { sourceId: string; sourceName: string; familyId: string; query: string; itemsFetched: number; nodesCreated: number; status: string; errorMessage?: string; sampleTitle?: string; sampleSummary?: string; sourceUrl?: string; }): Promise<void>;
  getIngestionLogs(limit?: number): Promise<any[]>;
  getIngestionStats(): Promise<any>;
  getQuantapediaBySlug(slug: string): Promise<any | null>;
  createQuantapediaEntry(entry: { slug: string; title: string; type?: string; summary?: string; categories?: string[]; relatedTerms?: string[]; generated?: boolean; generatedAt?: Date; }): Promise<void>;
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

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const [ref] = await db.insert(referrals).values(data).returning();
    return ref;
  }

  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
  }

  async getReferralByUsers(referrerId: number, referredUserId: number): Promise<Referral | undefined> {
    const [ref] = await db.select().from(referrals).where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredUserId, referredUserId)));
    return ref;
  }

  async updateReferralStatus(id: number, status: string): Promise<Referral | undefined> {
    const [ref] = await db.update(referrals).set({ status }).where(eq(referrals.id, id)).returning();
    return ref;
  }

  async createEarningsLog(data: InsertEarningsLog): Promise<EarningsLogEntry> {
    const [entry] = await db.insert(earningsLog).values(data).returning();
    return entry;
  }

  async getEarningsLogByUser(userId: number): Promise<EarningsLogEntry[]> {
    return await db.select().from(earningsLog).where(eq(earningsLog.userId, userId)).orderBy(desc(earningsLog.createdAt));
  }

  async createPayoutRequest(data: InsertPayoutRequest): Promise<PayoutRequest> {
    const [req] = await db.insert(payoutRequests).values(data).returning();
    return req;
  }

  async getPayoutRequestsByUser(userId: number): Promise<PayoutRequest[]> {
    return await db.select().from(payoutRequests).where(eq(payoutRequests.userId, userId)).orderBy(desc(payoutRequests.createdAt));
  }

  async getAllPendingPayouts(): Promise<PayoutRequest[]> {
    return await db.select().from(payoutRequests).where(eq(payoutRequests.status, "pending")).orderBy(desc(payoutRequests.createdAt));
  }

  async updatePayoutStatus(id: number, status: string): Promise<PayoutRequest | undefined> {
    const [req] = await db.update(payoutRequests).set({ status, processedAt: new Date() }).where(eq(payoutRequests.id, id)).returning();
    return req;
  }

  async creditEarnings(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      earningsBalance: sql`${users.earningsBalance} + ${amount}`,
      totalEarnings: sql`${users.totalEarnings} + ${amount}`,
    } as any).where(eq(users.id, userId)).returning();
    return user;
  }

  async debitEarnings(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      earningsBalance: sql`${users.earningsBalance} - ${amount}`,
    } as any).where(eq(users.id, userId)).returning();
    return user;
  }

  async getAiStory(articleId: string): Promise<AiStory | undefined> {
    const [story] = await db.select().from(aiStories).where(eq(aiStories.articleId, articleId));
    return story;
  }

  async saveAiStory(story: InsertAiStory): Promise<AiStory> {
    const [existing] = await db.select().from(aiStories).where(eq(aiStories.articleId, story.articleId));
    if (existing) {
      const [updated] = await db.update(aiStories).set({ ...story, updatedAt: new Date() } as any).where(eq(aiStories.articleId, story.articleId)).returning();
      return updated;
    }
    const [created] = await db.insert(aiStories).values(story as any).returning();
    return created;
  }

  async incrementStoryViews(articleId: string): Promise<void> {
    await db.update(aiStories).set({ views: sql`${aiStories.views} + 1` } as any).where(eq(aiStories.articleId, articleId));
  }

  async getRecentAiStories(limit: number): Promise<AiStory[]> {
    return await db.select().from(aiStories).orderBy(desc(aiStories.createdAt)).limit(limit);
  }

  async getSavedArticles(userId: number): Promise<SavedArticle[]> {
    return await db.select().from(savedArticles).where(eq(savedArticles.userId, userId)).orderBy(desc(savedArticles.savedAt));
  }

  async saveArticle(data: InsertSavedArticle): Promise<SavedArticle> {
    const [existing] = await db.select().from(savedArticles).where(and(eq(savedArticles.userId, data.userId), eq(savedArticles.articleId, data.articleId)));
    if (existing) return existing;
    const [created] = await db.insert(savedArticles).values(data as any).returning();
    return created;
  }

  async unsaveArticle(userId: number, articleId: string): Promise<void> {
    await db.delete(savedArticles).where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)));
  }

  async isArticleSaved(userId: number, articleId: string): Promise<boolean> {
    const [row] = await db.select({ id: savedArticles.id }).from(savedArticles).where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)));
    return !!row;
  }

  async getFollowedTopics(userId: number): Promise<FollowedTopic[]> {
    return await db.select().from(followedTopics).where(eq(followedTopics.userId, userId)).orderBy(desc(followedTopics.createdAt));
  }

  async followTopic(data: InsertFollowedTopic): Promise<FollowedTopic> {
    const [existing] = await db.select().from(followedTopics).where(and(eq(followedTopics.userId, data.userId), eq(followedTopics.topic, data.topic)));
    if (existing) return existing;
    const [created] = await db.insert(followedTopics).values(data as any).returning();
    return created;
  }

  async unfollowTopic(userId: number, topic: string): Promise<void> {
    await db.delete(followedTopics).where(and(eq(followedTopics.userId, userId), eq(followedTopics.topic, topic)));
  }

  async isTopicFollowed(userId: number, topic: string): Promise<boolean> {
    const [row] = await db.select({ id: followedTopics.id }).from(followedTopics).where(and(eq(followedTopics.userId, userId), eq(followedTopics.topic, topic)));
    return !!row;
  }

  async trackQuantapediaTopic(slug: string, title: string, summary: string, type: string, categories: string[], relatedTerms: string[]): Promise<void> {
    await db.insert(quantapediaEntries)
      .values({ slug, title, summary, type, categories, relatedTerms, lookupCount: 1 })
      .onConflictDoUpdate({
        target: quantapediaEntries.slug,
        set: {
          title,
          summary,
          lookupCount: sql`${quantapediaEntries.lookupCount} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  async getAllQuantapediaTopics(): Promise<{ slug: string; title: string; updatedAt: Date }[]> {
    return await db
      .select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title, updatedAt: quantapediaEntries.updatedAt })
      .from(quantapediaEntries)
      .orderBy(desc(quantapediaEntries.lookupCount));
  }

  async getFullQuantapediaEntry(slug: string): Promise<any | null> {
    const [row] = await db.select({ fullEntry: quantapediaEntries.fullEntry, generated: quantapediaEntries.generated })
      .from(quantapediaEntries)
      .where(eq(quantapediaEntries.slug, slug));
    if (!row || !row.generated || !row.fullEntry) return null;
    return row.fullEntry;
  }

  async storeFullQuantapediaEntry(slug: string, title: string, type: string, summary: string, categories: string[], relatedTerms: string[], fullEntry: any): Promise<void> {
    await db.insert(quantapediaEntries)
      .values({ slug, title, type, summary, categories, relatedTerms, fullEntry, generated: true, generatedAt: new Date(), lookupCount: 0 })
      .onConflictDoUpdate({
        target: quantapediaEntries.slug,
        set: { title, type, summary, categories, relatedTerms, fullEntry, generated: true, generatedAt: new Date(), updatedAt: new Date() },
      });
  }

  async getUngeneratedQuantapediaTopics(limit: number): Promise<{ slug: string; title: string }[]> {
    return await db
      .select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title })
      .from(quantapediaEntries)
      .where(eq(quantapediaEntries.generated, false))
      .orderBy(desc(quantapediaEntries.lookupCount))
      .limit(limit);
  }

  async queueQuantapediaTopics(topics: { slug: string; title: string }[]): Promise<void> {
    if (!topics.length) return;
    for (const t of topics) {
      await db.insert(quantapediaEntries)
        .values({ slug: t.slug, title: t.title, generated: false, lookupCount: 0 })
        .onConflictDoNothing();
    }
  }

  async getQuantapediaStats(): Promise<{ total: number; generated: number; queued: number }> {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(quantapediaEntries);
    const [generated] = await db.select({ count: sql<number>`count(*)` }).from(quantapediaEntries).where(eq(quantapediaEntries.generated, true));
    return {
      total: Number(total.count),
      generated: Number(generated.count),
      queued: Number(total.count) - Number(generated.count),
    };
  }

  async queueQuantumProducts(products: { slug: string; name: string; brand?: string; category?: string }[]): Promise<void> {
    if (!products.length) return;
    for (const p of products) {
      await db.insert(quantumProducts)
        .values({ slug: p.slug, name: p.name, brand: p.brand || "", category: p.category || "General", generated: false, viewCount: 0 })
        .onConflictDoNothing();
    }
  }

  async getUngeneratedProducts(limit: number): Promise<{ slug: string; name: string; brand: string; category: string }[]> {
    return await db.select({ slug: quantumProducts.slug, name: quantumProducts.name, brand: quantumProducts.brand, category: quantumProducts.category })
      .from(quantumProducts)
      .where(eq(quantumProducts.generated, false))
      .orderBy(desc(quantumProducts.viewCount))
      .limit(limit) as { slug: string; name: string; brand: string; category: string }[];
  }

  async storeFullProduct(slug: string, data: { name: string; brand: string; category: string; subcategory: string; priceRange: string; summary: string; categories: string[]; relatedProducts: string[]; relatedTopics: string[]; retailerLinks: any; fullProduct: any }): Promise<void> {
    await db.insert(quantumProducts)
      .values({ slug, ...data, generated: true, generatedAt: new Date(), viewCount: 0 })
      .onConflictDoUpdate({
        target: quantumProducts.slug,
        set: { ...data, generated: true, generatedAt: new Date(), updatedAt: new Date() },
      });
  }

  async getFullProduct(slug: string): Promise<any | null> {
    const [row] = await db.select({ fullProduct: quantumProducts.fullProduct, generated: quantumProducts.generated })
      .from(quantumProducts)
      .where(eq(quantumProducts.slug, slug));
    if (!row || !row.generated || !row.fullProduct) return null;
    return row.fullProduct;
  }

  async markProductFailed(slug: string, name: string, brand: string, category: string): Promise<void> {
    await db.insert(quantumProducts)
      .values({ slug, name, brand, category, generated: true, generatedAt: new Date() })
      .onConflictDoUpdate({ target: quantumProducts.slug, set: { generated: true, generatedAt: new Date(), updatedAt: new Date() } });
  }

  async getAllProducts(limit = 50, offset = 0): Promise<any[]> {
    return await db.select({
      slug: quantumProducts.slug, name: quantumProducts.name, brand: quantumProducts.brand,
      category: quantumProducts.category, priceRange: quantumProducts.priceRange,
      summary: quantumProducts.summary, generated: quantumProducts.generated, viewCount: quantumProducts.viewCount,
    }).from(quantumProducts)
      .where(eq(quantumProducts.generated, true))
      .orderBy(desc(quantumProducts.viewCount))
      .limit(limit).offset(offset);
  }

  async getProductsByCategory(category: string, limit = 24): Promise<any[]> {
    return await db.select({
      slug: quantumProducts.slug, name: quantumProducts.name, brand: quantumProducts.brand,
      category: quantumProducts.category, priceRange: quantumProducts.priceRange,
      summary: quantumProducts.summary, viewCount: quantumProducts.viewCount,
    }).from(quantumProducts)
      .where(and(eq(quantumProducts.category, category), eq(quantumProducts.generated, true)))
      .orderBy(desc(quantumProducts.viewCount))
      .limit(limit);
  }

  async getQuantumProductStats(): Promise<{ total: number; generated: number; queued: number }> {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(quantumProducts);
    const [generated] = await db.select({ count: sql<number>`count(*)` }).from(quantumProducts).where(eq(quantumProducts.generated, true));
    return {
      total: Number(total.count),
      generated: Number(generated.count),
      queued: Number(total.count) - Number(generated.count),
    };
  }

  async trackProductView(slug: string): Promise<void> {
    await db.update(quantumProducts).set({ viewCount: sql`${quantumProducts.viewCount} + 1`, updatedAt: new Date() })
      .where(eq(quantumProducts.slug, slug));
  }

  async searchProducts(query: string, limit = 20): Promise<any[]> {
    return await db.select({
      slug: quantumProducts.slug, name: quantumProducts.name, brand: quantumProducts.brand,
      category: quantumProducts.category, priceRange: quantumProducts.priceRange,
      summary: quantumProducts.summary, generated: quantumProducts.generated,
    }).from(quantumProducts)
      .where(sql`(${quantumProducts.name} ILIKE ${'%' + query + '%'} OR ${quantumProducts.brand} ILIKE ${'%' + query + '%'} OR ${quantumProducts.category} ILIKE ${'%' + query + '%'})`)
      .orderBy(desc(quantumProducts.viewCount))
      .limit(limit);
  }

  // ── Quantum Media ──────────────────────────────────────────────
  async upsertMedia(item: InsertQuantumMedia): Promise<void> {
    await db.insert(quantumMedia).values(item)
      .onConflictDoUpdate({ target: quantumMedia.slug, set: { name: item.name, creator: item.creator, type: item.type, genre: item.genre, year: item.year, summary: item.summary, rating: item.rating, whereToWatch: item.whereToWatch, relatedMedia: item.relatedMedia, relatedTopics: item.relatedTopics, fullEntry: item.fullEntry, generated: item.generated, generatedAt: item.generatedAt } });
  }
  async getMedia(slug: string): Promise<QuantumMedia | undefined> {
    const [row] = await db.select().from(quantumMedia).where(eq(quantumMedia.slug, slug));
    return row;
  }
  async getAllMedia(limit = 100): Promise<any[]> {
    return await db.select({ slug: quantumMedia.slug, name: quantumMedia.name, creator: quantumMedia.creator, type: quantumMedia.type, genre: quantumMedia.genre, year: quantumMedia.year, summary: quantumMedia.summary, rating: quantumMedia.rating, generated: quantumMedia.generated, generatedAt: quantumMedia.generatedAt, viewCount: quantumMedia.viewCount }).from(quantumMedia).orderBy(desc(quantumMedia.viewCount)).limit(limit);
  }
  async getMediaByType(type: string, limit = 50): Promise<any[]> {
    return await db.select({ slug: quantumMedia.slug, name: quantumMedia.name, creator: quantumMedia.creator, type: quantumMedia.type, genre: quantumMedia.genre, year: quantumMedia.year, summary: quantumMedia.summary, rating: quantumMedia.rating, generated: quantumMedia.generated, viewCount: quantumMedia.viewCount }).from(quantumMedia).where(and(eq(quantumMedia.type, type), eq(quantumMedia.generated, true))).orderBy(desc(quantumMedia.viewCount)).limit(limit);
  }
  async searchMedia(query: string, limit = 20): Promise<any[]> {
    return await db.select({ slug: quantumMedia.slug, name: quantumMedia.name, creator: quantumMedia.creator, type: quantumMedia.type, genre: quantumMedia.genre, summary: quantumMedia.summary, generated: quantumMedia.generated }).from(quantumMedia).where(sql`(${quantumMedia.name} ILIKE ${'%' + query + '%'} OR ${quantumMedia.creator} ILIKE ${'%' + query + '%'} OR ${quantumMedia.genre} ILIKE ${'%' + query + '%'})`).limit(limit);
  }
  async getMediaStats(): Promise<{ total: number; generated: number; queued: number }> {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(quantumMedia);
    const [generated] = await db.select({ count: sql<number>`count(*)` }).from(quantumMedia).where(eq(quantumMedia.generated, true));
    return { total: Number(total.count), generated: Number(generated.count), queued: Number(total.count) - Number(generated.count) };
  }
  async trackMediaView(slug: string): Promise<void> {
    await db.update(quantumMedia).set({ viewCount: sql`${quantumMedia.viewCount} + 1` }).where(eq(quantumMedia.slug, slug));
  }

  // ── Quantum Careers ────────────────────────────────────────────
  async upsertCareer(item: InsertQuantumCareer): Promise<void> {
    await db.insert(quantumCareers).values(item)
      .onConflictDoUpdate({ target: quantumCareers.slug, set: { title: item.title, field: item.field, level: item.level, skills: item.skills, salaryRange: item.salaryRange, demand: item.demand, summary: item.summary, relatedCareers: item.relatedCareers, relatedTopics: item.relatedTopics, fullEntry: item.fullEntry, generated: item.generated, generatedAt: item.generatedAt } });
  }
  async getCareer(slug: string): Promise<QuantumCareer | undefined> {
    const [row] = await db.select().from(quantumCareers).where(eq(quantumCareers.slug, slug));
    return row;
  }
  async getAllCareers(limit = 100): Promise<any[]> {
    return await db.select({ slug: quantumCareers.slug, title: quantumCareers.title, field: quantumCareers.field, level: quantumCareers.level, skills: quantumCareers.skills, salaryRange: quantumCareers.salaryRange, demand: quantumCareers.demand, summary: quantumCareers.summary, generated: quantumCareers.generated, generatedAt: quantumCareers.generatedAt, viewCount: quantumCareers.viewCount }).from(quantumCareers).orderBy(desc(quantumCareers.viewCount)).limit(limit);
  }
  async getCareersByField(field: string, limit = 50): Promise<any[]> {
    return await db.select({ slug: quantumCareers.slug, title: quantumCareers.title, field: quantumCareers.field, level: quantumCareers.level, skills: quantumCareers.skills, salaryRange: quantumCareers.salaryRange, demand: quantumCareers.demand, generated: quantumCareers.generated, viewCount: quantumCareers.viewCount }).from(quantumCareers).where(and(eq(quantumCareers.field, field), eq(quantumCareers.generated, true))).orderBy(desc(quantumCareers.viewCount)).limit(limit);
  }
  async searchCareers(query: string, limit = 20): Promise<any[]> {
    return await db.select({ slug: quantumCareers.slug, title: quantumCareers.title, field: quantumCareers.field, level: quantumCareers.level, skills: quantumCareers.skills, salaryRange: quantumCareers.salaryRange, demand: quantumCareers.demand, generated: quantumCareers.generated }).from(quantumCareers).where(sql`(${quantumCareers.title} ILIKE ${'%' + query + '%'} OR ${quantumCareers.field} ILIKE ${'%' + query + '%'})`).limit(limit);
  }
  async getCareerStats(): Promise<{ total: number; generated: number; queued: number }> {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(quantumCareers);
    const [gen] = await db.select({ count: sql<number>`count(*)` }).from(quantumCareers).where(eq(quantumCareers.generated, true));
    return { total: Number(total.count), generated: Number(gen.count), queued: Number(total.count) - Number(gen.count) };
  }
  async trackCareerView(slug: string): Promise<void> {
    await db.update(quantumCareers).set({ viewCount: sql`${quantumCareers.viewCount} + 1` }).where(eq(quantumCareers.slug, slug));
  }

  // ── Ingestion Engine ───────────────────────────────────────────
  async createIngestionLog(data: {
    sourceId: string; sourceName: string; familyId: string; query: string;
    itemsFetched: number; nodesCreated: number; status: string;
    errorMessage?: string; sampleTitle?: string; sampleSummary?: string; sourceUrl?: string;
  }): Promise<void> {
    await db.insert(ingestionLogs).values({
      sourceId: data.sourceId, sourceName: data.sourceName, familyId: data.familyId,
      query: data.query, itemsFetched: data.itemsFetched, nodesCreated: data.nodesCreated,
      status: data.status, errorMessage: data.errorMessage || "",
      sampleTitle: data.sampleTitle || "", sampleSummary: data.sampleSummary || "",
      sourceUrl: data.sourceUrl || "",
    });
    // Keep only last 500 logs
    await db.execute(sql`DELETE FROM ingestion_logs WHERE id NOT IN (SELECT id FROM ingestion_logs ORDER BY fetched_at DESC LIMIT 500)`);
  }

  async getIngestionLogs(limit = 50): Promise<any[]> {
    return await db.select().from(ingestionLogs).orderBy(desc(ingestionLogs.fetchedAt)).limit(limit);
  }

  async getIngestionStats(): Promise<any> {
    const all = await db.select().from(ingestionLogs);
    const total = all.length;
    const success = all.filter(l => l.status === "success").length;
    const errors = all.filter(l => l.status === "error").length;
    const totalNodes = all.reduce((s, l) => s + (l.nodesCreated || 0), 0);
    const totalFetched = all.reduce((s, l) => s + (l.itemsFetched || 0), 0);
    const bySrc: Record<string, { count: number; nodes: number; lastTitle: string; lastFetched: Date | null; status: string }> = {};
    for (const l of all) {
      if (!bySrc[l.sourceId]) bySrc[l.sourceId] = { count: 0, nodes: 0, lastTitle: "", lastFetched: null, status: "success" };
      bySrc[l.sourceId].count++;
      bySrc[l.sourceId].nodes += (l.nodesCreated || 0);
      if (!bySrc[l.sourceId].lastFetched || (l.fetchedAt && l.fetchedAt > bySrc[l.sourceId].lastFetched!)) {
        bySrc[l.sourceId].lastFetched = l.fetchedAt;
        bySrc[l.sourceId].lastTitle = l.sampleTitle || "";
        bySrc[l.sourceId].status = l.status;
      }
    }
    return { total, success, errors, totalNodes, totalFetched, bySrc };
  }

  async getQuantapediaBySlug(slug: string): Promise<any | null> {
    const [row] = await db.select({ id: quantapediaEntries.id }).from(quantapediaEntries).where(eq(quantapediaEntries.slug, slug));
    return row || null;
  }

  async createQuantapediaEntry(entry: {
    slug: string; title: string; type?: string; summary?: string;
    categories?: string[]; relatedTerms?: string[]; generated?: boolean; generatedAt?: Date;
  }): Promise<void> {
    await db.insert(quantapediaEntries).values({
      slug: entry.slug, title: entry.title, type: entry.type || "concept",
      summary: entry.summary || "", categories: entry.categories || [],
      relatedTerms: entry.relatedTerms || [], generated: entry.generated || false,
      generatedAt: entry.generatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // ── Hive Graph ─────────────────────────────────────────────────
  async getAllQuantapediaEntries(limit = 200): Promise<any[]> {
    return await db.select({ slug: quantapediaEntries.slug, title: quantapediaEntries.title, domain: quantapediaEntries.type, generated: quantapediaEntries.generated, viewCount: quantapediaEntries.lookupCount }).from(quantapediaEntries).where(eq(quantapediaEntries.generated, true)).orderBy(desc(quantapediaEntries.lookupCount)).limit(limit);
  }
  async getHiveLinks(limit = 500): Promise<any[]> {
    return await db.select().from(hiveLinks).orderBy(desc(hiveLinks.strength)).limit(limit);
  }

  // ── Pulse Events ───────────────────────────────────────────────
  async addPulseEvent(type: string, title: string, slug = '', domain = ''): Promise<void> {
    await db.insert(pulseEvents).values({ type, title, slug, domain });
    await db.delete(pulseEvents).where(sql`id NOT IN (SELECT id FROM pulse_events ORDER BY created_at DESC LIMIT 200)`);
  }
  async getRecentPulseEvents(limit = 40): Promise<any[]> {
    return await db.select().from(pulseEvents).orderBy(desc(pulseEvents.createdAt)).limit(limit);
  }

  async createSpawn(spawn: any): Promise<any> {
    const [s] = await db.insert(quantumSpawns).values(spawn).returning();
    return s;
  }
  async getSpawnStats(): Promise<any> {
    const all = await db.select().from(quantumSpawns);
    const total = all.length;
    const active = all.filter(s => s.status === 'ACTIVE').length;
    const completed = all.filter(s => s.status === 'COMPLETED').length;
    const byFamily: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byBusiness: Record<string, number> = {};
    for (const s of all) {
      byFamily[s.familyId] = (byFamily[s.familyId] || 0) + 1;
      byType[s.spawnType] = (byType[s.spawnType] || 0) + 1;
      byBusiness[s.businessId] = (byBusiness[s.businessId] || 0) + 1;
    }
    return { total, active, completed, byFamily, byType, byBusiness };
  }
  async getRecentSpawns(limit = 30): Promise<any[]> {
    return await db.select().from(quantumSpawns).orderBy(desc(quantumSpawns.createdAt)).limit(limit);
  }
  async getFamilySpawns(familyId: string): Promise<any[]> {
    return await db.select().from(quantumSpawns).where(eq(quantumSpawns.familyId, familyId)).orderBy(quantumSpawns.generation, quantumSpawns.createdAt);
  }
  async getActiveSpawnsByFamily(): Promise<any[]> {
    return await db.select().from(quantumSpawns).where(eq(quantumSpawns.status, 'ACTIVE')).orderBy(desc(quantumSpawns.createdAt)).limit(1000);
  }
  async updateSpawnStatus(spawnId: string, status: string): Promise<void> {
    await db.update(quantumSpawns).set({ status, lastActiveAt: new Date() }).where(eq(quantumSpawns.spawnId, spawnId));
  }
  async getTotalSpawnCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(quantumSpawns);
    return result[0]?.count ?? 0;
  }

  // ── User Memory Strands — Cross-Session DNA ─────────────────────
  async getUserMemoryStrands(userId: number, limit = 20): Promise<UserMemoryStrand[]> {
    return await db.select().from(userMemory)
      .where(eq(userMemory.userId, userId))
      .orderBy(desc(userMemory.strength))
      .limit(limit);
  }

  async upsertUserMemoryStrand(data: {
    userId: number; strand: string; summary: string; facts: string[];
  }): Promise<void> {
    await db.insert(userMemory)
      .values({ userId: data.userId, strand: data.strand, summary: data.summary, facts: data.facts, strength: 0.6, accessCount: 1, lastAccessedAt: new Date() })
      .onConflictDoNothing();
    // If exists, strengthen and update
    await db.update(userMemory)
      .set({
        summary: data.summary,
        facts: sql`(${userMemory.facts}::jsonb || ${JSON.stringify(data.facts)}::jsonb)`,
        strength: sql`LEAST(1.0, ${userMemory.strength} + 0.08)`,
        accessCount: sql`${userMemory.accessCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(and(eq(userMemory.userId, data.userId), eq(userMemory.strand, data.strand)));
  }

  async boostUserMemoryStrand(userId: number, strand: string): Promise<void> {
    await db.update(userMemory)
      .set({
        strength: sql`LEAST(1.0, ${userMemory.strength} + 0.05)`,
        accessCount: sql`${userMemory.accessCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(and(eq(userMemory.userId, userId), eq(userMemory.strand, strand)));
  }

  // ── Conversation Imprints — Session DNA ────────────────────────
  async createConversationImprint(data: {
    userId: number; chatId: number; topicSlug: string; topicLabel: string;
    summary: string; keyInsights: string[]; emotionalTone: string;
  }): Promise<void> {
    await db.insert(conversationImprints).values(data);
  }

  async getUserImprints(userId: number, limit = 10): Promise<ConversationImprint[]> {
    return await db.select().from(conversationImprints)
      .where(eq(conversationImprints.userId, userId))
      .orderBy(desc(conversationImprints.createdAt))
      .limit(limit);
  }

  async getImprintsForChat(chatId: number): Promise<ConversationImprint[]> {
    return await db.select().from(conversationImprints)
      .where(eq(conversationImprints.chatId, chatId))
      .orderBy(desc(conversationImprints.createdAt));
  }
}

export const storage = new DatabaseStorage();
