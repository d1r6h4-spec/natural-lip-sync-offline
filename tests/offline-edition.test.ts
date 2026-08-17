import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("FREE Offline Edition architecture", () => {
  it("does not retain cloud provider tokens in runtime source", () => {
    const runtimeFiles = [
      "app/create.tsx",
      "app/processing.tsx",
      "app/result.tsx",
      "app/(tabs)/index.tsx",
      "app/(tabs)/settings.tsx",
      "lib/offline-renderer.ts",
      "lib/offline-renderer.native.ts",
      "lib/offline-renderer.web.ts",
      "server/_core/env.ts",
      "server/routers.ts",
    ];
    const runtime = runtimeFiles.map(read).join("\n");
    const forbidden = [
      ["api", "sync", "so"],
      ["SYNC", "API", "KEY"],
      ["sync", "3"],
      ["credits"],
      ["billing"],
    ].map((parts: string[]) => parts.join(" ").toLowerCase());
    const normalized = runtime.toLowerCase();
    for (const token of forbidden) expect(normalized).not.toContain(token);
  });

  it("uses local ML Kit face detection and FFmpeg rendering without network calls", () => {
    const renderer = read("lib/offline-renderer.native.ts");
    expect(renderer).toContain("@infinitered/react-native-mlkit-face-detection");
    expect(renderer).toContain("ffmpeg-kit-react-native");
    expect(renderer).toContain('engine: "offline-local-engine"');
    expect(renderer).not.toMatch(/fetch\s*\(|axios\./);
  });

  it("exposes version 2.0.0 FREE Offline Edition", () => {
    const config = read("app.config.ts");
    expect(config).toContain('version: "2.0.0"');
  });
});
