async function verifyProd() {
  const baseUrl = "https://natlipsync-6gf2ddhv.manus.space";
  console.log(`Verifying absolute production endpoint: ${baseUrl}/api/trpc/lipsync.create`);
  try {
    const res = await fetch(`${baseUrl}/api/trpc/lipsync.create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "0": { sourceUrl: "test", audioUrl: "test", sourceType: "image" } }),
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Body preview:", text.substring(0, 200));
    JSON.parse(text);
    console.log("SUCCESS: Production endpoint returns valid JSON!");
  } catch (err) {
    console.error("FAILED to verify production endpoint:", err);
  }
}
verifyProd();
