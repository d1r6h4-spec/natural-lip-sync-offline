import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { createPrediction, getPrediction } from "../server/lipsync";
import { storagePut } from "../server/storage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const root = process.cwd();
  const videoPath = join(root, "test-assets/video-retalking-face-1.mp4");
  const audioPath = join(root, "test-assets/video-retalking-audio-1.wav");
  const videoUpload = await storagePut(
    `live-tests/${Date.now()}-video.mp4`,
    await readFile(videoPath),
    "video/mp4",
  );
  const audioUpload = await storagePut(
    `live-tests/${Date.now()}-audio.wav`,
    await readFile(audioPath),
    "audio/wav",
  );

  const job = await createPrediction({
    sourceType: "video",
    sourceKey: videoUpload.key,
    audioKey: audioUpload.key,
    style: "Natural",
    intensity: "Balanced",
    trimStart: 0,
    trimEnd: 1,
    videoTrimStart: 0.2,
    videoTrimEnd: 0.8,
  });

  const report: Record<string, unknown> = {
    input: {
      videoKey: videoUpload.key,
      audioKey: audioUpload.key,
      videoTrimStart: 0.2,
      videoTrimEnd: 0.8,
    },
    job,
    polling: [],
  };

  console.log(JSON.stringify({ phase: "created", job }, null, 2));
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    await sleep(10_000);
    const status = await getPrediction(job.jobId);
    (report.polling as unknown[]).push({ attempt, ...status });
    console.log(JSON.stringify({ phase: "poll", attempt, ...status }, null, 2));
    if (status.status === "succeeded") {
      report.final = status;
      await writeFile(join(root, "test-assets/live-video-lipsync-result.json"), JSON.stringify(report, null, 2));
      return;
    }
    if (status.status === "failed" || status.status === "canceled") {
      report.final = status;
      await writeFile(join(root, "test-assets/live-video-lipsync-result.json"), JSON.stringify(report, null, 2));
      process.exitCode = 2;
      return;
    }
  }

  report.final = { status: "timeout" };
  await writeFile(join(root, "test-assets/live-video-lipsync-result.json"), JSON.stringify(report, null, 2));
  process.exitCode = 3;
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  await writeFile(join(process.cwd(), "test-assets/live-video-lipsync-error.txt"), message);
  process.exitCode = 1;
});
