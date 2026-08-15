import { ENV } from "../server/_core/env";

async function validate() {
  console.log("=== VALIDASI KONFIGURASI REPLICATE MOTION CONTROL ===");
  console.log(`Model Identifier: ${ENV.replicateMotionTransferModel}`);
  console.log(`API Token Available: ${Boolean(ENV.replicateApiToken)} (length: ${ENV.replicateApiToken.length})`);

  if (!ENV.replicateApiToken) {
    console.error("ERROR: REPLICATE_API_TOKEN tidak ditemukan di environment.");
    process.exit(1);
  }

  // Uji koneksi ke endpoint model Replicate
  const endpoint = `https://api.replicate.com/v1/models/${ENV.replicateMotionTransferModel}`;
  console.log(`Memeriksa metadata model di: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${ENV.replicateApiToken}`,
        Accept: "application/json",
      },
    });

    console.log(`Response status model metadata: ${response.status} ${response.statusText}`);
    const data = await response.json() as Record<string, unknown>;
    console.log("Metadata model respons:", JSON.stringify(data, null, 2).slice(0, 500));

    if (response.ok) {
      console.log("SUCCESS: Koneksi dan model identifier Replicate valid!");
    } else {
      console.log("WARNING: Model endpoint merespons dengan error (kemungkinan perlu token berhak akses penuh atau kredit provider).");
    }
  } catch (error) {
    console.error("Gagal terhubung ke Replicate API:", error);
  }
}

void validate();
