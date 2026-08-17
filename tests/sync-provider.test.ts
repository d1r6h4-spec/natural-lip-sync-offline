import { describe, expect, it } from "vitest";

import { normalizeSyncApiKey } from "../server/_core/env";
import { buildSyncGenerationInput } from "../server/lipsync";

describe("Sync Labs provider payload", () => {
  it("removes all whitespace from a dirty Sync Labs API key", () => {
    expect(normalizeSyncApiKey("  sk-test-\nkey\twith spaces  ")).toBe("sk-test-keywithspaces");
    expect(normalizeSyncApiKey("\r\n\tsk-clean\n")).toBe("sk-clean");
  });

  it("builds an image plus audio sync-3 generation request", () => {
    const payload = buildSyncGenerationInput(
      {
        sourceType: "image",
        style: "Natural",
        intensity: "Balanced",
        trimStart: 0,
        trimEnd: 12,
        videoTrimStart: 0,
        videoTrimEnd: 1,
      },
      "https://media.example/source.jpg",
      "https://media.example/audio.mp3",
    );

    expect(payload).toEqual({
      model: "sync-3",
      input: [
        { type: "image", url: "https://media.example/source.jpg" },
        { type: "audio", url: "https://media.example/audio.mp3" },
      ],
      options: { sync_mode: "cut_off" },
    });
  });

  it("uses a video input for video lip-sync", () => {
    const payload = buildSyncGenerationInput(
      {
        sourceType: "video",
        style: "Calm",
        intensity: "Low",
        trimStart: 2,
        trimEnd: 8,
        videoTrimStart: 1,
        videoTrimEnd: 9,
      },
      "https://media.example/source.mp4",
      "https://media.example/audio.m4a",
    );

    expect(payload.input[0]).toEqual({ type: "video", url: "https://media.example/source.mp4" });
    expect(payload.input[1]).toEqual({ type: "audio", url: "https://media.example/audio.m4a" });
  });
});
