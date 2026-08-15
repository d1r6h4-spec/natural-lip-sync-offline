import { describe, expect, it } from "vitest";

describe("Replicate credentials", () => {
  it("can authenticate against the lightweight models endpoint", async () => {
    const token = process.env.REPLICATE_API_TOKEN;
    expect(token, "REPLICATE_API_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.replicate.com/v1/models?limit=1", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    expect(response.status).toBe(200);
  }, 15_000);
});
