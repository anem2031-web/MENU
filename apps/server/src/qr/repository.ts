import { customerQr, customerQrHistory, db } from "@almalqa/db";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { QrRepository } from "./service.js";

export const qrRepository: QrRepository = {
  async get() { return (await db.select().from(customerQr).where(eq(customerQr.id, 1)).limit(1))[0] ?? null; },
  async getByToken(token) { return (await db.select().from(customerQr).where(eq(customerQr.token, token)).limit(1))[0] ?? null; },
  async history() { return db.select().from(customerQrHistory).where(eq(customerQrHistory.qrId, 1)).orderBy(desc(customerQrHistory.revision)); },
  async create(record) {
    try {
      return await db.transaction(async (tx) => {
        await tx.insert(customerQr).values({ id: 1, ...record });
        await tx.insert(customerQrHistory).values({ qrId: 1, revision: 1, previousUrl: null, destinationUrl: record.destinationUrl, changedBy: record.createdBy });
        return (await tx.select().from(customerQr).where(eq(customerQr.id, 1)).limit(1))[0]!;
      });
    } catch (error) {
      // The primary key prevents two concurrent creation requests from replacing the identity.
      if (await this.get()) throw new TRPCError({ code: "CONFLICT", message: "الباركود محفوظ بالفعل. أعد تحميل الأرشيف." });
      throw error;
    }
  },
  async update(destinationUrl, expectedRevision, actor) {
    return db.transaction(async (tx) => {
      const current = (await tx.select().from(customerQr).where(eq(customerQr.id, 1)).limit(1).for("update"))[0];
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "الباركود غير موجود" });
      if (current.revision !== expectedRevision) throw new TRPCError({ code: "CONFLICT", message: "تم تغيير الوجهة من جلسة أخرى. أعد تحميل الأرشيف قبل التعديل." });
      if (current.destinationUrl === destinationUrl) return current;
      const revision = current.revision + 1;
      await tx.update(customerQr).set({ destinationUrl, revision }).where(eq(customerQr.id, 1));
      await tx.insert(customerQrHistory).values({ qrId: 1, revision, previousUrl: current.destinationUrl, destinationUrl, changedBy: actor });
      return (await tx.select().from(customerQr).where(eq(customerQr.id, 1)).limit(1))[0]!;
    });
  },
};
