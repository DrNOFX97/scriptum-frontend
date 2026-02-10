import { useState } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const useFileUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async <T>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<T | null> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const xhr = new XMLHttpRequest();

      return new Promise<T>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });

        xhr.addEventListener('load', () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          setIsUploading(false);
          const errorMsg = 'Upload failed';
          setError(errorMsg);
          reject(new Error(errorMsg));
        });

        xhr.addEventListener('abort', () => {
          setIsUploading(false);
          const errorMsg = 'Upload cancelled';
          setError(errorMsg);
          reject(new Error(errorMsg));
        });

        xhr.open('POST', url);
        xhr.send(formData);
      });
    } catch (err) {
      setIsUploading(false);
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
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
    reset,
  };
};

export default useFileUpload;
