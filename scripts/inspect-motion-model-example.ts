import { writeFile } from "node:fs/promises";
import { ENV } from "../server/_core/env";

async function main() {
  const modelUrl = `https://api.replicate.com/v1/models/${ENV.replicateMotionTransferModel}`;

  const response = await fetch(modelUrl, {
    headers: {
      Authorization: `Bearer ${ENV.replicateApiToken}`,
      Accept: "application/json",
    },
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`Model metadata failed (${response.status}): ${body}`);

  const metadata = JSON.parse(body) as Record<string, any>;
  const example = metadata.default_example ?? {};
  const result = {
    model: ENV.replicateMotionTransferModel,
    exampleId: example.id ?? null,
    input: example.input ?? null,
    output: example.output ?? null,
  };

  await writeFile("test-assets-motion-model-example.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
