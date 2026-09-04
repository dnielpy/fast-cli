import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpText, parseArgs } from "../src/cli.js";
import { formatJson, formatProgress } from "../src/format.js";
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
        assert.match(formatJson({
            downloadMbps: 87.4,
            uploadMbps: 18.2,
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