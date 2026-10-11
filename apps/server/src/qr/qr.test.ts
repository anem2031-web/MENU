import express from "express";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createQrService, validateDestination, validateOrigin, type QrRecord, type QrHistory, type QrRepository } from "./service.js";
import { createQrAdminRouter, createQrRedirectRouter } from "./router.js";
import type { Context } from "../trpc/context.js";

export function memoryRepository(): QrRepository {
  let record: QrRecord | null = null;
  const history: QrHistory[] = [];
  return {
    async get() { return record && { ...record }; },
    async getByToken(token) { return record?.token === token ? { ...record } : null; },
    async history() { return [...history].reverse(); },
    async create(input) {
      if (record) throw new TRPCError({ code: "CONFLICT" });
      record = { id: 1, ...input, revision: 1, createdAt: new Date(), updatedAt: new Date() };
      history.push({ id: 1, qrId: 1, revision: 1, previousUrl: null, destinationUrl: input.destinationUrl, changedBy: input.createdBy, createdAt: new Date() });
      return { ...record };
    },
    async update(destinationUrl, expectedRevision, actor) {
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.revision !== expectedRevision) throw new TRPCError({ code: "CONFLICT" });
      if (record.destinationUrl === destinationUrl) return { ...record };
      history.push({ id: history.length + 1, qrId: 1, revision: record.revision + 1, previousUrl: record.destinationUrl, destinationUrl, changedBy: actor, createdAt: new Date() });
      record = { ...record, destinationUrl, revision: record.revision + 1, updatedAt: new Date() };
      return { ...record };
    },
  };
}

describe("immutable customer QR archive", () => {
  it("retains its token and encoded URL across destination, settings/origin changes and reloads", async () => {
    const repo = memoryRepository();
    const service = createQrService(repo, "https://owned.example");
    const first = await service.create({ origin: "https://ignored.example", destinationUrl: "https://menu.example/old" }, 1);
    const second = await service.update({ destinationUrl: "https://other.example/new", expectedRevision: 1 }, 2);
    expect(second.stableUrl).toBe(first.stableUrl);
    expect(second.token).toBe(first.token);
    const reloaded = await createQrService(repo, "https://changed.example").archive();
    expect(reloaded.record?.stableUrl).toBe(first.stableUrl);
    expect(reloaded.history).toHaveLength(2);
    expect(reloaded.history[0]).toMatchObject({ previousUrl: "https://menu.example/old", changedBy: 2, revision: 2 });
  });
  it("rejects repeat and concurrent creation rather than replacing a printed QR", async () => {
    const repo = memoryRepository(); const service = createQrService(repo);
    const input = { origin: "https://owned.example", destinationUrl: "https://menu.example/" };
    const results = await Promise.allSettled([service.create(input, 1), service.create(input, 2)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const original = await repo.get();
    await expect(service.create(input, 1)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await repo.get()).toEqual(original);
  });
  it("rejects stale edits and does not add history for unchanged destinations", async () => {
    const repo = memoryRepository(); const service = createQrService(repo);
    await service.create({ origin: "https://owned.example", destinationUrl: "https://menu.example/" }, 1);
    await service.update({ destinationUrl: "https://menu.example/", expectedRevision: 1 }, 1);
    expect(await repo.history()).toHaveLength(1);
    await service.update({ destinationUrl: "https://menu.example/new", expectedRevision: 1 }, 1);
    await expect(service.update({ destinationUrl: "https://menu.example/stale", expectedRevision: 1 }, 1)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await repo.get())?.destinationUrl).toBe("https://menu.example/new");
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "https://user:pass@example.com/", "https://example.com/\r\nx", "/menu"])("rejects unsafe destination %s", (url) => {
    expect(() => validateDestination(url)).toThrow();
  });
  it("rejects redirect loops and insecure/path-based QR origins", () => {
    expect(() => validateDestination("https://owned.example/q/another", "https://owned.example/q/first")).toThrow();
    expect(() => validateDestination("https://owned.example/%71/first", "https://owned.example/q/first")).toThrow();
    expect(() => validateOrigin("http://owned.example")).toThrow();
    expect(() => validateOrigin("https://owned.example/subpath")).toThrow();
    expect(validateOrigin("http://localhost:5173", true)).toBe("http://localhost:5173");
  });
  it("requires authentication and explicit confirmation at the API boundary", async () => {
    const admin = createQrAdminRouter(memoryRepository());
    const anonymous = admin.createCaller({ user: null } as Context);
    await expect(anonymous.archive()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anonymous.create({ origin: "https://owned.example", destinationUrl: "https://menu.example/", confirmed: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const owner = admin.createCaller({ user: { id: 1, username: "owner", role: "owner" } } as Context);
    await expect(owner.create({ origin: "https://owned.example", destinationUrl: "https://menu.example/", confirmed: false } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const result = await owner.create({ origin: "https://owned.example", destinationUrl: "https://menu.example/", confirmed: true });
    expect(result.stableUrl).toContain("/q/");
  });
  it("redirects the SAME printed URL to the new destination with no caching; unknown IDs are 404", async () => {
    const repo = memoryRepository(); const service = createQrService(repo);
    const record = await service.create({ origin: "https://owned.example", destinationUrl: "https://menu.example/old" }, 1);
    const app = express(); app.use("/q", createQrRedirectRouter(repo));
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    try {
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const first = await fetch(`${base}/q/${record.token}`, { redirect: "manual" });
      expect(first.status).toBe(302); expect(first.headers.get("location")).toBe("https://menu.example/old");
      expect(first.headers.get("cache-control")).toContain("no-store");
      await service.update({ destinationUrl: "https://menu.example/new", expectedRevision: 1 }, 1);
      const second = await fetch(`${base}/q/${record.token}`, { redirect: "manual" });
      expect(second.headers.get("location")).toBe("https://menu.example/new");
      expect((await fetch(`${base}/q/${"0".repeat(24)}`, { redirect: "manual" })).status).toBe(404);
      expect((await fetch(`${base}/q/bad/extra`, { redirect: "manual" })).status).toBe(404);
    } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
  });
});
