import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session.js";

describe("admin session token", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-that-is-long-enough-for-auth-tests";
  });

  it("accepts a valid signed token", () => {
    const token = createSessionToken(7, "owner");
    expect(verifySessionToken(token)).toMatchObject({ userId: 7, role: "owner" });
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(7, "owner");
    const tampered = `${token.slice(0, -1)}x`;
    expect(verifySessionToken(tampered)).toBeNull();
  });
});
