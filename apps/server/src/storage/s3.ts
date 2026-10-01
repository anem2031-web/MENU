import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type UploadKind = "logo" | "category" | "product";

type StorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

let cachedConfig: StorageConfig | null = null;
let cachedClient: S3Client | null = null;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getStorageConfig(): StorageConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    endpoint: requiredEnv("S3_ENDPOINT").replace(/\/$/, ""),
    region: process.env.S3_REGION?.trim() || "us-east-1",
    bucket: requiredEnv("S3_BUCKET"),
    accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    forcePathStyle:
      (process.env.S3_FORCE_PATH_STYLE ?? "true").toLowerCase() !==
      "false",
  };

  return cachedConfig;
}

export function getS3Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getStorageConfig();

  cachedClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

/**
 * الصور محفوظة داخل Bucket خاص.
 *
 * لذلك لا نعيد رابط IDrive المباشر للمتصفح.
 * بدلًا من ذلك نعيد مسارًا داخل API الخاص بالمشروع،
 * والسيرفر هو الذي يقرأ الصورة من IDrive.
 */
export function buildImageUrl(key: string) {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

export async function putImageObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const config = getStorageConfig();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl:
        input.cacheControl ??
        "public, max-age=31536000, immutable",
    }),
  );

  return {
    key: input.key,
    url: buildImageUrl(input.key),
  };
}

export async function getImageObject(key: string) {
  if (!key.trim()) {
    throw new Error("Image key is required");
  }

  const config = getStorageConfig();
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Image object has no body");
  }

  const bytes = await response.Body.transformToByteArray();

  return {
    body: Buffer.from(bytes),
    contentType:
      response.ContentType ?? "application/octet-stream",
    cacheControl:
      response.CacheControl ??
      "public, max-age=31536000, immutable",
    etag: response.ETag,
  };
}

export async function deleteImageObject(key: string) {
  if (!key) {
    return;
  }

  const config = getStorageConfig();
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}