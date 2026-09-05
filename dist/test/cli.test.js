import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpText, parseArgs } from "../src/cli.js";
import { formatCenteredProgress, formatCenteredResult, formatJson, formatProgress } from "../src/format.js";
describe("CLI", () => {
    it("uses download and upload by default", () => {
        assert.deepEqual(parseArgs([]), {
            upload: true,
            verbose: false,
            json: false,
            help: false,
            version: false,
        });
    });
    it("parses supported flags", () => {
        assert.deepEqual(parseArgs(["--download-only", "--json", "--verbose"]), {
            upload: false,
            verbose: true,
            json: true,
            help: false,
            version: false,
        });
    });
    it("rejects unknown flags", () => {
        assert.throws(() => parseArgs(["--wat"]), /Opción desconocida/);
    });
    it("formats progress and JSON output", () => {
        assert.match(formatProgress({ phase: "download", mbps: 87.4, elapsedMs: 1200, bytes: 1 }), /87\.4 Mbps/);
        assert.match(formatCenteredProgress({ phase: "download", mbps: 87.4, elapsedMs: 1200, bytes: 1 }, 80, 24), /DESCARGA/);
        assert.match(formatCenteredProgress({ phase: "download", mbps: 87.4, elapsedMs: 1200, bytes: 1 }, 80, 24), /Tiempo: 1\.2s/);
        assert.match(formatCenteredProgress({ phase: "download", mbps: 87.4, elapsedMs: 1200, bytes: 1 }, 80, 24), /█/);
        assert.match(formatCenteredResult({
            downloadMbps: 87.4,
            uploadMbps: 18.2,
            pingMs: 24.5,
            durationMs: 6000,
            server: null,
            serverLocation: null,
            clientIp: null,
            clientLocation: null,
        }, 80, 24), /RESULTADO FINAL/);
        assert.match(formatCenteredResult({
            downloadMbps: 87.4,
            uploadMbps: 18.2,
            pingMs: 24.5,
            durationMs: 6000,
            server: null,
            serverLocation: null,
            clientIp: null,
            clientLocation: null,
        }, 80, 24), /Ping:.*24\.5 ms/);
        assert.match(formatJson({
            downloadMbps: 87.4,
            uploadMbps: 18.2,
            pingMs: 24.5,
            durationMs: 6000,
            server: "Miami",
            serverLocation: "Miami, US",
            clientIp: null,
            clientLocation: null,
        }), /"downloadMbps": 87\.4/);
    });
    it("contains installation-facing help", () => {
        assert.match(helpText(), /--download-only/);
        assert.match(helpText(), /--json/);
    });
});
//# sourceMappingURL=cli.test.js.map