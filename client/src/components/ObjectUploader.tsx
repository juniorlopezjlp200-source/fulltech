// client/src/components/ObjectUploader.tsx
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult, UppyFile } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  /**
   * Si lo pasas, se usará en lugar de la integración por defecto.
   * Debe devolver { method: "PUT", url }.
   */
  onGetUploadParameters?: (file: UppyFile) => Promise<{
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
  }>;
  /**
   * Se dispara después de finalizar la subida (ya con ACL pública aplicada).
   */
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Uploader basado en Uppy + presigned PUT.
 * Flujo:
 * 1) POST /api/upload-url  -> { uploadUrl, objectPath }
 * 2) PUT uploadUrl         -> sube el binario
 * 3) POST /api/upload-finalize { uploaded:[objectPath] } -> devuelve finalizedPaths (/uploads/...)
 */
export function ObjectUploader({
  maxNumberOfFiles = 100,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);

  // Mapa fileId -> objectPath que nos da el backend en /api/upload-url
  const fileIdToObjectPath = useMemo(() => new Map<string, string>(), []);

  // getUploadParameters por defecto (usa tu backend)
  const getParamsDefault = async (file: UppyFile) => {
    const r = await fetch("/api/upload-url", {
      method: "POST",
      credentials: "include",
    });
    if (!r.ok) throw new Error("No se pudo obtener la URL de subida");
    const j = await r.json();
    const uploadUrl: string = j.uploadUrl ?? j.uploadURL ?? j.url;
    const objectPath: string = j.objectPath ?? j.key ?? j.path;
    if (!uploadUrl) throw new Error("Respuesta sin uploadUrl");
    if (!objectPath) throw new Error("Respuesta sin objectPath");

    // Guarda el objectPath para este file
    fileIdToObjectPath.set(file.id, objectPath);

    return {
      method: "PUT" as const,
      url: uploadUrl,
      headers: {
        // Content-Type genérico para PUT de binario
        "Content-Type": "application/octet-stream",
      },
    };
  };

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: { maxNumberOfFiles, maxFileSize },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: (file: UppyFile) =>
          onGetUploadParameters ? onGetUploadParameters(file) : getParamsDefault(file),
      })
      .on("complete", async (result) => {
        try {
          // Junta los objectPath de todos los archivos subidos con éxito
          const objectPaths = result.successful
            .map((f) => fileIdToObjectPath.get(f.id))
            .filter((v): v is string => Boolean(v));

          if (objectPaths.length > 0) {
            const fr = await fetch("/api/upload-finalize", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uploaded: objectPaths }),
            });
            if (!fr.ok) throw new Error("No se pudo finalizar la subida");
            const fj = await fr.json();
            const finalizedPaths: string[] =
              fj.finalizedPaths ??
              objectPaths.map((op) =>
                op.startsWith("uploads/") ? `/${op}` : `/uploads/${op}`
              );

            console.log("✅ Subidas finalizadas:", finalizedPaths);
            // Opcional: muestra un aviso en Uppy
            try {
              (uppy as any).info("Archivos listos", "info", 3000);
            } catch {}
          }
        } catch (err) {
          console.error("Error al finalizar subidas:", err);
          try {
            (uppy as any).info("Error al finalizar subidas", "error", 4000);
          } catch {}
        } finally {
          onComplete?.(result);
        }
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
