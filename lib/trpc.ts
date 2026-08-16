import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const token = await Auth.getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch with robust debug logging for request URL, status, headers, and raw text to catch unexpected HTML/text
        async fetch(url, options) {
          const start = Date.now();
          console.log(`[tRPC Fetch] Request -> URL: ${url}, Method: ${options?.method || "GET"}`);
          try {
            const res = await fetch(url, {
              ...options,
              credentials: "include",
            });
            const status = res.status;
            const contentType = res.headers.get("content-type") || "unknown";
            const text = await res.text();
            console.log(`[tRPC Fetch] Response <- Status: ${status}, Type: ${contentType}, Duration: ${Date.now() - start}ms`);
            console.log(`[tRPC Fetch] Raw Body (first 300 chars): ${text.substring(0, 300)}`);

            // If response is not JSON or starts with HTML/error prefix causing unexpected character 'e', log warning
            if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
              console.warn(`[tRPC Warning] Expected JSON content-type, got: ${contentType}`);
            }

            // Re-create response so downstream can still consume it normally
            return new Response(text, {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
            });
          } catch (err) {
            console.error(`[tRPC Fetch Error] Failed request to ${url}:`, err);
            throw err;
          }
        },
      }),
    ],
  });
}
