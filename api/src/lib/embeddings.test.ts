import { describe, expect, it } from "vitest";
import { cosineSimilarity, embedText, localHashEmbed } from "./embeddings.js";

describe("embeddings", () => {
  it("localHashEmbed is unit-ish and stable", () => {
    const a = localHashEmbed("Hội An beach hotel");
    const b = localHashEmbed("Hội An beach hotel");
    expect(a).toEqual(b);
    expect(cosineSimilarity(a, a)).toBeGreaterThan(0.99);
  });

  it("similar text scores higher than unrelated", () => {
    const a = localHashEmbed("da nang beach hotel ocean");
    const b = localHashEmbed("da nang ocean resort beach");
    const c = localHashEmbed("quantum physics lecture notes");
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
  });

  it("embedText falls back to local without key", async () => {
    const prev = process.env.EMBEDDING_API_KEY;
    const prev2 = process.env.OPENAI_API_KEY;
    delete process.env.EMBEDDING_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const r = await embedText("test query");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("local");
    if (prev !== undefined) process.env.EMBEDDING_API_KEY = prev;
    if (prev2 !== undefined) process.env.OPENAI_API_KEY = prev2;
  });
});
