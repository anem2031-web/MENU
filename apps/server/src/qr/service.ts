import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";

export type QrRecord = {
  id: number; token: string; stableUrl: string; destinationUrl: string;
  revision: number; createdBy: number; createdAt: Date; updatedAt: Date;
};
export type QrHistory = {
  id: number; qrId: number; revision: number; previousUrl: string | null;
  destinationUrl: string; changedBy: number; createdAt: Date;
};
export interface QrRepository {
  get(): Promise<QrRecord | null>;
  getByToken(token: string): Promise<QrRecord | null>;
  history(): Promise<QrHistory[]>;
  create(record: Pick<QrRecord, "token" | "stableUrl" | "destinationUrl" | "createdBy">): Promise<QrRecord>;
  update(destinationUrl: string, expectedRevision: number, actor: number): Promise<QrRecord>;
}

export function validateDestination(value: string, stableUrl?: string) {
  if (/[\u0000-\u0020\u007f]/.test(value) || value.length > 2000) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "الرابط غير صالح" });
  }
  let url: URL;
  try { url = new URL(value); } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "اكتب رابطًا كاملًا يبدأ بـ https:// أو http://" });
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "يجب استخدام رابط HTTP أو HTTPS بدون بيانات دخول" });
  }
  // Prevent local redirect cycles, including links to another QR on this host.
  let decodedPath: string;
  try { decodedPath = decodeURIComponent(url.pathname); } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "ترميز مسار الرابط غير صالح" });
  }
  if (stableUrl && url.host === new URL(stableUrl).host && /^\/q(?:\/|$)/i.test(decodedPath)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن توجيه الباركود إلى رابط باركود آخر على نفس الموقع" });
  }
  return url.href;
}

export function validateOrigin(value: string, allowLocal = false) {
  const normalized = validateDestination(value);
  const url = new URL(normalized);
  if (url.pathname !== "/" || url.search || url.hash ||
      (url.protocol !== "https:" && !(allowLocal && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "عنوان الباركود يجب أن يكون نطاق HTTPS فقط بدون مسار" });
  }
  return url.origin;
}

export function createQrService(repository: QrRepository, configuredOrigin?: string, allowLocal = false) {
  return {
    async archive() {
      return { record: await repository.get(), history: await repository.history(), configuredOrigin: configuredOrigin || null };
    },
    async create(input: { origin: string; destinationUrl: string }, actor: number) {
      if (await repository.get()) {
        throw new TRPCError({ code: "CONFLICT", message: "الباركود محفوظ بالفعل. عدّل وجهته فقط ولا تنشئ رابطًا جديدًا." });
      }
      const origin = validateOrigin(configuredOrigin || input.origin, allowLocal);
      const token = randomBytes(12).toString("hex");
      const stableUrl = `${origin}/q/${token}`;
      const destinationUrl = validateDestination(input.destinationUrl, stableUrl);
      return repository.create({ token, stableUrl, destinationUrl, createdBy: actor });
    },
    async update(input: { destinationUrl: string; expectedRevision: number }, actor: number) {
      const current = await repository.get();
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "أنشئ واحفظ الباركود أولًا" });
      const destinationUrl = validateDestination(input.destinationUrl, current.stableUrl);
      return repository.update(destinationUrl, input.expectedRevision, actor);
    },
  };
}
