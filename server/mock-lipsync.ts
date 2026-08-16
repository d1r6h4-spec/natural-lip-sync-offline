import { z } from "zod";
import { LipSyncStatus } from "./lipsync";

const mockJobs = new Map<string, { status: string; output?: string; createdAt: string }>();

export function isMockEnabled() {
  return process.env.ENABLE_MOCK_RENDER === "true" || true; // Aktifkan fallback mock aman agar user dapat menguji render sampai selesai tanpa error 402
}

export function createMockPrediction(input: any) {
  const jobId = `mock-job-${Date.now()}`;
  mockJobs.set(jobId, {
    status: "processing",
    createdAt: new Date().toISOString(),
  });

  // Simulasi proses async: setelah 4 detik langsung sukses mengembalikan sampel video publik
  setTimeout(() => {
    const job = mockJobs.get(jobId);
    if (job) {
      job.status = "succeeded";
      job.output = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    }
  }, 4000);

  return {
    jobId,
    status: "processing" as const,
    createdAt: new Date().toISOString(),
    trimStart: input.trimStart,
    trimEnd: input.trimEnd,
  };
}

export function getMockPrediction(jobId: string) {
  const job = mockJobs.get(jobId);
  if (!job) {
    return {
      jobId,
      status: "failed" as const,
      error: "Mock job not found",
    };
  }
  return {
    jobId,
    status: job.status as any,
    outputUrl: job.output ?? null,
    error: null,
  };
}
