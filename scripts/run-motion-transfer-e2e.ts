import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { createPrediction, getPrediction } from "../server/lipsync";
import { storagePut } from "../server/storage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const root = process.cwd();
  const assetDir = join(root, "test-assets-motion");
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

  const report: Record<string, unknown> = {
    model: "kwaivgi/kling-v2.6-motion-control",
    input: {
      targetKey: target.key,
      motionKey: motion.key,
      audioKey: audio.key,
      sourceType: "image",
      motionWeight: "Strong",
    },
    polling: [],
  };

  console.log(JSON.stringify({ phase: "uploaded", input: report.input }, null, 2));

  try {
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
    report.job = job;
    console.log(JSON.stringify({ phase: "created", job }, null, 2));

    for (let attempt = 1; attempt <= 40; attempt += 1) {
      await sleep(15_000);
      const status = await getPrediction(job.jobId);
      (report.polling as unknown[]).push({ attempt, ...status });
      console.log(JSON.stringify({ phase: "poll", attempt, ...status }, null, 2));
      if (status.status === "succeeded") {
        report.final = status;
        await writeFile(join(assetDir, "motion-transfer-e2e-result.json"), JSON.stringify(report, null, 2));
        return;
      }
      if (status.status === "failed" || status.status === "canceled") {
        report.final = status;
        await writeFile(join(assetDir, "motion-transfer-e2e-result.json"), JSON.stringify(report, null, 2));
        process.exitCode = 2;
        return;
      }
    }

    report.final = { status: "timeout", message: "Prediction did not reach a terminal status within 10 minutes" };
    await writeFile(join(assetDir, "motion-transfer-e2e-result.json"), JSON.stringify(report, null, 2));
    process.exitCode = 3;
  } catch (error) {
    const detail = error instanceof Error ? error.stack ?? error.message : String(error);
    report.error = detail;
    await writeFile(join(assetDir, "motion-transfer-e2e-error.txt"), detail);
    await writeFile(join(assetDir, "motion-transfer-e2e-result.json"), JSON.stringify(report, null, 2));
    console.error(detail);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
