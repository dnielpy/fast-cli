const BIG_DIGITS = {
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
export function formatProgress(update) {
    const label = update.phase === "download" ? "Descarga" : "Subida  ";
    return `${label}: ${formatMbps(update.mbps).padStart(8)} Mbps  (${formatSeconds(update.elapsedMs)})`;
}
export function formatResult(result, verbose = false) {
    const lines = [
        `✓ Descarga: ${formatMbps(result.downloadMbps).padStart(8)} Mbps`,
        result.uploadMbps === null
            ? ""
            : `✓ Subida:   ${formatMbps(result.uploadMbps).padStart(8)} Mbps`,
        result.pingMs === null ? "" : `✓ Ping:     ${formatPing(result.pingMs)}`,
    ].filter(Boolean);
    if (verbose) {
        if (result.serverLocation)
            lines.push(`Servidor:   ${result.serverLocation}`);
        if (result.clientLocation)
            lines.push(`Cliente:    ${result.clientLocation}`);
        if (result.clientIp)
            lines.push(`IP pública: ${result.clientIp}`);
        lines.push(`Duración:   ${formatSeconds(result.durationMs)}`);
    }
    return lines.join("\n");
}
export function formatCenteredProgress(update, columns = 80, rows = 24) {
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
export function formatCenteredResult(result, columns = 80, rows = 24, verbose = false) {
    const content = [
        "RESULTADO FINAL",
        "",
        `Descarga: ${formatMbps(result.downloadMbps)} Mbps`,
        result.uploadMbps === null ? "" : `Subida:   ${formatMbps(result.uploadMbps)} Mbps`,
        result.pingMs === null ? "" : `Ping:     ${formatPing(result.pingMs)}`,
    ];
    if (verbose) {
        content.push("");
        if (result.serverLocation)
            content.push(`Servidor: ${result.serverLocation}`);
        if (result.clientLocation)
            content.push(`Cliente: ${result.clientLocation}`);
        if (result.clientIp)
            content.push(`IP pública: ${result.clientIp}`);
        content.push(`Duración: ${formatSeconds(result.durationMs)}`);
    }
    return centerBlock(content, columns, rows);
}
export function formatJson(result) {
    return JSON.stringify(result, null, 2);
}
function formatMbps(value) {
    return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}
function formatSeconds(milliseconds) {
    return `${(milliseconds / 1_000).toFixed(1)}s`;
}
function formatPing(milliseconds) {
    return `${milliseconds.toFixed(1)} ms`;
}
function bigNumberLines(value) {
    const digits = formatMbps(value).split("").map((digit) => BIG_DIGITS[digit] ?? BIG_DIGITS["0"]);
    return Array.from({ length: 9 }, (_, row) => digits.map((digit) => digit[row]).join(" "));
}
function centerBlock(lines, columns, rows) {
    const verticalPadding = Math.max(0, Math.floor((rows - lines.length) / 2));
    const centered = [
        ...Array.from({ length: verticalPadding }, () => ""),
        ...lines.map((line) => centerLine(line, columns)),
    ];
    return centered.join("\n");
}
function centerLine(line, columns) {
    const padding = Math.max(0, Math.floor((columns - line.length) / 2));
    return `${" ".repeat(padding)}${line}`;
}
