import { TRPCError } from "@trpc/server";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { z } from "zod";

import { ENV } from "./_core/env";
import { storageCreateUploadUrl, storageGetSignedUrl, storagePut } from "./storage";

const REPLICATE_API = "https://api.replicate.com/v1";
const SADTALKER_VERSION = ENV.replicateSadTalkerVersion;
const VIDEO_RETALKING_VERSION = ENV.replicateVideoRetalkingVersion;
const execFileAsync = promisify(execFile);

const uploadInput = z.object({
  fileName: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(1).max(120),
  mediaType: z.enum(["image", "video", "audio"]),
});

const renderInput = z.object({
  sourceKey: z.string().trim().min(1).max(300).optional(),
  sourceUrl: z.string().url().max(2000).optional(),
  audioKey: z.string().trim().min(1).max(300).optional(),
  audioUrl: z.string().url().max(2000).optional(),
  sourceType: z.enum(["image", "video"]),
  style: z.enum(["Natural", "Expressive", "Calm"]),
  intensity: z.enum(["Low", "Balanced", "High"]),
  trimStart: z.number().min(0).max(1),
  trimEnd: z.number().min(0).max(1),
  videoTrimStart: z.number().min(0).max(1),
  videoTrimEnd: z.number().min(0).max(1),
}).superRefine((input, ctx) => {
  if (!input.sourceKey && !input.sourceUrl) ctx.addIssue({ code: "custom", path: ["sourceKey"], message: "A source image key or URL is required" });
  if (!input.audioKey && !input.audioUrl) ctx.addIssue({ code: "custom", path: ["audioKey"], message: "An audio key or URL is required" });
  if (input.videoTrimEnd <= input.videoTrimStart) ctx.addIssue({ code: "custom", path: ["videoTrimEnd"], message: "Video trim end must be after the start" });
});

export type LipSyncStatus = "queued" | "processing" | "succeeded" | "failed" | "canceled";

function getOrigin(req: { protocol?: string; headers: Record<string, string | string[] | undefined>; get?: (name: string) => string | undefined }) {
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

async function replicateFetch(path: string, init?: RequestInit) {
  if (!ENV.replicateApiToken) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "REPLICATE_API_TOKEN is not configured" });
  }

  const response = await fetch(`${REPLICATE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ENV.replicateApiToken}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    const code = response.status === 401 || response.status === 403 ? "UNAUTHORIZED" : "BAD_GATEWAY";
    throw new TRPCError({ code, message: `Replicate request failed (${response.status}): ${details.slice(0, 500)}` });
  }
  return response;
}

function normalizeStatus(status: string): LipSyncStatus {
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "canceled") return "canceled";
  if (status === "processing") return "processing";
  return "queued";
}

function normalizeOutput(output: unknown) {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.find((value) => typeof value === "string") ?? null;
  if (output && typeof output === "object" && "url" in output && typeof output.url === "string") return output.url;
  return null;
}

function expressionScale(style: z.infer<typeof renderInput>["style"], intensity: z.infer<typeof renderInput>["intensity"]) {
  const base = style === "Expressive" ? 1.25 : style === "Calm" ? 0.82 : 1;
  const multiplier = intensity === "High" ? 1.18 : intensity === "Low" ? 0.86 : 1;
  return Number((base * multiplier).toFixed(2));
}

export function buildSadTalkerInput(input: z.infer<typeof renderInput>, sourceUrl: string, audioUrl: string) {
  return {
    source_image: sourceUrl,
    driven_audio: audioUrl,
    use_enhancer: true,
    pose_style: 0,
    expression_scale: expressionScale(input.style, input.intensity),
    use_eyeblink: true,
    preprocess: "crop",
    size_of_image: 256,
    facerender: "facevid2vid",
    still_mode: input.style === "Calm",
  } as const;
}

function buildVideoRetalkingInput(sourceUrl: string, audioUrl: string) {
  return {
    face: sourceUrl,
    input_audio: audioUrl,
  } as const;
}

async function prepareVideoForInference(sourceUrl: string, startRatio: number, endRatio: number) {
  if (startRatio <= 0 && endRatio >= 1) return sourceUrl;
  if (!ffmpegPath || !ffprobeStatic.path) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Video trimming is unavailable in this deployment" });
  }

  const workspace = await mkdtemp(join(tmpdir(), "natural-lipsync-"));
  const sourcePath = join(workspace, "source.mp4");
  const outputPath = join(workspace, "trimmed.mp4");
  try {
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) throw new TRPCError({ code: "BAD_GATEWAY", message: "Could not download the uploaded video for trimming" });
    await writeFile(sourcePath, Buffer.from(await sourceResponse.arrayBuffer()));

    const { stdout } = await execFileAsync(ffprobeStatic.path, [
      "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", sourcePath,
    ], { timeout: 30_000 });
    const duration = Number(stdout.trim());
    if (!Number.isFinite(duration) || duration <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Could not read the uploaded video's duration" });

    const startSeconds = Math.max(0, Math.min(duration, duration * startRatio));
    const endSeconds = Math.max(startSeconds + 0.05, Math.min(duration, duration * endRatio));
    await execFileAsync(ffmpegPath, [
      "-y", "-ss", String(startSeconds), "-i", sourcePath, "-t", String(endSeconds - startSeconds),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", outputPath,
    ], { timeout: 120_000, maxBuffer: 5 * 1024 * 1024 });

    const uploaded = await storagePut(`lipsync-clips/${Date.now()}-trimmed.mp4`, await readFile(outputPath), "video/mp4");
    return storageGetSignedUrl(uploaded.key);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

export async function prepareUpload(req: Parameters<typeof getOrigin>[0], input: z.infer<typeof uploadInput>) {
  const origin = getOrigin(req);
  const key = `lipsync-inputs/${Date.now()}-${safeFileName(input.fileName)}`;
  const { key: storedKey, uploadUrl } = await storageCreateUploadUrl(key, input.contentType);
  return {
    key: storedKey,
    uploadUrl,
    fileUrl: absoluteStorageUrl(origin, storedKey),
    mediaType: input.mediaType,
  };
}

export async function createPrediction(input: z.infer<typeof renderInput>) {
  const sourceUrl = input.sourceUrl ?? (input.sourceKey ? await storageGetSignedUrl(input.sourceKey) : null);
  const audioUrl = input.audioUrl ?? (input.audioKey ? await storageGetSignedUrl(input.audioKey) : null);
  if (!sourceUrl || !audioUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Both source media and audio are required" });

  const inferenceSourceUrl = input.sourceType === "video"
    ? await prepareVideoForInference(sourceUrl, input.videoTrimStart, input.videoTrimEnd)
    : sourceUrl;
  const isVideoSource = input.sourceType === "video";
  const response = await replicateFetch("/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isVideoSource ? {
      version: VIDEO_RETALKING_VERSION,
      input: buildVideoRetalkingInput(inferenceSourceUrl, audioUrl),
    } : {
      version: SADTALKER_VERSION,
      input: buildSadTalkerInput(input, inferenceSourceUrl, audioUrl),
    }),
  });
  const data = (await response.json()) as { id: string; status: string; created_at?: string };
  return {
    jobId: data.id,
    status: normalizeStatus(data.status),
    createdAt: data.created_at ?? null,
    trimStart: input.trimStart,
    trimEnd: input.trimEnd,
  };
}

export async function getPrediction(jobId: string) {
  const response = await replicateFetch(`/predictions/${encodeURIComponent(jobId)}`);
  const data = (await response.json()) as {
    id: string;
    status: string;
    output?: unknown;
    error?: string | null;
    logs?: string | null;
    metrics?: { predict_time?: number };
  };
  const status = normalizeStatus(data.status);
  return {
    jobId: data.id,
    status,
    progress: status === "succeeded" ? 1 : status === "processing" ? 0.56 : status === "queued" ? 0.12 : 0,
    outputUrl: status === "succeeded" ? normalizeOutput(data.output) : null,
    error: data.error ?? null,
    logs: data.logs ?? null,
    predictTime: data.metrics?.predict_time ?? null,
  };
}

export async function cancelPrediction(jobId: string) {
  await replicateFetch(`/predictions/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
  return { jobId, status: "canceled" as const };
}

export { renderInput, uploadInput };
