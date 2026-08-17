export type OfflineRenderStage = "audio" | "frames" | "face" | "inference" | "encode" | "done";

export type OfflineRenderProgress = {
  stage: OfflineRenderStage;
  progress: number;
  detail: string;
};

export type OfflineRenderResult = {
  outputUri: string;
  engine: string;
  duration: number;
};

export async function renderOffline(
  _params: {
    sourceUri: string;
    sourceType: "image" | "video";
    audioUri: string;
    trimStart: number;
    trimEnd: number;
    audioDuration: number;
    videoTrimStart: number;
    videoTrimEnd: number;
    style: string;
    intensity: string;
  },
  onProgress?: (progress: OfflineRenderProgress) => void,
): Promise<OfflineRenderResult> {
  onProgress?.({ stage: "audio", progress: 0.05, detail: "Preparing offline renderer" });
  throw new Error("Offline rendering requires the Android native build. The browser preview is UI-only.");
}
