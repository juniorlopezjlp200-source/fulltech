// client/src/components/ObjectUploader.tsx
import { useMemo, useState } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UppyFile } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (fileUrls: string[]) => void;
  buttonClassName?: string;
  children: React.ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 50,
  maxFileSize = 50 * 1024 * 1024,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const fileUrlMap = useMemo(() => new Map<string, string>(), []);

  const getUploadParameters = async (file: UppyFile) => {
    // pedir presign con filename + contentType
    const r = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
      credentials: "include",
    });
    if (!r.ok) throw new Error("No se pudo obtener URL de subida");
    const j = await r.json(); // { uploadUrl, key, fileUrl }
    if (!j.uploadUrl || !j.fileUrl) throw new Error("Presign inválido");
    fileUrlMap.set(file.id, j.fileUrl);

    // usa el mismo content-type que firmaste
    return {
      method: "PUT" as const,
      url: j.uploadUrl,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    };
  };

  const [uppy] = useState(
    () =>
      new Uppy({ restrictions: { maxNumberOfFiles, maxFileSize }, autoProceed: false })
        .use(AwsS3, { shouldUseMultipart: false, getUploadParameters })
        .on("complete", (result) => {
          const urls = result.successful
            .map((f) => fileUrlMap.get(f.id))
            .filter((x): x is string => Boolean(x));
          onComplete?.(urls);
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
