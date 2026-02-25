import { z } from "zod";
import { insertChatSchema, chats, messages } from "./schema";

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  chats: {
    list: {
      method: 'GET' as const,
      path: '/api/chats' as const,
      responses: {
        200: z.array(z.custom<typeof chats.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/chats' as const,
      input: insertChatSchema,
      responses: {
        201: z.custom<typeof chats.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/chats/:id' as const,
      responses: {
        200: z.custom<typeof chats.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/chats/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/chats/:chatId/messages' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/chats/:chatId/messages' as const,
      input: z.object({
        content: z.string(),
      }),
      responses: {
        200: z.custom<typeof messages.$inferSelect>(), // Returns the newly created assistant message
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
