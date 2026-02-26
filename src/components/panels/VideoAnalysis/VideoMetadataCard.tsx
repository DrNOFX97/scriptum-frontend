import { memo } from "react";
import { Info, Film, Clock, Layers, Monitor, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { VideoInfo } from "@/lib/types";
import type { AudioStreamInfo } from "@/lib/audioConverter";

interface VideoMetadataCardProps {
  videoInfo: VideoInfo;
  audioInfo: AudioStreamInfo | null;
}

export const VideoMetadataCard = memo(({ videoInfo, audioInfo }: VideoMetadataCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Informações do Vídeo</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Film className="h-3 w-3" /> Codec Vídeo
          </p>
          <p className="font-mono text-sm text-foreground">
            {videoInfo.codec?.toUpperCase() || 'N/A'} / {videoInfo.format || 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Duração
          </p>
          <p className="font-mono text-sm text-foreground">{videoInfo.duration_formatted || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> FPS
          </p>
          <p className="font-mono text-sm text-foreground">
            {videoInfo.fps ? videoInfo.fps.toFixed(3) : 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Monitor className="h-3 w-3" /> Resolução
          </p>
          <p className="font-mono text-sm text-foreground">{videoInfo.resolution || 'N/A'}</p>
        </div>
        {audioInfo ? (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> Codec Áudio
              </p>
              <p className="font-mono text-sm text-foreground flex items-center gap-2">
                {audioInfo.codec.toUpperCase()}
                {!audioInfo.isCompatible && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-sans">
                    Incompatível
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> Canais / Sample Rate
              </p>
              <p className="font-mono text-sm text-foreground">
                {audioInfo.channels === 6 ? '5.1' : audioInfo.channels === 8 ? '7.1' : audioInfo.channels === 1 ? 'Mono' : 'Estéreo'} · {audioInfo.sampleRate}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Volume2 className="h-3 w-3" /> Áudio
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {videoInfo.size_mb > 4000
                ? 'Ficheiro grande — analisado no servidor'
                : 'N/A'}
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Ficheiro</p>
        <p className="text-sm text-foreground break-all">{videoInfo.filename || 'N/A'}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {videoInfo.size_mb ? `${videoInfo.size_mb.toFixed(1)} MB` : 'N/A'}
        </p>
      </div>
    </Card>
  );
});

VideoMetadataCard.displayName = 'VideoMetadataCard';
