// client/src/components/FileUploader.tsx
import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useCacheManager } from "@/utils/cacheManager";

interface FileUploaderProps {
  onUploadComplete: (fileUrl: string) => void;
  maxFileSize?: number;
  accept?: string;
  fileType?: "image" | "video" | "any";
  children: ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
  /** Por defecto AHORA es false para evitar guardar blob: en formularios */
  enableOptimistic?: boolean;
}

/**
 * Uploader simple compatible móvil/PC.
 * Nuevo flujo: presigned PUT + finalize para obtener ruta pública /uploads/…
 * Sin guardar URLs blob: en el estado por defecto (evita 404 y "unknown-*").
 */
export function FileUploader({
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*,video/*",
  fileType = "any",
  children,
  buttonClassName,
  disabled = false,
  enableOptimistic = false, // <- cambiado a false por defecto
}: FileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "optimistic" | "syncing" | "synced" | "failed"
  >("idle");

  const { isOnline, addOfflineAction } = useOfflineSync();
  const cacheManager = useCacheManager();

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Tamaño
    if (file.size > maxFileSize) {
      toast({
        title: "Archivo muy grande",
        description: `Debe ser menor a ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Tipo
    if (!validateFileType(file, fileType)) {
      toast({
        title: "Tipo de archivo inválido",
        description: getTypeMessage(fileType),
        variant: "destructive",
      });
      return;
    }

    // Si quisieras preview local temporal SOLO visual (no guardarlo en DB),
    // podrías usarlo fuera de onUploadComplete. Aquí evitamos pasarlo al formulario.
    if (enableOptimistic) {
      setUploadStatus("optimistic");
      toast({
        title: "Preparando archivo…",
        description: "Subiendo en segundo plano.",
      });
    }

    // Subir
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus("syncing");

    try {
      if (!isOnline) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await cacheManager.saveFileForOfflineUpload(tempId, file);
        await addOfflineAction("file-upload", "/api/upload-url", "POST", {
          tempId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        setUploadStatus("optimistic"); // queda pendiente hasta reconexión
        toast({
          title: "Guardado offline",
          description: "Se subirá automáticamente cuando tengas conexión.",
        });
        return;
      }

      // 1) URL de subida
      const resp = await apiRequest("POST", "/api/upload-url");
      if (!resp.ok) throw new Error("No se pudo obtener la URL de subida");
      const json = (await resp.json()) as { uploadUrl: string; objectPath: string };
      const uploadUrl = (json.uploadUrl || "").replace(/&amp;/g, "&");
      const objectPath = json.objectPath;
      if (!uploadUrl || !objectPath) throw new Error("uploadUrl/objectPath faltante");

      // 2) PUT binario
      const putResp = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!putResp.ok) {
        const errText = await safeText(putResp);
        throw new Error(`PUT failed: ${putResp.status} ${errText}`);
      }

      // 3) Finalize (aplica ACL pública y normaliza)
      const fin = await fetch("/api/objects/finalize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploaded: [objectPath] }),
      });
      if (!fin.ok) throw new Error("No se pudo finalizar la subida");
      const finJson = await fin.json();
      const finalized: string[] = finJson.finalizedPaths || [];
      const finalUrl =
        finalized[0] ||
        (objectPath.startsWith("uploads/") ? `/${objectPath}` : `/uploads/${objectPath}`);

      // 4) Entregar URL real al formulario (sin blob:)
      onUploadComplete(finalUrl);
      setUploadStatus("synced");
      toast({
        title: "Archivo subido",
        description: getSuccessMessage(fileType),
      });
    } catch (err) {
      console.error("Error uploading:", err);
      setUploadStatus("failed");
      toast({
        title: "Error al subir",
        description: getErrorMessage(fileType),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Utilidades
  const validateFileType = (file: File, type: "image" | "video" | "any"): boolean => {
    switch (type) {
      case "image":
        return file.type.startsWith("image/");
      case "video":
        return file.type.startsWith("video/");
      case "any":
        return file.type.startsWith("image/") || file.type.startsWith("video/");
      default:
        return true;
    }
  };

  const getTypeMessage = (type: "image" | "video" | "any"): string => {
    switch (type) {
      case "image":
        return "Selecciona una imagen (JPG, PNG, GIF, etc.)";
      case "video":
        return "Selecciona un video (MP4, AVI, MOV, etc.)";
      case "any":
        return "Selecciona una imagen o video";
      default:
        return "Tipo no soportado";
    }
  };

  const getSuccessMessage = (type: "image" | "video" | "any"): string => {
    switch (type) {
      case "image":
        return "La imagen se ha subido exitosamente";
      case "video":
        return "El video se ha subido exitosamente";
      case "any":
        return "El archivo se ha subido exitosamente";
      default:
        return "Archivo subido exitosamente";
    }
  };

  const getErrorMessage = (type: "image" | "video" | "any"): string => {
    switch (type) {
      case "image":
        return "No se pudo subir la imagen. Intenta nuevamente.";
      case "video":
        return "No se pudo subir el video. Intenta nuevamente.";
      case "any":
        return "No se pudo subir el archivo. Intenta nuevamente.";
      default:
        return "Error al subir archivo. Intenta nuevamente.";
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "optimistic":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "syncing":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case "synced":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        data-testid="file-input-hidden"
      />
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={buttonClassName}
        data-testid="button-upload-file"
      >
        <div className="flex items-center gap-2">
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Subiendo…
            </>
          ) : (
            children
          )}
          {uploadStatus !== "idle" && (
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs opacity-75">
                {uploadStatus === "optimistic" && "Listo"}
                {uploadStatus === "syncing" && "Sincronizando…"}
                {uploadStatus === "synced" && "Sincronizado"}
                {uploadStatus === "failed" && "Error"}
              </span>
            </div>
          )}
        </div>
      </Button>
    </div>
  );
}

async function safeText(r: Response) {
  try {
    return await r.text();
  } catch {
    return "";
  }
}
