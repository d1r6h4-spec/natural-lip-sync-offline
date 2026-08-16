async function runTest() {
  const localUrl = "http://127.0.0.1:3000";
  console.log(`[E2E Test] Starting local Express test against ${localUrl}`);

  const payload = {
    0: {
      json: {
        sourceUrl: "https://raw.githubusercontent.com/ajinkya-more/SadTalker/main/examples/source_image/full_body_1.png",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        sourceType: "image",
        style: "Natural",
        intensity: "Balanced",
        trimStart: 0,
        trimEnd: 1,
        videoTrimStart: 0,
        videoTrimEnd: 1,
      },
    },
  };

  const trpcUrl = `${localUrl}/api/trpc/lipsync.create?batch=1`;
  const trpcRes = await fetch(trpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const status = trpcRes.status;
  const contentType = trpcRes.headers.get("content-type") || "";
  const rawText = await trpcRes.text();

  console.log(`[E2E Test] Local Express tRPC Response status: ${status}`);
  console.log(`[E2E Test] Local Express Content-Type: ${contentType}`);
  console.log(`[E2E Test] Local Express Raw Body (first 400 chars): ${rawText.substring(0, 400)}`);
}

runTest().catch((err) => {
  console.error("[E2E Test Fatal]", err);
  process.exit(1);
});
