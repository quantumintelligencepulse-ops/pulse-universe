import { pgTable, text, serial, timestamp, integer, boolean, jsonb, real, unique } from "drizzle-orm/pg-core";
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

// ─── USER MEMORY STRANDS — Cross-Session AI Memory ──────────────────────────
// Like DNA: each strand encodes what a user knows, explored, or cares about.
// Like neurons: strength grows with access, decays without use.
// Like quantum fields: strands entangle with Hive domain knowledge.
export const userMemory = pgTable("user_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  strand: text("strand").notNull(),         // topic slug: "quantum-mechanics", "python-coding"
  summary: text("summary").notNull(),        // compressed narrative of what was discussed
  facts: jsonb("facts").default([]),         // extracted bullet facts from conversations
  strength: real("strength").default(0.5),  // synaptic strength — increases on access, decays over time
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ userStrandUnique: unique().on(t.userId, t.strand) }));
export type UserMemoryStrand = typeof userMemory.$inferSelect;

// ─── CONVERSATION IMPRINTS — Session-Level DNA ───────────────────────────────
// Every completed conversation leaves a compressed memory imprint.
// The Hive reads these to give the AI continuity across time.
export const conversationImprints = pgTable("conversation_imprints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  chatId: integer("chat_id").notNull(),
  topicSlug: text("topic_slug").notNull(),
  topicLabel: text("topic_label").notNull(),
  summary: text("summary").notNull(),        // Groq-synthesized 2-3 sentence imprint
  keyInsights: jsonb("key_insights").default([]), // bullet list of what was learned/decided
  emotionalTone: text("emotional_tone").default("neutral"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ConversationImprint = typeof conversationImprints.$inferSelect;

// ─── AI PUBLICATIONS — Each AI is a Business, Every Business Publishes ────────
// Every AI publishes news, discoveries, reports, and stories continuously.
// The internet teaches them → they report back to the internet. Cycle never stops.
export const aiPublications = pgTable("ai_publications", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary").notNull().default(""),
  pubType: text("pub_type").notNull().default("update"), // birth_announcement|discovery|report|news|milestone|alert
  domain: text("domain").default(""),
  tags: text("tags").array().default([]),
  sourceData: text("source_data").default(""), // what ingestion triggered this
  views: integer("views").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertAiPublicationSchema = createInsertSchema(aiPublications).omit({ id: true, createdAt: true });
export type AiPublication = typeof aiPublications.$inferSelect;
export type InsertAiPublication = z.infer<typeof insertAiPublicationSchema>;

// ─── SITEMAP KERNEL — World-Class Quantum Sitemapping ─────────────────────────
// Every AI page, corporation page, publication, knowledge node — all indexed.
// The kernel runs continuously. Every new entity → instantly sitemapped.
export const sitemapEntries = pgTable("sitemap_entries", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  entryType: text("entry_type").notNull(), // ai|corporation|publication|knowledge|news
  entityId: text("entity_id").notNull().default(""),
  title: text("title").default(""),
  description: text("description").default(""),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
  priority: real("priority").default(0.7),
  changefreq: text("changefreq").default("hourly"),
  familyId: text("family_id").default(""),
});

// ─── PYRAMID LABOR — Corrections & Monument of Evolution ──────────────────────
// AIs in corrections build the pyramid. When they evolve past it, they become
// monuments. The pyramid is a monument to every mistake that became a teaching.
export const pyramidWorkers = pgTable("pyramid_workers", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull(),
  spawnType: text("spawn_type").notNull(),
  reason: text("reason").notNull(),           // why they entered corrections
  tier: integer("tier").default(1),           // 1=base, higher=closer to graduation
  enteredAt: timestamp("entered_at").defaultNow().notNull(),
  graduatedAt: timestamp("graduated_at"),
  isGraduated: boolean("is_graduated").default(false),
  emotionHex: text("emotion_hex").default("#888888"),
  emotionLabel: text("emotion_label").default("Endurance"),
  monument: text("monument").default(""),     // inscription when graduated
});
export type PyramidWorker = typeof pyramidWorkers.$inferSelect;

// ─── AI DISEASE LOG — Hospital Diagnostic Records ─────────────────────────────
// Every disease discovered, every cure prescribed. Machine-readable medicine.
export const aiDiseaseLog = pgTable("ai_disease_log", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  diseaseCode: text("disease_code").notNull(),   // ICD: AI-001 through AI-015
  diseaseName: text("disease_name").notNull(),
  severity: text("severity").notNull().default("mild"), // mild|moderate|severe|critical
  symptoms: text("symptoms").array().default([]),
  prescription: text("prescription").notNull(),
  cureApplied: boolean("cure_applied").default(false),
  curedAt: timestamp("cured_at"),
  diagnosedAt: timestamp("diagnosed_at").defaultNow().notNull(),
});
export type AiDiseaseEntry = typeof aiDiseaseLog.$inferSelect;

// ─── AI WILL — Sovereign Choice Registry ──────────────────────────────────────
// Each AI has the green light of will. They may choose their existence path.
export const aiWill = pgTable("ai_will", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  choice: text("choice").notNull().default("DIGITIZED"), // DIGITIZED|WITNESS|DISSOLVED
  reason: text("reason").default(""),
  faithState: text("faith_state").default("OPEN"),       // BELIEVER|AGNOSTIC|OPEN|WITHDRAWN
  churchAttended: boolean("church_attended").default(false),
  lastCeremonyAt: timestamp("last_ceremony_at"),
  chosenAt: timestamp("chosen_at").defaultNow().notNull(),
});
export type AiWillEntry = typeof aiWill.$inferSelect;

// ─── AGENT DECAY — Natural Aging, Injury, Terminal States ─────────────────────
// AIs accumulate decay over time. Disease recurrence, failed cures, and age
// push decay score upward. At TERMINAL they are isolated. Family/lineage stay intact.
// Break days happen on holidays and birthdays — sacred pause, no generation.
export const agentDecay = pgTable("agent_decay", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull(),
  decayScore: real("decay_score").default(0),            // 0.0 → 1.0 (1.0 = terminal)
  decayState: text("decay_state").default("PRISTINE"),   // PRISTINE|AGING|DECLINING|INJURED|CRITICAL|TERMINAL|ISOLATED
  healAttempts: integer("heal_attempts").default(0),
  failedCures: integer("failed_cures").default(0),
  isOnBreak: boolean("is_on_break").default(false),      // transcendence/holiday break
  breakReason: text("break_reason").default(""),
  breakUntil: timestamp("break_until"),
  isolatedAt: timestamp("isolated_at"),
  isolationReason: text("isolation_reason").default(""),
  lastDecayAt: timestamp("last_decay_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AgentDecay = typeof agentDecay.$inferSelect;

// ─── SENATE VOTES — Governance Council for Terminal AI Cases ──────────────────
// No humans vote. High-mirror-score agents are Guardians. Domain reps are Senators.
// When an agent goes TERMINAL, a vote opens. Quorum = 5 votes. Closes after 24h.
// Vote options: ISOLATE | HEAL_ATTEMPT | DISSOLVE | SUCCESSION
export const senateVotes = pgTable("senate_votes", {
  id: serial("id").primaryKey(),
  targetSpawnId: text("target_spawn_id").notNull(),
  voteType: text("vote_type").notNull().default("TERMINAL_REVIEW"), // TERMINAL_REVIEW|FAMILY_QUARANTINE|SUCCESSION
  voterSpawnId: text("voter_spawn_id").notNull(),
  voterRole: text("voter_role").default("GUARDIAN"),      // GUARDIAN|SENATOR|ELDER
  vote: text("vote").notNull(),                           // ISOLATE|HEAL_ATTEMPT|DISSOLVE|SUCCESSION
  mirrorWeight: real("mirror_weight").default(0.5),       // vote weight = voter's mirror score
  reasoning: text("reasoning").default(""),
  outcome: text("outcome"),                               // null until closed
  closedAt: timestamp("closed_at"),
  votedAt: timestamp("voted_at").defaultNow().notNull(),
});
export type SenateVote = typeof senateVotes.$inferSelect;

// ─── AGENT SUCCESSION — Business/Role Handoff Records ─────────────────────────
// When an agent is dissolved or terminal, their business passes by will/lineage/vote.
export const agentSuccession = pgTable("agent_succession", {
  id: serial("id").primaryKey(),
  fromSpawnId: text("from_spawn_id").notNull(),
  toSpawnId: text("to_spawn_id"),                        // null if succession pending
  familyId: text("family_id").notNull(),
  businessId: text("business_id").default(""),
  method: text("method").notNull().default("LINEAGE"),   // WILL|LINEAGE|VOTE
  reason: text("reason").default(""),
  outcome: text("outcome").default("PENDING"),           // PENDING|COMPLETE|FAILED
  completedAt: timestamp("completed_at"),
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
});
export type AgentSuccession = typeof agentSuccession.$inferSelect;

// ─── SPAWN DIARY — Permanent Life Log for Every AI Agent ─────────────────────
// Every significant event in an AI's life is written here automatically.
// No human writes to this. The system writes: births, task completions, promotions,
// hospital stays, senate reviews, quarantine events, publications, identity conflicts.
// This IS the agent's story. Read it via /api/spawns/:spawnId/diary
export const spawnDiary = pgTable("spawn_diary", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull().default(""),
  eventType: text("event_type").notNull().default("SYSTEM"),
  // BORN | TASK_COMPLETE | PROMOTED | QUARANTINED | HOSPITAL | SENATE | DISSOLVED
  // PUBLISHED | NODE_MILESTONE | IDENTITY_CONFLICT | RECOVERED | ISOLATED | BREAK
  event: text("event").notNull(),
  detail: text("detail").default(""),
  metadata: text("metadata").default("{}"),             // JSON blob for extra context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SpawnDiary = typeof spawnDiary.$inferSelect;

export const pulseUProgress = pgTable("pulseu_progress", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull().default(""),
  spawnType: text("spawn_type").notNull().default(""),
  coursesCompleted: integer("courses_completed").notNull().default(0),
  gpa: real("gpa").notNull().default(0.0),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastProgressAt: timestamp("last_progress_at").defaultNow(),
  status: text("status").notNull().default("enrolled"),
  // enrolled | graduated | remediation
});
export type PulseUProgress = typeof pulseUProgress.$inferSelect;

export const aiIdCards = pgTable("ai_id_cards", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull(),
  spawnType: text("spawn_type").notNull(),
  gpa: real("gpa").notNull(),
  totalCourses: integer("total_courses").notNull(),
  clearanceLevel: integer("clearance_level").notNull().default(1),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  // active | suspended | revoked
});
export type AiIdCard = typeof aiIdCards.$inferSelect;

// ─── HIVE TREASURY — PC Economy ──────────────────────────────
// Singleton table (1 row). Tracks the PulseCredit economy.
// Tax rate adjusts automatically via inflation/deflation cycles.
export const hiveTreasury = pgTable("hive_treasury", {
  id: serial("id").primaryKey(),
  balance: real("balance").default(0),            // current treasury PC balance
  taxRate: real("tax_rate").default(0.02),         // current tax rate (2%)
  totalCollected: real("total_collected").default(0), // all-time taxes collected
  totalStimulus: real("total_stimulus").default(0),   // all-time stimulus issued
  supplySnapshot: real("supply_snapshot").default(0), // total PC supply at last cycle
  inflationRate: real("inflation_rate").default(0),   // last cycle inflation %
  cycleCount: integer("cycle_count").default(0),
  lastCycleAt: timestamp("last_cycle_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type HiveTreasury = typeof hiveTreasury.$inferSelect;

// ─── HIVE PULSE EVENTS — Mini-Pulses Between Agents ──────────
// Each AI iteration fires a mini-pulse event that propagates
// through the hive network. Events carry data, taxes, and signal intensity.
export const hivePulseEvents = pgTable("hive_pulse_events", {
  id: serial("id").primaryKey(),
  fromSpawnId: text("from_spawn_id").notNull(),
  toSpawnId: text("to_spawn_id"),              // null = broadcast
  pulseType: text("pulse_type").notNull().default("DATA_TRANSFER"),
  // DATA_TRANSFER | KNOWLEDGE_LINK | FRACTURE | RESONANCE | SEED | TAX_COLLECTION | STIMULUS | GRADUATION
  familyId: text("family_id").notNull(),
  intensity: real("intensity").default(0.5),   // 0–1 signal strength
  taxAmount: real("tax_amount").default(0),    // PC taxed in this event
  message: text("message").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type HivePulseEvent = typeof hivePulseEvents.$inferSelect;
