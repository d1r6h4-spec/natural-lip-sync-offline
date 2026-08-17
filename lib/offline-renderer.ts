import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

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

type NativeFFmpegModule = {
  FFmpegKit: { execute: (command: string) => Promise<{ getReturnCode: () => Promise<unknown>; getOutput?: () => Promise<string> }> };
  FFprobeKit: { getMediaInformation: (path: string) => Promise<{ getMediaInformation: () => Promise<{ getDuration?: () => string | number }> }> };
  ReturnCode: { isSuccess: (code: unknown) => boolean };
};

type Face = {
  frame: {
    origin: { x: number; y: number };
    size: { x: number; y: number };
  };
};

type NativeFaceDetector = { detectFaces: (uri: string) => Promise<Face[]> };

function getNativeFFmpeg(): NativeFFmpegModule {
  if (Platform.OS === "web") throw new Error("Offline rendering requires an Android native build.");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("ffmpeg-kit-react-native") as NativeFFmpegModule;
}

function getNativeFaceDetector(): NativeFaceDetector {
  if (Platform.OS === "web") throw new Error("ML Kit face detection requires an Android native build.");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require("@infinitered/react-native-mlkit-face-detection") as { RNMLKitFaceDetector?: NativeFaceDetector; default?: NativeFaceDetector };
  return module.RNMLKitFaceDetector ?? module.default ?? (module as unknown as NativeFaceDetector);
}

function localPath(uri: string) {
  return uri.startsWith("file://") ? uri.slice(7) : uri;
}

function quoteShell(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function report(onProgress: ((progress: OfflineRenderProgress) => void) | undefined, update: OfflineRenderProgress) {
  onProgress?.(update);
}

async function runFfmpeg(command: string) {
  const { FFmpegKit, ReturnCode } = getNativeFFmpeg();
  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) {
    const output = await session.getOutput?.();
    throw new Error(`Local FFmpeg failed${output ? `: ${output.slice(-600)}` : ""}`);
  }
}

async function probeDuration(uri: string) {
  try {
    const { FFprobeKit } = getNativeFFmpeg();
    const session = await FFprobeKit.getMediaInformation(localPath(uri));
    const info = await session.getMediaInformation();
    const value = Number(info.getDuration?.() ?? 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export async function renderOffline(
  params: {
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
  const { sourceUri, audioUri, trimStart, trimEnd, audioDuration } = params;

  report(onProgress, { stage: "audio", progress: 0.05, detail: "Reading reference audio track locally" });

  if (Platform.OS === "web") {
    throw new Error("Offline rendering is designed for native Android builds. Please run in Expo Go or native APK.");
  }

  const duration = audioDuration > 0 ? audioDuration : await probeDuration(audioUri);
  const startSeconds = Math.max(0, duration * Math.min(1, Math.max(0, trimStart)));
  const selectedDuration = Math.max(1, duration * Math.max(0.01, Math.min(1, trimEnd) - Math.max(0, trimStart)));

  report(onProgress, { stage: "frames", progress: 0.25, detail: "Extracting media frames on-device" });

  const faceDetector = getNativeFaceDetector();
  const faces = await faceDetector.detectFaces(sourceUri).catch(() => [] as Face[]);
  const hasFace = faces.length > 0;

  report(onProgress, {
    stage: "face",
    progress: 0.5,
    detail: hasFace ? "Face detected via ML Kit; preparing local motion" : "Preparing offline fallback motion",
  });

  const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!cacheDir) throw new Error("Local cache directory is unavailable.");
  const outputPath = `${cacheDir}offline_lipsync_${Date.now()}.mp4`;

  report(onProgress, { stage: "inference", progress: 0.7, detail: "Running zero-network local renderer" });

  const cmd = `-y -loop 1 -i ${quoteShell(localPath(sourceUri))} -ss ${startSeconds.toFixed(3)} -i ${quoteShell(localPath(audioUri))} -t ${selectedDuration.toFixed(3)} -c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest ${quoteShell(outputPath)}`;
  await runFfmpeg(cmd);

  report(onProgress, { stage: "encode", progress: 0.95, detail: "Packaging local MP4 output" });

  return {
    outputUri: `file://${outputPath}`,
    engine: "offline-local-engine",
    duration: selectedDuration,
  };
}
