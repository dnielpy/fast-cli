import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isStable, speedMbps } from "../src/measure.js";
describe("measure helpers", () => {
    it("converts bytes and elapsed time to Mbps", () => {
        assert.equal(speedMbps(125_000_000, 1_000), 1000);
        assert.equal(speedMbps(0, 1_000), 0);
    });
    it("detects a stable window", () => {
        assert.equal(isStable([50, 51, 50.5, 49.8, 50.2, 51.1]), true);
        assert.equal(isStable([50, 51, 50, 49, 60, 51]), false);
        assert.equal(isStable([50, 51]), false);
    });
});
//# sourceMappingURL=measure.test.js.map