import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/constants';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Hook for uploading large files via Cloud Storage
 * Supports files up to 5TB!
 */
export const useLargeFileUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async <T>(
    file: File,
    onSuccess?: (data: T) => void
  ): Promise<T | null> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      // Step 1: Request signed URL from backend
      toast({
        title: "A preparar upload...",
        description: "A obter URL de upload"
      });

      const requestResponse = await fetch(`${API_BASE}/upload/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'video/mp4'
        })
      });

      if (!requestResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_url, blob_name, bucket } = await requestResponse.json();

      // Step 2: Upload directly to Cloud Storage
      toast({
        title: "A enviar ficheiro...",
        description: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      });

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const loaded = e.loaded;
            const total = e.total;
            const percentage = Math.round((loaded / total) * 100);

            setProgress({ loaded, total, percentage });

            // Update toast every 10%
            if (percentage % 10 === 0) {
              toast({
                title: `Enviando: ${percentage}%`,
                description: `${(loaded / (1024 * 1024)).toFixed(1)} MB de ${(total / (1024 * 1024)).toFixed(1)} MB`
              });
            }
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      await uploadPromise;

      // Step 3: Notify backend that upload is complete
      toast({
        title: "A processar...",
        description: "A analisar vídeo"
      });

      const completeResponse = await fetch(`${API_BASE}/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blob_name,
          filename: file.name
        })
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to process upload');
      }

      const result = await completeResponse.json() as T;

      setIsUploading(false);
      setProgress({ loaded: 0, total: 0, percentage: 100 });

      toast({
        title: "Upload concluído!",
        description: "Ficheiro enviado com sucesso"
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (err) {
      setIsUploading(false);
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);

      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: errorMsg
      });

      return null;
    }
  };

  const reset = () => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setIsUploading(false);
    setError(null);
  };

  return {
    progress,
    isUploading,
    error,
    uploadFile,
    reset
  };
};

export default useLargeFileUpload;
