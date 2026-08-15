import { describe, expect, it, vi } from "vitest";

const memoryStore: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => memoryStore[key] ?? null,
    setItem: async (key: string, value: string) => {
      memoryStore[key] = value;
    },
    removeItem: async (key: string) => {
      delete memoryStore[key];
    },
  },
}));

import { saveDraft, getDrafts, deleteDraft } from "../lib/drafts";

describe("local drafts management", () => {
  it("saves and retrieves drafts successfully", async () => {
    const drafts = await saveDraft({
      title: "Test Draft",
      sourceUri: "file:///test.jpg",
      sourceType: "image",
      audioUri: "file:///test.mp3",
      audioName: "Test Audio",
      trimStart: 0,
      trimEnd: 0.5,
      videoTrimStart: 0,
      videoTrimEnd: 1,
      style: "Natural",
      intensity: "Balanced",
    });

    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts[0].title).toBe("Test Draft");

    const fetched = await getDrafts();
    expect(fetched.some((d) => d.title === "Test Draft")).toBe(true);

    const afterDelete = await deleteDraft(drafts[0].id);
    expect(afterDelete.some((d) => d.id === drafts[0].id)).toBe(false);
  });
});
