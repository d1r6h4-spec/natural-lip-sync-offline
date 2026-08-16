import { describe, it, expect } from "vitest";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import http from "http";

describe("API JSON Response Guarantee", () => {
  const app = express();
  app.use(express.json());
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const server = http.createServer(app);

  it("should return JSON for health check", async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const port = address.port;

    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    const contentType = res.headers.get("content-type");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(contentType).toMatch(/application\/json/);
    expect(json.ok).toBe(true);

    server.close();
  });
});
