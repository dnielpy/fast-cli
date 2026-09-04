import type { ProgressUpdate, SpeedTestResult } from "./types.js";

export function formatProgress(update: ProgressUpdate): string {
  const label = update.phase === "download" ? "Descarga" : "Subida  ";
  return `${label}: ${formatMbps(update.mbps).padStart(8)} Mbps  (${formatSeconds(update.elapsedMs)})`;
}

export function formatResult(result: SpeedTestResult, verbose = false): string {
  const lines = [
    `✓ Descarga: ${formatMbps(result.downloadMbps).padStart(8)} Mbps`,
    result.uploadMbps === null
      ? ""
      : `✓ Subida:   ${formatMbps(result.uploadMbps).padStart(8)} Mbps`,
  ].filter(Boolean);

  if (verbose) {
    if (result.serverLocation) lines.push(`Servidor:   ${result.serverLocation}`);
    if (result.clientLocation) lines.push(`Cliente:    ${result.clientLocation}`);
    if (result.clientIp) lines.push(`IP pública: ${result.clientIp}`);
    lines.push(`Duración:   ${formatSeconds(result.durationMs)}`);
  }
  return lines.join("\n");
}

export function formatJson(result: SpeedTestResult): string {
  return JSON.stringify(result, null, 2);
}

function formatMbps(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}
