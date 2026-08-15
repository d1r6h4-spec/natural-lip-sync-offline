import { describe, expect, it } from "vitest";

import { friendlyLipSyncError, isProviderCreditError } from "../lib/lipsync-error";

describe("lip-sync provider errors", () => {
  it("detects Replicate insufficient-credit responses", () => {
    const error = new Error(
      'Replicate request failed (402): {"title":"Insufficient credit","status":402}',
    );

    expect(isProviderCreditError(error)).toBe(true);
    expect(friendlyLipSyncError(error)).toContain("insufficient credit");
  });

  it("keeps useful messages for non-credit failures", () => {
    expect(friendlyLipSyncError(new Error("Network request failed"))).toBe("Network request failed");
    expect(isProviderCreditError(new Error("Network request failed"))).toBe(false);
  });
});
