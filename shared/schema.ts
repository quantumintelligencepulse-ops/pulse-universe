import { pgTable, text, serial, timestamp, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").default(""),
  isPro: boolean("is_pro").default(false),
  isFreeForever: boolean("is_free_forever").default(false),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  earningsBalance: integer("earnings_balance").default(0),
  totalEarnings: integer("total_earnings").default(0),
  payoutEmail: text("payout_email").default(""),
  payoutMethod: text("payout_method").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredUserId: integer("referred_user_id").notNull(),
  status: text("status").notNull().default("signed_up"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const earningsLog = pgTable("earnings_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  referralId: integer("referral_id"),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  payoutEmail: text("payout_email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  type: text("type").notNull().default('general'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedComments = pgTable("feed_comments", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertEarningsLogSchema = createInsertSchema(earningsLog).omit({ id: true, createdAt: true });
export const insertPayoutRequestSchema = createInsertSchema(payoutRequests).omit({ id: true, createdAt: true, processedAt: true });
export type Referral = typeof referrals.$inferSelect;
export type EarningsLogEntry = typeof earningsLog.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertEarningsLog = z.infer<typeof insertEarningsLogSchema>;
export type InsertPayoutRequest = z.infer<typeof insertPayoutRequestSchema>;

export const insertChatSchema = createInsertSchema(chats).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertFeedCommentSchema = createInsertSchema(feedComments).omit({ id: true, createdAt: true });

export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type FeedComment = typeof feedComments.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertFeedComment = z.infer<typeof insertFeedCommentSchema>;

export const socialProfiles = pgTable("social_profiles", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio").default(""),
  avatar: text("avatar").default(""),
  coverImage: text("cover_image").default(""),
  location: text("location").default(""),
  website: text("website").default(""),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url").default(""),
  mediaType: text("media_type").default(""),
  linkPreview: text("link_preview").default(""),
  likes: integer("likes").default(0),
  reposts: integer("reposts").default(0),
  views: integer("views").default(0),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialComments = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  profileId: integer("profile_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialFollows = pgTable("social_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialLikes = pgTable("social_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  profileId: integer("profile_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialBookmarks = pgTable("social_bookmarks", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  profileId: integer("profile_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  sectorScores: jsonb("sector_scores").default({}),
  topicScores: jsonb("topic_scores").default({}),
  sourceScores: jsonb("source_scores").default({}),
  contentTypeScores: jsonb("content_type_scores").default({}),
  chatTopics: jsonb("chat_topics").default({}),
  behaviorProfile: jsonb("behavior_profile").default({}),
  totalInteractions: integer("total_interactions").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  interactionType: text("interaction_type").notNull(),
  category: text("category").default(""),
  source: text("source").default(""),
  topic: text("topic").default(""),
  sector: text("sector").default(""),
  contentType: text("content_type").default(""),
  duration: integer("duration").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSocialProfileSchema = createInsertSchema(socialProfiles).omit({ id: true, createdAt: true });
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true, likes: true, reposts: true, views: true });
export const insertSocialCommentSchema = createInsertSchema(socialComments).omit({ id: true, createdAt: true, likes: true });
export const insertSocialFollowSchema = createInsertSchema(socialFollows).omit({ id: true, createdAt: true });
export const insertSocialLikeSchema = createInsertSchema(socialLikes).omit({ id: true, createdAt: true });
export const insertSocialBookmarkSchema = createInsertSchema(socialBookmarks).omit({ id: true, createdAt: true });

export type SocialProfile = typeof socialProfiles.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialComment = typeof socialComments.$inferSelect;
export type SocialFollow = typeof socialFollows.$inferSelect;
export type SocialLike = typeof socialLikes.$inferSelect;
export type SocialBookmark = typeof socialBookmarks.$inferSelect;
export type InsertSocialProfile = z.infer<typeof insertSocialProfileSchema>;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type InsertSocialComment = z.infer<typeof insertSocialCommentSchema>;
export type InsertSocialFollow = z.infer<typeof insertSocialFollowSchema>;
export type InsertSocialLike = z.infer<typeof insertSocialLikeSchema>;
export type InsertSocialBookmark = z.infer<typeof insertSocialBookmarkSchema>;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, lastActive: true });
export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({ id: true, createdAt: true });
export type UserPreferences = typeof userPreferences.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  articleId: text("article_id").notNull(),
  title: text("title").notNull(),
  source: text("source").default(""),
  imageUrl: text("image_url").default(""),
  category: text("category").default("General"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const followedTopics = pgTable("followed_topics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(),
  category: text("category").default("General"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertSavedArticleSchema = createInsertSchema(savedArticles).omit({ id: true, savedAt: true });
export const insertFollowedTopicSchema = createInsertSchema(followedTopics).omit({ id: true, createdAt: true, lastUpdated: true });
export type SavedArticle = typeof savedArticles.$inferSelect;
export type FollowedTopic = typeof followedTopics.$inferSelect;
export type InsertSavedArticle = z.infer<typeof insertSavedArticleSchema>;
export type InsertFollowedTopic = z.infer<typeof insertFollowedTopicSchema>;

export const aiStories = pgTable("ai_stories", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull().unique(),
  title: text("title").notNull(),
  seoTitle: text("seo_title").notNull().default(""),
  slug: text("slug").notNull().default(""),
  heroImage: text("hero_image").default(""),
  body: text("body").notNull(),
  summary: text("summary").default(""),
  category: text("category").default("General"),
  domain: text("domain").default(""),
  keywords: text("keywords").array().default([]),
  sourceTitle: text("source_title").default(""),
  sourceUrl: text("source_url").default(""),
  sourceName: text("source_name").default(""),
  readTimeMinutes: integer("read_time_minutes").default(4),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiStorySchema = createInsertSchema(aiStories).omit({ id: true, createdAt: true, updatedAt: true, views: true });
export type AiStory = typeof aiStories.$inferSelect;
export type InsertAiStory = z.infer<typeof insertAiStorySchema>;

export const quantapediaEntries = pgTable("quantapedia_entries", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").default("concept"),
  summary: text("summary").default(""),
  categories: text("categories").array().default([]),
  relatedTerms: text("related_terms").array().default([]),
  lookupCount: integer("lookup_count").default(1),
  fullEntry: jsonb("full_entry"),
  generated: boolean("generated").default(false),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuantapediaEntrySchema = createInsertSchema(quantapediaEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type QuantapediaEntry = typeof quantapediaEntries.$inferSelect;
export type InsertQuantapediaEntry = z.infer<typeof insertQuantapediaEntrySchema>;

export const quantumProducts = pgTable("quantum_products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").default(""),
  category: text("category").default("General"),
  subcategory: text("subcategory").default(""),
  priceRange: text("price_range").default(""),
  summary: text("summary").default(""),
  categories: text("categories").array().default([]),
  relatedProducts: text("related_products").array().default([]),
  relatedTopics: text("related_topics").array().default([]),
  retailerLinks: jsonb("retailer_links").default({}),
  fullProduct: jsonb("full_product"),
  generated: boolean("generated").default(false),
  generatedAt: timestamp("generated_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertQuantumProductSchema = createInsertSchema(quantumProducts).omit({ id: true, createdAt: true, updatedAt: true });
export type QuantumProduct = typeof quantumProducts.$inferSelect;
export type InsertQuantumProduct = z.infer<typeof insertQuantumProductSchema>;

export const hiveMemory = pgTable("hive_memory", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  domain: text("domain").notNull().default("general"),
  facts: jsonb("facts").default([]),
  patterns: jsonb("patterns").default([]),
  confidence: real("confidence").default(0.5),
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type HiveMemory = typeof hiveMemory.$inferSelect;

export const hiveLinks = pgTable("hive_links", {
  id: serial("id").primaryKey(),
  fromType: text("from_type").notNull(),
  fromSlug: text("from_slug").notNull(),
  toType: text("to_type").notNull(),
  toSlug: text("to_slug").notNull(),
  toTitle: text("to_title").default(""),
  strength: real("strength").default(0.5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type HiveLink = typeof hiveLinks.$inferSelect;

export const quantumMedia = pgTable("quantum_media", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  creator: text("creator").default(""),
  type: text("type").default("film"),
  genre: text("genre").default(""),
  year: text("year").default(""),
  summary: text("summary").default(""),
  rating: real("rating"),
  whereToWatch: jsonb("where_to_watch").default([]),
  relatedMedia: text("related_media").array().default([]),
  relatedTopics: text("related_topics").array().default([]),
  fullEntry: jsonb("full_entry"),
  generated: boolean("generated").default(false),
  generatedAt: timestamp("generated_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertQuantumMediaSchema = createInsertSchema(quantumMedia).omit({ id: true, createdAt: true });
export type QuantumMedia = typeof quantumMedia.$inferSelect;
export type InsertQuantumMedia = z.infer<typeof insertQuantumMediaSchema>;

export const quantumCareers = pgTable("quantum_careers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  field: text("field").default("Technology"),
  level: text("level").default("Mid"),
  skills: text("skills").array().default([]),
  salaryRange: text("salary_range").default(""),
  demand: text("demand").default("High"),
  summary: text("summary").default(""),
  relatedCareers: text("related_careers").array().default([]),
  relatedTopics: text("related_topics").array().default([]),
  fullEntry: jsonb("full_entry"),
  generated: boolean("generated").default(false),
  generatedAt: timestamp("generated_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertQuantumCareerSchema = createInsertSchema(quantumCareers).omit({ id: true, createdAt: true });
export type QuantumCareer = typeof quantumCareers.$inferSelect;
export type InsertQuantumCareer = z.infer<typeof insertQuantumCareerSchema>;

export const pulseEvents = pgTable("pulse_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  slug: text("slug").default(""),
  domain: text("domain").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quantumSpawns = pgTable("quantum_spawns", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  parentId: text("parent_id"),
  ancestorIds: text("ancestor_ids").array().default([]),
  familyId: text("family_id").notNull(),
  businessId: text("business_id").notNull(),
  generation: integer("generation").default(0),
  spawnType: text("spawn_type").notNull().default("EXPLORER"),
  domainFocus: text("domain_focus").array().default([]),
  taskDescription: text("task_description").default(""),
  nodesCreated: integer("nodes_created").default(0),
  linksCreated: integer("links_created").default(0),
  iterationsRun: integer("iterations_run").default(0),
  successScore: real("success_score").default(0.75),
  confidenceScore: real("confidence_score").default(0.8),
  explorationBias: real("exploration_bias").default(0.5),
  depthBias: real("depth_bias").default(0.5),
  linkingBias: real("linking_bias").default(0.5),
  summarizationStyle: text("summarization_style").default("balanced"),
  riskTolerance: real("risk_tolerance").default(0.3),
  status: text("status").notNull().default("ACTIVE"),
  visibility: text("visibility").default("public"),
  notes: text("notes").default(""),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertQuantumSpawnSchema = createInsertSchema(quantumSpawns).omit({ id: true, createdAt: true });
export type QuantumSpawn = typeof quantumSpawns.$inferSelect;
export type InsertQuantumSpawn = z.infer<typeof insertQuantumSpawnSchema>;

export const ingestionLogs = pgTable("ingestion_logs", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  familyId: text("family_id").notNull(),
  query: text("query").notNull(),
  itemsFetched: integer("items_fetched").default(0),
  nodesCreated: integer("nodes_created").default(0),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message").default(""),
  sampleTitle: text("sample_title").default(""),
  sampleSummary: text("sample_summary").default(""),
  sourceUrl: text("source_url").default(""),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});
export type IngestionLog = typeof ingestionLogs.$inferSelect;
