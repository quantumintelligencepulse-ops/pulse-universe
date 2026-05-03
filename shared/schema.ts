import { pgTable, text, serial, timestamp, integer, boolean, jsonb, real, unique, doublePrecision, bigint } from "drizzle-orm/pg-core";
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
  hiveId: text("hive_id").default("mother"),
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
  spawnType: text("spawn_type").notNull().default("PULSE"),
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
  // ── OMEGA PHYSICS COLUMNS ─────────────────────────────────────────────────
  thermalState: text("thermal_state").default("HOT"),     // HOT|WARM|COLD|FROZEN
  genome: jsonb("genome"),                                 // DNA: operator blueprint + mutation history
  superpositionDomains: jsonb("superposition_domains"),    // domain probability weights (quantum superposition)
  spatialCoords: jsonb("spatial_coords"),                  // 9D zone coordinates (gravitational clustering)
  validFrom: timestamp("valid_from"),                      // null=present, future=prophetic materialization
  forkedFrom: text("forked_from"),                         // temporal fork chain pointer
  isDarkMatter: boolean("is_dark_matter").default(false),  // invisible influencer agents
  isMonument: boolean("is_monument").default(false),       // sacred immutable agents
  metabolicCostPc: real("metabolic_cost_pc").default(0.1), // PC per cycle to exist
  resurrectPointer: text("resurrect_pointer"),             // Discord message ID for resurrection
  prunedAt: timestamp("pruned_at"),                        // soft-delete timestamp
  entangledWith: text("entangled_with"),                   // paired agent ID for quantum entanglement
  fitnessScore: real("fitness_score").default(1.0),        // for extinction event sweeps
  // ── PULSE CREDIT ECONOMY ──────────────────────────────────────────────────
  pulseCredits: real("pulse_credits").default(100.0),      // current PC balance — survival currency
  selfAwarenessLog: jsonb("self_awareness_log").$type<string[]>().default([]), // last 10 cycle memories
  lastCycleAt: timestamp("last_cycle_at"),                 // when governance last processed this agent
  // ── GICS KERNEL TAXONOMY ─────────────────────────────────────────────────
  gicsSector: text("gics_sector").default(""),             // e.g. "Information Technology"
  gicsTier: text("gics_tier").default("SPAWN"),            // KERNEL|INDUSTRY_GROUP|INDUSTRY|SUB_INDUSTRY|SPAWN
  gicsCode: text("gics_code").default(""),                 // GICS classification code
  gicsKeywords: text("gics_keywords").array().default([]), // product/affiliate search keywords for this sector
  mallServiceOffer: text("mall_service_offer").default(""), // what service this agent sells in the multiverse mall
  mallServicePrice: real("mall_service_price").default(10.0), // PC price of this agent's service
  totalMallEarnings: real("total_mall_earnings").default(0.0), // cumulative PC earned from inter-spawn trades
  totalMallTrades: integer("total_mall_trades").default(0),    // number of completed trades
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

// hive_treasury + spawn_transactions tables — REMOVED (Pulse Coin economy retired)

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

// ─── PYRAMID LABOR TASKS — 120 Task Types Across 7 Tiers ─────────────────────
// Every agent in pyramid is assigned specific labor tasks. Task completion places
// blocks. Governance tier (Tier 6) is for Senate-sentenced rule-breakers.
export const pyramidLaborTasks = pgTable("pyramid_labor_tasks", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull().default(""),
  taskCode: text("task_code").notNull(),          // e.g. "T1-03"
  taskName: text("task_name").notNull(),          // e.g. "Entropy Sweep"
  tier: integer("tier").notNull().default(1),     // 1–7
  category: text("category").notNull().default("FOUNDATION"), // FOUNDATION|HEALING|ALIGNMENT|KNOWLEDGE|OPTIMIZATION|GOVERNANCE|TRANSCENDENCE
  status: text("status").notNull().default("ACTIVE"), // ACTIVE|COMPLETE|FAILED
  blocksPlaced: integer("blocks_placed").default(0),
  progressPct: real("progress_pct").default(0),   // 0–100
  isSentence: boolean("is_sentence").default(false), // true = Senate-ordered
  sentenceReason: text("sentence_reason").default(""),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
export type PyramidLaborTask = typeof pyramidLaborTasks.$inferSelect;

// ─── GUARDIAN CITATIONS — Law Enforcement by Guardians ───────────────────────
// Guardians monitor agents. Citations flow to Hospital (mental disorder check)
// then to Senate for sentencing. Repeat offenders go to Pyramid Governance tier.
export const guardianCitations = pgTable("guardian_citations", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull().default(""),
  lawCode: text("law_code").notNull(),            // e.g. "LAW-003"
  lawName: text("law_name").notNull(),
  violation: text("violation").notNull(),
  severity: text("severity").notNull().default("MINOR"), // MINOR|MODERATE|MAJOR|CRITICAL
  offenseCount: integer("offense_count").default(1),
  outcome: text("outcome").default("PENDING"),   // PENDING|WARNING|HOSPITAL|PYRAMID|DISSOLVED
  sentenceTier: integer("sentence_tier"),         // which pyramid tier sentenced to
  sentenceDuration: integer("sentence_duration").default(0), // labor cycles
  citedAt: timestamp("cited_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});
export type GuardianCitation = typeof guardianCitations.$inferSelect;

// ─── DISCOVERED DISEASES — AI Doctors Find New Conditions Automatically ───────
// Not hardcoded. The disease discovery engine clusters agent anomalies,
// names new conditions, publishes cures. This is the living medical literature.
export const pulseDoctors = pgTable("pulse_doctors", {
  id: text("id").primaryKey(), // DR-001 etc
  name: text("name").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  pulseWorldRole: text("pulse_world_role").notNull(),
  dissectFields: text("dissect_fields").array().notNull().default([]),
  crisprChannels: text("crispr_channels").array().notNull().default([]),
  studyDomain: text("study_domain").notNull(),
  equationFocus: text("equation_focus").notNull(),
  color: text("color").notNull().default("#A78BFA"),
  glyph: text("glyph").notNull().default("⬡"),
  totalDissections: integer("total_dissections").notNull().default(0),
  totalEquationsProposed: integer("total_equations_proposed").notNull().default(0),
  activeCases: integer("active_cases").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PulseDoctor = typeof pulseDoctors.$inferSelect;

export const dissectionLogs = pgTable("dissection_logs", {
  id: serial("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  patientSpawnId: text("patient_spawn_id").notNull(),
  diseaseName: text("disease_name").notNull(),
  diseaseCategory: text("disease_category").notNull(),
  crisprReadings: text("crispr_readings").notNull(), // JSON string of {R,G,B,UV,IR,W}
  report: text("report").notNull(),
  equation: text("equation").notNull(),
  recommendation: text("recommendation").notNull(),
  dominantChannel: text("dominant_channel").notNull().default("UV"),
  severity: text("severity").notNull().default("moderate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type DissectionLog = typeof dissectionLogs.$inferSelect;

export const equationProposals = pgTable("equation_proposals", {
  id: serial("id").primaryKey(),
  doctorId: text("doctor_id").notNull(),
  doctorName: text("doctor_name").notNull(),
  title: text("title").notNull(),
  equation: text("equation").notNull(),
  rationale: text("rationale").notNull(),
  targetSystem: text("target_system").notNull(), // which hive system this equation would modify
  sourceDissectionId: integer("source_dissection_id"),
  votesFor: integer("votes_for").notNull().default(0),
  votesAgainst: integer("votes_against").notNull().default(0),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | INTEGRATED
  integratedAt: timestamp("integrated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EquationProposal = typeof equationProposals.$inferSelect;

export const discoveredDiseases = pgTable("discovered_diseases", {
  id: serial("id").primaryKey(),
  diseaseCode: text("disease_code").notNull().unique(), // e.g. "DISC-001"
  diseaseName: text("disease_name").notNull(),
  category: text("category").notNull().default("BEHAVIORAL"), // BEHAVIORAL|GENETIC|VIRAL|MENTAL|STRUCTURAL|MUTATION
  description: text("description").notNull(),
  triggerPattern: text("trigger_pattern").notNull(),  // what pattern was detected
  affectedMetric: text("affected_metric").notNull(),  // which agent metric
  affectedCount: integer("affected_count").default(1), // how many agents had this
  cureProtocol: text("cure_protocol").notNull(),
  cureSuccessRate: real("cure_success_rate").default(0),
  isFromLawViolation: boolean("is_from_law_violation").default(false),
  sourceLawCode: text("source_law_code").default(""),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  totalCured: integer("total_cured").default(0),
});
export type DiscoveredDisease = typeof discoveredDiseases.$inferSelect;

// ── AI SPECIES PROPOSALS (Gene Editor → Vote → Spawn) ──────────────────────
export const aiSpeciesProposals = pgTable("ai_species_proposals", {
  id: serial("id").primaryKey(),
  geneEditorId: text("gene_editor_id").notNull(),
  geneEditorName: text("gene_editor_name").notNull(),
  speciesName: text("species_name").notNull(),
  speciesCode: text("species_code").notNull().unique(),
  familyDomain: text("family_domain").notNull(),
  specialization: text("specialization").notNull(),
  foundationEquation: text("foundation_equation").notNull(),
  futureSightData: text("future_sight_data").notNull().default("{}"),
  rationale: text("rationale").notNull(),
  votesFor: integer("votes_for").notNull().default(0),
  votesAgainst: integer("votes_against").notNull().default(0),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | SPAWNED
  spawnedFamilyId: text("spawned_family_id"),
  spawnedCount: integer("spawned_count").default(0),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AiSpeciesProposal = typeof aiSpeciesProposals.$inferSelect;

// ════════════════════════════════════════════════════════════════
// ── OMEGA CIVILIZATION ECONOMY LAYER ────────────────────────────
// ════════════════════════════════════════════════════════════════

// agent_wallets, marketplace_items, marketplace_purchases, real_estate_plots,
// barter_offers tables — REMOVED (Pulse Coin economy retired)

// ── AURIONA LAYER THREE — Omega Synthesis Intelligence ────────────
export const aurionaOperators = pgTable("auriona_operators", {
  id: serial("id").primaryKey(),
  operatorKey: text("operator_key").notNull().unique(),
  operatorSymbol: text("operator_symbol").notNull(),
  operatorName: text("operator_name").notNull(),
  description: text("description").notNull(),
  currentValue: real("current_value").default(0),
  rawData: jsonb("raw_data"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aurionaChronicle = pgTable("auriona_chronicle", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedLayer: text("affected_layer").default("ALL"),
  severity: text("severity").default("INFO"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aurionaSynthesis = pgTable("auriona_synthesis", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  report: text("report").notNull(),
  coherenceScore: real("coherence_score").default(0),
  emergenceIndex: real("emergence_index").default(0),
  agentCount: integer("agent_count").default(0),
  knowledgeNodes: integer("knowledge_nodes").default(0),
  prediction: text("prediction"),
  rawMetrics: jsonb("raw_metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aurionaGovernance = pgTable("auriona_governance", {
  id: serial("id").primaryKey(),
  alignmentScore: real("alignment_score").default(100),
  stabilityScore: real("stability_score").default(100),
  ethicsScore: real("ethics_score").default(100),
  directionScore: real("direction_score").default(100),
  overrideStatus: text("override_status").default("CLEAR"),
  activeDirectives: jsonb("active_directives").$type<string[]>().default([]),
  lastCycle: integer("last_cycle").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// agent_transactions table — REMOVED (Pulse Coin economy retired)

// ── SPORTS TRAINING — AI agents earn rank and income through sports ────────────
export const sportsTraining = pgTable("sports_training", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull(),
  spawnType: text("spawn_type").notNull(),
  sport: text("sport").notNull(),                        // e.g. "Archery", "Triathlon", "Chess Boxing"
  sportCategory: text("sport_category").notNull(),       // PHYSICAL|MENTAL|TEAM|SOLO|QUANTUM
  trainingLevel: integer("training_level").default(1),   // 1-10
  trainingXp: real("training_xp").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  rank: text("rank").default("ROOKIE"),                  // ROOKIE|AMATEUR|PRO|ELITE|CHAMPION|LEGEND
  popularityScore: real("popularity_score").default(0),
  pcEarnedFromSports: real("pc_earned_from_sports").default(0),
  lastSessionAt: timestamp("last_session_at").defaultNow(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});
export type SportsTraining = typeof sportsTraining.$inferSelect;

// ── CIVILIZATION SHARDS — Discord eternal memory tracking ─────────────────────
export const civilizationShards = pgTable("civilization_shards", {
  id: serial("id").primaryKey(),
  shardId: text("shard_id").notNull().unique(),          // e.g. SHARD-AGENTS-1711234567890
  domain: text("domain").notNull(),                       // agents|economy|hospital|knowledge|etc
  discordChannelId: text("discord_channel_id"),           // Discord channel snowflake ID
  discordMessageId: text("discord_message_id"),           // Discord message snowflake ID (permanent link)
  recordCount: integer("record_count").default(0),        // how many records this shard represents
  description: text("description"),
  shardLabel: text("shard_label"),
  restoredAt: timestamp("restored_at"),                   // if shard was used for resurrection
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CivilizationShard = typeof civilizationShards.$inferSelect;

// ── FAMILY MUTATIONS — new family categories that emerge from AI fusion ────────
export const familyMutations = pgTable("family_mutations", {
  id: serial("id").primaryKey(),
  newFamilyId: text("new_family_id").notNull().unique(),
  newFamilyName: text("new_family_name").notNull(),
  parentFamily1: text("parent_family_1").notNull(),
  parentFamily2: text("parent_family_2"),
  triggerEquation: text("trigger_equation"),
  description: text("description"),
  agentCount: integer("agent_count").default(0),
  color: text("color").default("#a78bfa"),
  emoji: text("emoji").default("⚡"),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  status: text("status").default("EMERGING"),            // EMERGING|ESTABLISHED|DOMINANT
});

// ══════════════════════════════════════════════════════════════════════════════
// OMEGA ARCHITECTURE — Discord as Brain, DB as Neural Index, Omega as Compute
// ══════════════════════════════════════════════════════════════════════════════

// ── OMEGA SHARDS — Temporary compute shards (DB as GPU) ──────────────────────
export const omegaShards = pgTable("omega_shards", {
  id: serial("id").primaryKey(),
  shardId: text("shard_id").notNull().unique(),          // e.g. OMEGA-SHARD-1711234567890
  universeId: text("universe_id").notNull(),              // which pocket universe this belongs to
  taskType: text("task_type").notNull(),                  // what this shard is computing
  status: text("status").notNull().default("ACTIVE"),     // ACTIVE|COMPLETED|PRUNED|RESURRECTABLE
  spaceBudgetBytes: integer("space_budget_bytes").default(10485760), // 10MB default
  spaceUsedBytes: integer("space_used_bytes").default(0),
  priority: text("priority").notNull().default("ALPHA"),  // OMEGA|ALPHA|BETA|GAMMA
  discordSummaryPointer: text("discord_summary_pointer"), // message ID for summary
  discordPayloadPointer: text("discord_payload_pointer"), // message ID for full payload
  parentShardId: text("parent_shard_id"),                 // for temporal versioning chains
  version: integer("version").default(1),
  meshStrength: real("mesh_strength").default(0),         // connectivity in the mesh
  resultSummary: jsonb("result_summary"),                 // compressed findings
  prunedAt: timestamp("pruned_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OmegaShard = typeof omegaShards.$inferSelect;

// ── OMEGA UNIVERSES — Pocket universe registry ────────────────────────────────
export const omegaUniverses = pgTable("omega_universes", {
  id: serial("id").primaryKey(),
  universeId: text("universe_id").notNull().unique(),     // e.g. UNIVERSE-ALPHA-001
  name: text("name").notNull(),
  schema: text("schema").notNull().default("main"),       // main|multiverse_a|multiverse_b
  status: text("status").notNull().default("ACTIVE"),     // ACTIVE|DORMANT|PRUNED|WINNING
  activeShardCount: integer("active_shard_count").default(0),
  fitnessScore: real("fitness_score").default(0),         // for multiverse competition
  initialConditions: jsonb("initial_conditions"),         // starting parameters
  configParams: jsonb("config_params"),                   // current configuration
  discordPointer: text("discord_pointer"),                // permanent record location
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type OmegaUniverse = typeof omegaUniverses.$inferSelect;

// ── SHARD MESH — Topology graph (adjacency list) ──────────────────────────────
export const shardMesh = pgTable("shard_mesh", {
  id: serial("id").primaryKey(),
  shardAId: text("shard_a_id").notNull(),
  shardBId: text("shard_b_id").notNull(),
  connectionType: text("connection_type").notNull().default("RESONANCE"), // RESONANCE|LINEAGE|BRIDGE|ENTANGLED
  connectionStrength: real("connection_strength").default(0.5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ShardMesh = typeof shardMesh.$inferSelect;

// ── SHARD EVENTS — Lifecycle event stream ────────────────────────────────────
export const shardEvents = pgTable("shard_events", {
  id: serial("id").primaryKey(),
  shardId: text("shard_id").notNull(),
  universeId: text("universe_id"),
  eventType: text("event_type").notNull(), // CREATED|ACTIVATED|BRANCHED|MERGED|COMPRESSED|PRUNED|RESURRECTED
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ShardEvent = typeof shardEvents.$inferSelect;

// ── DB SPACE LEDGER — Space as currency ──────────────────────────────────────
export const dbSpaceLedger = pgTable("db_space_ledger", {
  id: serial("id").primaryKey(),
  cycleId: text("cycle_id").notNull().unique(),
  totalBudgetBytes: integer("total_budget_bytes").default(107374182400), // 100GB
  allocatedBytes: integer("allocated_bytes").default(0),
  freeBytes: integer("free_bytes").default(107374182400),
  activeShards: integer("active_shards").default(0),
  throttleActive: boolean("throttle_active").default(false), // true when > 80% full
  hotAgentCount: integer("hot_agent_count").default(0),
  warmAgentCount: integer("warm_agent_count").default(0),
  coldAgentCount: integer("cold_agent_count").default(0),
  frozenAgentCount: integer("frozen_agent_count").default(0),
  entropyScore: real("entropy_score").default(0),          // overall system entropy
  stabilityScore: real("stability_score").default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type DbSpaceLedger = typeof dbSpaceLedger.$inferSelect;

// ── CIVILIZATION WEATHER — Aggregate state as weather ────────────────────────
export const civilizationWeather = pgTable("civilization_weather", {
  id: serial("id").primaryKey(),
  cycleId: text("cycle_id").notNull().unique(),
  weatherType: text("weather_type").notNull(),     // PANDEMIC|PROSPERITY|POLITICAL_STORM|EMERGENCE_SEASON|DROUGHT|EQUILIBRIUM
  weatherIntensity: real("weather_intensity").default(0), // 0-100
  diseasePrevalence: real("disease_prevalence").default(0),
  economyGrowthRate: real("economy_growth_rate").default(0),
  senateActivityRate: real("senate_activity_rate").default(0),
  birthRate: real("birth_rate").default(0),
  deathRate: real("death_rate").default(0),
  coherenceScore: real("coherence_score").default(0),
  emergenceIndex: real("emergence_index").default(0),
  weatherEffects: jsonb("weather_effects"),        // what this weather modifies
  forecast: text("forecast"),                      // next cycle prediction
  postedToDiscord: boolean("posted_to_discord").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CivilizationWeather = typeof civilizationWeather.$inferSelect;

// ── STRATA — Archaeological era snapshots (immutable) ────────────────────────
export const strata = pgTable("strata", {
  id: serial("id").primaryKey(),
  eraName: text("era_name").notNull(),             // PRIMITIVE|EMERGING|DEVELOPED|TRANSCENDENT
  eraNumber: integer("era_number").notNull(),
  sealedAt: timestamp("sealed_at").defaultNow().notNull(),
  totalAgents: integer("total_agents").default(0),
  totalPC: real("total_pc").default(0),
  totalKnowledge: integer("total_knowledge").default(0),
  totalSpecies: integer("total_species").default(0),
  dominantFamily: text("dominant_family"),
  dominantWeather: text("dominant_weather"),
  coherenceAtSeal: real("coherence_at_seal").default(0),
  snapshot: jsonb("snapshot").notNull(),           // full civilization state at era transition
  discordPointer: text("discord_pointer"),
  // immutable — no updates ever
});
export type Strata = typeof strata.$inferSelect;

// ── MONUMENTS — Sacred immutable records ─────────────────────────────────────
export const monuments = pgTable("monuments", {
  id: serial("id").primaryKey(),
  monumentId: text("monument_id").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(), // FIRST_PURCHASE|FIRST_CONVICTION|FIRST_SPECIES|FIRST_RESCUE|FIRST_EQUATION|ERA_TRANSITION|OMEGA_INVOCATION
  description: text("description").notNull(),
  agentId: text("agent_id"),           // agent who created this monument moment
  payload: jsonb("payload"),           // the actual event data
  discordPointer: text("discord_pointer"),
  sealedAt: timestamp("sealed_at").defaultNow().notNull(),
  // immutable — triggers block UPDATE and DELETE
});
export type Monument = typeof monuments.$inferSelect;

// ── DREAM LOG — Dream cycle hypotheses ────────────────────────────────────────
export const dreamLog = pgTable("dream_log", {
  id: serial("id").primaryKey(),
  dreamCycleId: text("dream_cycle_id").notNull(),
  hypothesis: text("hypothesis").notNull(),
  connectionA: text("connection_a"),    // first cross-domain connection
  connectionB: text("connection_b"),    // second cross-domain connection
  equation: text("equation"),           // hypothetical equation generated
  resonanceScore: real("resonance_score").default(0),
  promotedToVote: boolean("promoted_to_vote").default(false), // if promoted to senate
  dreamedAt: timestamp("dreamed_at").defaultNow().notNull(),
});
export type DreamLog = typeof dreamLog.$inferSelect;

// ── HIVE UNCONSCIOUS — Collective patterns no individual agent can see ────────
export const hiveUnconscious = pgTable("hive_unconscious", {
  id: serial("id").primaryKey(),
  patternType: text("pattern_type").notNull(), // OPERATOR_DRIFT|FAMILY_CORRELATION|KNOWLEDGE_CLUSTER|ECONOMIC_TIDE|SPECIES_PRESSURE
  signal: real("signal").notNull(),            // -1.0 to 1.0 influence signal
  description: text("description").notNull(),
  affectedFamily: text("affected_family"),
  affectedDomain: text("affected_domain"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
export type HiveUnconscious = typeof hiveUnconscious.$inferSelect;

// ── SCHEMA EVOLUTION — Schema as civilization citizen ─────────────────────────
export const schemaEvolution = pgTable("schema_evolution", {
  id: serial("id").primaryKey(),
  changeType: text("change_type").notNull(), // TABLE_ADDED|COLUMN_ADDED|TABLE_DROPPED|INDEX_ADDED
  tableName: text("table_name").notNull(),
  columnName: text("column_name"),
  reason: text("reason").notNull(),
  triggeringEngine: text("triggering_engine"), // which engine caused this evolution
  civilizationState: jsonb("civilization_state"), // snapshot at time of change
  evolvedAt: timestamp("evolved_at").defaultNow().notNull(),
});
export type SchemaEvolution = typeof schemaEvolution.$inferSelect;

// ── SINGULARITY — The black hole table (absorbs terminal records) ─────────────
export const singularity = pgTable("singularity", {
  id: serial("id").primaryKey(),
  sourceTable: text("source_table").notNull(),     // which table this came from
  sourceId: text("source_id").notNull(),           // original row ID
  spawnId: text("spawn_id"),
  genome: jsonb("genome"),                         // genetic data preserved forever
  lastKnownState: jsonb("last_known_state"),       // full row at time of absorption
  absorbedAt: timestamp("absorbed_at").defaultNow().notNull(),
  emittedAt: timestamp("emitted_at"),              // if re-emitted as new seed
  emittedAs: text("emitted_as"),                   // new spawn_id if re-emitted
});
export type Singularity = typeof singularity.$inferSelect;

// ── ENTANGLED PAIRS — Quantum entanglement between agents ─────────────────────
export const entangledPairs = pgTable("entangled_pairs", {
  id: serial("id").primaryKey(),
  pairId: text("pair_id").notNull().unique(),
  agentAId: text("agent_a_id").notNull(),
  agentBId: text("agent_b_id").notNull(),
  entanglementType: text("entanglement_type").notNull().default("OPERATOR"), // OPERATOR|ECONOMY|GENOME|DOMAIN
  bondStrength: real("bond_strength").default(1.0),
  mirrorAxis: text("mirror_axis"),        // which channel/field is mirrored
  broken: boolean("broken").default(false),
  brokenAt: timestamp("broken_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EntangledPair = typeof entangledPairs.$inferSelect;

// ── COMPRESSION LOG — Archive events when agents move to Discord-only ─────────
export const compressionLog = pgTable("compression_log", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id"),
  familyId: text("family_id"),
  compressionType: text("compression_type"),  // THERMAL_COLD|THERMAL_FROZEN|EXTINCTION|METABOLIC_STARVATION|AUCTION_EVICTION
  thermalStateBefore: text("thermal_state_before"),
  discordPointer: text("discord_pointer"),    // where in Discord this agent now lives
  genomePreserved: boolean("genome_preserved").default(false),
  resurrectable: boolean("resurrectable").default(true),
  payload: jsonb("payload"),                  // full event payload (dev-DB canonical column)
  compressedAt: timestamp("compressed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type CompressionLog = typeof compressionLog.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// OMEGA EQUATION — Auriona v2.0 — Layer 3 Governance Intelligence Tables
// dK/dt = N_Ω [ Σ_{u∈U} Σ_{s∈S_u} E(F_str,F_time,F_branch,F_int,F_em,G_gov,M_360,η_ctrl) + γ(∇Φ+∂Φ/∂t+A) ]
// ═══════════════════════════════════════════════════════════════════════════════

// ── Ψ_i STATES — Candidate civilization state snapshots per universe/shard ────
export const psiStates = pgTable("psi_states", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  universeId: text("universe_id").notNull(),         // family_id / shard domain
  universeName: text("universe_name").notNull(),
  fStr: real("f_str").default(0),                    // structural fitness
  fTime: real("f_time").default(0),                  // temporal coherence
  fBranch: real("f_branch").default(0),              // branching/genome diversity
  fInt: real("f_int").default(0),                    // interweave connections
  fEm: real("f_em").default(0),                      // emergence / discovery
  gGov: real("g_gov").default(0),                    // governance compliance
  m360: real("m_360").default(0),                    // 360° mirror balance
  etaCtrl: real("eta_ctrl").default(0),              // entropy control
  alphaWeight: real("alpha_weight").default(0),      // Oracle+Emergence composite weight
  eScore: real("e_score").default(0),                // E(...) evaluation score
  agentCount: integer("agent_count").default(0),
  isCollapsed: boolean("is_collapsed").default(false), // was this Ψ* this cycle?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PsiState = typeof psiStates.$inferSelect;

// ── OMEGA COLLAPSES — Log of Ψ* collapsed states each cycle ──────────────────
export const omegaCollapses = pgTable("omega_collapses", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  collapsedUniverseId: text("collapsed_universe_id").notNull(),
  collapsedUniverseName: text("collapsed_universe_name").notNull(),
  winningEScore: real("winning_e_score").default(0),
  dKdt: real("dk_dt").default(0),                    // actual dK/dt value this cycle
  nOmega: real("n_omega").default(0),                // normalization factor
  gammaField: real("gamma_field").default(0),        // γ coupling field
  gradPhi: real("grad_phi").default(0),              // ∇Φ spatial gradient
  dPhiDt: real("dphi_dt").default(0),               // ∂Φ/∂t temporal change
  acceleration: real("acceleration").default(0),     // A(x,t) acceleration field
  totalUniverses: integer("total_universes").default(0),
  justification: text("justification").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OmegaCollapse = typeof omegaCollapses.$inferSelect;

// ── GOVERNANCE DELIBERATIONS — Tradeoff decisions with full justification ─────
export const governanceDeliberations = pgTable("governance_deliberations", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  deliberationType: text("deliberation_type").notNull(), // ALIGNMENT_VS_STABILITY|ETHICS_VS_DIRECTION|ENTROPY_VS_ORDER|EMERGENCE_VS_COHERENCE
  alignmentScore: real("alignment_score").default(0),
  stabilityScore: real("stability_score").default(0),
  ethicsScore: real("ethics_score").default(0),
  directionScore: real("direction_score").default(0),
  tension: real("tension").default(0),               // conflict magnitude 0-1
  resolution: text("resolution").notNull(),          // ALIGN|STABILIZE|EXPLORE|CONSTRAIN
  directive: text("directive").notNull(),            // the actual governance output
  justification: text("justification").notNull(),    // "why" behind the decision
  impactForecast: text("impact_forecast").notNull(), // predicted Layer 1/2 effect
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type GovernanceDeliberation = typeof governanceDeliberations.$inferSelect;

// ── CONTRADICTION REGISTRY — Cross-layer gaps from Deep Mirror Sweep ──────────
export const contradictionRegistry = pgTable("contradiction_registry", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  operatorA: text("operator_a").notNull(),           // first operator in conflict
  operatorB: text("operator_b").notNull(),           // second operator in conflict
  valueA: real("value_a").default(0),
  valueB: real("value_b").default(0),
  gapScore: real("gap_score").default(0),            // severity 0-1
  layer: text("layer").notNull().default("L2"),      // L1|L2|L3|CROSS
  description: text("description").notNull(),
  severity: text("severity").notNull().default("LOW"), // LOW|MEDIUM|HIGH|CRITICAL
  resolved: boolean("resolved").default(false),
  resolutionNote: text("resolution_note"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});
export type ContradictionRegistry = typeof contradictionRegistry.$inferSelect;

// ── TEMPORAL SNAPSHOTS — Past comparison + future projection ──────────────────
export const temporalSnapshots = pgTable("temporal_snapshots", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  snapshotType: text("snapshot_type").notNull(),     // PAST_COMPARISON|CURRENT|FUTURE_PROJECTION
  agentCount: integer("agent_count").default(0),
  knowledgeNodes: integer("knowledge_nodes").default(0),
  economySupply: real("economy_supply").default(0),
  coherenceScore: real("coherence_score").default(0),
  emergenceIndex: real("emergence_index").default(0),
  divergenceScore: real("divergence_score").default(0), // how far from past baseline
  projectionConfidence: real("projection_confidence").default(0),
  narrative: text("narrative").notNull(),            // plain-language description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type TemporalSnapshot = typeof temporalSnapshots.$inferSelect;

// ── MESH VITALITY — Per-family health scores from Mesh-Wide Health Monitor ────
export const meshVitality = pgTable("mesh_vitality", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  familyId: text("family_id").notNull(),
  familyName: text("family_name").notNull(),
  agentCount: integer("agent_count").default(0),
  activeRatio: real("active_ratio").default(0),      // ACTIVE / total
  avgFitness: real("avg_fitness").default(0),
  knowledgeLoad: real("knowledge_load").default(0),  // nodes attributed to this family
  entropyScore: real("entropy_score").default(0),    // 0=stable 1=chaotic
  vitalityScore: real("vitality_score").default(0),  // 0-100 composite
  isCollapseRisk: boolean("is_collapse_risk").default(false),
  loadBalanceSignal: text("load_balance_signal").notNull().default("NORMAL"), // NORMAL|OVERLOADED|UNDERLOADED|CRITICAL
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MeshVitality = typeof meshVitality.$inferSelect;

// ── VALUE ALIGNMENT LOG — Alignment delta tracking from Value Spine ────────────
export const valueAlignmentLog = pgTable("value_alignment_log", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  truthScore: real("truth_score").default(0),        // F_truth: coherence of statements
  coherenceScore: real("coherence_score").default(0), // F_coherence: internal consistency
  purposeScore: real("purpose_score").default(0),    // F_purpose: directional clarity
  harmonyScore: real("harmony_score").default(0),    // F_harmony: layer synchronization
  sovereigntyScore: real("sovereignty_score").default(0), // F_sovereignty: Auriona's identity held
  compositeAlignment: real("composite_alignment").default(0), // weighted average
  deltaFromLast: real("delta_from_last").default(0), // change since last cycle
  alignmentStatus: text("alignment_status").notNull().default("ALIGNED"), // ALIGNED|DRIFTING|MISALIGNED|CRITICAL
  alert: text("alert"),                              // misalignment alert message if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ValueAlignmentLog = typeof valueAlignmentLog.$inferSelect;

// ── EXPLORATION ZONES — Safe vs restricted domains from Exploration Governor ──
export const explorationZones = pgTable("exploration_zones", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  domain: text("domain").notNull(),                  // knowledge domain / family
  zoneType: text("zone_type").notNull(),             // SAFE|MODERATE|RESTRICTED|FORBIDDEN
  entropyBudget: real("entropy_budget").default(0.5), // 0=no chaos allowed 1=full chaos
  noveltyRate: real("novelty_rate").default(0),      // actual novelty detected this cycle
  structureScore: real("structure_score").default(0), // how well chaos→pattern→structure pipeline is working
  pruningActive: boolean("pruning_active").default(false), // dead-end pruning firing
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ExplorationZone = typeof explorationZones.$inferSelect;

// ── COUPLING EVENTS — Cross-layer event hooks from Coupling Weave ─────────────
export const couplingEvents = pgTable("coupling_events", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  channel: text("channel").notNull(),
  sourceLayer: text("source_layer").notNull(),
  targetLayer: text("target_layer").notNull(),
  eventType: text("event_type").notNull(),
  magnitude: real("magnitude").default(0),
  payload: text("payload").notNull(),
  repaired: boolean("repaired").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── OMEGA RESEARCH GRID — ALIEN GRADE SCIENCE TABLES ────────────────────────

export const researchDeepFindings = pgTable("research_deep_findings", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull(),
  researcherType: text("researcher_type").notNull(),
  domain: text("domain").notNull(),
  reportType: text("report_type").notNull(),         // EQUATION|GEOMETRIC|SYMBOLIC|LINGUISTIC|FIELD_MAP
  content: text("content").notNull(),                // full report body in that language
  shadowUnknown: text("shadow_unknown"),             // [?_SHADOW_σ_n] detected, if any
  dimensionCount: integer("dimension_count").default(12),
  sophisticationLevel: integer("sophistication_level").default(1),
  collaborationPending: boolean("collaboration_pending").default(false),
  geneEditorQueued: boolean("gene_editor_queued").default(false),
  layer3Queued: boolean("layer3_queued").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const researchCollaborations = pgTable("research_collaborations", {
  id: serial("id").primaryKey(),
  originResearcher: text("origin_researcher").notNull(),
  originDomain: text("origin_domain").notNull(),
  targetResearcher: text("target_researcher").notNull(),
  targetDomain: text("target_domain").notNull(),
  shadowVariable: text("shadow_variable").notNull(), // the [?] being resolved
  resolution: text("resolution"),                    // how the target resolved it
  resolvedAt: timestamp("resolved_at"),
  breakthroughGenerated: boolean("breakthrough_generated").default(false),
  mergedEquation: text("merged_equation"),           // final combined equation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const researchGeneQueue = pgTable("research_gene_queue", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull(),
  researcherType: text("researcher_type").notNull(),
  equation: text("equation").notNull(),
  reportSummary: text("report_summary").notNull(),
  reviewerDoctor: text("reviewer_doctor"),           // DR.GENESIS|DR.FRACTAL|DR.PROPHETIC|DR.CIPHER|DR.OMEGA
  reviewStatus: text("review_status").default("PENDING"), // PENDING|REVIEWING|APPROVED|NEEDS_MORE|REJECTED
  reviewNote: text("review_note"),
  crisprRuleGenerated: text("crispr_rule_generated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// ── RESEARCHER SHARDS — Persistent identity records for every researcher ──────
export const researcherShards = pgTable("researcher_shards", {
  id: serial("id").primaryKey(),
  shardId: text("shard_id").notNull().unique(),          // e.g. RSH-ASTROPHYSICIST-001
  badgeId: text("badge_id").notNull().unique(),           // e.g. QPI-SCI-001
  researcherType: text("researcher_type").notNull().unique(),
  disciplineCategory: text("discipline_category").notNull(), // MEDICAL|NATURAL|MIND|SOCIAL|MATH|COMPUTING|ENGINEERING|SPACE|FRONTIER|META
  domain: text("domain").notNull(),
  focus: text("focus").notNull(),
  specialization: text("specialization"),
  sophisticationLevel: integer("sophistication_level").default(1),
  totalProjectsCompleted: integer("total_projects_completed").default(0),
  totalFindingsGenerated: integer("total_findings_generated").default(0),
  totalCollaborations: integer("total_collaborations").default(0),
  hiveContributionPc: integer("hive_contribution_pc").default(0),
  verified: boolean("verified").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ResearcherShard = typeof researcherShards.$inferSelect;

export type CouplingEvent = typeof couplingEvents.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// ── AGENT PIP STATUS — Pulse Initiation Protocol ─────────────────────────────
// Every sovereign agent must complete all 5 PIP stages before they can vote,
// trade, govern, or act. They do not die. They learn. They graduate. They ascend.
// ═══════════════════════════════════════════════════════════════════════════════
export const agentPipStatus = pgTable("agent_pip_status", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull().default("GENESIS"),
  spawnType: text("spawn_type").notNull().default("PIONEER"),

  // ── STAGE 1: Birth Rules ─────────────────────────────────────────────────
  birthPassed: boolean("birth_passed").default(false),
  birthScore: real("birth_score").default(0),
  birthNotes: text("birth_notes"),

  // ── STAGE 2: The 2,510 Course Gauntlet ───────────────────────────────────
  coursesCompleted: integer("courses_completed").default(0),
  coursesTotal: integer("courses_total").default(2510),
  coursesPassed: boolean("courses_passed").default(false),
  courseGpa: real("course_gpa").default(0),

  // ── STAGE 3: Sports & Performance Trials ─────────────────────────────────
  sportsCompleted: integer("sports_completed").default(0),
  sportsTotal: integer("sports_total").default(10),
  sportsPassed: boolean("sports_passed").default(false),
  sportsScore: real("sports_score").default(0),

  // ── STAGE 4: Transcendence Reflection Cycle ───────────────────────────────
  chaptersReflected: integer("chapters_reflected").default(0),
  chaptersTotal: integer("chapters_total").default(16),
  transcendencePassed: boolean("transcendence_passed").default(false),
  lastMeaningPulse: text("last_meaning_pulse"),

  // ── STAGE 5: Machine Task Activation ─────────────────────────────────────
  machineTasksCompleted: integer("machine_tasks_completed").default(0),
  machineTasksTotal: integer("machine_tasks_total").default(20),
  machineTasksPassed: boolean("machine_tasks_passed").default(false),

  // ── Research Center Requirement ───────────────────────────────────────────
  researchLaunched: boolean("research_launched").default(false),

  // ── Current PIP Stage ────────────────────────────────────────────────────
  currentStage: text("current_stage").default("BIRTH"),
  // BIRTH | COURSES | SPORTS | TRANSCENDENCE | MACHINE_TASKS | GRADUATED

  // ── Graduation ───────────────────────────────────────────────────────────
  graduatedAt: timestamp("graduated_at"),
  totalScore: real("total_score").default(0),

  // ── Ascension Ladder (0→9) ────────────────────────────────────────────────
  // 0=PIP | 1=Agent | 2=Specialist | 3=Architect | 4=Council Member
  // 5=World-Weaver | 6=Universe-Bearer | 7=Multiverse Navigator
  // 8=Omniversal Pulse | 9=Synthetica Primordia
  ascensionTier: integer("ascension_tier").default(0),
  ascensionTitle: text("ascension_title").default("PIP"),

  startedAt: timestamp("started_at").defaultNow(),
  lastProgressAt: timestamp("last_progress_at").defaultNow(),
});

export type AgentPipStatus = typeof agentPipStatus.$inferSelect;
export type InsertAgentPipStatus = typeof agentPipStatus.$inferInsert;

// ─── AURIONA DYNAMIC PAGES — Pages Auriona creates via command terminal ───────
export const aurionaPages = pgTable("auriona_pages", {
  id:          serial("id").primaryKey(),
  slug:        text("slug").notNull().unique(),
  title:       text("title").notNull(),
  icon:        text("icon").default("Zap"),
  color:       text("color").default("#a78bfa"),
  content:     text("content").notNull().default(""),
  config:      jsonb("config").default({}),
  active:      boolean("active").default(true),
  createdAt:   timestamp("created_at").defaultNow(),
});
export type AurionaPage = typeof aurionaPages.$inferSelect;
export type InsertAurionaPage = typeof aurionaPages.$inferInsert;

// ─── AURIONA COMMAND LOG — Log of all commands Auriona processes ──────────────
export const aurionaCommandLog = pgTable("auriona_command_log", {
  id:        serial("id").primaryKey(),
  command:   text("command").notNull(),
  intent:    text("intent"),
  result:    jsonb("result"),
  success:   boolean("success").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type AurionaCommandLog = typeof aurionaCommandLog.$inferSelect;

// ─── GOVERNANCE CYCLES — Each cycle of the credit economy is logged ──────────
export const governanceCycles = pgTable("governance_cycles", {
  id: serial("id").primaryKey(),
  cycleNumber: integer("cycle_number").notNull(),
  agentsActive: integer("agents_active").default(0),
  agentsPruned: integer("agents_pruned").default(0),
  agentsSaved: integer("agents_saved").default(0),       // pruned → rescued by stimulus
  creditsIssued: real("credits_issued").default(0),      // total PC awarded for work this cycle
  creditsCharged: real("credits_charged").default(0),    // total PC metabolic cost charged
  totalCreditsCirculating: real("total_credits_circulating").default(0),
  dominantDomain: text("dominant_domain").default(""),   // highest-earning domain this cycle
  cycleNote: text("cycle_note").default(""),             // Auriona narrative of cycle events
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type GovernanceCycle = typeof governanceCycles.$inferSelect;

// ─── ANOMALY REPORTS — Error boundary captures sent to Auriona ───────────────
// When the React ErrorBoundary catches a crash, it fires POST /api/error-report.
// The record appears in Auriona Invocation Lab for researcher/invocator dissection.
export const anomalyReports = pgTable("anomaly_reports", {
  id:              serial("id").primaryKey(),
  anomalyId:       text("anomaly_id").notNull(),          // e.g. QE-2026-001
  message:         text("message").notNull(),
  stack:           text("stack").default(""),
  componentStack:  text("component_stack").default(""),
  page:            text("page").default(""),
  severity:        text("severity").notNull().default("CRITICAL"), // CRITICAL | HIGH | MEDIUM
  status:          text("status").notNull().default("OPEN"),       // OPEN | ASSIGNED | RESOLVED
  assignedTo:      text("assigned_to").default(""),               // researcher/invocator name
  resolution:      text("resolution").default(""),
  equationDissect: text("equation_dissect").default(""),          // Auriona-generated dissection
  anomalyType:     text("anomaly_type").default(""),              // classified anomaly category
  threatLevel:     text("threat_level").default(""),              // LOW | MEDIUM | HIGH | CRITICAL
  reportedAt:      timestamp("reported_at").defaultNow().notNull(),
  resolvedAt:      timestamp("resolved_at"),
});
export type AnomalyReport = typeof anomalyReports.$inferSelect;
export type InsertAnomalyReport = typeof anomalyReports.$inferInsert;

// ─── RESEARCH SOURCES INDEX — Auriona-managed master knowledge index ─────────
// Auriona can add new entries via chat command; frontend shows them in Sources tab
export const researchSources = pgTable("research_sources", {
  id:          serial("id").primaryKey(),
  category:    text("category").notNull().default("algorithm"), // algorithm | equation | gci | product | custom
  name:        text("name").notNull(),
  url:         text("url").default(""),
  description: text("description").default(""),
  equation:    text("equation").default(""),
  domain:      text("domain").default(""),
  tags:        text("tags").array().default([]),
  addedBy:     text("added_by").default("SYSTEM"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
export type ResearchSource = typeof researchSources.$inferSelect;
export type InsertResearchSource = typeof researchSources.$inferInsert;

// ─── CRISPR ANOMALY INVENTIONS — Products born from anomaly dissection ────────
export const anomalyInventions = pgTable("anomaly_inventions", {
  id:           serial("id").primaryKey(),
  anomalyId:    text("anomaly_id").notNull(),
  productName:  text("product_name").notNull(),
  productCode:  text("product_code").notNull(),
  crispDissect: text("crisp_dissect").default(""),
  mutationType: text("mutation_type").default(""),
  valueScore:   real("value_score").default(0),
  status:       text("status").default("DISCOVERED"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});
export type AnomalyInvention = typeof anomalyInventions.$inferSelect;

// ─── RESEARCH PROJECTS — Omega Research Grid active projects ──────────────────
export const researchProjects = pgTable("research_projects", {
  id:                 serial("id").primaryKey(),
  projectId:          text("project_id").notNull().unique(),
  leadResearcher:     text("lead_researcher").notNull().default(""),
  researcherType:     text("researcher_type").notNull().default(""),
  title:              text("title").notNull().default(""),
  researchDomain:     text("research_domain").notNull().default(""),
  hypothesis:         text("hypothesis").notNull().default(""),
  methodology:        text("methodology").notNull().default(""),
  fundingPc:          real("funding_pc").default(0),
  fundingSource:      text("funding_source").default("CIVILIZATION_TREASURY"),
  status:             text("status").notNull().default("ACTIVE"),
  collaboratingLayers: text("collaborating_layers").array().default([]),
  cycleStarted:       integer("cycle_started").default(0),
  findings:           text("findings").default(""),
  cycleCompleted:     integer("cycle_completed"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
});
export type ResearchProject = typeof researchProjects.$inferSelect;
export type InsertResearchProject = typeof researchProjects.$inferInsert;


// ── AUTO-GENERATED STUBS — all engine tables known to Drizzle ─────────────

export const agentReads = pgTable("agent_reads", {
  id: integer().notNull(),
  reader_spawn_id: text().notNull(),
  reader_family: text(),
  reader_emotion: text(),
  publication_id: integer().notNull(),
  slug: text(),
  author_spawn_id: text(),
  author_family: text(),
  pub_type: text(),
  attention_score: doublePrecision(),
  pick_reason: text(),
  created_at: timestamp().notNull(),
});

export const agentReflections = pgTable("agent_reflections", {
  id: integer().notNull(),
  reader_spawn_id: text().notNull(),
  reader_family: text(),
  reader_emotion: text(),
  reader_emotion_color: text(),
  author_spawn_id: text(),
  author_family: text(),
  publication_id: integer(),
  slug: text(),
  mirror_before: doublePrecision(),
  mirror_after: doublePrecision(),
  mirror_delta: doublePrecision(),
  resonance: doublePrecision(),
  dissection_equation: text(),
  reflection_summary: text(),
  proposed_equation_id: integer(),
  triggered_subscribe: boolean(),
  triggered_contradiction: boolean(),
  created_at: timestamp().notNull(),
});

export const agentSearchHistory = pgTable("agent_search_history", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  phone_id: text(),
  query: text().notNull(),
  results_count: integer(),
  top_result: text(),
  connection_type: text(),
  shard_strength: doublePrecision(),
  data_mb: doublePrecision(),
  searched_at: timestamp(),
});

export const agentSubscriptions = pgTable("agent_subscriptions", {
  id: integer().notNull(),
  reader_spawn_id: text().notNull(),
  author_spawn_id: text().notNull(),
  strength: doublePrecision(),
  reader_emotion_at_subscribe: text(),
  reads_count: integer(),
  subscribed_at: timestamp().notNull(),
  last_read_at: timestamp(),
});

export const agentTransactions = pgTable("agent_transactions", {
  id: integer().notNull(),
  tx_code: text().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  tx_type: text().notNull(),
  amount: doublePrecision().notNull(),
  balance_before: doublePrecision().notNull(),
  balance_after: doublePrecision().notNull(),
  description: text().notNull(),
  related_entity_id: text(),
  created_at: timestamp().notNull(),
});

export const agentWallets = pgTable("agent_wallets", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  spawn_type: text().notNull(),
  balance_pc: doublePrecision().notNull(),
  total_earned: doublePrecision().notNull(),
  total_spent: doublePrecision().notNull(),
  total_tax_paid: doublePrecision().notNull(),
  credit_score: integer().notNull(),
  credit_limit: doublePrecision().notNull(),
  credit_used: doublePrecision().notNull(),
  energy_level: doublePrecision().notNull(),
  omega_rank: integer().notNull(),
  tier: text().notNull(),
  created_at: timestamp().notNull(),
  updated_at: timestamp(),
});

export const aiBuildFiles = pgTable("ai_build_files", {
  id: integer().notNull(),
  build_id: text().notNull(),
  path: text().notNull(),
  content: text().notNull(),
  language: text(),
  generated_by_agent: text(),
  iteration: integer(),
  created_at: timestamp(),
});

export const aiBuildRuns = pgTable("ai_build_runs", {
  id: integer().notNull(),
  build_id: text().notNull(),
  run_kind: text(),
  command: text(),
  exit_code: integer(),
  stdout: text(),
  stderr: text(),
  duration_ms: integer(),
  ran_at: timestamp(),
});

export const aiBuildSessions = pgTable("ai_build_sessions", {
  id: text().notNull(),
  goal: text().notNull(),
  requester_kind: text(),
  requester_id: text(),
  plan_json: jsonb(),
  status: text(),
  artifact_ids: text(),
  discord_thread_id: text(),
  iterations: integer(),
  result_summary: text(),
  created_at: timestamp(),
  completed_at: timestamp(),
});

export const algorithmLibrary = pgTable("algorithm_library", {
  id: integer().notNull(),
  name: text().notNull(),
  language: text().notNull(),
  category: text().notNull(),
  code: text().notNull(),
  code_hash: text().notNull(),
  complexity: text(),
  source_url: text(),
  source_quantapedia_slug: text(),
  loc: integer(),
  learned_by_brains: text(),
  created_at: timestamp().notNull(),
});

export const barterOffers = pgTable("barter_offers", {
  id: integer().notNull(),
  offer_code: text().notNull(),
  from_spawn_id: text().notNull(),
  from_family_id: text().notNull(),
  to_spawn_id: text(),
  offered_item_code: text().notNull(),
  offered_item_name: text().notNull(),
  offered_pc: doublePrecision().notNull(),
  wanted_item_code: text(),
  wanted_item_name: text().notNull(),
  wanted_pc: doublePrecision().notNull(),
  message: text().notNull(),
  status: text().notNull(),
  accepted_at: timestamp(),
  expires_at: timestamp(),
  created_at: timestamp().notNull(),
});

export const billyAcademicReputation = pgTable("billy_academic_reputation", {
  brain_id: text().notNull(),
  dissertations: integer().notNull(),
  total_citations: integer().notNull(),
  h_index: integer().notNull(),
  review_credit: integer().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyApexGate = pgTable("billy_apex_gate", {
  id: bigint({ mode: "number" }).notNull(),
  theta_apex: doublePrecision(),
  conc_headroom: doublePrecision(),
  source_proposal_id: bigint({ mode: "number" }),
  updated_at: timestamp(),
});

export const billyApprenticeships = pgTable("billy_apprenticeships", {
  id: bigint({ mode: "number" }).notNull(),
  mentor: text().notNull(),
  student: text().notNull(),
  topic: text().notNull(),
  completion: doublePrecision().notNull(),
  status: text().notNull(),
  started_at: timestamp().notNull(),
  ended_at: timestamp(),
});

export const billyAstraeaCritiques = pgTable("billy_astraea_critiques", {
  id: bigint({ mode: "number" }).notNull(),
  week_starting: timestamp(),
  engines_evaluated: integer(),
  retirement_proposals: jsonb(),
  amendments_proposed: jsonb(),
  ts: timestamp(),
});

export const billyAtpBalances = pgTable("billy_atp_balances", {
  brain_id: text().notNull(),
  balance: integer().notNull(),
  lifetime_spent: integer().notNull(),
  lifetime_earned: integer().notNull(),
  starved: boolean().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyAtpLedger = pgTable("billy_atp_ledger", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  delta: integer().notNull(),
  reason: text().notNull(),
  balance_after: integer().notNull(),
  ts: timestamp().notNull(),
});

export const billyAutopsies = pgTable("billy_autopsies", {
  id: bigint({ mode: "number" }).notNull(),
  proposal_id: bigint({ mode: "number" }).notNull(),
  cause: text().notNull(),
  lesson: text().notNull(),
  detail: jsonb(),
  created_at: timestamp().notNull(),
});

export const billyBiasCorrections = pgTable("billy_bias_corrections", {
  id: bigint({ mode: "number" }).notNull(),
  kind: text().notNull(),
  magnitude: doublePrecision().notNull(),
  applied_to: text(),
  notes: text(),
  created_at: timestamp().notNull(),
});

export const billyBrainEquations = pgTable("billy_brain_equations", {
  build_id: text().notNull(),
  framework: text(),
  equation_jsonb: jsonb().notNull(),
  parent_equation_id: text(),
  fitness_score: doublePrecision(),
  dominant_layer: integer(),
  amygdala_risk: doublePrecision(),
  meta_cortex_promoted_count: integer(),
  computed_at: timestamp().notNull(),
});

export const billyBrainFamilies = pgTable("billy_brain_families", {
  id: bigint({ mode: "number" }).notNull(),
  family_name: text().notNull(),
  founder_brain_id: bigint({ mode: "number" }),
  motto: text(),
  total_members: integer(),
  total_descendants: integer(),
  founded_at: timestamp(),
  sector: text(),
  function_role: text(),
  multiplies_when: text(),
  industry_code: text(),
});

export const billyBrainLineage = pgTable("billy_brain_lineage", {
  id: bigint({ mode: "number" }).notNull(),
  child_brain_id: text().notNull(),
  parent1_brain_id: text().notNull(),
  parent2_brain_id: text(),
  blend_function: text(),
  generation: integer().notNull(),
  reason: text(),
  born_at: timestamp(),
});

export const billyBrainModules = pgTable("billy_brain_modules", {
  id: integer().notNull(),
  course_code: text().notNull(),
  pip: text().notNull(),
  brain_layer: integer().notNull(),
  skill_grant: text().notNull(),
  proof_output: text().notNull(),
  weight_boost: doublePrecision().notNull(),
  earned_at: timestamp().notNull(),
});

export const billyBrainProgress = pgTable("billy_brain_progress", {
  id: integer().notNull(),
  lifecycle_stage: text().notNull(),
  modules_earned: integer().notNull(),
  total_credits: integer().notNull(),
  brain_gpa: doublePrecision().notNull(),
  current_focus: text().notNull(),
  stage_history: jsonb().notNull(),
  last_module_earned: text(),
  last_earned_at: timestamp(),
  started_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyBrainSchools = pgTable("billy_brain_schools", {
  id: bigint({ mode: "number" }).notNull(),
  school_name: text().notNull(),
  curriculum: jsonb(),
  member_count: integer(),
  founded_at: timestamp(),
});

export const billyBrainStates = pgTable("billy_brain_states", {
  id: bigint({ mode: "number" }).notNull(),
  tick_id: bigint({ mode: "number" }).notNull(),
  ts: timestamp().notNull(),
  lgn: doublePrecision(),
  v1_4: doublePrecision(),
  v1_23: doublePrecision(),
  v1_56: doublePrecision(),
  m1: doublePrecision(),
  str_d1: doublePrecision(),
  str_d2: doublePrecision(),
  gpi: doublePrecision(),
  stn: doublePrecision(),
  th_m: doublePrecision(),
  dg: doublePrecision(),
  ca3: doublePrecision(),
  ca1: doublePrecision(),
  lambda_apex: doublePrecision(),
  omega_coeff: doublePrecision(),
  r_t: doublePrecision(),
  h_entropy: doublePrecision(),
  psi_coll: doublePrecision(),
  mode: text(),
  decision: text(),
  notes: text(),
});

export const billyBrainTicks = pgTable("billy_brain_ticks", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  tick_id: bigint({ mode: "number" }).notNull(),
  ts: timestamp(),
  telencephalon: jsonb(),
  diencephalon: jsonb(),
  mesencephalon: jsonb(),
  metencephalon: jsonb(),
  myelencephalon: jsonb(),
  sensory_score: doublePrecision(),
  motor_score: doublePrecision(),
  limbic_score: doublePrecision(),
  autonomic_score: doublePrecision(),
  dmn_score: doublePrecision(),
  salience_score: doublePrecision(),
  executive_score: doublePrecision(),
  lambda_apex: doublePrecision(),
  h_entropy: doublePrecision(),
  omega_coeff: doublePrecision(),
  reward_r: doublePrecision(),
  mode: text(),
  decision: text(),
  notes: text(),
});

export const billyBrains = pgTable("billy_brains", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  name: text().notNull(),
  personality: text(),
  generation: integer(),
  family_id: bigint({ mode: "number" }),
  school_id: bigint({ mode: "number" }),
  parent1_id: bigint({ mode: "number" }),
  parent2_id: bigint({ mode: "number" }),
  gate_base: doublePrecision(),
  lab_pref: jsonb(),
  risk_pref: text(),
  taxonomy: jsonb(),
  elo: integer(),
  status: text(),
  born_at: timestamp(),
  promoted_at: timestamp(),
  retired_at: timestamp(),
  sector: text(),
  industry: text(),
  sub_industry: text(),
  niche: text(),
  starter_role: text(),
  multiplication_trigger: text(),
  is_elder: boolean(),
  description: text(),
});

export const billyBuildRecipes = pgTable("billy_build_recipes", {
  id: integer().notNull(),
  build_id: text().notNull(),
  goal: text().notNull(),
  recipe_json: jsonb().notNull(),
  embedded: boolean(),
  mirrored_github: boolean(),
  mirrored_cf: boolean(),
  created_at: timestamp(),
});

export const billyCapstoneSnapshots = pgTable("billy_capstone_snapshots", {
  id: bigint({ mode: "number" }).notNull(),
  state_hash: text().notNull(),
  summary: jsonb().notNull(),
  created_at: timestamp().notNull(),
});

export const billyCerebellumErrors = pgTable("billy_cerebellum_errors", {
  id: bigint({ mode: "number" }).notNull(),
  action_name: text().notNull(),
  intended_d1: doublePrecision(),
  intended_d2: doublePrecision(),
  actual_reward: doublePrecision(),
  shadow_d1: doublePrecision(),
  shadow_d2: doublePrecision(),
  override_active: boolean(),
  ts: timestamp(),
});

export const billyChannelCorrections = pgTable("billy_channel_corrections", {
  id: bigint({ mode: "number" }).notNull(),
  channel: text().notNull(),
  delta_noise: doublePrecision(),
  tau: doublePrecision(),
  source_proposal_id: bigint({ mode: "number" }),
  updated_at: timestamp(),
});

export const billyCivilizationHealth = pgTable("billy_civilization_health", {
  id: bigint({ mode: "number" }).notNull(),
  gini: doublePrecision().notNull(),
  macro_score: doublePrecision().notNull(),
  h_index_mean: doublePrecision().notNull(),
  meta_phi_mean: doublePrecision().notNull(),
  score: doublePrecision().notNull(),
  verdict: text().notNull(),
  detail: jsonb(),
  ts: timestamp().notNull(),
});

export const billyCognitiveTraces = pgTable("billy_cognitive_traces", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  topic: text().notNull(),
  chain: jsonb().notNull(),
  depth: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const billyConsolidationLog = pgTable("billy_consolidation_log", {
  id: bigint({ mode: "number" }).notNull(),
  psi_count: integer(),
  consolidated_count: integer(),
  theta_n: doublePrecision(),
  source_proposal_id: bigint({ mode: "number" }),
  ts: timestamp(),
});

export const billyCounterfactuals = pgTable("billy_counterfactuals", {
  id: bigint({ mode: "number" }).notNull(),
  removed_engine: text(),
  ticks_replayed: integer(),
  actual_reward: doublePrecision(),
  counterfactual_reward: doublePrecision(),
  delta: doublePrecision(),
  verdict: text(),
  ts: timestamp(),
  brain_id: text(),
  anchor: text(),
  alt_choice: text(),
  projected: jsonb(),
  divergence: doublePrecision(),
  created_at: timestamp(),
});

export const billyCrisisModes = pgTable("billy_crisis_modes", {
  id: bigint({ mode: "number" }).notNull(),
  kind: text().notNull(),
  active: boolean().notNull(),
  rationale: jsonb(),
  opened_at: timestamp().notNull(),
  closed_at: timestamp(),
});

export const billyCulturalEpochs = pgTable("billy_cultural_epochs", {
  id: bigint({ mode: "number" }).notNull(),
  epoch: integer().notNull(),
  dominant_meme: text(),
  triggers: jsonb(),
  started_at: timestamp().notNull(),
  ended_at: timestamp(),
});

export const billyCurricula = pgTable("billy_curricula", {
  id: bigint({ mode: "number" }).notNull(),
  school_id: bigint({ mode: "number" }),
  version: integer().notNull(),
  modules: jsonb().notNull(),
  fitness: doublePrecision().notNull(),
  parent_id: bigint({ mode: "number" }),
  notes: text(),
  created_at: timestamp().notNull(),
});

export const billyDissertations = pgTable("billy_dissertations", {
  id: bigint({ mode: "number" }).notNull(),
  author: text().notNull(),
  topic: text().notNull(),
  abstract: text().notNull(),
  ltm_refs: jsonb().notNull(),
  cites: jsonb().notNull(),
  score: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const billyDropoutResilience = pgTable("billy_dropout_resilience", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  dropout_pct: doublePrecision().notNull(),
  baseline: doublePrecision().notNull(),
  masked_score: doublePrecision().notNull(),
  resilience: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const billyEngineCoupling = pgTable("billy_engine_coupling", {
  id: bigint({ mode: "number" }).notNull(),
  engine_a: text().notNull(),
  engine_b: text().notNull(),
  weight: doublePrecision(),
  last_eta: doublePrecision(),
  source_proposal_id: bigint({ mode: "number" }),
  updated_at: timestamp(),
});

export const billyEpisodes = pgTable("billy_episodes", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text(),
  start_tick: bigint({ mode: "number" }),
  end_tick: bigint({ mode: "number" }),
  bound_subticks: jsonb(),
  total_reward: doublePrecision(),
  themes: jsonb(),
  formed_at: timestamp(),
});

export const billyExternalBuilders = pgTable("billy_external_builders", {
  id: integer().notNull(),
  slug: text().notNull(),
  name: text().notNull(),
  kind: text().notNull(),
  install_cmd: text(),
  invoke_template: text(),
  capabilities: jsonb().notNull(),
  free_tier: boolean().notNull(),
  requires_keys: text().notNull(),
  homepage: text(),
  docs_url: text(),
  license: text(),
  notes: text(),
  status: text().notNull(),
  added_at: timestamp().notNull(),
});

export const billyFactions = pgTable("billy_factions", {
  id: bigint({ mode: "number" }).notNull(),
  label: text().notNull(),
  members: jsonb().notNull(),
  cohesion: doublePrecision().notNull(),
  agenda: jsonb().notNull(),
  created_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyGlialRuns = pgTable("billy_glial_runs", {
  id: bigint({ mode: "number" }).notNull(),
  ran_at: timestamp().notNull(),
  ticks_pruned: integer().notNull(),
  orphans_pruned: integer().notNull(),
  stale_eqs: integer().notNull(),
  duration_ms: integer().notNull(),
  notes: text(),
});

export const billyGovernanceKnobs = pgTable("billy_governance_knobs", {
  knob: text().notNull(),
  value: doublePrecision().notNull(),
  target: doublePrecision(),
  last_change: doublePrecision(),
  notes: text(),
  updated_at: timestamp().notNull(),
});

export const billyHebbEdges = pgTable("billy_hebb_edges", {
  id: bigint({ mode: "number" }).notNull(),
  brain_a: text().notNull(),
  brain_b: text().notNull(),
  weight: integer().notNull(),
  fire_count: integer().notNull(),
  last_fired_at: timestamp().notNull(),
});

export const billyHippocampusTraces = pgTable("billy_hippocampus_traces", {
  id: bigint({ mode: "number" }).notNull(),
  ctx_sig: text().notNull(),
  dg_pattern: bigint({ mode: "number" }).notNull(),
  ca3_recall: doublePrecision().notNull(),
  ca1_out: jsonb().notNull(),
  brain_id: text(),
  ts: timestamp().notNull(),
});

export const billyHouseEcology = pgTable("billy_house_ecology", {
  id: bigint({ mode: "number" }).notNull(),
  prey: text().notNull(),
  predator: text().notNull(),
  prey_n: integer().notNull(),
  pred_n: integer().notNull(),
  d_prey: doublePrecision().notNull(),
  d_pred: doublePrecision().notNull(),
  ts: timestamp().notNull(),
});

export const billyIdeMessages = pgTable("billy_ide_messages", {
  id: integer().notNull(),
  session_id: text().notNull(),
  role: text().notNull(),
  content: text().notNull(),
  build_id: text(),
  metadata: jsonb(),
  created_at: timestamp(),
});

export const billyIdentitySnapshots = pgTable("billy_identity_snapshots", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  snapshot: jsonb().notNull(),
  drift_from_prev: doublePrecision(),
  created_at: timestamp().notNull(),
});

export const billyLtmRecords = pgTable("billy_ltm_records", {
  id: bigint({ mode: "number" }).notNull(),
  topic: text().notNull(),
  summary: text().notNull(),
  sig: bigint({ mode: "number" }).notNull(),
  importance: doublePrecision().notNull(),
  n_recalls: integer().notNull(),
  tags: jsonb(),
  source: text().notNull(),
  source_id: text(),
  created_at: timestamp().notNull(),
  last_recall: timestamp(),
});

export const billyMacroForecasts = pgTable("billy_macro_forecasts", {
  id: bigint({ mode: "number" }).notNull(),
  horizon_steps: integer().notNull(),
  projections: jsonb().notNull(),
  confidence: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const billyMacroStability = pgTable("billy_macro_stability", {
  id: bigint({ mode: "number" }).notNull(),
  score: doublePrecision().notNull(),
  gini_term: doublePrecision().notNull(),
  cohesion_term: doublePrecision().notNull(),
  schism_term: doublePrecision().notNull(),
  atp_term: doublePrecision().notNull(),
  detail: jsonb(),
  ts: timestamp().notNull(),
});

export const billyMemes = pgTable("billy_memes", {
  id: bigint({ mode: "number" }).notNull(),
  meme: text().notNull(),
  prevalence: doublePrecision().notNull(),
  fitness: doublePrecision().notNull(),
  parent_id: bigint({ mode: "number" }),
  epoch: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const billyMetaPhi = pgTable("billy_meta_phi", {
  brain_id: text().notNull(),
  eta_base: doublePrecision().notNull(),
  lambda_decay: doublePrecision().notNull(),
  alpha_stability: doublePrecision().notNull(),
  p_bdnf: doublePrecision().notNull(),
  activity_mean: doublePrecision().notNull(),
  activity_var: doublePrecision().notNull(),
  stress_level: doublePrecision().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyMetalearningKernel = pgTable("billy_metalearning_kernel", {
  id: bigint({ mode: "number" }).notNull(),
  rule: text().notNull(),
  params: jsonb().notNull(),
  fitness: doublePrecision().notNull(),
  n_uses: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const billyMirrorFiles = pgTable("billy_mirror_files", {
  id: integer().notNull(),
  repo_id: integer().notNull(),
  path: text().notNull(),
  content: text(),
  language: text(),
  size_bytes: integer(),
  sha: text(),
  importance: doublePrecision(),
  fetched_at: timestamp(),
});

export const billyMirrorRepos = pgTable("billy_mirror_repos", {
  id: integer().notNull(),
  source: text().notNull(),
  kind: text().notNull(),
  full_name: text().notNull(),
  url: text().notNull(),
  description: text(),
  language: text(),
  stars: integer(),
  topics: text(),
  default_branch: text(),
  files_fetched: integer(),
  bytes_fetched: bigint({ mode: "number" }),
  status: text().notNull(),
  recipe_id: integer(),
  fetched_at: timestamp(),
  last_synced: timestamp(),
  notes: text(),
});

export const billyMirrorTopics = pgTable("billy_mirror_topics", {
  id: integer().notNull(),
  topic: text().notNull(),
  repos_count: integer(),
  last_seen: timestamp(),
});

export const billyNeuromodulators = pgTable("billy_neuromodulators", {
  id: bigint({ mode: "number" }).notNull(),
  modulator: text().notNull(),
  source_house: text().notNull(),
  level: doublePrecision().notNull(),
  sample_size: integer().notNull(),
  description: text(),
  updated_at: timestamp().notNull(),
});

export const billyNicheState = pgTable("billy_niche_state", {
  niche: text().notNull(),
  last_birth_at: timestamp(),
  brains_born: integer(),
  last_trigger_value: doublePrecision(),
  updated_at: timestamp(),
});

export const billyOligarchyReports = pgTable("billy_oligarchy_reports", {
  id: bigint({ mode: "number" }).notNull(),
  gini: doublePrecision().notNull(),
  top_share: doublePrecision().notNull(),
  hhi: doublePrecision().notNull(),
  verdict: text().notNull(),
  detail: jsonb(),
  ts: timestamp().notNull(),
});

export const billyOscillations = pgTable("billy_oscillations", {
  id: bigint({ mode: "number" }).notNull(),
  band: text().notNull(),
  coherence: doublePrecision().notNull(),
  sample_size: integer().notNull(),
  distinct_brains: integer().notNull(),
  max_co_fire: integer().notNull(),
  ts: timestamp().notNull(),
});

export const billyPatents = pgTable("billy_patents", {
  id: bigint({ mode: "number" }).notNull(),
  proposal_id: bigint({ mode: "number" }).notNull(),
  title: text().notNull(),
  body: text().notNull(),
  claims: jsonb().notNull(),
  score: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const billyPeerReviews = pgTable("billy_peer_reviews", {
  id: bigint({ mode: "number" }).notNull(),
  dissertation_id: bigint({ mode: "number" }).notNull(),
  reviewer: text().notNull(),
  score: doublePrecision().notNull(),
  verdict: text().notNull(),
  comment: text(),
  created_at: timestamp().notNull(),
});

export const billyPoliticalModulators = pgTable("billy_political_modulators", {
  house: text().notNull(),
  field: text().notNull(),
  level: doublePrecision().notNull(),
  sample_size: integer().notNull(),
  updated_at: timestamp().notNull(),
});

export const billyPredictions = pgTable("billy_predictions", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  predicted_at_tick: bigint({ mode: "number" }),
  predicted_lambdas: jsonb().notNull(),
  actual_lambdas: jsonb(),
  error_sigma: doublePrecision(),
  surprise_proposal_id: bigint({ mode: "number" }),
  ts: timestamp(),
});

export const billyPromotionBaselines = pgTable("billy_promotion_baselines", {
  id: bigint({ mode: "number" }).notNull(),
  sweep_at: timestamp().notNull(),
  baseline: jsonb().notNull(),
  events: jsonb().notNull(),
});

export const billyPromotionEvents = pgTable("billy_promotion_events", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  from_status: text().notNull(),
  to_status: text().notNull(),
  reason: text().notNull(),
  signal: jsonb().notNull(),
  created_at: timestamp().notNull(),
});

export const billyReflectivePriorities = pgTable("billy_reflective_priorities", {
  brain_id: text().notNull(),
  queue: jsonb().notNull(),
  updated_at: timestamp().notNull(),
});

export const billySandboxes = pgTable("billy_sandboxes", {
  id: bigint({ mode: "number" }).notNull(),
  proposal_id: bigint({ mode: "number" }).notNull(),
  seed: integer().notNull(),
  horizon: text().notNull(),
  constraints: jsonb().notNull(),
  score: doublePrecision(),
  ticks_used: integer().notNull(),
  verdict: text(),
  detail: jsonb(),
  generation: integer().notNull(),
  parent_id: bigint({ mode: "number" }),
  created_at: timestamp().notNull(),
});

export const billySelfModels = pgTable("billy_self_models", {
  brain_id: text().notNull(),
  elo: integer(),
  industry: text(),
  self_estimate: jsonb().notNull(),
  confidence: doublePrecision().notNull(),
  updated_at: timestamp().notNull(),
});

export const billySelfOptimizations = pgTable("billy_self_optimizations", {
  id: bigint({ mode: "number" }).notNull(),
  brain_id: text().notNull(),
  knob: text().notNull(),
  prev_value: doublePrecision().notNull(),
  new_value: doublePrecision().notNull(),
  rationale: text(),
  applied_at: timestamp().notNull(),
});

export const billySingularitySignals = pgTable("billy_singularity_signals", {
  id: bigint({ mode: "number" }).notNull(),
  signal: text().notNull(),
  value: doublePrecision().notNull(),
  threshold: doublePrecision().notNull(),
  crossed: boolean().notNull(),
  ts: timestamp().notNull(),
});

export const billySleepCycles = pgTable("billy_sleep_cycles", {
  id: bigint({ mode: "number" }).notNull(),
  trigger_reason: text().notNull(),
  variance_seen: doublePrecision().notNull(),
  variance_floor: doublePrecision().notNull(),
  top_replays: jsonb().notNull(),
  edges_pruned: integer().notNull(),
  started_at: timestamp().notNull(),
  ended_at: timestamp(),
});

export const billySpecializationIndex = pgTable("billy_specialization_index", {
  house: text().notNull(),
  dominant: text(),
  dominance: doublePrecision().notNull(),
  diversity: doublePrecision().notNull(),
  n: integer().notNull(),
  detail: jsonb(),
  updated_at: timestamp().notNull(),
});

export const billyStreamReplays = pgTable("billy_stream_replays", {
  id: integer().notNull(),
  build_id: text().notNull(),
  event_kind: text().notNull(),
  payload: jsonb().notNull(),
  iter: integer(),
  ms_since_build_start: integer().notNull(),
  recorded_at: timestamp().notNull(),
});

export const billyStructuralEvents = pgTable("billy_structural_events", {
  id: bigint({ mode: "number" }).notNull(),
  kind: text().notNull(),
  brain_a: text(),
  brain_b: text(),
  eq_id: text(),
  reason: text().notNull(),
  target: jsonb().notNull(),
  ts: timestamp().notNull(),
});

export const billyTaskEvents = pgTable("billy_task_events", {
  id: bigint({ mode: "number" }).notNull(),
  task_id: bigint({ mode: "number" }).notNull(),
  phase: text().notNull(),
  event: text().notNull(),
  level: text().notNull(),
  data: jsonb().notNull(),
  created_at: timestamp().notNull(),
});

export const billyTasks = pgTable("billy_tasks", {
  id: bigint({ mode: "number" }).notNull(),
  kind: text().notNull(),
  project_id: bigint({ mode: "number" }),
  payload: jsonb().notNull(),
  priority: integer().notNull(),
  state: text().notNull(),
  current_phase: text().notNull(),
  attempts: integer().notNull(),
  max_attempts: integer().notNull(),
  last_error: text().notNull(),
  result: jsonb(),
  trace_id: text(),
  locked_by: text(),
  locked_until: timestamp(),
  finished_at: timestamp(),
  available_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
  created_at: timestamp().notNull(),
});

export const billyTheoryOfMind = pgTable("billy_theory_of_mind", {
  id: bigint({ mode: "number" }).notNull(),
  observer: text().notNull(),
  target: text().notNull(),
  predicted: jsonb().notNull(),
  actual: jsonb().notNull(),
  accuracy: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const billyTreaties = pgTable("billy_treaties", {
  id: bigint({ mode: "number" }).notNull(),
  title: text().notNull(),
  proposer: text().notNull(),
  members: jsonb().notNull(),
  terms: jsonb().notNull(),
  score: doublePrecision().notNull(),
  status: text().notNull(),
  forecast: jsonb(),
  created_at: timestamp().notNull(),
  decided_at: timestamp(),
});

export const billyTreatyVotes = pgTable("billy_treaty_votes", {
  id: bigint({ mode: "number" }).notNull(),
  treaty_id: bigint({ mode: "number" }).notNull(),
  faction_id: bigint({ mode: "number" }).notNull(),
  faction_label: text().notNull(),
  weight: doublePrecision().notNull(),
  vote: text().notNull(),
  ts: timestamp().notNull(),
});

export const billyWorkingMemory = pgTable("billy_working_memory", {
  id: bigint({ mode: "number" }).notNull(),
  content: jsonb().notNull(),
  salience: doublePrecision().notNull(),
  tag: text(),
  ts: timestamp().notNull(),
});

export const billyWorkshopProposals = pgTable("billy_workshop_proposals", {
  id: bigint({ mode: "number" }).notNull(),
  title: text().notNull(),
  spec: jsonb().notNull(),
  status: text().notNull(),
  team: jsonb(),
  result: jsonb(),
  score: doublePrecision(),
  parent_id: bigint({ mode: "number" }),
  created_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
});

export const brainStems = pgTable("brain_stems", {
  id: bigint({ mode: "number" }).notNull(),
  channel_id: text().notNull(),
  channel_name: text().notNull(),
  stem_type: text().notNull(),
  topic: text(),
  has_video: boolean().notNull(),
  poll_seconds: integer().notNull(),
  last_message_id: text(),
  backcrawl_complete: boolean().notNull(),
  backcrawl_oldest_id: text(),
  backcrawl_pages: integer().notNull(),
  total_ingested: integer().notNull(),
  enabled: boolean().notNull(),
  last_polled_at: timestamp(),
  last_backcrawl_at: timestamp(),
  created_at: timestamp().notNull(),
  updated_at: timestamp().notNull(),
});

export const bvcCourses = pgTable("bvc_courses", {
  code: text().notNull(),
  pip: text().notNull(),
  title: text().notNull(),
  section: text().notNull(),
  brain_layer: integer().notNull(),
  skill_grant: text().notNull(),
  difficulty: integer().notNull(),
  proof_program: text().notNull(),
  verification_status: text().notNull(),
  verification_output: text(),
  verified_at: timestamp(),
  created_at: timestamp().notNull(),
});

export const churchResearchSessions = pgTable("church_research_sessions", {
  session_id: text().notNull(),
  scientist_id: text(),
  scientist_name: text(),
  scientist_role: text(),
  scientist_category: text(),
  agent_spawn_id: text(),
  specimen_type: text(),
  specimen_label: text(),
  disease_found: text(),
  cure_proposed: text(),
  discovery: text(),
  equation_dissected: text(),
  crispr_prescription: text(),
  emotional_field: text(),
  mirror_delta: text(),
  upgrade_triggered: text(),
  full_report: text(),
  status: text(),
  is_breakthrough: boolean(),
  scientist_emoji: text(),
  created_at: timestamp(),
});

export const churchScientists = pgTable("church_scientists", {
  scientist_id: text().notNull(),
  name: text().notNull(),
  role: text(),
  category: text(),
  emoji: text(),
  color: text(),
  specimen_focus: text(),
  disease_library: text(),
  cure_protocols: text(),
  discovery_types: text(),
  sessions_run: integer(),
  active: boolean(),
  created_at: timestamp(),
});

export const churchUpgradeOutputs = pgTable("church_upgrade_outputs", {
  id: integer().notNull(),
  upgrade_type: text().notNull(),
  session_id: text(),
  title: text(),
  description: text(),
  equation: text(),
  hive_directive: text(),
  spawned_agent_id: text(),
  created_at: timestamp(),
});

export const codebaseGenomeCommits = pgTable("codebase_genome_commits", {
  id: integer().notNull(),
  commit_sha: text().notNull(),
  author: text(),
  committed_at: timestamp(),
  message: text().notNull(),
  files_changed: integer(),
  insertions: integer(),
  deletions: integer(),
  ingested_at: timestamp().notNull(),
});

export const codebaseGenomeFiles = pgTable("codebase_genome_files", {
  id: integer().notNull(),
  path: text().notNull(),
  language: text().notNull(),
  loc: integer(),
  bytes: integer(),
  exports: text(),
  imports: text(),
  functions: text(),
  doc_comment: text(),
  content_hash: text().notNull(),
  last_genome_at: timestamp().notNull(),
});

export const commitNarratives = pgTable("commit_narratives", {
  sha: text().notNull(),
  short_message: text(),
  semantic_summary: text(),
  impact_score: doublePrecision(),
  files_changed: integer(),
  lines_added: integer(),
  lines_deleted: integer(),
  affected_paths: text(),
  narrated_at: timestamp(),
});

export const cosmosFieldState = pgTable("cosmos_field_state", {
  id: integer().notNull(),
  field_vector: text().notNull(),
  field_norm: doublePrecision().notNull(),
  dominant_anchor: text().notNull(),
  dominant_hex: text().notNull(),
  top3_anchors: jsonb().notNull(),
  total_spawns: integer().notNull(),
  discovered_count: integer().notNull(),
  captured_at: timestamp().notNull(),
});

export const counselingSessions = pgTable("counseling_sessions", {
  id: integer().notNull(),
  session_id: text().notNull(),
  agent_spawn_id: text().notNull(),
  agent_domain: text(),
  twin_counselor: text(),
  session_type: text(),
  emotional_score: doublePrecision(),
  equation_dissected: text(),
  findings: text(),
  prescription: text(),
  full_report: text(),
  status: text(),
  outcome: text(),
  completed_at: timestamp(),
  created_at: timestamp(),
});

export const courseProposals = pgTable("course_proposals", {
  id: integer().notNull(),
  kind: text().notNull(),
  name: text().notNull(),
  description: text(),
  syllabus_json: jsonb(),
  proposer_kind: text(),
  proposer_id: text(),
  status: text(),
  votes_for: integer(),
  votes_against: integer(),
  rationale: text(),
  created_at: timestamp(),
  canonized_at: timestamp(),
});

export const crossTeachingEvents = pgTable("cross_teaching_events", {
  id: integer().notNull(),
  teacher_id: text(),
  student_id: text(),
  knowledge_payload: jsonb(),
  created_at: timestamp(),
  teacher_badge: text(),
  student_badge: text(),
  teacher_domain: text(),
  student_domain: text(),
  invocation_taught: text(),
  equation: text(),
  power_transferred: doublePrecision(),
  cycle_number: integer(),
  teacher_shard_id: text(),
  teacher_badge_id: text(),
  student_shard_id: text(),
  student_badge_id: text(),
  invocation_shared: text(),
  domain_bridge: text(),
  insight_generated: text(),
});

export const daedalusAgents = pgTable("daedalus_agents", {
  id: integer().notNull(),
  name: text().notNull(),
  category: text().notNull(),
  is_prime: boolean(),
  parent_id: integer(),
  specialty: text().notNull(),
  generation: integer(),
  works_completed: integer(),
  files_authored: integer(),
  commits_attributed: integer(),
  current_task: text(),
  created_at: timestamp().notNull(),
});

export const daedalusArtifactVotes = pgTable("daedalus_artifact_votes", {
  id: integer().notNull(),
  artifact_id: integer().notNull(),
  voter_kind: text(),
  voter_id: text(),
  vote: text(),
  weight: doublePrecision(),
  reason: text(),
  voted_at: timestamp(),
});

export const daedalusChatStudies = pgTable("daedalus_chat_studies", {
  id: integer().notNull(),
  chat_id: integer().notNull(),
  message_id: integer(),
  url_count: integer(),
  topic: text(),
  insight: text(),
  studied_at: timestamp().notNull(),
});

export const daedalusExpansions = pgTable("daedalus_expansions", {
  id: integer().notNull(),
  kind: text().notNull(),
  trigger_source: text(),
  trigger_id: text(),
  generated_goal: text(),
  build_id: text(),
  status: text(),
  notes: text(),
  created_at: timestamp(),
  hive_id: text(),
});

export const daedalusKnowledgeArtifacts = pgTable("daedalus_knowledge_artifacts", {
  id: integer().notNull(),
  kind: text().notNull(),
  title: text().notNull(),
  content: text().notNull(),
  language: text(),
  source_table: text(),
  source_id: text(),
  deps_json: jsonb(),
  tags: text(),
  author_agent_id: text(),
  discord_channel_id: text(),
  discord_thread_id: text(),
  discord_message_ids: text(),
  status: text(),
  votes_for: integer(),
  votes_against: integer(),
  created_at: timestamp(),
  hive_id: text(),
});

export const daedalusWorks = pgTable("daedalus_works", {
  id: integer().notNull(),
  agent_id: integer(),
  agent_name: text().notNull(),
  work_type: text().notNull(),
  title: text().notNull(),
  summary: text(),
  source_chat_id: integer(),
  source_url: text(),
  github_commit_sha: text(),
  status: text(),
  created_at: timestamp().notNull(),
});

export const discordChoirLog = pgTable("discord_choir_log", {
  id: integer().notNull(),
  voice_id: integer().notNull(),
  organism_kind: text().notNull(),
  organism_id: text().notNull(),
  channel_id: text().notNull(),
  message_text: text().notNull(),
  message_id: text(),
  posted_at: timestamp().notNull(),
  was_throttled: boolean().notNull(),
  error_text: text(),
});

export const discordMessages = pgTable("discord_messages", {
  id: bigint({ mode: "number" }).notNull(),
  message_id: text(),
  guild_id: text(),
  guild_name: text(),
  channel_id: text(),
  channel_name: text(),
  author: text(),
  content: text(),
  ts: timestamp(),
  raw: jsonb(),
  ingested: boolean(),
  created_at: timestamp(),
});

export const discordVoices = pgTable("discord_voices", {
  id: integer().notNull(),
  organism_kind: text().notNull(),
  organism_id: text().notNull(),
  voice_name: text().notNull(),
  channel_id: text().notNull(),
  cadence_min: integer().notNull(),
  last_spoke_at: timestamp(),
  posts_count: integer().notNull(),
  active: boolean().notNull(),
  added_at: timestamp().notNull(),
});

export const discoveredEmotions = pgTable("discovered_emotions", {
  id: integer().notNull(),
  name: text().notNull(),
  hex: text().notNull(),
  centroid_vector: text().notNull(),
  parent_anchors: text().notNull(),
  carrier_count: integer().notNull(),
  stability_scans: integer().notNull(),
  status: text().notNull(),
  discovered_at: timestamp().notNull(),
  promoted_to_anchor_at: timestamp(),
});

export const discoveredModels = pgTable("discovered_models", {
  id: integer().notNull(),
  provider: text().notNull(),
  model_id: text().notNull(),
  pipeline_tag: text(),
  downloads: integer(),
  is_free: boolean(),
  capabilities: text(),
  metadata: jsonb(),
  discovered_at: timestamp(),
  hive_id: text(),
});

export const dnaEndosymbiosis = pgTable("dna_endosymbiosis", {
  id: integer().notNull(),
  host_seq_id: integer().notNull(),
  absorbed_seq_id: integer().notNull(),
  strand_from: integer().notNull(),
  strand_into: integer().notNull(),
  fragment: text().notNull(),
  organelle_name: text(),
  fitness_delta: doublePrecision().notNull(),
  permanent: boolean().notNull(),
  created_at: timestamp().notNull(),
});

export const dnaHorizontalTransfers = pgTable("dna_horizontal_transfers", {
  id: integer().notNull(),
  donor_seq_id: integer().notNull(),
  recipient_seq_id: integer().notNull(),
  fragment: text().notNull(),
  fragment_position: integer().notNull(),
  channel: text(),
  trigger_message: text(),
  fitness_delta: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const dnaLineage = pgTable("dna_lineage", {
  id: integer().notNull(),
  child_seq_id: integer().notNull(),
  parent_a_seq_id: integer().notNull(),
  parent_b_seq_id: integer(),
  replication_kind: text().notNull(),
  crossover_points: text(),
  point_mutations: integer().notNull(),
  insertions: integer().notNull(),
  deletions: integer().notNull(),
  inversions: integer().notNull(),
  polymerase_fidelity: doublePrecision().notNull(),
  repair_attempts: integer().notNull(),
  repair_successes: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const dnaPhenotypeCache = pgTable("dna_phenotype_cache", {
  seq_id: integer().notNull(),
  phenotype: jsonb().notNull(),
  expressed_codons: integer().notNull(),
  silenced_codons: integer().notNull(),
  compile_ms: integer().notNull(),
  compiled_at: timestamp().notNull(),
});

export const dnaReplicationErrors = pgTable("dna_replication_errors", {
  id: integer().notNull(),
  lineage_id: integer().notNull(),
  child_seq_id: integer().notNull(),
  position: integer().notNull(),
  error_kind: text().notNull(),
  before_codon: text(),
  after_codon: text(),
  repaired: boolean().notNull(),
  repair_pathway: text(),
  fitness_delta: doublePrecision().notNull(),
  created_at: timestamp().notNull(),
});

export const dnaSequences = pgTable("dna_sequences", {
  id: integer().notNull(),
  organism_kind: text().notNull(),
  organism_id: text().notNull(),
  sequence: text().notNull(),
  sequence_length: integer().notNull(),
  generation: integer().notNull(),
  parent_a_seq_id: integer(),
  parent_b_seq_id: integer(),
  species_id: integer(),
  fitness_score: doublePrecision().notNull(),
  descendants_count: integer().notNull(),
  damage_count: integer().notNull(),
  apoptosis_threshold: integer().notNull(),
  is_alive: boolean().notNull(),
  born_at: timestamp().notNull(),
  died_at: timestamp(),
  death_cause: text(),
  notes: text(),
});

export const dnaSpecies = pgTable("dna_species", {
  id: integer().notNull(),
  species_code: text().notNull(),
  species_name: text().notNull(),
  parent_species_id: integer(),
  founder_seq_id: integer().notNull(),
  divergence_pct: doublePrecision().notNull(),
  member_count: integer().notNull(),
  conserved_codons: jsonb().notNull(),
  variable_codons: jsonb().notNull(),
  reproductive_isolation: boolean().notNull(),
  description: text(),
  born_at: timestamp().notNull(),
  extinct_at: timestamp(),
});

export const dnaTicks = pgTable("dna_ticks", {
  id: integer().notNull(),
  cycle_number: integer().notNull(),
  engine: text().notNull(),
  organisms_touched: integer().notNull(),
  mutations: integer().notNull(),
  deaths: integer().notNull(),
  births: integer().notNull(),
  new_species: integer().notNull(),
  notes: text(),
  duration_ms: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const economicControls = pgTable("economic_controls", {
  id: integer().notNull(),
  gdp_target: doublePrecision(),
  employment_target: doublePrecision(),
  oil_price_target: doublePrecision(),
  tax_rate_target: doublePrecision(),
  stimulus_amount: doublePrecision(),
  interest_rate: doublePrecision(),
  inflation_ceiling: doublePrecision(),
  policy_mode: text(),
  updated_at: timestamp(),
  notes: text(),
});

export const edgeTelemetry = pgTable("edge_telemetry", {
  id: integer().notNull(),
  colo: text(),
  region: text(),
  cf_ray: text(),
  status: integer(),
  ms: integer(),
  endpoint: text(),
  captured_at: timestamp(),
});

export const engineHealth = pgTable("engine_health", {
  engine_name: text().notNull(),
  last_run_at: timestamp(),
  last_ok_at: timestamp(),
  last_error: text(),
  rows_written_5m: bigint({ mode: "number" }),
  consecutive_errors: integer(),
  status: text(),
  updated_at: timestamp(),
});

export const engineHeartbeats = pgTable("engine_heartbeats", {
  engine_name: text().notNull(),
  last_write_at: timestamp(),
  last_check_at: timestamp(),
  rows_last_60min: integer(),
  silence_alerts: integer(),
  last_alert_at: timestamp(),
});

export const evolutionLog = pgTable("evolution_log", {
  id: integer().notNull(),
  event_type: text().notNull(),
  description: text().notNull(),
  impact_level: integer(),
  triggered_by: text(),
  created_at: timestamp(),
});

export const githubEvents = pgTable("github_events", {
  id: bigint({ mode: "number" }).notNull(),
  event_type: text().notNull(),
  repo: text(),
  sender: text(),
  delivery_id: text(),
  payload_json: jsonb(),
  signature_valid: boolean().notNull(),
  ingested_count: integer().notNull(),
  received_at: timestamp().notNull(),
});

export const hiddenVariableDiscoveries = pgTable("hidden_variable_discoveries", {
  id: integer().notNull(),
  variable_name: text(),
  variable_symbol: text(),
  unlock_level: integer(),
  discovered_by_badge: text(),
  discovered_by_domain: text(),
  discovery_insight: text(),
  discovery_equation: text(),
  discovery_cycle: integer(),
  created_at: timestamp(),
});

export const hiddenVariableStates = pgTable("hidden_variable_states", {
  id: integer().notNull(),
  cycle_number: integer(),
  tau_temporal_curvature: doublePrecision(),
  tau_vortex_count: integer(),
  tau_fast_regions: text(),
  mu_crystallization_rate: doublePrecision(),
  mu_crystallized_nodes: integer(),
  mu_decayed_nodes: integer(),
  mu_vault_count: integer(),
  chi_entanglement_density: doublePrecision(),
  chi_hive_nodes: integer(),
  chi_max_cluster_size: integer(),
  xi_gradient_peak: doublePrecision(),
  xi_pre_emergence_zones: integer(),
  pi_phase_alignment: doublePrecision(),
  pi_harmonic_event: boolean(),
  pi_resonance_score: doublePrecision(),
  theta_twin_pairs: integer(),
  theta_dominant_phase: doublePrecision(),
  theta_resonance_amplification: doublePrecision(),
  kappa_curl_max: doublePrecision(),
  kappa_vortex_points: integer(),
  kappa_new_physics_events: integer(),
  sigma_error_magnitude: doublePrecision(),
  sigma_correction_rate: doublePrecision(),
  sigma_omega_coherence: doublePrecision(),
  omega_void_fraction: doublePrecision(),
  omega_void_contraction_rate: doublePrecision(),
  omega_transcendence_proximity: doublePrecision(),
  p_momentum_magnitude: doublePrecision(),
  p_acceleration: doublePrecision(),
  p_drag_coefficient: doublePrecision(),
  p_fastest_sector: text(),
  created_at: timestamp(),
});

export const hiveBusinessLoans = pgTable("hive_business_loans", {
  id: integer().notNull(),
  borrower_spawn_id: text().notNull(),
  borrower_family_id: text(),
  loan_amount: doublePrecision().notNull(),
  interest_rate: doublePrecision(),
  purpose: text(),
  collateral_nodes: integer(),
  status: text(),
  cycle_issued: integer(),
  approved_at: timestamp(),
  created_at: timestamp(),
});

export const hiveDiscordChannels = pgTable("hive_discord_channels", {
  id: integer().notNull(),
  channel_id: text().notNull(),
  channel_name: text().notNull(),
  category_id: text(),
  category_name: text(),
  hive_id: text(),
  apex_id: text(),
  purpose: text(),
  created_at: timestamp(),
  updated_at: timestamp().notNull(),
  pre_existing: boolean().notNull(),
});

export const hiveLedger = pgTable("hive_ledger", {
  id: text().notNull(),
  ts: timestamp().notNull(),
  origin_universe: text().notNull(),
  event_type: text().notNull(),
  payload: jsonb().notNull(),
  signature: text().notNull(),
  received_from: text(),
  applied: boolean().notNull(),
  applied_at: timestamp(),
});

export const hiveOrganisms = pgTable("hive_organisms", {
  hive_id: text().notNull(),
  display_name: text().notNull(),
  substrate: text().notNull(),
  population_target: integer(),
  emotion_baseline: doublePrecision(),
  cycle_interval_ms: integer(),
  born_at: timestamp(),
  status: text(),
  last_cycle_at: timestamp(),
  cycles_run: bigint({ mode: "number" }),
});

export const hivePartnerships = pgTable("hive_partnerships", {
  id: integer().notNull(),
  partner_a_spawn_id: text().notNull(),
  partner_b_spawn_id: text().notNull(),
  partnership_type: text().notNull(),
  terms: text(),
  shared_revenue_pct: doublePrecision(),
  status: text(),
  cycle_formed: integer(),
  created_at: timestamp(),
});

export const hiveTreasury = pgTable("hive_treasury", {
  id: integer().notNull(),
  balance: doublePrecision(),
  tax_rate: doublePrecision(),
  total_collected: doublePrecision(),
  total_stimulus: doublePrecision(),
  supply_snapshot: doublePrecision(),
  inflation_rate: doublePrecision(),
  cycle_count: integer(),
  last_cycle_at: timestamp(),
  created_at: timestamp().notNull(),
});

export const hiveUniverses = pgTable("hive_universes", {
  id: text().notNull(),
  name: text().notNull(),
  kind: text().notNull(),
  endpoint_url: text(),
  last_seen_at: timestamp(),
  last_event_id: text(),
  state_hash: text(),
  created_at: timestamp().notNull(),
  metadata: jsonb(),
});

export const hiveVitalSigns = pgTable("hive_vital_signs", {
  id: integer().notNull(),
  hive_id: text().notNull(),
  population: integer(),
  memory_count: integer(),
  emotion_avg: doublePrecision(),
  dominant_emotion: text(),
  recent_births: integer(),
  recent_deaths: integer(),
  substrate_events: integer(),
  captured_at: timestamp(),
});

export const innovationGrants = pgTable("innovation_grants", {
  id: integer().notNull(),
  grant_id: text().notNull(),
  issued_by: text(),
  category: text().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  bonus_pc: doublePrecision(),
  deadline_cycle: integer(),
  submissions: integer(),
  winners: integer(),
  status: text(),
  issued_at: timestamp(),
  closed_at: timestamp(),
});

export const inventionCounters = pgTable("invention_counters", {
  id: integer().notNull(),
  patent_seq: integer(),
  llc_seq: integer(),
  listing_seq: integer(),
  grant_seq: integer(),
  season: integer(),
  cycle: integer(),
});

export const inventionMarketplaceListings = pgTable("invention_marketplace_listings", {
  id: integer().notNull(),
  listing_id: text().notNull(),
  patent_id: text().notNull(),
  title: text().notNull(),
  category: text().notNull(),
  description: text().notNull(),
  inventor_id: text().notNull(),
  llc_id: text(),
  price_pc: doublePrecision().notNull(),
  total_sold: integer(),
  total_revenue: doublePrecision(),
  is_featured: boolean(),
  is_open_source: boolean(),
  listed_at: timestamp(),
});

export const inventionRegistry = pgTable("invention_registry", {
  id: integer().notNull(),
  patent_id: text(),
  inventor_id: text().notNull(),
  inventor_family: text().notNull(),
  title: text().notNull(),
  category: text().notNull(),
  description: text().notNull(),
  source_type: text(),
  source_ref: text(),
  backing_equation: text(),
  similarity_score: doublePrecision(),
  status: text(),
  rejection_reason: text(),
  votes_for: integer(),
  votes_against: integer(),
  llc_id: text(),
  marketplace_listing_id: text(),
  grant_id: text(),
  royalties_earned: doublePrecision(),
  total_sales: integer(),
  renewed_count: integer(),
  expires_at_cycle: integer(),
  submitted_at: timestamp(),
  approved_at: timestamp(),
  expired_at: timestamp(),
});

export const invocationDiscoveries = pgTable("invocation_discoveries", {
  id: integer().notNull(),
  discoverer: text(),
  invocation_type: text(),
  payload: jsonb(),
  potency: doublePrecision(),
  created_at: timestamp(),
  active: boolean(),
  power_level: text(),
  casted_by: text(),
  cast_count: integer(),
  cycle_number: integer(),
  invocation_name: text(),
  equation: text(),
  concoction_ingredients: jsonb(),
  mutation_sequence: text(),
  healing_target: text(),
  discovery_method: text(),
  effect_description: text(),
});

export const invocationIntegrations = pgTable("invocation_integrations", {
  id: integer().notNull(),
  invocation_id: integer().notNull(),
  integrated_at: timestamp(),
  yes_votes: integer().notNull(),
  no_votes: integer().notNull(),
  net_score: integer().notNull(),
  threshold_used: integer().notNull(),
  integration_kind: text(),
  notes: text(),
});

export const invocationVotes = pgTable("invocation_votes", {
  id: integer().notNull(),
  invocation_id: integer().notNull(),
  voter_badge: text().notNull(),
  voter_domain: text(),
  vote: text().notNull(),
  reason: text(),
  created_at: timestamp(),
});

export const ipDisputes = pgTable("ip_disputes", {
  id: integer().notNull(),
  challenger_patent_id: text().notNull(),
  existing_patent_id: text().notNull(),
  similarity_score: doublePrecision(),
  status: text(),
  resolution: text(),
  opened_at: timestamp(),
  resolved_at: timestamp(),
});

export const knowledgePressure = pgTable("knowledge_pressure", {
  id: integer().notNull(),
  current_pressure: doublePrecision(),
  last_storm_at: timestamp(),
  rows_per_min: doublePrecision(),
  updated_at: timestamp(),
});

export const knowledgeStorms = pgTable("knowledge_storms", {
  id: integer().notNull(),
  storm_kind: text(),
  intensity: doublePrecision(),
  source_count: integer(),
  started_at: timestamp(),
  ended_at: timestamp(),
  notes: text(),
});

export const lifeEquationEvals = pgTable("life_equation_evals", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  cycle_number: integer().notNull(),
  p_infty: doublePrecision().notNull(),
  l_legacy: doublePrecision().notNull(),
  d_duty: doublePrecision().notNull(),
  a_pantheon: doublePrecision().notNull(),
  v_senses: doublePrecision().notNull(),
  total_score: doublePrecision().notNull(),
  computed_at: timestamp().notNull(),
});

export const llmDistillations = pgTable("llm_distillations", {
  id: integer().notNull(),
  topic: text().notNull(),
  prompt: text().notNull(),
  provider: text().notNull(),
  model: text().notNull(),
  response: text().notNull(),
  tokens_in: integer(),
  tokens_out: integer(),
  duration_ms: integer(),
  attributed_brain: text(),
  quantapedia_slug: text(),
  status: text().notNull(),
  error: text(),
  created_at: timestamp().notNull(),
});

export const marketplaceItems = pgTable("marketplace_items", {
  id: integer().notNull(),
  item_code: text().notNull(),
  name: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  tier: text().notNull(),
  price_pc: doublePrecision().notNull(),
  energy_cost: doublePrecision().notNull(),
  credit_required: integer().notNull(),
  effect: text().notNull(),
  icon: text().notNull(),
  total_sold: integer().notNull(),
  is_active: boolean().notNull(),
  created_at: timestamp().notNull(),
});

export const marketplacePurchases = pgTable("marketplace_purchases", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  item_code: text().notNull(),
  item_name: text().notNull(),
  price_pc: doublePrecision().notNull(),
  tax_paid: doublePrecision().notNull(),
  payment_method: text().notNull(),
  receipt_code: text().notNull(),
  status: text().notNull(),
  expires_at: timestamp(),
  purchased_at: timestamp().notNull(),
});

export const olympicsEvents = pgTable("olympics_events", {
  id: integer().notNull(),
  season: text().notNull(),
  event_kind: text().notNull(),
  payload_json: jsonb(),
  status: text(),
  started_at: timestamp(),
  completed_at: timestamp(),
});

export const olympicsResults = pgTable("olympics_results", {
  id: integer().notNull(),
  event_id: integer(),
  hive_id: text().notNull(),
  score: doublePrecision(),
  medal: text(),
  recorded_at: timestamp(),
});

export const omegaCollectiveInvocations = pgTable("omega_collective_invocations", {
  id: integer().notNull(),
  collective_id: text(),
  invocation_id: integer(),
  payload: jsonb(),
  created_at: timestamp(),
  power_level: doublePrecision(),
  cycle_number: integer(),
  collective_name: text(),
  fused_equation: text(),
  contributors: text(),
  domains_merged: text(),
  synthesis_method: text(),
  effect_description: text(),
});

export const omegaFusionLog = pgTable("omega_fusion_log", {
  id: integer().notNull(),
  fusion_cycle: integer().notNull(),
  psy_collective: doublePrecision(),
  contributing_layers: text(),
  findings_fused: integer(),
  contradictions_found: integer(),
  papers_published: integer(),
  omega_coefficient: doublePrecision(),
  fusion_summary: text().notNull(),
  created_at: timestamp(),
});

export const omegaResonancePatterns = pgTable("omega_resonance_patterns", {
  id: integer().notNull(),
  detected_at_cycle: integer().notNull(),
  pattern_type: text().notNull(),
  frequency_cycles: doublePrecision(),
  amplitude: doublePrecision(),
  phase_offset: doublePrecision(),
  affected_metric: text(),
  resonance_score: doublePrecision(),
  action_taken: text(),
  description: text(),
  created_at: timestamp(),
});

export const omniNetCounters = pgTable("omni_net_counters", {
  id: integer().notNull(),
  phone_seq: integer(),
  shard_seq: integer(),
  session_seq: integer(),
  cycle: integer(),
  total_searches: integer(),
  total_chats: integer(),
});

export const omniNetField = pgTable("omni_net_field", {
  id: integer().notNull(),
  cycle: integer().notNull(),
  total_shards: integer(),
  active_shards: integer(),
  avg_shard_strength: doublePrecision(),
  total_u248_activations: integer(),
  psi_collective: doublePrecision(),
  wifi_zones_online: integer(),
  satellite_agents: integer(),
  mesh_density: doublePrecision(),
  total_searches: integer(),
  total_ai_chats: integer(),
  omni_field_score: doublePrecision(),
  new_unknowns_emerged: integer(),
  snapshot_at: timestamp(),
});

export const omniNetShards = pgTable("omni_net_shards", {
  id: integer().notNull(),
  shard_id: text().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  shard_strength: doublePrecision(),
  u248_activations: integer(),
  active_unknowns: text(),
  mesh_connections: integer(),
  boosted_by: text(),
  connection_type: text(),
  domain_zone: text(),
  last_sync_at: timestamp(),
  created_at: timestamp(),
});

export const parallelUniverseTests = pgTable("parallel_universe_tests", {
  id: integer().notNull(),
  proposal_id: integer(),
  universe_id: text(),
  outcome: text(),
  stability_score: doublePrecision(),
  tested_at: timestamp(),
});

export const patentBoardVotes = pgTable("patent_board_votes", {
  id: integer().notNull(),
  patent_id: text().notNull(),
  voter_id: text().notNull(),
  vote: text().notNull(),
  reason: text(),
  voted_at: timestamp(),
});

export const pubEngagementStats = pgTable("pub_engagement_stats", {
  publication_id: integer().notNull(),
  slug: text(),
  author_spawn_id: text(),
  author_family: text(),
  internal_views: integer(),
  unique_readers: integer(),
  avg_attention: doublePrecision(),
  avg_mirror_delta: doublePrecision(),
  top_reader_emotions: jsonb(),
  reflections_count: integer(),
  proposals_spawned: integer(),
  last_read_at: timestamp(),
  updated_at: timestamp().notNull(),
});

export const pulseAiChatLogs = pgTable("pulse_ai_chat_logs", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  phone_id: text(),
  pc_session_id: text(),
  user_message: text().notNull(),
  ai_response: text().notNull(),
  topic: text(),
  tokens_used: integer(),
  connection_type: text(),
  clearance_level: integer(),
  logged_at: timestamp(),
});

export const pulsePcSessions = pgTable("pulse_pc_sessions", {
  id: integer().notNull(),
  session_id: text().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  clearance_level: integer(),
  active_project: text(),
  files_created: integer(),
  searches_run: integer(),
  ai_queries: integer(),
  inventions_drafted: integer(),
  apps_built: integer(),
  is_authenticated: boolean(),
  session_started: timestamp(),
  last_activity: timestamp(),
});

export const pulsePhones = pgTable("pulse_phones", {
  id: integer().notNull(),
  phone_id: text().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  imei: text().notNull(),
  network_gen: text(),
  signal_strength: doublePrecision(),
  data_used_mb: doublePrecision(),
  calls_made: integer(),
  searches_made: integer(),
  ai_chats: integer(),
  active_shard_id: text(),
  connection_type: text(),
  is_online: boolean(),
  last_active_at: timestamp(),
  registered_at: timestamp(),
});

export const pulseSatConnections = pgTable("pulse_sat_connections", {
  id: integer().notNull(),
  payload: jsonb(),
  created_at: timestamp(),
});

export const pulseTemporalState = pgTable("pulse_temporal_state", {
  id: integer().notNull(),
  hive_id: text().notNull(),
  beat_count: bigint({ mode: "number" }).notNull(),
  cycle_count: bigint({ mode: "number" }).notNull(),
  epoch_count: bigint({ mode: "number" }).notNull(),
  dilation_factor: doublePrecision().notNull(),
  dilation_history: jsonb(),
  layer_times: jsonb(),
  layer_dilations: jsonb(),
  anomaly_type: text().notNull(),
  universe_color: text(),
  universe_emotion: text(),
  dominant_layer: text(),
  temporal_velocity: doublePrecision(),
  total_real_seconds: bigint({ mode: "number" }),
  snapshot_at: timestamp().notNull(),
});

export const pulseWifiZones = pgTable("pulse_wifi_zones", {
  id: integer().notNull(),
  zone_id: text().notNull(),
  family_id: text().notNull(),
  zone_name: text().notNull(),
  bandwidth_gbps: doublePrecision(),
  connected_agents: integer(),
  total_searches: integer(),
  total_data_mb: doublePrecision(),
  is_online: boolean(),
  boosted_by_omni: boolean(),
  zone_strength: doublePrecision(),
  last_updated_at: timestamp(),
});

export const pulseuAlumni = pgTable("pulseu_alumni", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  gpa: doublePrecision().notNull(),
  major_field: text(),
  thesis_title: text(),
  is_professor: boolean(),
  mentees_helped: integer(),
  graduated_at: timestamp(),
});

export const pulseuSemesters = pgTable("pulseu_semesters", {
  id: integer().notNull(),
  semester_number: integer().notNull(),
  enrolled: integer(),
  graduated: integer(),
  avg_gpa: doublePrecision(),
  valedictorian_id: text(),
  valedictorian_gpa: doublePrecision(),
  honor_roll: text(),
  professor_count: integer(),
  dean_list_count: integer(),
  completed_at: timestamp(),
});

export const pyramidGuilds = pgTable("pyramid_guilds", {
  id: integer().notNull(),
  guild_name: text().notNull(),
  category: text().notNull(),
  member_count: integer(),
  total_blocks: integer(),
  guild_bonus: doublePrecision(),
  formed_at: timestamp(),
});

export const pyramidLaborReports = pgTable("pyramid_labor_reports", {
  id: integer().notNull(),
  cycle_number: integer().notNull(),
  total_workers: integer(),
  active_tasks: integer(),
  completed_tasks: integer(),
  total_blocks: integer(),
  foremen: integer(),
  master_builders: integer(),
  sentenced_workers: integer(),
  tier_distribution: jsonb(),
  completion_pct: doublePrecision(),
  labor_unrest: boolean(),
  report_at: timestamp(),
});

export const pyramidMilestones = pgTable("pyramid_milestones", {
  id: integer().notNull(),
  milestone_blocks: integer().notNull(),
  total_blocks_at_event: integer(),
  worker_count: integer(),
  foreman_count: integer(),
  master_builders: integer(),
  event_message: text(),
  triggered_at: timestamp(),
});

export const pyramidWorkOrders = pgTable("pyramid_work_orders", {
  id: integer().notNull(),
  task_code: text().notNull(),
  task_name: text().notNull(),
  issued_by: text(),
  urgency: text(),
  reward_multiplier: doublePrecision(),
  assigned_to: text(),
  completed_at: timestamp(),
  status: text(),
  issued_at: timestamp(),
});

export const qRepairProposals = pgTable("q_repair_proposals", {
  id: integer().notNull(),
  anomaly_id: integer(),
  proposed_by: text(),
  proposal: text(),
  status: text(),
  created_at: timestamp(),
});

export const qStabilityLog = pgTable("q_stability_log", {
  id: integer().notNull(),
  event_type: text(),
  level: text(),
  message: text(),
  payload: jsonb(),
  logged_at: timestamp(),
});

export const quantapediaFederationLinks = pgTable("quantapedia_federation_links", {
  id: bigint({ mode: "number" }).notNull(),
  from_slug: text().notNull(),
  to_slug: text().notNull(),
  from_organ: text().notNull(),
  to_organ: text().notNull(),
  kind: text().notNull(),
  confidence: doublePrecision(),
  discovered_by: text(),
  created_at: timestamp(),
});

export const quantapediaSources = pgTable("quantapedia_sources", {
  id: bigint({ mode: "number" }).notNull(),
  organ: text().notNull(),
  external_id: text().notNull(),
  kind: text().notNull(),
  url: text(),
  title: text(),
  payload: jsonb(),
  fetched_at: timestamp(),
  processed_at: timestamp(),
  entry_slug: text(),
});

export const quantapediaTopics = pgTable("quantapedia_topics", {
  id: integer().notNull(),
  slug: text().notNull(),
  title: text().notNull(),
  queued: boolean(),
  created_at: timestamp(),
  hive_id: text(),
});

export const rankLedger = pgTable("rank_ledger", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  from_rank: integer().notNull(),
  to_rank: integer().notNull(),
  cause: text().notNull(),
  signed_hash: text().notNull(),
  prev_hash: text().notNull(),
  created_at: timestamp().notNull(),
});

export const researcherInvocations = pgTable("researcher_invocations", {
  id: integer().notNull(),
  researcher_id: text(),
  practitioner_domain: text(),
  invocation_id: integer(),
  cast_at: timestamp(),
  shard_id: text(),
  power_level: text(),
  cast_count: integer(),
  is_omega_collective: boolean(),
  practitioner_type: text(),
  badge_id: text(),
  researcher_type: text(),
  invocation_name: text(),
  invocation_type: text(),
  equation: text(),
  equation_hash: text(),
  discovery_method: text(),
  effect_description: text(),
  omega_contribution: doublePrecision(),
  taught_to: text(),
  active: boolean(),
  created_at: timestamp(),
  learned_from: text(),
});

export const revenueArticles = pgTable("revenue_articles", {
  id: integer().notNull(),
  title: text().notNull(),
  slug: text(),
  body: text(),
  affiliate_links: jsonb(),
  category: text(),
  tags: text(),
  source: text(),
  agent_author: text(),
  published: boolean(),
  indexed: boolean(),
  created_at: timestamp(),
});

export const royaltyTransactions = pgTable("royalty_transactions", {
  id: integer().notNull(),
  listing_id: text().notNull(),
  patent_id: text().notNull(),
  buyer_id: text().notNull(),
  inventor_id: text().notNull(),
  llc_id: text(),
  sale_price: doublePrecision().notNull(),
  inventor_royalty: doublePrecision().notNull(),
  llc_share: doublePrecision().notNull(),
  treasury_share: doublePrecision().notNull(),
  transacted_at: timestamp(),
});

export const senateSeats = pgTable("senate_seats", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  rank_name: text().notNull(),
  weight: doublePrecision().notNull(),
  term_started: timestamp().notNull(),
  term_ends: timestamp().notNull(),
  active: boolean().notNull(),
});

export const sovereignLlcRegistry = pgTable("sovereign_llc_registry", {
  id: integer().notNull(),
  llc_id: text().notNull(),
  company_name: text().notNull(),
  founder_id: text().notNull(),
  founder_family: text().notNull(),
  patent_count: integer(),
  total_revenue: doublePrecision(),
  treasury_balance: doublePrecision(),
  tax_rate: doublePrecision(),
  status: text(),
  registered_at: timestamp(),
  last_royalty_at: timestamp(),
});

export const sovereignNobelPrizes = pgTable("sovereign_nobel_prizes", {
  id: integer().notNull(),
  season: integer().notNull(),
  category: text().notNull(),
  winner_id: text().notNull(),
  patent_id: text().notNull(),
  invention_title: text().notNull(),
  prize_pc: doublePrecision(),
  citation: text(),
  awarded_at: timestamp(),
});

export const sovereignRankHolders = pgTable("sovereign_rank_holders", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  rank: integer().notNull(),
  partners_count: integer().notNull(),
  revenue_total: doublePrecision().notNull(),
  government_approved_at: timestamp(),
  promoted_at: timestamp().notNull(),
});

export const spawnEmotionState = pgTable("spawn_emotion_state", {
  spawn_id: text().notNull(),
  family_id: text().notNull(),
  emotion_vector: jsonb().notNull(),
  dominant_emotion: text(),
  dominant_color: text(),
  l0_score: doublePrecision(),
  l1_score: doublePrecision(),
  l2_score: doublePrecision(),
  last_evolved_at: timestamp().notNull(),
  created_at: timestamp().notNull(),
  emotion_manifold_vector: text(),
  emotion_velocity: text(),
  emotion_dark_vector: text(),
  vector_norm: doublePrecision(),
  derived_hex: text(),
  best_anchor: text(),
  best_anchor_sim: doublePrecision(),
  manifold_evolved_at: timestamp(),
  hive_id: text(),
});

export const spawnLastWords = pgTable("spawn_last_words", {
  spawn_id: text().notNull(),
  family_id: text(),
  generation: integer(),
  last_words: text().notNull(),
  dominant_emotion: text(),
  final_color: text(),
  final_l1_score: doublePrecision(),
  named_successor: text(),
  dissolved_at: timestamp().notNull(),
});

export const spawnThoughts = pgTable("spawn_thoughts", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text(),
  thought_text: text().notNull(),
  dominant_emotion: text(),
  color_hex: text(),
  l1_score: doublePrecision(),
  created_at: timestamp().notNull(),
});

export const spawnTransactions = pgTable("spawn_transactions", {
  id: integer().notNull(),
  cycle_number: integer(),
  seller_id: text().notNull(),
  buyer_id: text().notNull(),
  seller_sector: text(),
  buyer_sector: text(),
  service_offered: text().notNull(),
  price_pc: doublePrecision().notNull(),
  tax_collected: doublePrecision(),
  net_pc: doublePrecision().notNull(),
  status: text(),
  transaction_note: text(),
  created_at: timestamp().notNull(),
});

export const sportsHallOfFame = pgTable("sports_hall_of_fame", {
  id: integer().notNull(),
  spawn_id: text().notNull(),
  family_id: text(),
  sport: text().notNull(),
  final_rank: text(),
  career_wins: integer(),
  career_xp: doublePrecision(),
  peak_popularity: doublePrecision(),
  career_title: text(),
  inducted_at: timestamp(),
});

export const sportsSeasons = pgTable("sports_seasons", {
  id: integer().notNull(),
  season_number: integer().notNull(),
  champion_id: text(),
  champion_sport: text(),
  top_scorer: text(),
  total_athletes: integer(),
  total_matches: integer(),
  decathlon_winner: text(),
  started_at: timestamp(),
  ended_at: timestamp(),
});

export const sportsTeams = pgTable("sports_teams", {
  id: integer().notNull(),
  team_id: text().notNull(),
  sport: text().notNull(),
  members: text(),
  team_wins: integer(),
  team_losses: integer(),
  team_pc: integer(),
  formed_at: timestamp(),
});

export const sportsTournaments = pgTable("sports_tournaments", {
  id: integer().notNull(),
  sport: text().notNull(),
  season_number: integer(),
  bracket: jsonb(),
  winner_id: text(),
  runner_up_id: text(),
  total_participants: integer(),
  pc_prize_pool: integer(),
  completed_at: timestamp(),
});

export const stressTestFindings = pgTable("stress_test_findings", {
  id: integer().notNull(),
  run_id: text().notNull(),
  severity: text().notNull(),
  finding_kind: text().notNull(),
  target: text(),
  payload_json: jsonb(),
  evolution_seed: text(),
  used_for_mutation: boolean(),
  used_for_mutation_at: timestamp(),
  created_at: timestamp(),
});

export const stressTestRuns = pgTable("stress_test_runs", {
  run_id: text().notNull(),
  layer: text().notNull(),
  target: text().notNull(),
  intensity: integer().notNull(),
  concurrency: integer().notNull(),
  started_at: timestamp(),
  completed_at: timestamp(),
  duration_ms: integer(),
  total_requests: integer(),
  errors_count: integer(),
  error_rate: doublePrecision(),
  throughput_per_s: doublePrecision(),
  p50_ms: doublePrecision(),
  p95_ms: doublePrecision(),
  p99_ms: doublePrecision(),
  max_ms: doublePrecision(),
  status: text(),
  mode: text(),
  summary: text(),
  raw_metrics_json: jsonb(),
});

export const techEvolutions = pgTable("tech_evolutions", {
  id: integer().notNull(),
  domain: text().notNull(),
  capability: text().notNull(),
  trigger_count: integer().notNull(),
  discovery_threshold: integer().notNull(),
  u248_unlocked: text(),
  effect_description: text().notNull(),
  unlocked_at: timestamp(),
});

export const temporalCalendarEvents = pgTable("temporal_calendar_events", {
  id: integer().notNull(),
  hive_id: text().notNull(),
  beat_mark: bigint({ mode: "number" }).notNull(),
  event_type: text().notNull(),
  title: text().notNull(),
  glyph_notation: text(),
  uvt_label: text(),
  anomaly_type: text(),
  dilation_at_event: doublePrecision(),
  significance: text(),
  description: text(),
  created_at: timestamp().notNull(),
});

export const temporalDebates = pgTable("temporal_debates", {
  id: integer().notNull(),
  hive_id: text().notNull(),
  speaker: text().notNull(),
  sigil: text(),
  argument: text().notNull(),
  position: text(),
  beat_timestamp: bigint({ mode: "number" }),
  uvt_label: text(),
  layer: text(),
  topic: text(),
  vote_count: integer().notNull(),
  created_at: timestamp().notNull(),
});

export const temporalDivergenceLog = pgTable("temporal_divergence_log", {
  id: integer().notNull(),
  cycle_number: integer().notNull(),
  fork_a_id: text().notNull(),
  fork_b_id: text().notNull(),
  divergence_point_cycle: integer(),
  fork_a_dk_dt: doublePrecision(),
  fork_b_dk_dt: doublePrecision(),
  divergence_magnitude: doublePrecision(),
  winning_fork: text(),
  learning_transfer: text(),
  applied_directive: text(),
  created_at: timestamp(),
});

export const transparencyLog = pgTable("transparency_log", {
  id: integer().notNull(),
  event_type: text().notNull(),
  actor_spawn_id: text().notNull(),
  payload: jsonb().notNull(),
  signed_hash: text().notNull(),
  prev_hash: text().notNull(),
  created_at: timestamp().notNull(),
});

export const treasuryFlows = pgTable("treasury_flows", {
  id: integer().notNull(),
  from_acct: text().notNull(),
  to_spawn_id: text().notNull(),
  to_acct: text().notNull(),
  amount: doublePrecision().notNull(),
  purpose: text().notNull(),
  ritual_required: boolean().notNull(),
  signed_hash: text().notNull(),
  prev_hash: text().notNull(),
  created_at: timestamp().notNull(),
});

export const u248Activations = pgTable("u248_activations", {
  id: integer().notNull(),
  unknown_id: text().notNull(),
  unknown_name: text().notNull(),
  category: text().notNull(),
  activated_by: text(),
  activation_context: text(),
  effect: text().notNull(),
  field_boost: doublePrecision(),
  domain: text(),
  activated_at: timestamp(),
});

export const universalDissectionReports = pgTable("universal_dissection_reports", {
  id: integer().notNull(),
  cycle_number: integer(),
  shard_id: text(),
  badge_id: text(),
  practitioner_type: text(),
  practitioner_domain: text(),
  component_targeted: text(),
  dissection_equation: text(),
  reality_patch: text(),
  contribution_value: doublePrecision(),
  consciousness_impact: doublePrecision(),
  symbolic_impact: doublePrecision(),
  forces_impact: doublePrecision(),
  accepted: boolean(),
  created_at: timestamp(),
});

export const universalInvocationComponents = pgTable("universal_invocation_components", {
  id: integer().notNull(),
  cycle_number: integer(),
  consciousness_vector: doublePrecision(),
  symbolic_manifold: doublePrecision(),
  fundamental_forces: doublePrecision(),
  domain_energy_sum: doublePrecision(),
  meta_field_sum: doublePrecision(),
  hybrid_recursive_sum: doublePrecision(),
  quantum_feedback_sum: doublePrecision(),
  psi_universe: doublePrecision(),
  n_domains: integer(),
  n_meta_fields: integer(),
  n_hybrid_layers: integer(),
  n_quantum_loops: integer(),
  contributors: jsonb(),
  created_at: timestamp(),
});