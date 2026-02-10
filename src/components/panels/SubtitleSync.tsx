import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Upload, FileVideo, FileText, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

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

const SubtitleSync = () => {
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localSubtitleFile, setLocalSubtitleFile] = useState<File | null>(null);
  const [syncedData, setSyncedData] = useState<SyncResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [logFile, setLogFile] = useState<string | null>(null);
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
    if (!logFile || !isSyncing) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/sync-log/${logFile}`);
        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
          setSyncLogs(data.logs);

          // Estimate progress from log content
          const logText = data.logs.join(' ');
          if (logText.includes('Analisando framerates')) setSyncProgress(10);
          if (logText.includes('Detectando idioma')) setSyncProgress(20);
          if (logText.includes('Extraindo amostra')) setSyncProgress(30);
          if (logText.includes('Transcrevendo amostra')) setSyncProgress(40);
          if (logText.includes('Iniciando análise')) setSyncProgress(50);
          if (logText.includes('Transcrevendo áudio')) setSyncProgress(70);
          if (logText.includes('Análise completa')) setSyncProgress(90);
          if (logText.includes('Aplicando correção')) setSyncProgress(95);
        }

        // Stop polling if complete
        if (data.complete) {
          clearInterval(pollInterval);
          setSyncProgress(100);
        }
      } catch (err) {
        console.error('Error polling log:', err);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(pollInterval);
  }, [logFile, isSyncing]);

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

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncLogs([]);
    setLogFile(null);

    try {
      toast({
        title: "Sincronizando...",
        description: "MLX Whisper a processar áudio",
      });

      const formData = new FormData();
      formData.append('video', vidFile);
      formData.append('subtitle', subFile);

      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

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
    } catch (err) {
      setIsSyncing(false);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: err instanceof Error ? err.message : "Falha ao sincronizar legendas",
      });
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
          disabled={!currentVideo || !currentSubtitle || isSyncing}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'A Sincronizar...' : 'Iniciar Sincronização'}
        </Button>
        {isSyncing && (
          <div className="mt-4 space-y-3">
            <Progress value={syncProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              A processar com MLX Whisper... {syncProgress}%
            </p>

            {/* Real-time logs */}
            {syncLogs.length > 0 && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg max-h-64 overflow-y-auto font-mono text-xs">
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
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este processo pode demorar 5-10 minutos dependendo da duração do vídeo.
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
