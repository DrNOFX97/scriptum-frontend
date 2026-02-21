import { useRef } from "react";
import { Upload, Camera, FolderOpen, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFileUploadProps {
  onFileSelect: (file: File) => void;
  accept: string;
  type: "video" | "subtitle";
  className?: string;
}

export const MobileFileUpload = ({
  onFileSelect,
  accept,
  type,
  className,
}: MobileFileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const isVideo = type === "video";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main upload button - Large, touch-friendly */}
      <button
        onClick={handleFileClick}
        className="w-full h-32 border-2 border-dashed border-border rounded-xl bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-2 touch-manipulation"
      >
        {isVideo ? (
          <Film className="h-10 w-10 text-muted-foreground" />
        ) : (
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
        )}
        <div className="text-center px-4">
          <p className="text-sm font-medium text-foreground">
            {isVideo ? "Selecionar Vídeo" : "Selecionar Legenda"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Toque para escolher ficheiro
          </p>
        </div>
      </button>

      {/* Camera capture for videos (mobile only) */}
      {isVideo && (
        <button
          onClick={handleCameraClick}
          className="w-full h-16 border border-border rounded-lg bg-background hover:bg-muted active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 touch-manipulation md:hidden"
        >
          <Camera className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Gravar Vídeo</span>
        </button>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden camera input (mobile) */}
      {isVideo && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
};
