import { QueryClient, QueryFunction } from "@tanstack/react-query";

// When deployed to Cloudflare Pages or GitHub Pages the frontend has no
// co-located backend, so all /api/* calls must go to the Replit origin.
// Set VITE_API_BASE_URL=https://myaigpt.online at build time for those deploys.
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

function resolveUrl(url: string): string {
  if (!API_BASE || url.startsWith("http")) return url;
  return API_BASE + (url.startsWith("/") ? url : "/" + url);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(resolveUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: API_BASE ? "omit" : "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const res = await fetch(resolveUrl(path), {
      credentials: API_BASE ? "omit" : "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
