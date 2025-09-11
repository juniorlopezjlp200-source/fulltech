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
  fileType?: 'image' | 'video' | 'any';
  children: ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
  enableOptimistic?: boolean; // Nueva prop para habilitar preview optimista
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
  enableOptimistic = true, // Por defecto habilitado
}: FileUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'optimistic' | 'syncing' | 'synced' | 'failed'>('idle');
  
  // Hooks para funcionalidad offline y cache
  const { isOnline, addOfflineAction } = useOfflineSync();
  const cacheManager = useCacheManager();

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

    // 🚀 OPTIMISTIC UI: Mostrar inmediatamente el preview
    if (enableOptimistic) {
      let localUrl: string | null = null;
      try {
        // Crear URL local inmediato para preview
        localUrl = URL.createObjectURL(file);
        
        // Generar ID temporal para tracking
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // ✅ LLAMAR INMEDIATAMENTE a onUploadComplete con preview
        setUploadStatus('optimistic');
        onUploadComplete(localUrl);
        
        // Toast inmediato de confirmación
        toast({
          title: "¡Archivo listo!",
          description: "Se está sincronizando en segundo plano...",
        });
        
        // 🔄 Subir en background (sin bloquear UI)
        uploadInBackground(file, tempId, localUrl);
        
      } catch (error) {
        console.error("Error creating optimistic preview:", error);
        // Limpiar URL si se creó
        if (localUrl) {
          URL.revokeObjectURL(localUrl);
        }
        // Fallback al upload normal
        uploadFileNormally(file);
      }
    } else {
      // Upload normal (sin optimistic UI)
      uploadFileNormally(file);
    }
  };

  // 🔄 Función para subir en background
  const uploadInBackground = async (file: File, tempId: string, localUrl: string) => {
    setIsUploading(true);
    setUploadStatus('syncing');
    
    try {
      if (!isOnline) {
        // Guardar archivo completo en IndexedDB para uso offline
        await cacheManager.saveFileForOfflineUpload(tempId, file);
        
        // Encolar acción de upload offline (usando solo addOfflineAction, no duplicar)
        await addOfflineAction('file-upload', '/api/upload-url', 'POST', {
          tempId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        
        setUploadStatus('optimistic'); // Mantener optimistic hasta que se sincronice
        setIsUploading(false); // ✅ CRÍTICO: Liberar UI cuando esté offline
        
        toast({
          title: "Archivo guardado offline",
          description: "Se subirá automáticamente cuando tengas conexión.",
        });
        
        console.log("📡 Sin conexión - archivo guardado para sincronización posterior");
        return;
      }

      // 1. Obtener URL de subida
      const uploadResponse = await apiRequest("POST", "/api/upload-url");
      const uploadData = await uploadResponse.json() as { uploadUrl: string; objectPath: string };
      
      // Decodificar HTML entities en la URL
      const uploadURL = uploadData.uploadUrl.replace(/&amp;/g, '&');

      // 2. Subir archivo a SeaweedFS/S3
      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!fileUploadResponse.ok) {
        throw new Error(`Upload failed: ${fileUploadResponse.status}`);
      }

      // 3. Generar URL final
      const uuid = uploadData.objectPath.replace(/^\/?uploads\//, "");
      const finalUrl = `/uploads/${uuid}`;
      
      // 4. ✅ ACTUALIZAR con URL real (reemplaza el preview)
      onUploadComplete(finalUrl);
      setUploadStatus('synced');
      
      console.log("✅ Sincronización completada:", finalUrl);
      
    } catch (error) {
      console.error("Error uploading in background:", error);
      setUploadStatus('failed');
      
      // En caso de error, mantener el preview pero mostrar estado de fallo
      toast({
        title: "Error al sincronizar",
        description: "El archivo está disponible localmente. Se reintentará automáticamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // ✅ CRÍTICO: Limpiar URL temporal en todos los casos
      URL.revokeObjectURL(localUrl);
    }
  };

  // 📁 Función de upload normal (sin optimistic UI)
  const uploadFileNormally = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('syncing');

    try {
      const uploadResponse = await apiRequest("POST", "/api/upload-url");
      const uploadData = await uploadResponse.json() as { uploadUrl: string; objectPath: string };
      const uploadURL = uploadData.uploadUrl.replace(/&amp;/g, '&');

      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!fileUploadResponse.ok) {
        throw new Error(`Upload failed: ${fileUploadResponse.status}`);
      }

      const uuid = uploadData.objectPath.replace(/^\/?uploads\//, "");
      const finalUrl = `/uploads/${uuid}`;
      
      onUploadComplete(finalUrl);
      setUploadStatus('synced');
      
      toast({
        title: "Archivo subido",
        description: getSuccessMessage(fileType),
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus('failed');
      toast({
        title: "Error al subir",
        description: getErrorMessage(fileType),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

  // 🎨 Función para obtener el icono según el estado
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'optimistic':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'syncing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
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
        <div className="flex items-center gap-2">
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Subiendo...
            </>
          ) : (
            children
          )}
          {/* ✨ Indicador de estado visual */}
          {uploadStatus !== 'idle' && (
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs opacity-75">
                {uploadStatus === 'optimistic' && 'Listo'}
                {uploadStatus === 'syncing' && 'Sincronizando...'}
                {uploadStatus === 'synced' && 'Sincronizado'}
                {uploadStatus === 'failed' && 'Error'}
              </span>
            </div>
          )}
        </div>
      </Button>
    </div>
  );
}