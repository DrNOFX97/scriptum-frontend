import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Cpu,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  detectSystem,
  detectGPU,
  checkWhisperCapability,
  formatSystemInfo,
  formatGPUInfo,
  getRecommendationText,
  type SystemInfo,
  type GPUInfo,
  type WhisperCapability
} from '@/lib/systemDetector';

export default function SystemDiagnostics() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [gpuInfo, setGPUInfo] = useState<GPUInfo | null>(null);
  const [whisperCapability, setWhisperCapability] = useState<WhisperCapability | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    try {
      const system = detectSystem();
      const gpu = detectGPU();
      const capability = await checkWhisperCapability();

      setSystemInfo(system);
      setGPUInfo(gpu);
      setWhisperCapability(capability);
    } catch (err) {
      console.error('Diagnostics failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getBackendBadge = (backend: string) => {
    switch (backend) {
      case 'mlx':
        return <Badge className="bg-green-500">MLX (Apple Silicon)</Badge>;
      case 'cuda':
        return <Badge className="bg-blue-500">CUDA (NVIDIA)</Badge>;
      case 'cpu':
        return <Badge variant="secondary">CPU (Lento)</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
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
        <h2 className="text-xl font-bold text-foreground mb-1">Diagnóstico de Sistema</h2>
        <p className="text-sm text-muted-foreground">
          Verifica se o sistema está preparado para MLX Whisper (Mac) ou CUDA Whisper (PC/Linux)
        </p>
      </div>

      {/* System Info Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Sistema Operativo</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={runDiagnostics}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Verificar Novamente
          </Button>
        </div>

        {systemInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Plataforma</p>
                <p className="text-sm font-medium text-foreground">{systemInfo.os}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Arquitetura</p>
                <p className="text-sm font-medium text-foreground">{systemInfo.arch}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Browser</p>
                <p className="text-sm font-medium text-foreground">{systemInfo.browser}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                <p className="text-sm font-medium text-foreground">
                  {systemInfo.isMac ? '🍎 Mac' : systemInfo.isWindows ? '🪟 Windows' : '🐧 Linux'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* GPU Info Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">GPU / Placa Gráfica</h3>
        </div>

        {gpuInfo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fabricante</p>
                <p className="text-sm font-medium text-foreground">{gpuInfo.vendor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modelo</p>
                <p className="text-sm font-medium text-foreground">{gpuInfo.renderer}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-3">
              {gpuInfo.isAppleSilicon && (
                <Badge className="bg-green-500">Apple Silicon</Badge>
              )}
              {gpuInfo.isNvidia && (
                <Badge className="bg-green-500">NVIDIA</Badge>
              )}
              {gpuInfo.isAMD && (
                <Badge className="bg-orange-500">AMD</Badge>
              )}
              {gpuInfo.isIntel && (
                <Badge variant="secondary">Intel</Badge>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível detetar a GPU. O browser pode estar a bloquear acesso ao WebGL.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Whisper Capability Card */}
      {whisperCapability && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Capacidade Whisper</h3>
          </div>

          <div className="space-y-4">
            {/* Recommended Backend */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Backend Recomendado</p>
              {getBackendBadge(whisperCapability.recommendedBackend)}
            </div>

            {/* MLX Support */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              {whisperCapability.canUseMLX ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">MLX Whisper (Mac)</p>
                <p className="text-xs text-muted-foreground">
                  {whisperCapability.mlxInfo?.reason}
                </p>
                {whisperCapability.mlxInfo?.chip && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Chip: {whisperCapability.mlxInfo.chip}
                  </p>
                )}
              </div>
            </div>

            {/* CUDA Support */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              {whisperCapability.canUseCUDA ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">CUDA Whisper (NVIDIA)</p>
                <p className="text-xs text-muted-foreground">
                  {whisperCapability.cudaInfo?.reason}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {whisperCapability.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {whisperCapability.warnings.map((warning, i) => (
                      <li key={i} className="text-xs">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendation */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs whitespace-pre-line">
                {getRecommendationText(whisperCapability)}
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      )}

      {/* Technical Details */}
      <Card className="p-6">
        <details className="cursor-pointer">
          <summary className="font-semibold text-foreground mb-2">
            Detalhes Técnicos
          </summary>
          <div className="mt-3 space-y-2 text-xs font-mono bg-muted/30 p-3 rounded">
            {systemInfo && (
              <>
                <p><strong>User Agent:</strong></p>
                <p className="text-muted-foreground break-all">{systemInfo.userAgent}</p>
              </>
            )}
            {gpuInfo && (
              <>
                <p className="mt-3"><strong>GPU Renderer:</strong></p>
                <p className="text-muted-foreground break-all">{formatGPUInfo(gpuInfo)}</p>
              </>
            )}
          </div>
        </details>
      </Card>

      {/* Configuration Recommendations */}
      {whisperCapability && (
        <Card className="p-6 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-3">Próximos Passos</h3>
          <div className="space-y-2 text-sm">
            {whisperCapability.canUseMLX && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-muted-foreground">
                  O backend já está configurado para usar MLX. Sincronização será rápida!
                </p>
              </div>
            )}

            {whisperCapability.canUseCUDA && (
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-muted-foreground">
                  O backend será configurado para usar CUDA. Certifique-se que NVIDIA drivers estão instalados no servidor.
                </p>
              </div>
            )}

            {whisperCapability.recommendedBackend === 'cpu' && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <p className="text-muted-foreground">
                  Sem GPU compatível. Whisper usará CPU (10-20x mais lento). Considere usar serviço de cloud com GPU.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
