import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploaderProps {
  onUploadComplete: (fileUrl: string) => void;
  maxFileSize?: number;
  accept?: string;
  fileType?: 'image' | 'video' | 'any';
  children: ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
}

/**
 * Componente simple de subida de archivos que funciona en móvil y PC.
 * Usa un input de archivo nativo que abre el explorador del dispositivo.
 * Soporta imágenes, videos y otros tipos de archivos multimedia.
 */
export function FileUploader({
  onUploadComplete,
  maxFileSize = 10485760, // 10MB por defecto para videos
  accept = "image/*,video/*",
  fileType = 'any',
  children,
  buttonClassName,
  disabled = false,
}: FileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > maxFileSize) {
      toast({
        title: "Archivo muy grande",
        description: `El archivo debe ser menor a ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validar tipo según fileType
    const isValidType = validateFileType(file, fileType);
    if (!isValidType) {
      const typeMessage = getTypeMessage(fileType);
      toast({
        title: "Tipo de archivo inválido",
        description: typeMessage,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Obtener URL de subida
      const uploadResponse = await apiRequest("POST", "/api/upload-url");
      const uploadData = await uploadResponse.json() as { uploadUrl: string; objectPath: string };
      const uploadURL = uploadData.uploadUrl;

      // 2. Subir archivo directamente a Google Cloud Storage
      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error(`Upload failed: ${fileUploadResponse.status}`);
      }

      // 3. Usar el objectPath devuelto por el backend
      const localImageUrl = `/uploads/${uploadData.objectPath}`;

      // 4. Notificar al componente padre
      onUploadComplete(localImageUrl);

      const successMessage = getSuccessMessage(fileType);
      toast({
        title: "Archivo subido",
        description: successMessage,
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = getErrorMessage(fileType);
      toast({
        title: "Error al subir",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir subir el mismo archivo nuevamente si es necesario
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const extractObjectIdFromURL = (uploadURL: string): string => {
    try {
      const url = new URL(uploadURL);
      const pathParts = url.pathname.split('/');
      // El path es algo como: /bucket-name/folder/uploads/object-id
      // Tomamos la última parte que es el ID del objeto
      return pathParts[pathParts.length - 1];
    } catch {
      return 'unknown-' + Date.now();
    }
  };

  const validateFileType = (file: File, type: 'image' | 'video' | 'any'): boolean => {
    switch (type) {
      case 'image':
        return file.type.startsWith('image/');
      case 'video':
        return file.type.startsWith('video/');
      case 'any':
        return file.type.startsWith('image/') || file.type.startsWith('video/');
      default:
        return true;
    }
  };

  const getTypeMessage = (type: 'image' | 'video' | 'any'): string => {
    switch (type) {
      case 'image':
        return "Por favor selecciona una imagen (JPG, PNG, GIF, etc.)";
      case 'video':
        return "Por favor selecciona un video (MP4, AVI, MOV, etc.)";
      case 'any':
        return "Por favor selecciona una imagen o video";
      default:
        return "Tipo de archivo no soportado";
    }
  };

  const getSuccessMessage = (type: 'image' | 'video' | 'any'): string => {
    switch (type) {
      case 'image':
        return "La imagen se ha subido exitosamente";
      case 'video':
        return "El video se ha subido exitosamente";
      case 'any':
        return "El archivo se ha subido exitosamente";
      default:
        return "Archivo subido exitosamente";
    }
  };

  const getErrorMessage = (type: 'image' | 'video' | 'any'): string => {
    switch (type) {
      case 'image':
        return "No se pudo subir la imagen. Intenta nuevamente.";
      case 'video':
        return "No se pudo subir el video. Intenta nuevamente.";
      case 'any':
        return "No se pudo subir el archivo. Intenta nuevamente.";
      default:
        return "Error al subir archivo. Intenta nuevamente.";
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="file-input-hidden"
      />
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={buttonClassName}
        data-testid="button-upload-file"
      >
        {isUploading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Subiendo...
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}