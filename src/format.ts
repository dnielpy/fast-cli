import type { ProgressUpdate, SpeedTestResult } from "./types.js";

const BIG_DIGITS: Record<string, string[]> = {
  "0": ["  █████  ", " ██   ██ ", "██     ██", "██     ██", "██     ██", "██     ██", "██     ██", " ██   ██ ", "  █████  "],
  "1": ["    ██   ", "  ████   ", "    ██   ", "    ██   ", "    ██   ", "    ██   ", "    ██   ", "    ██   ", " ███████ "],
  "2": [" ██████  ", "██    ██ ", "      ██ ", "     ██  ", "   ███   ", " ██      ", "██       ", "██       ", "████████ "],
  "3": ["███████  ", "      ██ ", "      ██ ", "   ████  ", "      ██ ", "      ██ ", "      ██ ", "      ██ ", "███████  "],
  "4": ["██    ██ ", "██    ██ ", "██    ██ ", "██    ██ ", "████████ ", "      ██ ", "      ██ ", "      ██ ", "      ██ "],
  "5": ["████████ ", "██       ", "██       ", "███████  ", "      ██ ", "      ██ ", "      ██ ", "      ██ ", "███████  "],
  "6": ["  █████  ", " ██      ", "██       ", "██       ", "███████  ", "██    ██ ", "██    ██ ", "██    ██ ", " ██████  "],
  "7": ["████████ ", "      ██ ", "     ██  ", "     ██  ", "    ██   ", "   ██    ", "   ██    ", "  ██     ", "  ██     "],
  "8": ["  █████  ", " ██   ██ ", " ██   ██ ", "  █████  ", " ██   ██ ", "██     ██", "██     ██", " ██   ██ ", "  █████  "],
  "9": ["  █████  ", " ██   ██ ", "██     ██", "██     ██", " ███████ ", "      ██ ", "      ██ ", "     ██  ", " █████   "],
  ".": ["         ", "         ", "         ", "         ", "         ", "         ", "         ", "   ██    ", "   ██    "],
};

export function formatProgress(update: ProgressUpdate): string {
  const label = update.phase === "download" ? "Descarga" : "Subida  ";
  return `${label}: ${formatSpeed(update.mbps).padStart(13)}  (${formatSeconds(update.elapsedMs)})`;
}

export function formatResult(result: SpeedTestResult, verbose = false): string {
  const lines = [
    `✓ Descarga: ${formatSpeed(result.downloadMbps).padStart(13)}`,
    result.uploadMbps === null
      ? ""
      : `✓ Subida:   ${formatSpeed(result.uploadMbps).padStart(13)}`,
    result.pingMs === null ? "" : `✓ Ping:     ${formatPing(result.pingMs)}`,
  ].filter(Boolean);

  if (verbose) {
    if (result.serverLocation) lines.push(`Servidor:   ${result.serverLocation}`);
    if (result.clientLocation) lines.push(`Cliente:    ${result.clientLocation}`);
    if (result.clientIp) lines.push(`IP pública: ${result.clientIp}`);
    lines.push(`Duración:   ${formatSeconds(result.durationMs)}`);
  }
  return lines.join("\n");
}

export function formatCenteredProgress(update: ProgressUpdate, columns = 80, rows = 24): string {
  const phase = update.phase === "download" ? "DESCARGA" : "SUBIDA";
  const content = [
    phase,
    "",
    ...bigNumberLines(update.mbps),
    "",
    `Tiempo: ${formatSeconds(update.elapsedMs)}`,
  ];
  return centerBlock(content, columns, rows);
}

export function formatCenteredResult(result: SpeedTestResult, columns = 80, rows = 24, verbose = false): string {
  const content = [
    "RESULTADO FINAL",
    "",
    `Descarga: ${formatSpeed(result.downloadMbps)}`,
    result.uploadMbps === null ? "" : `Subida:   ${formatSpeed(result.uploadMbps)}`,
    result.pingMs === null ? "" : `Ping:     ${formatPing(result.pingMs)}`,
  ];

  if (verbose) {
    content.push("");
    if (result.serverLocation) content.push(`Servidor: ${result.serverLocation}`);
    if (result.clientLocation) content.push(`Cliente: ${result.clientLocation}`);
    if (result.clientIp) content.push(`IP pública: ${result.clientIp}`);
    content.push(`Duración: ${formatSeconds(result.durationMs)}`);
  }
  return centerBlock(content, columns, rows);
}

export function formatJson(result: SpeedTestResult): string {
  return JSON.stringify(result, null, 2);
}

function formatSpeed(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0.0 Mbps";
  return value < 1 ? `${(value * 1_000).toFixed(0)} Kbps` : `${value.toFixed(1)} Mbps`;
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

function formatPing(milliseconds: number): string {
  return `${milliseconds.toFixed(1)} ms`;
}

function bigNumberLines(value: number): string[] {
  const [number, unit] = formatSpeed(value).split(" ");
  const digits = number.split("").map((digit) => BIG_DIGITS[digit] ?? BIG_DIGITS["0"]);
  return Array.from({ length: 9 }, (_, row) => {
    const line = digits.map((digit) => digit[row]).join(" ");
    return row === 8 ? `${line} ${unit}` : `${line}${" ".repeat(unit.length + 1)}`;
  });
}

function centerBlock(lines: string[], columns: number, rows: number): string {
  const verticalPadding = Math.max(0, Math.floor((rows - lines.length) / 2));
  const centered = [
    ...Array.from({ length: verticalPadding }, () => ""),
    ...lines.map((line) => centerLine(line, columns)),
  ];
  return centered.join("\n");
}

function centerLine(line: string, columns: number): string {
  const padding = Math.max(0, Math.floor((columns - line.length) / 2));
  return `${" ".repeat(padding)}${line}`;
}
