import { describe, expect, it } from "vitest";

import { buildMotionTransferInput } from "../server/lipsync";

describe("full-body motion transfer payload", () => {
  it("maps a strong motion request to the provider input contract", () => {
    expect(
      buildMotionTransferInput(
        "https://cdn.example.com/target.png",
        "https://cdn.example.com/movement.mp4",
        "Strong",
      ),
    ).toEqual({
      image: "https://cdn.example.com/target.png",
      video: "https://cdn.example.com/movement.mp4",
      mode: "pro",
      keep_original_sound: false,
    });
  });

  it("uses standard mode when motion strength is omitted or balanced", () => {
    expect(buildMotionTransferInput("https://cdn.example.com/target.png", "https://cdn.example.com/movement.mp4", undefined).mode).toBe("std");
    expect(buildMotionTransferInput("https://cdn.example.com/target.png", "https://cdn.example.com/movement.mp4", "Balanced").mode).toBe("std");
  });
});
