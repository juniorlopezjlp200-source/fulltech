// objectStorage.ts — S3/MinIO/SeaweedFS compatible (path-style) ✅
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

// ---------- Validación de variables ----------
const REQUIRED = [
  "S3_ENDPOINT",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "S3_BUCKET_NAME",
] as const;

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[objectStorage] ❌ Falta env ${key}. Revisa tus Secrets.`);
  } else {
    console.log(`[objectStorage] ✅ ${key} configurado`);
  }
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
const S3_ENDPOINT = (process.env.S3_ENDPOINT || "").replace(/\/+$/, "");

// ---------- Cliente S3 ----------
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT || undefined,
  region: "us-east-1", // genérico para S3-compatibles
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  // MUY IMPORTANTE para MinIO/SeaweedFS cuando no usas estilo virtual-host:
  forcePathStyle: true,
});

console.log(`[objectStorage] 📡 Conectando a: ${S3_ENDPOINT}`);
console.log(`[objectStorage] 🪣 Bucket: ${BUCKET_NAME}`);

// ---------- Utilidades ----------
export class ObjectNotFoundError extends Error {
  constructor(message = "Object not found") {
    super(message);
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function normalizeKey(key: string): string {
  return decodeURIComponent((key || "").replace(/^\/+/, "").trim());
}

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

function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "json":
      return "application/json";
    case "txt":
      return "text/plain; charset=utf-8";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function safeExtFromFilename(filename?: string): string {
  if (!filename) return "";
  const m = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return m ? m[0] : "";
}

function makeObjectKey(opts?: {
  filename?: string;
  prefix?: string; // por si quieres cambiar "uploads"
}): string {
  const prefix = (opts?.prefix || "uploads").replace(/^\/+|\/+$/g, "");
  const ext = safeExtFromFilename(opts?.filename);
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const key = `${prefix}/${yyyy}/${mm}/${dd}/${randomUUID()}${ext}`;
  return key;
}

// ---------- Servicio ----------
export class ObjectStorageService {
  /** HEAD: saber si existe sin traer body */
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
   * Genera una URL firmada (PUT) para subir un archivo.
   * Usado por:
   *   - /api/objects/upload-file (server hace el PUT con fetch del buffer)
   *   - /api/objects/upload (front hace el PUT directo si tienes CORS)
   *
   * IMPORTANTE: si mandas `contentType`, el cliente debe usar el MISMO header en el PUT.
   */
  async getObjectEntityUploadURL(options?: {
    filename?: string;
    contentType?: string;
    prefix?: string;
  }): Promise<string> {
    const Key = makeObjectKey({
      filename: options?.filename,
      prefix: options?.prefix,
    });

    const cmd = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key,
      // Si fijas ContentType en la firma, el PUT debe enviar el mismo header.
      ...(options?.contentType ? { ContentType: options.contentType } : {}),
    });

    let uploadUrl = await getSignedUrl(s3Client, cmd, { expiresIn: 900 }); // 15 min
    uploadUrl = uploadUrl.replace(/&amp;/g, "&"); // evitar HTML encoding

    console.log(`[objectStorage] 📤 Upload URL generada para: ${Key}`);
    console.log(`[objectStorage] 🔗 URL: ${uploadUrl.substring(0, 120)}...`);
    return uploadUrl;
  }

  /**
   * Stream del objeto hacia el response (proxy). Usa cabeceras cacheables.
   * Rutas: /objects/:objectPath(*) o /uploads/:objectPath(*)
   */
  async downloadObject(objectKey: string, res: Response, cacheTtlSec = 3600) {
    const Key = normalizeKey(objectKey);
    try {
      const s3Res = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key }),
      );
      const body = s3Res.Body as Readable;
      const contentType = s3Res.ContentType || guessContentType(Key);

      res.set({
        "Content-Type": contentType,
        ...(s3Res.ContentLength
          ? { "Content-Length": String(s3Res.ContentLength) }
          : {}),
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      body.pipe(res);
    } catch (err: any) {
      console.error("[objectStorage] Error downloading file:", err);
      if (!res.headersSent) {
        if (isNotFoundError(err)) {
          res.status(404).json({ error: "File not found", key: Key });
        } else {
          res.status(500).json({ error: "Error streaming file" });
        }
      }
    }
  }

  /** Obtener stream del objeto (uso interno si hiciera falta) */
  async getObjectEntityFile(objectPath: string): Promise<Readable> {
    const Key = normalizeKey(objectPath);
    if (!Key) throw new ObjectNotFoundError("Object path is empty");

    const exists = await this.fileExists(Key);
    if (!exists) throw new ObjectNotFoundError(`Object "${Key}" not found`);

    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key }),
    );
    return res.Body as Readable;
  }

  /** Buscar un objeto "público" por path/key */
  async searchPublicObject(filePath: string): Promise<string | null> {
    const Key = normalizeKey(filePath);
    const exists = await this.fileExists(Key);
    return exists ? Key : null;
  }

  /**
   * Normaliza una URL firmada o un path crudo a la key del objeto dentro del bucket.
   * Soporta path-style presigned: https://endpoint/bucket/key...
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath) return "";
    const trimmed = rawPath.trim();

    // Si es una URL firmada a nuestro endpoint, parsear
    if (S3_ENDPOINT && trimmed.startsWith(S3_ENDPOINT)) {
      try {
        const url = new URL(trimmed);
        // path-style: /bucket-name/KEY...
        const parts = url.pathname.replace(/^\/+/, "").split("/");
        if (parts[0] === BUCKET_NAME) {
          return normalizeKey(parts.slice(1).join("/"));
        }
        // fallback: por si el endpoint ya incluye bucket (raro con forcePathStyle)
        return normalizeKey(parts.join("/"));
      } catch {
        // continuar abajo
      }
    }

    // Si no era URL (o era otra), tratar como key directa
    return normalizeKey(trimmed);
  }

  /**
   * (Opcional) Aplicar ACL/política. En la mayoría de S3-compatibles modernos
   * la visibilidad se maneja por Bucket Policy; aquí sólo registramos.
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: { owner: string; visibility: "public" | "private" },
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    console.log(`[objectStorage] ACL hint for ${normalizedPath}:`, aclPolicy);
    // Si tu servidor requiere ACL por objeto, aquí podrías usar PutObjectAclCommand
    return normalizedPath;
  }

  /** Verificación de acceso (placeholder) */
  async canAccessObjectEntity(_args: {
    userId?: string;
    objectFile: any;
    requestedPermission?: string;
  }): Promise<boolean> {
    return true;
  }
}
