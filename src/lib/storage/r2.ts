import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60; // 5 minutes to complete the upload
const DOWNLOAD_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes to view/download

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (!cachedClient) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY env vars."
      );
    }

    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return cachedClient;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing R2_BUCKET_NAME env var.");
  }
  return bucket;
}

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export function isAllowedDocumentType(contentType: string): boolean {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType);
}

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

export function inferMimeTypeFromFileName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  const ext = Object.keys(EXTENSION_TO_MIME_TYPE).find((e) => lower.endsWith(e));
  return ext ? EXTENSION_TO_MIME_TYPE[ext] : null;
}

/**
 * Builds a private object key namespaced by user + home, so even if a key
 * were guessed, presigned URLs (the only way to read/write) are generated
 * per-request only after an ownership check — the key itself grants no
 * access on its own.
 */
export function buildDocumentKey(userId: string, homeId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
  return `documents/${userId}/${homeId}/${randomUUID()}-${safeName}`;
}

export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
}

export async function createDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: getBucket(), Key: key });
  await getClient().send(command);
}

/**
 * Downloads an object's raw bytes server-side — used to hand file content
 * to Gemini for analysis. Only ever called after an ownership check
 * upstream (never exposed directly to the client).
 */
export async function getObjectBytes(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  const response = await getClient().send(command);
  const body = response.Body;

  if (!body) {
    throw new Error(`Object ${key} has no body.`);
  }

  const chunks: Uint8Array[] = [];
  // @ts-expect-error -- AWS SDK's Body type is a generic stream; the Node
  // runtime always gives us an async-iterable Readable here.
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
