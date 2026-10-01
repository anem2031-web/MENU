import { randomUUID } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { getAuthenticatedUser } from "../auth/current-user.js";
import { putImageObject, type UploadKind } from "../storage/s3.js";

const uploadRouter = Router();
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      callback(
        new Error(
          "نوع الصورة غير مسموح. استخدم JPG أو PNG أو WebP أو AVIF.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await getAuthenticatedUser(req.headers.cookie);

    if (!user) {
      res.status(401).json({
        error: "يجب تسجيل الدخول أولًا",
      });
      return;
    }

    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function runSingleUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  uploader.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "حجم الصورة يتجاوز 8MB"
          : "تعذر قراءة ملف الصورة";

      res.status(400).json({
        error: message,
      });
      return;
    }

    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "ملف الصورة غير صالح",
    });
  });
}

function parseKind(
  value: string | undefined,
): UploadKind | null {
  if (
    value === "logo" ||
    value === "category" ||
    value === "product"
  ) {
    return value;
  }

  return null;
}

function makeObjectKey(kind: UploadKind) {
  const now = new Date();

  const year = String(now.getUTCFullYear());
  const month = String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0");

  const folder =
    kind === "logo"
      ? "logos"
      : kind === "category"
        ? "categories"
        : "products";

  return `al-malqa/${folder}/${year}/${month}/${randomUUID()}.webp`;
}

uploadRouter.post(
  "/:kind",
  requireAdmin,
  runSingleUpload,
  async (req, res, next) => {
    try {
      const kind = parseKind(req.params.kind);

      if (!kind) {
        res.status(400).json({
          error: "نوع الرفع غير صالح",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          error: "اختر صورة للرفع",
        });
        return;
      }

      const maxDimension =
        kind === "logo"
          ? 900
          : kind === "category"
            ? 1600
            : 1800;

      const quality =
        kind === "logo"
          ? 88
          : 84;

      const transformed = await sharp(
        req.file.buffer,
        {
          failOn: "error",
        },
      )
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 4,
        })
        .toBuffer({
          resolveWithObject: true,
        });

      const key = makeObjectKey(kind);

      const stored = await putImageObject({
        key,
        body: transformed.data,
        contentType: "image/webp",
      });

      res.status(201).json({
        ...stored,
        width: transformed.info.width,
        height: transformed.info.height,
        bytes: transformed.info.size,
        format: "webp",
      });
    } catch (error) {
      next(error);
    }
  },
);

export { uploadRouter };