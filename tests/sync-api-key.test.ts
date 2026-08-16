import { describe, expect, it } from "vitest";

describe("Sync Labs API key configuration", () => {
  it("is present as a single-line key accepted by the Sync Labs endpoint", async () => {
    const apiKey = process.env.SYNC_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(apiKey).not.toMatch(/[\r\n\s]/);

    const response = await fetch("https://api.sync.so/v2/generate", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey!,
      },
    });

    // GET may be unsupported by the generation route, but valid credentials must not be rejected as unauthorized.
    expect([401, 403]).not.toContain(response.status);
  }, 15000);
});

export {};

// Keep this test focused on configuration only; it never logs or persists the secret.
