/**
 * Reusable file upload input component.
 * Provides consistent styling and validation for file uploads.
 */

import React, { useRef } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  validateFileSize,
  validateFileExtension,
  formatFileSize,
  getFileExtension,
} from '@/lib/file-utils';
import { MAX_UPLOAD_SIZE_MB } from '@/lib/constants';

interface FileUploadInputProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  label: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * File upload input with validation and preview.
 *
 * @example
 * ```tsx
 * <FileUploadInput
 *   file={videoFile}
 *   onFileChange={setVideoFile}
 *   accept="video/*"
 *   allowedExtensions={['mp4', 'mkv', 'avi']}
 *   maxSizeMB={500}
 *   label="Vídeo"
 *   placeholder="Selecione um vídeo..."
 * />
 * ```
 */
export function FileUploadInput({
  file,
  onFileChange,
  accept,
  allowedExtensions,
  maxSizeMB = MAX_UPLOAD_SIZE_MB,
  label,
  description,
  placeholder = 'Selecione um arquivo...',
  disabled = false,
  className = '',
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (!validateFileSize(selectedFile, maxSizeMB)) {
      alert(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    // Validate file extension
    if (allowedExtensions && !validateFileExtension(selectedFile.name, allowedExtensions)) {
      alert(`Formato inválido. Permitidos: ${allowedExtensions.join(', ')}`);
      return;
    }

    onFileChange(selectedFile);
  };

  const handleClear = () => {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="text-sm font-medium text-foreground">
        {label}
        {description && (
          <span className="text-muted-foreground font-normal ml-2">
            {description}
          </span>
        )}
      </label>

      {/* Upload Area */}
      <Card
        className={`relative ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'
        } transition-colors`}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="p-4">
          {file ? (
            // File selected state
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {getFileExtension(file.name) && (
                      <span className="ml-2 uppercase">
                        {getFileExtension(file.name)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Empty state
            <div className="flex items-center gap-3 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm">{placeholder}</p>
                {allowedExtensions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos: {allowedExtensions.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Constraints info */}
      {maxSizeMB && (
        <p className="text-xs text-muted-foreground">
          Tamanho máximo: {maxSizeMB}MB
        </p>
      )}
    </div>
  );
}
