import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileVideo, Upload, Info, Film, Clock, Monitor, Layers, AlertCircle, Star, Play, Clapperboard, FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFileContext, type Subtitle } from "@/contexts/FileContext";
import { parseSubtitleLanguage, getSubtitleBadges, toISO6391 } from "@/lib/subtitleLanguages";
import { analyzeVideoLocally } from "@/lib/videoAnalyzer";
import { extractAllSubtitles } from "@/lib/subtitleExtractor";

import { API_BASE } from "@/lib/constants";

interface VideoInfo {
  filename: string;
  codec: string;
  format: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  duration_formatted: string;
  size_mb: number;
}

interface AnalyzeResponse {
  success: boolean;
  filename: string;
  video_info: VideoInfo;
  can_remux_to_mp4: boolean;
  can_convert_to_mp4: boolean;
  error?: string;
}

interface Movie {
  id: number;
  title: string;
  original_title: string;
  year: string;
  rating: number;
  overview: string;
  poster: string;
  imdb_id: string | null;
}

// Convert SRT to VTT format
const convertSrtToVtt = (srt: string): string => {
  // Add WEBVTT header
  let vtt = 'WEBVTT\n\n';

  // Replace comma with dot in timestamps (SRT uses comma, VTT uses dot)
  vtt += srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return vtt;
};

const VideoAnalysis = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingMovie, setIsLoadingMovie] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingOperation, setProcessingOperation] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    videoFile,
    setVideoFile,
    videoInfo,
    setVideoInfo,
    movieInfo,
    setMovieInfo,
    videoUrl,
    setVideoUrl,
    canRemux,
    setCanRemux,
    canConvert,
    setCanConvert,
    extractedSubtitles,
    setExtractedSubtitles,
    selectedSubtitle,
    setSelectedSubtitle,
  } = useFileContext();

  // Load subtitle into video player when selected
  useEffect(() => {
    if (selectedSubtitle && videoRef.current && selectedSubtitle.content) {
      console.log('🎬 Loading subtitle into player...', {
        type: selectedSubtitle.type,
        contentLength: selectedSubtitle.content.length,
        contentPreview: selectedSubtitle.content.substring(0, 200)
      });

      const video = videoRef.current;

      // Remove existing subtitle tracks
      const existingTracks = video.querySelectorAll('track');
      existingTracks.forEach(track => track.remove());

      // Convert SRT to VTT format
      const vttContent = convertSrtToVtt(selectedSubtitle.content);
      console.log('🔄 Converted to VTT format, length:', vttContent.length);

      // Create blob URL for subtitle content
      const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
      const subtitleUrl = URL.createObjectURL(blob);

      console.log('📝 Subtitle URL created:', subtitleUrl);

      // Get language code from subtitle
      const subtitleData = selectedSubtitle.data as any;
      const languageCode = subtitleData.language || 'pt';
      const iso6391Code = toISO6391(languageCode);

      console.log('🌐 Language detection:', {
        original: languageCode,
        iso6391: iso6391Code
      });

      // Add new track
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = selectedSubtitle.type === 'extracted'
        ? subtitleData.filename
        : subtitleData.name;
      track.srclang = iso6391Code; // Use detected language
      track.src = subtitleUrl;
      track.default = true;
      track.mode = 'showing'; // Force showing immediately

      track.addEventListener('load', () => {
        console.log('✅ Subtitle track loaded successfully');
      });

      track.addEventListener('error', (e) => {
        console.error('❌ Error loading subtitle track:', e);
      });

      video.appendChild(track);

      console.log('📊 Video tracks:', video.textTracks.length);

      // Enable the track immediately and with backup
      const enableTrack = () => {
        if (video.textTracks.length > 0) {
          // Disable all tracks first
          Array.from(video.textTracks).forEach(t => t.mode = 'disabled');
          // Enable our track
          const textTrack = video.textTracks[video.textTracks.length - 1];
          textTrack.mode = 'showing';
          console.log('👁️ Track mode set to:', textTrack.mode);
          console.log('📚 Track cues:', textTrack.cues?.length || 'loading...');
        }
      };

      // Try immediately and with delays as backup
      enableTrack();
      setTimeout(enableTrack, 100);
      setTimeout(enableTrack, 500);

      // Cleanup
      return () => {
        URL.revokeObjectURL(subtitleUrl);
      };
    }
  }, [selectedSubtitle]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setVideoFile(file); // Guarda no contexto
      await analyzeVideo(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file); // Guarda no contexto
      await analyzeVideo(file);
    }
  };

  const recognizeMovie = async (filename: string) => {
    console.log('🎬 Tentando reconhecer filme:', filename);
    setIsLoadingMovie(true);
    try {
      const response = await fetch(`${API_BASE}/recognize-movie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();
      console.log('📦 Resposta TMDB:', data);

      if (data.success && data.movie) {
        console.log('✅ Filme encontrado:', data.movie.title);
        setMovieInfo(data.movie);
      } else {
        console.log('❌ Filme não encontrado');
      }
    } catch (err) {
      console.error('❌ Erro ao reconhecer filme:', err);
    } finally {
      setIsLoadingMovie(false);
    }
  };

  const analyzeVideo = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      toast({
        title: "Analisando vídeo localmente...",
        description: `Lendo metadata de ${file.name}`,
      });

      // Criar URL local do vídeo para preview
      const url = URL.createObjectURL(file);
      setVideoUrl(url);

      // Analyze video locally (no upload!)
      const videoInfo = await analyzeVideoLocally(file);

      console.log('✅ Análise local concluída:', videoInfo);
      setVideoInfo(videoInfo);
      setCanRemux(false); // Not available without backend processing
      setCanConvert(false); // Not available without backend processing

      toast({
        title: "Análise local concluída!",
        description: `${videoInfo.codec} • ${videoInfo.resolution} • ${videoInfo.duration_formatted}`,
      });

      // Recognize movie from filename (only send filename, not the whole file!)
      recognizeMovie(file.name);

      // Auto-extract subtitles after analysis
      await extractSubtitlesFromVideo(file);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Falha ao analisar vídeo";
      setError(errorMsg);

      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: errorMsg,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemux = async () => {
    if (!videoFile) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum vídeo carregado",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingOperation("remux");

    try {
      toast({
        title: "Remux iniciado",
        description: "A remuxar vídeo para MP4 (rápido, sem recodificação)...",
      });

      const result = await uploadFile<{ success: boolean; filename: string; size_mb: number }>(
        `${API_BASE}/remux-mkv-to-mp4`,
        videoFile,
        'video'
      );

      if (result && result.success) {
        toast({
          title: "Remux concluído!",
          description: `Arquivo ${result.filename} (${result.size_mb.toFixed(1)} MB) pronto para download`,
        });

        // Trigger download
        window.open(`${API_BASE}/download/${result.filename}`, '_blank');
      } else {
        throw new Error('Remux falhou');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro no remux",
        description: err instanceof Error ? err.message : "Falha ao remuxar vídeo",
      });
    } finally {
      setIsProcessing(false);
      setProcessingOperation("");
    }
  };

  const handleConvert = async () => {
    if (!videoFile) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum vídeo carregado",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingOperation("convert");

    try {
      toast({
        title: "Conversão iniciada",
        description: "A converter vídeo para MP4 (pode demorar alguns minutos)...",
      });

      const result = await uploadFile<{ success: boolean; filename: string; size_mb: number }>(
        `${API_BASE}/convert-to-mp4`,
        videoFile,
        'video'
      );

      if (result && result.success) {
        toast({
          title: "Conversão concluída!",
          description: `Arquivo ${result.filename} (${result.size_mb.toFixed(1)} MB) pronto para download`,
        });

        // Trigger download
        window.open(`${API_BASE}/download/${result.filename}`, '_blank');
      } else {
        throw new Error('Conversão falhou');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na conversão",
        description: err instanceof Error ? err.message : "Falha ao converter vídeo",
      });
    } finally {
      setIsProcessing(false);
      setProcessingOperation("");
    }
  };

  const extractSubtitlesFromVideo = async (file: File) => {
    try {
      // Extract subtitles locally using ffmpeg.wasm
      const tracks = await extractAllSubtitles(file, (progress, message) => {
        toast({
          title: `Extração: ${progress}%`,
          description: message,
        });
      });

      // Convert to Subtitle format expected by the UI
      const subtitles = tracks.map((track, idx) => ({
        index: track.index,
        language: track.language,
        codec: track.codec,
        filename: `subtitle_${idx}_${track.language}.srt`,
        title: track.title, // Use the metadata title from MKV
        content: track.content
      }));

      setExtractedSubtitles(subtitles);

      if (subtitles.length > 0) {
        toast({
          title: "Legendas encontradas!",
          description: `${subtitles.length} legenda(s) detectada(s) no vídeo`,
        });
      }

    } catch (err) {
      console.error('Erro ao extrair legendas:', err);
      // Don't show error toast - subtitles are optional
    }
  };

  const selectExtractedSubtitle = async (subtitle: Subtitle) => {
    try {
      // Use the content that's already in the subtitle object (extracted locally)
      const content = subtitle.content || '';

      // Mark as selected globally
      setSelectedSubtitle({
        type: 'extracted',
        data: subtitle,
        content: content,
      });

      toast({
        title: "✅ Legenda selecionada",
        description: `${subtitle.filename} - Pronta para edição`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao selecionar",
        description: err instanceof Error ? err.message : "Falha ao carregar legenda",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Análise de Vídeo</h2>
        <p className="text-sm text-muted-foreground">
          Analise metadados do vídeo usando FFmpeg — codec, duração, FPS e resolução.
        </p>
      </div>

      {/* File loaded indicator */}
      {videoFile && !videoInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vídeo carregado: <strong>{videoFile.name}</strong> - Clique para analisar ou será usado automaticamente noutros painéis
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Zone - Only show when no video is loaded */}
      {!videoUrl && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          } p-12`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <FileVideo className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                {videoFile ? `Vídeo: ${videoFile.name}` : 'Arraste um vídeo ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta MKV, MP4, AVI, MOV e outros formatos
              </p>
            </div>
            <label htmlFor="video-file">
              <Button variant="outline" size="sm" asChild disabled={isAnalyzing}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? 'Trocar Vídeo' : 'Selecionar Ficheiro'}
                </span>
              </Button>
            </label>
            <input
              id="video-file"
              type="file"
              accept="video/*,.mkv,.avi,.mov,.wmv,.flv,.webm"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isAnalyzing}
            />
          </div>
        </div>
      )}

      {/* Video Player */}
      {videoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2"
        >
          <Card className="p-0 overflow-hidden">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full max-h-[500px] object-contain"
                preload="metadata"
                crossOrigin="anonymous"
              >
                O seu navegador não suporta a tag de vídeo.
              </video>
              {selectedSubtitle && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-primary/90 backdrop-blur-sm">
                    <FileText className="h-3 w-3 mr-1" />
                    Legenda ativa
                  </Badge>
                </div>
              )}
              {isAnalyzing && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3">
                  <div className="flex items-center justify-center text-sm text-white">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>A analisar vídeo localmente...</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
          <p className="text-xs text-muted-foreground text-center">
            <Play className="inline h-3 w-3 mr-1" />
            Preview local do vídeo
          </p>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Video Info */}
      {videoInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Informações do Vídeo</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Film className="h-3 w-3" /> Codec
                </p>
                <p className="font-mono text-sm text-foreground">
                  {videoInfo?.codec?.toUpperCase() || 'N/A'} / {videoInfo?.format || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Duração
                </p>
                <p className="font-mono text-sm text-foreground">{videoInfo?.duration_formatted || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> FPS
                </p>
                <p className="font-mono text-sm text-foreground">
                  {videoInfo?.fps ? videoInfo.fps.toFixed(3) : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Monitor className="h-3 w-3" /> Resolução
                </p>
                <p className="font-mono text-sm text-foreground">{videoInfo?.resolution || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Ficheiro</p>
              <p className="text-sm text-foreground break-all">{videoInfo?.filename || 'N/A'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {videoInfo?.size_mb ? `${videoInfo.size_mb.toFixed(1)} MB` : 'N/A'}
              </p>
            </div>
          </Card>

          {/* TMDB Info */}
          {movieInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Film className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Informações TMDB</h3>
                </div>
                <div className="flex gap-6">
                  {movieInfo?.poster && (
                    <div className="flex-shrink-0">
                      <img
                        src={movieInfo.poster}
                        alt={movieInfo?.title || 'Movie poster'}
                        className="w-32 h-48 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-xl font-bold text-foreground">{movieInfo?.title || 'Título desconhecido'}</h4>
                      {movieInfo?.original_title && movieInfo.original_title !== movieInfo.title && (
                        <p className="text-sm text-muted-foreground italic">{movieInfo.original_title}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {movieInfo?.year && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          <Film className="h-3.5 w-3.5" />
                          {movieInfo.year}
                        </span>
                      )}
                      {movieInfo?.rating && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-medium">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {movieInfo.rating}/10
                        </span>
                      )}
                    </div>
                    {movieInfo?.overview && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {movieInfo.overview}
                      </p>
                    )}
                    {movieInfo?.imdb_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.imdb.com/title/${movieInfo.imdb_id}`, '_blank')}
                      >
                        Ver no IMDB
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {isLoadingMovie && !movieInfo && (
            <Card className="p-6">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                <span className="text-sm">A procurar informações no TMDB...</span>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Operações Disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {canRemux && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemux}
                  disabled={isProcessing}
                >
                  {isProcessing && processingOperation === "remux" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A remuxar...
                    </>
                  ) : (
                    <>
                      <Clapperboard className="h-4 w-4 mr-2" />
                      Remux para MP4 (Rápido)
                    </>
                  )}
                </Button>
              )}
              {canConvert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvert}
                  disabled={isProcessing}
                >
                  {isProcessing && processingOperation === "convert" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A converter...
                    </>
                  ) : (
                    <>
                      <Film className="h-4 w-4 mr-2" />
                      Converter para MP4
                    </>
                  )}
                </Button>
              )}
              {/* Spacer to push load video button to the right */}
              <div className="flex-1" />

              {/* Load Another Video Button */}
              <label htmlFor="video-file-operations">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isAnalyzing || isProcessing}
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Outro Vídeo
                  </span>
                </Button>
              </label>
              <input
                id="video-file-operations"
                type="file"
                accept="video/*,.mkv,.avi,.mov,.wmv,.flv,.webm"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isAnalyzing || isProcessing}
              />
            </div>
          </Card>

          {/* Found Subtitles */}
          {extractedSubtitles.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Legendas encontradas</h3>
                <Badge variant="secondary">{extractedSubtitles.length}</Badge>
              </div>
              <div className="space-y-2">
                {extractedSubtitles.map((subtitle, index) => {
                  // Combinar language com title para melhor reconhecimento
                  const languageString = subtitle.title
                    ? `${subtitle.language} ${subtitle.title}`
                    : subtitle.language || '';
                  const langInfo = parseSubtitleLanguage(languageString);
                  const badges = getSubtitleBadges(langInfo);
                  const isSelected = selectedSubtitle?.type === 'extracted' &&
                                    (selectedSubtitle.data as Subtitle).filename === subtitle.filename;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors border ${
                        isSelected
                          ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/20'
                          : 'bg-muted/50 hover:bg-muted border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl" role="img" aria-label="flag">
                          {langInfo.flag}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground">
                              {langInfo.displayName}
                            </p>
                            {isSelected && (
                              <Badge variant="default" className="text-xs bg-primary">
                                ✓ Selecionada
                              </Badge>
                            )}
                            {badges.map((badge, i) => (
                              <Badge
                                key={i}
                                variant={badge === 'SDH' ? 'default' : badge === 'Forçada' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {subtitle.codec.toUpperCase()} • {subtitle.filename}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectExtractedSubtitle(subtitle)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Selecionar
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            // Download locally extracted subtitle
                            if (subtitle.content) {
                              const blob = new Blob([subtitle.content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = subtitle.filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoAnalysis;
