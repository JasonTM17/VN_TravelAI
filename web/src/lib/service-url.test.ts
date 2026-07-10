import { describe, it, expect } from "vitest";
import { resolveServiceBaseUrl } from "./service-url";

describe("resolveServiceBaseUrl", () => {
  it("prefers internal URL on server (Docker SSR)", () => {
    expect(
      resolveServiceBaseUrl({
        internal: "http://api:3001",
        publicUrl: "http://localhost:53001",
        fallback: "http://127.0.0.1:53001",
        isServer: true,
      }),
    ).toBe("http://api:3001");
  });

  it("uses public URL on client (browser)", () => {
    expect(
      resolveServiceBaseUrl({
        internal: "http://api:3001",
        publicUrl: "http://localhost:53001",
        fallback: "http://127.0.0.1:53001",
        isServer: false,
      }),
    ).toBe("http://localhost:53001");
  });

  it("falls back when env missing", () => {
    expect(
      resolveServiceBaseUrl({
        fallback: "http://127.0.0.1:53001",
        isServer: true,
      }),
    ).toBe("http://127.0.0.1:53001");
  });
});
