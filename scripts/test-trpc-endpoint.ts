import http from "http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

async function testEndpoint() {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  console.log(`Test server listening on port ${port}`);

  const payload = {
    sourceUrl: "https://example.com/face.jpg",
    audioUrl: "https://example.com/audio.mp3",
    sourceType: "image",
    style: "Natural",
    intensity: "Balanced",
    trimStart: 0,
    trimEnd: 1,
  };

  const url = `http://127.0.0.1:${port}/api/trpc/lipsync.create?batch=1`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "0": payload }),
  });

  const contentType = res.headers.get("content-type");
  const text = await res.text();
  console.log("Response status:", res.status);
  console.log("Content-Type:", contentType);
  console.log("Response body:", text);

  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
    console.log("Successfully parsed JSON response!");
  } catch (e) {
    console.error("FAILED to parse response as JSON:", e);
  }

  server.close();
}

testEndpoint().catch(console.error);
