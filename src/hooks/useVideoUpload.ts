import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/constants';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Hook for uploading videos via streaming (no signed URLs needed)
 */
export const useVideoUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadVideo = async <T>(file: File, onSuccess?: (data: T) => void): Promise<T | null> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      toast({
        title: "A enviar vídeo...",
        description: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      });

      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<T>((resolve, reject) => {
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
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result as T);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', `${API_BASE}/upload/stream`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      setIsUploading(false);
      setProgress({ loaded: 0, total: 0, percentage: 100 });

      toast({
        title: "Upload concluído!",
        description: "Vídeo enviado e analisado com sucesso"
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
    uploadVideo,
    reset
  };
};

export default useVideoUpload;
