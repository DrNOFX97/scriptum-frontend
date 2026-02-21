import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Upload, FileVideo, FileText, Download, AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { ensureCompatibleAudio, extractAudioToAAC, detectAudioCodec } from "@/lib/audioConverter";
import { parallelUpload } from "@/lib/parallelUpload";

import { API_BASE } from "@/lib/constants";

interface SyncResponse {
  success: boolean;
  synced_file?: string;
  offset_detected?: number;
  stats?: {
    total_entries: number;
    adjusted: number;
    time_taken: number;
  };
  error?: string;
}

interface SyncMetrics {
  stage: string;
  stageNumber: number;
  totalStages: number;
  percentage: number;
  elapsedTime: number;
  estimatedTotal: number;
  etaSeconds: number;
  currentOperation: string;
}

const SubtitleSync = () => {
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localSubtitleFile, setLocalSubtitleFile] = useState<File | null>(null);
  const [syncedData, setSyncedData] = useState<SyncResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [logFile, setLogFile] = useState<string | null>(null);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isCheckingAudio, setIsCheckingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const { toast } = useToast();
  const { videoFile, subtitleFile, setVideoFile, setSubtitleFile, selectedSubtitle } = useFileContext();

  // Usar ficheiros do contexto se disponíveis
  useEffect(() => {
    if (videoFile && !localVideoFile) {
      setLocalVideoFile(videoFile);
      toast({
        title: "Vídeo carregado do contexto",
        description: videoFile.name,
      });
    }
    if (subtitleFile && !localSubtitleFile) {
      setLocalSubtitleFile(subtitleFile);
      toast({
        title: "Legenda carregada do contexto",
        description: subtitleFile.name,
      });
    }
  }, [videoFile, subtitleFile]);

  // Extract metrics from logs
  const extractMetricsFromLogs = (logs: string[]): SyncMetrics => {
    const logText = logs.join('\n');
    let stage = 'Inicializando';
    let stageNumber = 0;
    let percentage = 0;
    const totalStages = 6;

    // Detect current stage from logs
    if (logText.includes('Informação de versão detectada')) {
      stage = 'Analisando versão';
      stageNumber = 1;
      percentage = 10;
    }
    if (logText.includes('Analisando framerates')) {
      stage = 'Analisando framerates';
      stageNumber = 2;
      percentage = 20;
    }
    if (logText.includes('Obtendo duração do vídeo')) {
      stage = 'Obtendo duração';
      stageNumber = 3;
      percentage = 30;
    }
    if (logText.includes('Detectando idioma do áudio')) {
      stage = 'Detectando idioma';
      stageNumber = 3;
      percentage = 35;
    }
    if (logText.includes('Extraindo amostra de áudio')) {
      stage = 'Extraindo amostra';
      stageNumber = 3;
      percentage = 40;
    }
    if (logText.includes('Transcrevendo amostra')) {
      stage = 'Transcrevendo amostra';
      stageNumber = 4;
      percentage = 45;
    }
    if (logText.includes('Iniciando análise com MLX Whisper')) {
      stage = 'Análise MLX Whisper';
      stageNumber = 5;
      percentage = 50;
    }
    if (logText.includes('Pontos de amostragem selecionados')) {
      stage = 'Preparando pontos de amostragem';
      stageNumber = 5;
      percentage = 55;
    }
    if (logText.includes('Extraindo e transcrevendo áudio')) {
      stage = 'Transcrevendo áudio completo';
      stageNumber = 5;
      percentage = 60;
    }
    if (logText.includes('Comparando transcrições')) {
      stage = 'Comparando transcrições';
      stageNumber = 5;
      percentage = 75;
    }
    if (logText.includes('Análise completa')) {
      stage = 'Análise completa';
      stageNumber = 5;
      percentage = 85;
    }
    if (logText.includes('Aplicando correção')) {
      stage = 'Aplicando correção';
      stageNumber = 6;
      percentage = 95;
    }
    if (logText.includes('Sincronização concluída')) {
      stage = 'Concluído';
      stageNumber = 6;
      percentage = 100;
    }

    // Calculate elapsed time
    const elapsedTime = startTime > 0 ? (Date.now() - startTime) / 1000 : 0;

    // Estimate total time (typical: 5-10 minutes = 300-600s)
    // Based on percentage, estimate total
    const estimatedTotal = percentage > 0 ? (elapsedTime / percentage) * 100 : 600;

    // Calculate ETA
    const etaSeconds = Math.max(0, estimatedTotal - elapsedTime);

    return {
      stage,
      stageNumber,
      totalStages,
      percentage,
      elapsedTime: Math.floor(elapsedTime),
      estimatedTotal: Math.floor(estimatedTotal),
      etaSeconds: Math.floor(etaSeconds),
      currentOperation: logs[logs.length - 1] || ''
    };
  };

  // Carregar legenda selecionada automaticamente
  useEffect(() => {
    if (selectedSubtitle?.content && !localSubtitleFile) {
      // Criar File a partir do conteúdo da legenda selecionada
      const subtitleName = selectedSubtitle.type === 'searched'
        ? `${(selectedSubtitle.data as any).name}.srt`
        : selectedSubtitle.type === 'extracted'
        ? (selectedSubtitle.data as any).filename
        : 'subtitle.srt';

      const blob = new Blob([selectedSubtitle.content], { type: 'text/plain' });
      const file = new File([blob], subtitleName, { type: 'text/plain' });

      setLocalSubtitleFile(file);
      setSubtitleFile(file);

      toast({
        title: "✅ Legenda carregada automaticamente",
        description: subtitleName,
      });
    }
  }, [selectedSubtitle]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalVideoFile(file);
      setVideoFile(file); // Guarda no contexto
      toast({
        title: "Vídeo carregado",
        description: file.name,
      });
    }
  };

  const handleSubtitleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalSubtitleFile(file);
      setSubtitleFile(file); // Guarda no contexto
      toast({
        title: "Legenda carregada",
        description: file.name,
      });
    }
  };

  // Poll log file for real-time progress
  useEffect(() => {
    if (!logFile || !isSyncing) {
      console.log('📊 Polling stopped - logFile:', logFile, 'isSyncing:', isSyncing);
      return;
    }

    console.log('📊 Starting polling for log file:', logFile);

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling sync log...');
        const response = await fetch(`${API_BASE}/sync-log/${logFile}`);
        const data = await response.json();

        console.log('📦 Log data received:', {
          logCount: data.logs?.length || 0,
          complete: data.complete,
          lastLog: data.logs?.[data.logs.length - 1]
        });

        if (data.logs && data.logs.length > 0) {
          setSyncLogs(data.logs);

          // Extract detailed metrics
          const metrics = extractMetricsFromLogs(data.logs);
          console.log('📈 Metrics:', metrics);
          setSyncMetrics(metrics);
          setSyncProgress(metrics.percentage);
        }

        // Stop polling if complete
        if (data.complete) {
          console.log('✅ Sync complete!');
          clearInterval(pollInterval);
          setSyncProgress(100);
          setSyncMetrics(prev => prev ? { ...prev, percentage: 100, stage: 'Concluído' } : null);
        }
      } catch (err) {
        console.error('❌ Error polling log:', err);
      }
    }, 500); // Poll every 500ms

    return () => {
      console.log('🛑 Cleanup: stopping polling');
      clearInterval(pollInterval);
    };
  }, [logFile, isSyncing, startTime]);

  const syncSubtitles = async () => {
    const vidFile = localVideoFile || videoFile;
    const subFile = localSubtitleFile || subtitleFile;

    if (!vidFile || !subFile) {
      toast({
        variant: "destructive",
        title: "Ficheiros em falta",
        description: "Selecione vídeo e legenda",
      });
      return;
    }

    // Check audio codec before syncing (only for files <4GB - ffmpeg.wasm limitation)
    const fileSizeGB = vidFile.size / (1024 * 1024 * 1024);

    if (fileSizeGB < 4) {
      setIsCheckingAudio(true);
      try {
        const audioCheck = await ensureCompatibleAudio(vidFile);

        if (!audioCheck.isCompatible && audioCheck.audioInfo) {
          const codec = audioCheck.audioInfo.codec.toUpperCase();

          // Show warning for incompatible audio (AC3, DTS, etc.)
          const confirmed = window.confirm(
            `⚠️ Áudio ${codec} Detectado\n\n` +
            `O vídeo tem áudio ${codec} que precisa ser convertido para AAC.\n\n` +
            `O backend irá:\n` +
            `1. Extrair o áudio ${codec}\n` +
            `2. Converter para AAC\n` +
            `3. Processar com MLX Whisper\n\n` +
            `Isto pode demorar alguns minutos extra.\n\n` +
            `Deseja continuar?`
          );

          if (!confirmed) {
            setIsCheckingAudio(false);
            return;
          }

          toast({
            title: `🔄 Áudio ${codec} → AAC`,
            description: "O backend irá converter automaticamente",
            duration: 5000,
          });
        }
      } catch (err) {
        console.warn('Audio check failed, proceeding anyway:', err);
      } finally {
        setIsCheckingAudio(false);
      }
    } else {
      // Large file - skip browser check, backend will handle audio conversion
      console.log(`📦 Large file (${fileSizeGB.toFixed(2)}GB) - skipping browser audio check`);
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);
    setLogFile(null);
    setSyncMetrics(null);
    setStartTime(Date.now());
    setUploadProgress(0);
    setUploadStatus("");

    try {
      const fileSizeMB = vidFile.size / (1024 * 1024);

      // Use parallel upload for large video files (>100MB)
      if (fileSizeMB > 100) {
        setUploadStatus("A fazer upload paralelo do vídeo...");

        const videoPath = await parallelUpload(vidFile, {
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
            const speedMBps = (progress.uploadSpeed / 1024 / 1024).toFixed(1);
            const etaMin = Math.ceil(progress.eta / 60);
            const uploadedMB = (progress.uploadedBytes / 1024 / 1024).toFixed(0);
            const totalMB = (progress.totalBytes / 1024 / 1024).toFixed(0);

            setUploadStatus(
              `Upload: ${uploadedMB}/${totalMB}MB (${progress.percentage.toFixed(1)}%) @ ${speedMBps} MB/s | ETA: ${etaMin}min`
            );
          },
          onChunkComplete: (chunkIndex, totalChunks) => {
            console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} complete`);
          }
        });

        console.log(`✅ Video uploaded: ${videoPath}`);

        // Check if we need to extract and upload AAC for GCS caching
        setUploadStatus("A verificar áudio...");

        try {
          const audioInfo = await detectAudioCodec(vidFile, (progress, msg) => {
            setUploadStatus(`A analisar áudio: ${msg}`);
          });

          // If audio needs conversion (AC3, DTS, etc), extract AAC and upload to GCS
          if (audioInfo && !audioInfo.isCompatible) {
            const codec = audioInfo.codec.toUpperCase();
            console.log(`🔊 Audio ${codec} detected - extracting AAC for GCS cache`);

            setUploadStatus(`A extrair áudio ${codec} → AAC...`);
            toast({
              title: `🔊 Áudio ${codec} Detectado`,
              description: "A extrair AAC para cache GCS (mais rápido para futuras sincronizações)",
            });

            // Extract AAC from video (audio only, no video)
            const aacFile = await extractAudioToAAC(vidFile, (progress, msg) => {
              setUploadStatus(`Extração AAC: ${msg} (${progress}%)`);
              setUploadProgress(progress);
            });

            console.log(`✅ AAC extracted: ${(aacFile.size / 1024 / 1024).toFixed(1)}MB`);

            // Upload AAC to GCS (same path as video but .aac extension)
            setUploadStatus("A fazer upload do AAC para GCS...");
            const aacPath = await parallelUpload(aacFile, {
              onProgress: (progress) => {
                setUploadProgress(progress.percentage);
                const speedMBps = (progress.uploadSpeed / 1024 / 1024).toFixed(1);
                const uploadedMB = (progress.uploadedBytes / 1024 / 1024).toFixed(0);
                const totalMB = (progress.totalBytes / 1024 / 1024).toFixed(0);

                setUploadStatus(
                  `Upload AAC: ${uploadedMB}/${totalMB}MB (${progress.percentage.toFixed(1)}%) @ ${speedMBps} MB/s`
                );
              }
            });

            console.log(`✅ AAC uploaded to GCS: ${aacPath}`);
            toast({
              title: "✅ AAC Cache Criado!",
              description: "Próximas sincronizações serão muito mais rápidas",
            });
          } else {
            console.log(`✅ Audio already compatible (${audioInfo?.codec || 'unknown'}), no AAC extraction needed`);
          }
        } catch (audioError) {
          // Non-critical error - continue with sync even if AAC extraction fails
          console.warn('AAC extraction failed (non-critical):', audioError);
        }

        setUploadStatus("A iniciar sincronização...");

        toast({
          title: "A iniciar sincronização",
          description: "MLX Whisper vai processar o vídeo",
        });

        // Send subtitle file + video path to sync endpoint
        const formData = new FormData();
        formData.append('video_path', videoPath);  // GCS path from parallel upload
        formData.append('subtitle', subFile);       // Actual subtitle file

        const response = await fetch(`${API_BASE}/sync`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        // Continue with normal flow...
        processSync(result);

      } else {
        // Small file - use regular upload
        setUploadStatus("A fazer upload...");

        const formData = new FormData();
        formData.append('video', vidFile);
        formData.append('subtitle', subFile);

        const response = await fetch(`${API_BASE}/sync`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        processSync(result);
      }

    } catch (err) {
      setIsSyncing(false);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: err instanceof Error ? err.message : "Falha ao sincronizar legendas",
      });
    }
  };

  const processSync = (result: any) => {
    if (result.success) {
      setSyncedData(result);
      setLogFile(result.log_file); // Start polling logs

      // Wait for completion before showing success toast
      const checkCompletion = setInterval(async () => {
        try {
          const logResponse = await fetch(`${API_BASE}/sync-log/${result.log_file}`);
          const logData = await logResponse.json();

          if (logData.complete) {
            clearInterval(checkCompletion);
            setIsSyncing(false);

            toast({
              title: "Sincronização concluída!",
              description: result.offset_detected !== null && result.offset_detected !== undefined
                ? `Offset detectado: ${result.offset_detected.toFixed(2)}s`
                : "Legendas sincronizadas com sucesso",
            });
          }
        } catch (err) {
          clearInterval(checkCompletion);
          setIsSyncing(false);
        }
      }, 1000);

    } else {
      throw new Error(result.error || 'Sincronização falhou');
    }
  };

  const downloadSynced = () => {
    if (syncedData?.synced_file) {
      const link = document.createElement('a');
      link.href = `${API_BASE}/download/${syncedData.synced_file}`;
      link.download = syncedData.synced_file;
      link.click();
    }
  };

  const currentVideo = localVideoFile || videoFile;
  const currentSubtitle = localSubtitleFile || subtitleFile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Sincronização Automática</h2>
        <p className="text-sm text-muted-foreground">
          Alinhar legendas ao áudio com MLX Whisper.
        </p>
      </div>

      {/* Context files indicator */}
      {(currentVideo || currentSubtitle) && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>
            {currentVideo && <div>✓ Vídeo: <strong>{currentVideo.name}</strong></div>}
            {currentSubtitle && <div>✓ Legenda: <strong>{currentSubtitle.name}</strong></div>}
          </AlertDescription>
        </Alert>
      )}

      {/* File Inputs */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileVideo className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Ficheiro de Vídeo</h3>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="video/*,.mkv,.mp4,.avi,.mov"
                onChange={handleVideoSelect}
                className="hidden"
                id="video-input"
                disabled={isSyncing}
              />
              <label htmlFor="video-input">
                <Button variant="outline" className="w-full" asChild disabled={isSyncing}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {currentVideo ? currentVideo.name : 'Selecionar Vídeo'}
                  </span>
                </Button>
              </label>
              {currentVideo && (
                <p className="text-xs text-muted-foreground">
                  {(currentVideo.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Ficheiro de Legendas</h3>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".srt"
                onChange={handleSubtitleSelect}
                className="hidden"
                id="subtitle-input"
                disabled={isSyncing}
              />
              <label htmlFor="subtitle-input">
                <Button variant="outline" className="w-full" asChild disabled={isSyncing}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {currentSubtitle ? currentSubtitle.name : 'Selecionar SRT'}
                  </span>
                </Button>
              </label>
              {currentSubtitle && (
                <p className="text-xs text-muted-foreground">
                  {(currentSubtitle.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Button */}
      <Card className="p-6">
        <Button
          onClick={syncSubtitles}
          disabled={!currentVideo || !currentSubtitle || isSyncing || isCheckingAudio}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isSyncing || isCheckingAudio) ? 'animate-spin' : ''}`} />
          {isCheckingAudio ? 'A verificar áudio...' : isSyncing ? 'A Sincronizar...' : 'Iniciar Sincronização'}
        </Button>
        {isSyncing && (
          <div className="mt-4 space-y-4">
            {/* Upload Progress (when uploading large files) */}
            {uploadStatus && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {uploadStatus}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {uploadProgress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Sync Progress */}
            {(!uploadStatus || uploadProgress >= 100) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {syncMetrics?.stage || 'A processar...'}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {syncProgress}%
                  </span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            )}

            {/* Detailed Metrics */}
            {syncMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Etapa</p>
                  <p className="text-sm font-semibold text-foreground">
                    {syncMetrics.stageNumber}/{syncMetrics.totalStages}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tempo Decorrido</p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {Math.floor(syncMetrics.elapsedTime / 60)}m {syncMetrics.elapsedTime % 60}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tempo Estimado</p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {Math.floor(syncMetrics.etaSeconds / 60)}m {syncMetrics.etaSeconds % 60}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Estimado</p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    {Math.floor(syncMetrics.estimatedTotal / 60)}m {syncMetrics.estimatedTotal % 60}s
                  </p>
                </div>
              </div>
            )}

            {/* Current Operation */}
            {syncMetrics?.currentOperation && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Operação Atual</p>
                <p className="text-sm text-foreground font-medium">
                  {syncMetrics.currentOperation}
                </p>
              </div>
            )}

            {/* Real-time logs */}
            {syncLogs.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-primary hover:underline mb-2">
                  Ver logs detalhados ({syncLogs.length} linhas)
                </summary>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg max-h-64 overflow-y-auto font-mono text-xs">
                  {syncLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-1 ${
                        log.includes('✅') ? 'text-green-600 dark:text-green-400' :
                        log.includes('❌') ? 'text-red-600 dark:text-red-400' :
                        log.includes('⚠️') ? 'text-yellow-600 dark:text-yellow-400' :
                        log.includes('🎬') || log.includes('🤖') ? 'text-primary font-semibold' :
                        'text-foreground/80'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  {/* Auto-scroll to bottom */}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </details>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>MLX Whisper</strong> está a analisar o áudio em múltiplos pontos.
                Este processo demora tipicamente 5-10 minutos dependendo da duração do vídeo.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>

      {/* Results */}
      {syncedData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Sincronização Concluída</h3>
            {syncedData.offset_detected !== undefined && (
              <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Offset Detectado</p>
                <p className="text-3xl font-bold text-primary">
                  {syncedData.offset_detected > 0 ? '+' : ''}{syncedData.offset_detected.toFixed(2)}s
                </p>
              </div>
            )}
            <Button onClick={downloadSynced} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descarregar Legendas Sincronizadas
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SubtitleSync;
