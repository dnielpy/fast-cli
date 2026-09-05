import { createFastApiClient, formatLocation } from "./fast-api.js";
import { measureDownload, measureLatency, measureUpload } from "./measure.js";
import type { ProgressHandler, SpeedTestResult, TestOptions } from "./types.js";

export async function runSpeedTest(
  options: TestOptions,
  onProgress?: ProgressHandler,
  signal?: AbortSignal,
): Promise<SpeedTestResult> {
  const startedAt = Date.now();
  const config = await createFastApiClient().getConfig(signal);
  const targets = config.targets ?? [];
  const firstTarget = targets[0];
  const pingMs = await measureLatency(targets, { signal });

  const download = await measureDownload(targets, {
    onProgress,
    signal,
  });
  const upload = options.upload
    ? await measureUpload(targets, {
        onProgress,
        signal,
      })
    : null;

  return {
    downloadMbps: roundMbps(download.mbps),
    uploadMbps: upload ? roundMbps(upload.mbps) : null,
    pingMs,
    durationMs: Date.now() - startedAt,
    server: firstTarget?.name ?? firstTarget?.url ?? null,
    serverLocation: formatLocation(firstTarget?.location),
    clientIp: config.client?.ip ?? null,
    clientLocation: formatLocation(config.client?.location),
  };
}

function roundMbps(value: number): number {
  return Math.round(value * 10) / 10;
}
