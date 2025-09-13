// client/src/components/FileUploader.tsx
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onUploadComplete: (fileUrl: string) => void;
  maxFileSize?: number;
  accept?: string;
  fileType?: "image" | "video" | "any";
  children: React.ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
}

export function FileUploader({
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024,
  accept = "image/*,video/*",
  fileType = "any",
  children,
  buttonClassName,
  disabled = false,
}: FileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validaciones rápidas
    if (file.size > maxFileSize) {
      toast({ title: "Archivo muy grande", variant: "destructive" });
      return;
    }
    if (fileType === "image" && !file.type.startsWith("image/")) {
      toast({ title: "Debe ser imagen", variant: "destructive" });
      return;
    }
    if (fileType === "video" && !file.type.startsWith("video/")) {
      toast({ title: "Debe ser video", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);

      // 1) pedir URL prefirmada (IMPORTANTE: enviar filename y contentType)
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      });
      if (!presignRes.ok) throw new Error("No se pudo obtener URL de subida");
      const { uploadUrl, fileUrl } = await presignRes.json();

      if (!uploadUrl || !fileUrl) throw new Error("Respuesta inválida del presign");

      // 2) subir directo al bucket
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        const t = await put.text().catch(() => "");
        throw new Error(`PUT ${put.status}: ${t}`);
      }

      // 3) listo: devuelve URL pública del bucket
      onUploadComplete(fileUrl);
      toast({ title: "Archivo subido ✅" });
    } catch (err: any) {
      console.error("upload error:", err);
      toast({ title: "Error al subir", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      />
      <Button type="button" onClick={handleButtonClick} disabled={disabled || isUploading} className={buttonClassName}>
        {isUploading ? "Subiendo…" : children}
      </Button>
    </div>
  );
}
