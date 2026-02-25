import { pgTable, text, serial, timestamp, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull().default('general'), // 'general' or 'coder'
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
