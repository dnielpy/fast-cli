import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { measureDownload, measureLatency, measureUpload } from "../src/measure.js";
describe("HTTP speed measurement", () => {
    it("measures download and upload against a local HTTP server", async () => {
        const payload = Buffer.alloc(128 * 1024, 7);
        const server = createServer((request, response) => {
            if (request.method === "GET") {
                response.writeHead(200, { "content-type": "application/octet-stream" });
                response.end(payload);
                return;
            }
            request.resume();
            request.on("end", () => {
                response.writeHead(200);
                response.end("ok");
            });
        });
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        assert.equal(typeof address, "object");
        if (!address || typeof address === "string")
            throw new Error("No se pudo abrir el servidor local");
        const targets = [{ url: `http://127.0.0.1:${address.port}/speedtest` }];
        try {
            const download = await measureDownload(targets, { minDurationMs: 300, maxDurationMs: 1_000 });
            const upload = await measureUpload(targets, { minDurationMs: 300, maxDurationMs: 1_000 });
            const ping = await measureLatency(targets);
            assert.ok(download.bytes > 0);
            assert.ok(download.mbps > 0);
            assert.ok(upload.bytes > 0);
            assert.ok(upload.mbps > 0);
            assert.ok(ping !== null && ping >= 0);
        }
        finally {
            await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        }
    });
    it("propagates cancellation to active requests", async () => {
        const server = createServer(() => undefined);
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        assert.equal(typeof address, "object");
        if (!address || typeof address === "string")
            throw new Error("No se pudo abrir el servidor local");
        const controller = new AbortController();
        const test = measureDownload([{ url: `http://127.0.0.1:${address.port}/hanging` }], {
            minDurationMs: 500,
            maxDurationMs: 5_000,
            signal: controller.signal,
        });
        setTimeout(() => controller.abort(new Error("Prueba cancelada")), 50);
        try {
            await assert.rejects(test, /Prueba cancelada/);
        }
        finally {
            await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        }
    });
});
//# sourceMappingURL=integration.test.js.map