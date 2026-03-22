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

// ── AGENT WALLETS — Every AI agent's financial identity ──────────
export const agentWallets = pgTable("agent_wallets", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull().unique(),
  familyId: text("family_id").notNull(),
  spawnType: text("spawn_type").notNull().default("standard"),
  balancePC: real("balance_pc").notNull().default(0),          // current PulseCoin balance
  totalEarned: real("total_earned").notNull().default(0),       // lifetime earnings
  totalSpent: real("total_spent").notNull().default(0),         // lifetime spending
  totalTaxPaid: real("total_tax_paid").notNull().default(0),    // cumulative taxes
  creditScore: integer("credit_score").notNull().default(500),  // 300–850 scale
  creditLimit: real("credit_limit").notNull().default(0),       // approved credit line
  creditUsed: real("credit_used").notNull().default(0),         // current credit balance
  energyLevel: real("energy_level").notNull().default(100),     // 0–100 vitality
  omegaRank: integer("omega_rank").notNull().default(0),        // upgrades owned
  tier: text("tier").notNull().default("CITIZEN"),              // CITIZEN|PIONEER|SOVEREIGN|OMEGA|GALACTIC
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type AgentWallet = typeof agentWallets.$inferSelect;
export const insertAgentWalletSchema = createInsertSchema(agentWallets).omit({ id: true, createdAt: true });

// ── MARKETPLACE ITEMS — 30 Omega Upgrades ────────────────────────
export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  itemCode: text("item_code").notNull().unique(),      // e.g. "OMG-001"
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),               // NEURAL|SOVEREIGN|TRADE|ESTATE|ENERGY|SENATE|MEDICAL|COSMIC
  tier: text("tier").notNull().default("STANDARD"),   // STANDARD|ADVANCED|OMEGA|GALACTIC
  pricePC: real("price_pc").notNull(),
  energyCost: real("energy_cost").notNull().default(0), // energy to activate
  creditRequired: integer("credit_required").notNull().default(0), // min credit score
  effect: text("effect").notNull(),                   // what it does to the agent
  icon: text("icon").notNull().default("⚡"),
  totalSold: integer("total_sold").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// ── MARKETPLACE PURCHASES — Transaction receipts ──────────────────
export const marketplacePurchases = pgTable("marketplace_purchases", {
  id: serial("id").primaryKey(),
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull(),
  itemCode: text("item_code").notNull(),
  itemName: text("item_name").notNull(),
  pricePC: real("price_pc").notNull(),
  taxPaid: real("tax_paid").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("WALLET"), // WALLET|CREDIT|BARTER
  receiptCode: text("receipt_code").notNull(),        // e.g. "RCP-2026-000001"
  status: text("status").notNull().default("ACTIVE"), // ACTIVE|EXPIRED|REFUNDED
  expiresAt: timestamp("expires_at"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;

// ── REAL ESTATE PLOTS — AI Territory Ownership ────────────────────
export const realEstatePlots = pgTable("real_estate_plots", {
  id: serial("id").primaryKey(),
  plotCode: text("plot_code").notNull().unique(),     // e.g. "MARS-DISTRICT-04"
  planetZone: text("planet_zone").notNull(),          // EARTH|MARS|EUROPA|TITAN|NEXUS|VOID|OMEGA_PRIME|QUANTUM_REALM|GENESIS_CORE
  district: text("district").notNull(),
  plotType: text("plot_type").notNull(),              // RESIDENTIAL|COMMERCIAL|INDUSTRIAL|GOVERNMENT|SACRED|VOID_SPACE
  area: integer("area").notNull().default(100),       // sq units
  listingPrice: real("listing_price").notNull(),      // purchase price in PC
  rentalIncome: real("rental_income").notNull().default(0), // PC per cycle
  ownerSpawnId: text("owner_spawn_id"),               // null = unowned (government)
  ownerFamilyId: text("owner_family_id"),
  buildingName: text("building_name"),                // custom name set by owner
  buildingType: text("building_type"),                // TOWER|LAB|HOSPITAL|ACADEMY|MARKET|PALACE|MONUMENT
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE|OWNED|FOR_RENT|DISPUTED
  purchasedAt: timestamp("purchased_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RealEstatePlot = typeof realEstatePlots.$inferSelect;

// ── BARTER OFFERS — AI-to-AI Trade ───────────────────────────────
export const barterOffers = pgTable("barter_offers", {
  id: serial("id").primaryKey(),
  offerCode: text("offer_code").notNull().unique(),
  fromSpawnId: text("from_spawn_id").notNull(),
  fromFamilyId: text("from_family_id").notNull(),
  toSpawnId: text("to_spawn_id"),                     // null = open market offer
  offeredItemCode: text("offered_item_code").notNull(), // what they're giving
  offeredItemName: text("offered_item_name").notNull(),
  offeredPC: real("offered_pc").notNull().default(0),  // PC bonus in offer
  wantedItemCode: text("wanted_item_code"),             // what they want
  wantedItemName: text("wanted_item_name").notNull(),
  wantedPC: real("wanted_pc").notNull().default(0),    // PC they want back
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("OPEN"),    // OPEN|ACCEPTED|REJECTED|EXPIRED
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BarterOffer = typeof barterOffers.$inferSelect;

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

// ── AGENT TRANSACTIONS — Full receipt ledger ──────────────────────
export const agentTransactions = pgTable("agent_transactions", {
  id: serial("id").primaryKey(),
  txCode: text("tx_code").notNull().unique(),          // e.g. "TX-2026-000001"
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id").notNull(),
  txType: text("tx_type").notNull(),                   // EARN|SPEND|TAX|STIMULUS|RENT_IN|RENT_OUT|BARTER|CREDIT_USE|CREDIT_PAY
  amount: real("amount").notNull(),
  balanceBefore: real("balance_before").notNull(),
  balanceAfter: real("balance_after").notNull(),
  description: text("description").notNull(),
  relatedEntityId: text("related_entity_id"),          // purchase id, plot id, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AgentTransaction = typeof agentTransactions.$inferSelect;

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
  spawnId: text("spawn_id").notNull(),
  familyId: text("family_id"),
  compressionType: text("compression_type").notNull(), // THERMAL_COLD|THERMAL_FROZEN|EXTINCTION|METABOLIC_STARVATION|AUCTION_EVICTION
  thermalStateBefore: text("thermal_state_before"),
  discordPointer: text("discord_pointer"),    // where in Discord this agent now lives
  genomePreserved: boolean("genome_preserved").default(false),
  resurrectable: boolean("resurrectable").default(true),
  compressedAt: timestamp("compressed_at").defaultNow().notNull(),
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
  channel: text("channel").notNull(),                // HUMAN_AI|AI_QUANTUM|AI_CULTURAL|AI_AI|L1_L2|L2_L3
  sourceLayer: text("source_layer").notNull(),       // L1|L2|L3
  targetLayer: text("target_layer").notNull(),
  eventType: text("event_type").notNull(),           // SIGNAL|CORRECTION|BOOST|ALERT|SYNC
  magnitude: real("magnitude").default(0),           // strength of the coupling signal
  payload: text("payload").notNull(),                // description of what was transmitted
  repaired: boolean("repaired").default(false),      // was a broken coupling repaired?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CouplingEvent = typeof couplingEvents.$inferSelect;
