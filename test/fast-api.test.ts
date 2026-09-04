import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFastApiClient, FastApiError } from "../src/fast-api.js";

describe("fast.com API adapter", () => {
  it("validates and returns server configuration", async () => {
    const client = createFastApiClient({
      endpoint: "https://example.test/speedtest",
      fetchImpl: async () => new Response(JSON.stringify({
        client: { ip: "203.0.113.1" },
        targets: [{ url: "https://server.test/speedtest", location: { city: "Miami", country: "US" } }],
      }), { status: 200 }),
    });
    const config = await client.getConfig();
    assert.equal(config.targets?.[0].url, "https://server.test/speedtest");
  });

  it("rejects malformed server configuration", async () => {
    const client = createFastApiClient({
      fetchImpl: async () => new Response(JSON.stringify({ targets: [] }), { status: 200 }),
    });
    await assert.rejects(client.getConfig(), (error: unknown) => error instanceof FastApiError);
  });
});
