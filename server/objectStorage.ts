// objectStorage.ts — versión sólida para SeaweedFS/MinIO
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";

const REQUIRED = ["S3_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET_NAME"] as const;
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.warn(`[objectStorage] Falta env ${key}. Revisa tus Secrets.`);
  }
}

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1",            // genérico; Seaweed/MinIO no lo usan realmente
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,           // 🔑 necesario para SeaweedFS/MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

/** Error semántico cuando el objeto no existe */
export class ObjectNotFoundError extends Error {
  constructor(message = "Object not found") {
    super(message);
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/** Normaliza keys: sin barras iniciales, sin espacios raros */
function normalizeKey(key: string): string {
  return (key || "").replace(/^\/+/, "").trim();
}

/** Detección amplia de “no existe” para S3, MinIO y Seaweed */
function isNotFoundError(err: any): boolean {
  const name = err?.name || err?.Code || err?.code;
  const status = err?.$metadata?.httpStatusCode;
  return (
    name === "NotFound" ||
    name === "NoSuchKey" ||
    name === "NoSuchBucket" ||
    status === 404
  );
}

/** Inferencia muy básica de content-type por extensión (sin deps) */
function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "json": return "application/json";
    case "txt": return "text/plain; charset=utf-8";
    case "pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

export class ObjectStorageService {
  /** HEAD para saber si existe (sin traer el body) */
  private async fileExists(objectKey: string): Promise<boolean> {
    const Key = normalizeKey(objectKey);
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key }));
      return true;
    } catch (err: any) {
      if (isNotFoundError(err)) return false;
      throw err;
    }
  }

  /**
   * Devuelve URL firmada para subir desde el front y la key a guardar.
   * Guarda SIEMPRE el `objectPath` en BD (ej: `uploads/uuid`).
   */
  async getObjectEntityUploadURL(): Promise<{ uploadUrl: string; objectPath: string }> {
    const objectPath = `uploads/${randomUUID()}`; // sin extensión; opcional si quieres forzar .png/.jpg
    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: BUCKET_NAME, Key: objectPath }),
      { expiresIn: 900 } // 15 min
    );
    return { uploadUrl, objectPath };
  }

  /**
   * Stream del objeto hacia el response (proxy). Usa cabeceras cacheables.
   * Llama: GET /uploads/:objectPath(*) -> downloadObject(objectPath, res)
   */
  async downloadObject(objectKey: string, res: Response, cacheTtlSec = 3600) {
    const Key = normalizeKey(objectKey);
    try {
      const s3Res = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key }));
      const body = s3Res.Body as Readable;

      // content-type de S3 o inferido por extensión
      const contentType = s3Res.ContentType || guessContentType(Key);

      res.set({
        "Content-Type": contentType,
        ...(s3Res.ContentLength ? { "Content-Length": String(s3Res.ContentLength) } : {}),
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      body.pipe(res);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      if (!res.headersSent) {
        if (isNotFoundError(err)) {
          res.status(404).json({ error: "File not found", key: Key });
        } else {
          res.status(500).json({ error: "Error streaming file" });
        }
      }
    }
  }

  /** Devuelve el stream del objeto (para usos internos si lo necesitas) */
  async getObjectEntityFile(objectPath: string): Promise<Readable> {
    const Key = normalizeKey(objectPath);
    if (!Key) throw new ObjectNotFoundError("Object path is empty");

    const exists = await this.fileExists(Key);
    if (!exists) throw new ObjectNotFoundError(`Object "${Key}" not found`);

    const res = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key }));
    return res.Body as Readable;
  }
}
