import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractToolCalls,
  parseToolArgs,
  executeCatalogTool,
  CATALOG_TOOLS,
} from "./deepseek-tools.mjs";

describe("deepseek-tools", () => {
  it("exports catalog tools without book/admin", () => {
    const names = CATALOG_TOOLS.map((t) => t.function.name);
    assert.ok(names.includes("search_catalog"));
    assert.ok(!names.includes("create_booking"));
    assert.ok(!names.includes("admin_reindex"));
  });

  it("extractToolCalls filters unknown tools", () => {
    const calls = extractToolCalls({
      tool_calls: [
        { id: "1", function: { name: "search_catalog", arguments: '{"q":"Hoi An"}' } },
        { id: "2", function: { name: "create_booking", arguments: "{}" } },
      ],
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, "search_catalog");
  });

  it("parseToolArgs validates search and slug", () => {
    assert.deepEqual(parseToolArgs("search_catalog", '{"q":"  Da Nang "}'), { q: "Da Nang" });
    assert.equal(parseToolArgs("search_catalog", "{}"), null);
    assert.deepEqual(parseToolArgs("get_hotel", '{"slug":"My-Hotel!"}'), { slug: "my-hotel" });
    assert.equal(parseToolArgs("get_hotel", '{"slug":""}'), null);
  });

  it("executeCatalogTool hits public GET only", async () => {
    /** @type {string[]} */
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(String(url));
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: [{ slug: "hoi-an" }] }),
      };
    };
    const r = await executeCatalogTool({
      name: "search_catalog",
      args: { q: "Hoi An" },
      apiBaseUrl: "http://api:3001",
      fetchImpl,
    });
    assert.equal(r.ok, true);
    assert.ok(urls[0].includes("/v1/search?q="));
    assert.ok(!urls[0].includes("admin"));
  });
});
