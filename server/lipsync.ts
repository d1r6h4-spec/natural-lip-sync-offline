import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { ENV, normalizeSyncApiKey } from "./_core/env";
import { storageCreateUploadUrl, storageGetSignedUrl, storagePut } from "./storage";

const SYNC_API = "https://api.sync.so/v2";
const execFileAsync = promisify(execFile);
const syncJobs = new Map<string, { apiKey: string }>();

export const uploadInput = z.object({
  fileName: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(1).max(120),
  mediaType: z.enum(["image", "video", "audio"]),
});

export const renderInput = z.object({
  sourceKey: z.string().trim().min(1).max(300).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  audioKey: z.string().trim().min(1).max(300).optional(),
  audioUrl: z.string().url().max(2000).optional(),
  motionKey: z.string().trim().min(1).max(300).optional(),
  motionUrl: z.string().url().max(2000).optional(),
  sourceType: z.enum(["image", "video"]),
  style: z.enum(["Natural", "Expressive", "Calm"]),
  intensity: z.enum(["Low", "Balanced", "High"]),
  trimStart: z.number().min(0),
  trimEnd: z.number().min(0),
  videoTrimStart: z.number().min(0),
  videoTrimEnd: z.number().min(0),
  motionWeight: z.enum(["Subtle", "Balanced", "Strong"]).optional(),
  provider: z.literal("sync").optional(),
}).superRefine((input, ctx) => {
  if (!input.sourceKey && !input.sourceUrl) ctx.addIssue({ code: "custom", path: ["sourceKey"], message: "A source image key or URL is required" });
  if (!input.audioKey && !input.audioUrl) ctx.addIssue({ code: "custom", path: ["audioKey"], message: "An audio key or URL is required" });
  if (input.videoTrimEnd <= input.videoTrimStart) ctx.addIssue({ code: "custom", path: ["videoTrimEnd"], message: "Video trim end must be after the start" });
  if ((input.motionKey || input.motionUrl) && input.sourceType !== "image") ctx.addIssue({ code: "custom", path: ["motionKey"], message: "Full-body motion transfer requires an image target" });
});

export type LipSyncStatus = "queued" | "processing" | "succeeded" | "failed" | "canceled";

function getOrigin(req: any) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol = String(forwardedProto ?? req.protocol ?? "https").split(",")[0];
  const host = String(forwardedHost ?? req.get?.("host") ?? "").split(",")[0];
  if (!host) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not determine public server origin" });
  return `${protocol}://${host}`;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "media";
}

function absoluteStorageUrl(origin: string, key: string) {
  return `${origin}/manus-storage/${key}`;
}

async function syncFetch(path: string, apiKey: string, init?: RequestInit) {
  const normalizedApiKey = normalizeSyncApiKey(apiKey);
  const response = await fetch(`${SYNC_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": normalizedApiKey,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    const code = response.status === 401 || response.status === 403 ? "UNAUTHORIZED" : response.status === 402 ? "PAYMENT_REQUIRED" : "BAD_GATEWAY";
    throw new TRPCError({ code, message: `Sync Labs request failed (${response.status}): ${details.slice(0, 500)}` });
  }
  return response;
}

function normalizeSyncStatus(status: string): LipSyncStatus {
  switch (status.toUpperCase()) {
    case "COMPLETED": return "succeeded";
    case "FAILED":
    case "REJECTED": return "failed";
    case "PROCESSING": return "processing";
    case "PENDING": return "queued";
    default: return "queued";
  }
}

export function buildSyncGenerationInput(input: z.infer<typeof renderInput>, sourceUrl: string, audioUrl: string) {
  return {
    model: "sync-3",
    input: [
      { type: input.sourceType === "video" ? "video" : "image", url: sourceUrl },
      { type: "audio", url: audioUrl },
    ],
    options: {
      sync_mode: "cut_off",
    },
  };
}



async function probeMediaDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(ffprobeStatic.path, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch {
    return 0;
  }
}

async function prepareVideoForInference(videoUrl: string, trimStart: number, trimEnd: number): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "lipsync-video-"));
  try {
    const inputPath = join(tmpDir, "input.mp4");
    const outputPath = join(tmpDir, "trimmed.mp4");

    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Failed to download source video: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(inputPath, buf);

    const originalDuration = await probeMediaDuration(inputPath);
    const start = Math.max(0, trimStart);
    const end = trimEnd > start ? Math.min(originalDuration || trimEnd, trimEnd) : originalDuration;
    const duration = Math.max(0.5, end - start);

    const ffmpegBinary = ffmpegPath;
    if (!ffmpegBinary) throw new Error("FFmpeg binary is unavailable");
    const args = ["-y", "-ss", start.toFixed(2), "-i", inputPath, "-t", duration.toFixed(2), "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-c:a", "aac", outputPath];
    await execFileAsync(ffmpegBinary, args);

    const trimmedBuffer = await readFile(outputPath);
    const key = `inference/video-${Date.now()}.mp4`;
    const putRes = await storagePut(key, trimmedBuffer, "video/mp4");
    return putRes.url;
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function prepareAudioForInference(audioUrl: string, trimStart: number, trimEnd: number): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "lipsync-audio-"));
  try {
    const inputPath = join(tmpDir, "input.audio");
    const outputPath = join(tmpDir, "trimmed.mp4");

    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error(`Failed to download audio track: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(inputPath, buf);

    const originalDuration = await probeMediaDuration(inputPath);
    const start = Math.max(0, trimStart);
    const end = trimEnd > start ? Math.min(originalDuration || trimEnd, trimEnd) : originalDuration;
    const duration = Math.max(0.5, end - start);

    const ffmpegBinary = ffmpegPath;
    if (!ffmpegBinary) throw new Error("FFmpeg binary is unavailable");
    const args = ["-y", "-ss", start.toFixed(2), "-i", inputPath, "-t", duration.toFixed(2), "-c:a", "aac", "-b:a", "192k", outputPath];
    await execFileAsync(ffmpegBinary, args);

    const trimmedBuffer = await readFile(outputPath);
    const key = `inference/audio-${Date.now()}.mp4`;
    const putRes = await storagePut(key, trimmedBuffer, "audio/mp4");
    return putRes.url;
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function prepareUpload(req: any, input: z.infer<typeof uploadInput>) {
  const origin = getOrigin(req);
  const storedKey = `uploads/${Date.now()}-${safeFileName(input.fileName)}`;
  const upload = await storageCreateUploadUrl(storedKey);
  return {
    key: upload.key,
    uploadUrl: upload.uploadUrl,
    fileUrl: absoluteStorageUrl(origin, upload.key),
    mediaType: input.mediaType,
  };
}

export async function createPrediction(input: z.infer<typeof renderInput>) {
  const sourceUrl = input.sourceUrl ?? (input.sourceKey ? await storageGetSignedUrl(input.sourceKey) : null);
  const audioUrl = input.audioUrl ?? (input.audioKey ? await storageGetSignedUrl(input.audioKey) : null);
  if (!sourceUrl || !audioUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Both source media and audio are required" });

  const activeSyncApiKey = ENV.syncApiKey;
  if (!activeSyncApiKey || activeSyncApiKey.length < 10) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "SYNC_API_KEY is not configured in the server secrets.",
    });
  }

  const inferenceSourceUrl = input.sourceType === "video"
    ? await prepareVideoForInference(sourceUrl, input.videoTrimStart, input.videoTrimEnd)
    : sourceUrl;
  const inferenceAudioUrl = await prepareAudioForInference(audioUrl, input.trimStart, input.trimEnd);

  const response = await syncFetch("/generate", activeSyncApiKey, {
    method: "POST",
    body: JSON.stringify(buildSyncGenerationInput(input, inferenceSourceUrl, inferenceAudioUrl)),
  });

  const data = (await response.json()) as { id?: string; status?: string; createdAt?: string; created_at?: string };
  if (!data.id) throw new TRPCError({ code: "BAD_GATEWAY", message: "Sync Labs did not return a generation ID" });

  syncJobs.set(data.id, { apiKey: activeSyncApiKey });
  return {
    jobId: data.id,
    status: normalizeSyncStatus(data.status ?? "PENDING"),
    createdAt: data.createdAt ?? data.created_at ?? new Date().toISOString(),
    trimStart: input.trimStart,
    trimEnd: input.trimEnd,
  };
}

export async function getPrediction(jobId: string) {
  const syncJob = syncJobs.get(jobId);
  if (syncJob) {
    const response = await syncFetch(`/generate/${encodeURIComponent(jobId)}`, syncJob.apiKey);
    const data = (await response.json()) as {
      id?: string;
      status?: string;
      outputUrl?: string | null;
      outputDuration?: number | null;
      error?: string | null;
      errorCode?: string | null;
    };
    const status = normalizeSyncStatus(data.status ?? "PENDING");
    if (status === "succeeded" || status === "failed" || status === "canceled") {
      syncJobs.delete(jobId);
    }
    return {
      jobId,
      status,
      progress: status === "succeeded" ? 1 : status === "processing" ? 0.56 : status === "queued" ? 0.12 : 0,
      outputUrl: status === "succeeded" ? data.outputUrl ?? null : null,
      error: data.error ?? data.errorCode ?? null,
      logs: null,
      duration: data.outputDuration ?? null,
    };
  }

  throw new TRPCError({ code: "NOT_FOUND", message: `Job ${jobId} not found in Sync Labs session storage` });
}

export async function cancelPrediction(jobId: string) {
  const syncJob = syncJobs.get(jobId);
  if (syncJob) {
    await syncFetch(`/generate/${encodeURIComponent(jobId)}/cancel`, syncJob.apiKey, { method: "POST" });
    syncJobs.delete(jobId);
    return { success: true };
  }
  return { success: true };
}
