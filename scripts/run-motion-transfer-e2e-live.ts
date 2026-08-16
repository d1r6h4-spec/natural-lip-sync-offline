import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPrediction, getPrediction } from "../server/lipsync";
import { storagePut } from "../server/storage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== MEMULAI UJI LIVE INFERENCE MOTION TRANSFER ===");
  const root = process.cwd();
  const assetDir = join(root, "test-assets-motion");

  console.log("Mengunggah test assets ke storage lokal...");
  const target = await storagePut(
    `live-motion-transfer/${Date.now()}-target.png`,
    await readFile(join(assetDir, "target.png")),
    "image/png",
  );
  const motion = await storagePut(
    `live-motion-transfer/${Date.now()}-motion-reference.mp4`,
    await readFile(join(assetDir, "motion-reference.mp4")),
    "video/mp4",
  );
  const audio = await storagePut(
    `live-motion-transfer/${Date.now()}-reference-audio.m4a`,
    await readFile(join(assetDir, "reference-audio.m4a")),
    "audio/mp4",
  );

  console.log("Media berhasil diunggah:", { target: target.key, motion: motion.key, audio: audio.key });

  try {
    console.log("Membuat prediction ke model kwaivgi/kling-v2.6-motion-control...");
    const job = await createPrediction({
      sourceType: "image",
      sourceKey: target.key,
      motionKey: motion.key,
      audioKey: audio.key,
      style: "Natural",
      intensity: "Balanced",
      trimStart: 0,
      trimEnd: 1,
      videoTrimStart: 0,
      videoTrimEnd: 1,
      motionWeight: "Strong",
    });

    console.log("Job berhasil dibuat:", job);

    for (let attempt = 1; attempt <= 30; attempt += 1) {
      await sleep(10_000);
      const status = await getPrediction(job.jobId);
      console.log(`Polling [Attempt ${attempt}]: status = ${status.status}`, status);

      if (status.status === "succeeded") {
        console.log("SUCCESS: Render berhasil diselesaikan oleh provider!", status);
        return;
      }
      if (status.status === "failed" || status.status === "canceled") {
        console.error("FAIL: Render gagal di sisi provider:", status);
        process.exitCode = 2;
        return;
      }
    }

    console.error("TIMEOUT: Render tidak mencapai status terminal dalam 5 menit.");
    process.exitCode = 3;
  } catch (error) {
    console.error("ERROR saat menjalankan live inference:", error);
    process.exitCode = 1;
  }
}

void main();
