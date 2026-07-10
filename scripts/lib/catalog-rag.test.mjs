import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { retrieveCatalogContext } from "./catalog-rag.mjs";

describe("catalog-rag", () => {
  it("formats hotel hits into context", async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({
        data: { hotels: [{ name: "Hoi An Riverside", slug: "hoi-an-riverside", priceFromVnd: 1200000 }] },
      }),
    });
    const r = await retrieveCatalogContext("Hoi An", {
      apiBaseUrl: "http://api:3001",
      fetchImpl,
    });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.match(r.context, /Hoi An Riverside/);
      assert.match(r.context, /CATALOG_CONTEXT/);
    }
  });
});
