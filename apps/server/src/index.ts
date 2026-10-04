import "dotenv/config";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import { uploadRouter } from "./uploads/router.js";
import { getImageObject } from "./storage/s3.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const port = Number(
  process.env.SERVER_PORT ?? process.env.PORT ?? 3001,
);
const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.disable("x-powered-by");

// In production the frontend and API are served from the same origin,
// so CORS is not needed. Keep it only for local Vite development.
if (!isProduction) {
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );
}

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "al-malqa-api",
  });
});

/**
 * Public image delivery endpoint.
 *
 * الصور نفسها تبقى داخل IDrive e2 Private Bucket.
 * المتصفح يطلب الصورة من API، والسيرفر يجلبها من IDrive.
 */
app.get(
  "/api/media",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const key =
        typeof req.query.key === "string"
          ? req.query.key.trim()
          : "";

      if (
        !key ||
        !key.startsWith("al-malqa/") ||
        key.includes("..")
      ) {
        res.status(400).json({
          error: "مسار الصورة غير صالح",
        });
        return;
      }

      const image = await getImageObject(key);

      res.setHeader(
        "Content-Type",
        image.contentType,
      );

      res.setHeader(
        "Cache-Control",
        image.cacheControl,
      );

      if (image.etag) {
        res.setHeader("ETag", image.etag);
      }

      res.setHeader(
        "Content-Disposition",
        "inline",
      );

      res.send(image.body);
    } catch (error) {
      console.error(
        "Unable to load image from storage:",
        error,
      );

      res.status(404).json({
        error: "تعذر العثور على الصورة",
      });
    }
  },
);

app.use("/api/uploads", uploadRouter);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

if (isProduction) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const webDistPath = resolve(currentDir, "../../web/dist");
  const indexHtmlPath = resolve(webDistPath, "index.html");

  if (!existsSync(indexHtmlPath)) {
    throw new Error(
      `Frontend build not found at ${indexHtmlPath}. Run the root build before starting the server.`,
    );
  }

  app.use(express.static(webDistPath));

  // SPA fallback: client-side routes such as /menu/... and /admin/...
  // should all return Vite's index.html. API routes are never rewritten.
  app.get("*", (req, res, next) => {
    if (
      req.path === "/api" ||
      req.path.startsWith("/api/") ||
      req.path === "/trpc" ||
      req.path.startsWith("/trpc/")
    ) {
      next();
      return;
    }

    res.sendFile(indexHtmlPath);
  });
}

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير متوقع";

    res.status(500).json({
      error: message,
    });
  },
);

app.listen(port, "0.0.0.0", () => {
  console.log(
    `Al Malqa app listening on http://0.0.0.0:${port}`,
  );
});