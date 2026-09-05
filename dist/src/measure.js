import { performance } from "node:perf_hooks";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
const MIN_DURATION_MS = 10_000;
const MAX_DURATION_MS = 30_000;
const MAX_CONNECTIONS = 8;
const INITIAL_CONNECTIONS = 2;
const PROGRESS_INTERVAL_MS = 250;
const STABILITY_WINDOW = 6;
const STABILITY_DELTA_MBPS = 2;
// Keep individual uploads small enough for OCA servers and slow connections;
// workers immediately start another chunk after completion.
const UPLOAD_CHUNK_BYTES = 256 * 1024;
const LATENCY_ATTEMPTS = 3;
const LATENCY_TIMEOUT_MS = 3_000;
export async function measureDownload(targets, options = {}) {
    return measurePhase("download", targets, options);
}
export async function measureUpload(targets, options = {}) {
    return measurePhase("upload", targets, options);
}
export async function measureLatency(targets, options = {}) {
    if (targets.length === 0) {
        return null;
    }
    const requests = Array.from({ length: LATENCY_ATTEMPTS }, (_, attempt) => {
        const target = targets[attempt % targets.length];
        const requestUrl = new URL(rangeTargetUrl(target.url, true));
        return pingRequest(requestUrl.toString(), options.signal);
    });
    const results = await Promise.allSettled(requests);
    if (options.signal?.aborted) {
        throw options.signal.reason instanceof Error ? options.signal.reason : new Error("Prueba cancelada");
    }
    const samples = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
    if (samples.length === 0) {
        return null;
    }
    samples.sort((a, b) => a - b);
    return Math.round(samples[Math.floor(samples.length / 2)] * 10) / 10;
}
async function pingRequest(url, signal) {
    const parsed = new URL(url);
    const requestImpl = parsed.protocol === "https:" ? httpsRequest : httpRequest;
    const startedAt = performance.now();
    return new Promise((resolve, reject) => {
        const request = requestImpl({
            hostname: parsed.hostname,
            port: parsed.port || undefined,
            path: `${parsed.pathname}${parsed.search}`,
            method: "POST",
            headers: {
                "content-length": 0,
                "user-agent": "fast-test-cli/1.0",
                accept: "*/*",
                connection: "close",
            },
            signal,
        }, (response) => {
            response.resume();
            response.once("end", () => {
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300) && response.statusCode !== 304) {
                    reject(new Error(`Ping HTTP ${response.statusCode}`));
                    return;
                }
                resolve(performance.now() - startedAt);
            });
        });
        request.setTimeout(LATENCY_TIMEOUT_MS, () => request.destroy(new Error("Tiempo de espera agotado durante el ping")));
        request.once("error", reject);
        request.end();
    });
}
async function measurePhase(phase, targets, options) {
    if (targets.length === 0) {
        throw new Error("No hay servidores disponibles para medir la velocidad");
    }
    const minDurationMs = options.minDurationMs ?? MIN_DURATION_MS;
    const maxDurationMs = options.maxDurationMs ?? MAX_DURATION_MS;
    if (minDurationMs <= 0 || maxDurationMs < minDurationMs) {
        throw new Error("Duración de prueba inválida");
    }
    const fetchImpl = options.fetchImpl ?? fetch;
    const start = performance.now();
    const controller = new AbortController();
    const relayAbort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", relayAbort, { once: true });
    let totalBytes = 0;
    let lastProgress = start;
    let stopped = false;
    const samples = [];
    const stop = () => {
        stopped = true;
        controller.abort();
    };
    const workers = Array.from({ length: INITIAL_CONNECTIONS }, (_, index) => runWorker(index, phase, targets, fetchImpl, controller.signal, () => stopped, (bytes) => {
        totalBytes += bytes;
    }));
    const interval = setInterval(() => {
        const elapsedMs = performance.now() - start;
        const mbps = speedMbps(totalBytes, elapsedMs);
        if (mbps > 0) {
            samples.push(mbps);
            if (samples.length > STABILITY_WINDOW) {
                samples.shift();
            }
        }
        if (options.onProgress && elapsedMs - (lastProgress - start) >= PROGRESS_INTERVAL_MS) {
            lastProgress = performance.now();
            options.onProgress({ phase, mbps, elapsedMs, bytes: totalBytes });
        }
        if (elapsedMs >= minDurationMs && isStable(samples)) {
            stop();
        }
        if (elapsedMs >= maxDurationMs) {
            stop();
        }
    }, PROGRESS_INTERVAL_MS);
    try {
        await Promise.all(workers);
    }
    finally {
        clearInterval(interval);
        options.signal?.removeEventListener("abort", relayAbort);
    }
    if (options.signal?.aborted) {
        throw options.signal.reason instanceof Error ? options.signal.reason : new Error("Prueba cancelada");
    }
    const elapsedMs = performance.now() - start;
    if (totalBytes === 0) {
        throw new Error(`No se pudieron transferir datos durante la prueba de ${phase}`);
    }
    return { bytes: totalBytes, elapsedMs, mbps: speedMbps(totalBytes, elapsedMs) };
}
async function runWorker(workerIndex, phase, targets, fetchImpl, signal, isStopped, addBytes) {
    let requestIndex = workerIndex;
    while (!isStopped() && !signal.aborted) {
        const target = targets[requestIndex % targets.length];
        requestIndex += MAX_CONNECTIONS;
        try {
            if (phase === "download") {
                await downloadRequest(target.url, fetchImpl, signal, addBytes);
            }
            else {
                await uploadRequest(target.url, signal, addBytes);
            }
        }
        catch (error) {
            if (signal.aborted || isAbortError(error)) {
                return;
            }
            // A single failed connection should not end the complete test. Other
            // workers may still be able to use the selected Netflix server.
            await Promise.resolve();
        }
    }
}
async function downloadRequest(url, fetchImpl, signal, addBytes) {
    const requestUrl = new URL(streamTargetUrl(url));
    const response = await fetchImpl(requestUrl, { signal, cache: "no-store" });
    if (!response.ok || !response.body) {
        throw new Error(`Descarga HTTP ${response.status}`);
    }
    const reader = response.body.getReader();
    try {
        while (!signal.aborted) {
            const chunk = await reader.read();
            if (chunk.done) {
                break;
            }
            addBytes(chunk.value.byteLength);
        }
    }
    finally {
        await reader.cancel().catch(() => undefined);
    }
}
async function uploadRequest(url, signal, addBytes) {
    const payload = Buffer.alloc(UPLOAD_CHUNK_BYTES);
    const parsed = new URL(streamTargetUrl(url));
    const requestImpl = parsed.protocol === "https:" ? httpsRequest : httpRequest;
    await new Promise((resolve, reject) => {
        const request = requestImpl({
            hostname: parsed.hostname,
            port: parsed.port || undefined,
            path: `${parsed.pathname}${parsed.search}`,
            method: "POST",
            headers: {
                "content-type": "application/octet-stream",
                "content-length": payload.byteLength,
                "user-agent": "fast-test-cli/1.0",
                accept: "*/*",
                connection: "close",
            },
            signal,
        }, (response) => {
            response.resume();
            response.once("end", () => {
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300) && response.statusCode !== 304) {
                    reject(new Error(`Subida HTTP ${response.statusCode}`));
                    return;
                }
                addBytes(payload.byteLength);
                resolve();
            });
        });
        request.setTimeout(15_000, () => request.destroy(new Error("Tiempo de espera agotado durante la subida")));
        request.once("error", reject);
        request.end(payload);
    });
}
function speedMbps(bytes, elapsedMs) {
    if (bytes <= 0 || elapsedMs <= 0) {
        return 0;
    }
    return (bytes * 8) / (elapsedMs / 1_000) / 1_000_000;
}
function isStable(samples) {
    if (samples.length < STABILITY_WINDOW) {
        return false;
    }
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    return max - min <= STABILITY_DELTA_MBPS;
}
function isAbortError(error) {
    return error instanceof DOMException && error.name === "AbortError";
}
function rangeTargetUrl(url, zeroByteRange = false) {
    const target = new URL(url);
    if (target.pathname.endsWith("/speedtest")) {
        target.pathname += "/range/";
    }
    else if (target.pathname.endsWith("/speedtest/")) {
        target.pathname += "range/";
    }
    if (zeroByteRange && target.pathname.endsWith("/range/")) {
        target.pathname += "0-0";
    }
    return target.toString();
}
function streamTargetUrl(url) {
    return url;
}
export { speedMbps, isStable };
//# sourceMappingURL=measure.js.map