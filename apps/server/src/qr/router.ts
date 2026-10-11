import { Router } from "express";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { createQrService, validateDestination, type QrRepository } from "./service.js";

export function createQrAdminRouter(repository: QrRepository) {
  const service = createQrService(repository, process.env.QR_PUBLIC_ORIGIN, process.env.NODE_ENV !== "production");
  return router({
    archive: protectedProcedure.query(() => service.archive()),
    create: protectedProcedure.input(z.object({
      origin: z.string().trim().max(1000), destinationUrl: z.string().trim().min(1).max(2000), confirmed: z.literal(true),
    })).mutation(({ input, ctx }) => service.create(input, ctx.user.id)),
    update: protectedProcedure.input(z.object({
      destinationUrl: z.string().trim().min(1).max(2000), expectedRevision: z.number().int().positive(), confirmed: z.literal(true),
    })).mutation(({ input, ctx }) => service.update(input, ctx.user.id)),
  });
}

export function createQrRedirectRouter(repository: QrRepository) {
  const redirects = Router();
  redirects.get("/:token", async (req, res, next) => {
    // Never allow browsers/CDNs to retain a destination after it is changed.
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Robots-Tag", "noindex");
    if (!/^[a-f0-9]{24}$/.test(req.params.token ?? "")) {
      res.status(404).send("الباركود غير موجود"); return;
    }
    try {
      const record = await repository.getByToken(req.params.token!);
      if (!record) { res.status(404).send("الباركود غير موجود"); return; }
      const destination = validateDestination(record.destinationUrl, record.stableUrl);
      res.redirect(302, destination);
    } catch (error) { next(error); }
  });
  redirects.use((_req, res) => { res.setHeader("Cache-Control", "no-store"); res.status(404).send("الباركود غير موجود"); });
  return redirects;
}
