import { describe, expect, it } from "vitest";
import { messageFromErrorBody } from "./problem-error";

describe("messageFromErrorBody", () => {
  it("parses problem+json title and detail", () => {
    expect(
      messageFromErrorBody(JSON.stringify({ title: "Unauthorized", detail: "Invalid credentials" }), 401),
    ).toBe("Unauthorized: Invalid credentials");
  });

  it("falls back to HTTP status when empty", () => {
    expect(messageFromErrorBody("", 500)).toBe("HTTP 500");
  });

  it("returns plain text body", () => {
    expect(messageFromErrorBody("boom", 400)).toBe("boom");
  });
});
