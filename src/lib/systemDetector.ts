/**
 * System Detection & Whisper Capability Check
 * Detects user's system and checks for MLX (Mac) or CUDA (Windows/Linux) support
 */

export interface SystemInfo {
  platform: 'mac' | 'windows' | 'linux' | 'unknown';
  os: string;
  arch: string;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  browser: string;
  userAgent: string;
}

export interface WhisperCapability {
  canUseMLX: boolean;
  canUseCUDA: boolean;
  recommendedBackend: 'mlx' | 'cuda' | 'cpu' | 'none';
  hasGPU: boolean;
  gpuInfo?: GPUInfo;
  mlxInfo?: MLXInfo;
  cudaInfo?: CUDAInfo;
  warnings: string[];
}

export interface GPUInfo {
  vendor: string;
  renderer: string;
  isNvidia: boolean;
  isAMD: boolean;
  isIntel: boolean;
  isAppleSilicon: boolean;
}

export interface MLXInfo {
  available: boolean;
  version?: string;
  chip?: string; // M1, M2, M3, etc.
  unified_memory?: number; // GB
  reason?: string;
}

export interface CUDAInfo {
  available: boolean;
  version?: string;
  compute_capability?: string;
  vram?: number; // GB
  reason?: string;
}

/**
 * Detect user's operating system and architecture
 */
export function detectSystem(): SystemInfo {
  const ua = navigator.userAgent;
  const platform = navigator.platform.toLowerCase();

  let os = 'unknown';
  let detectedPlatform: SystemInfo['platform'] = 'unknown';
  let arch = '';

  // Detect macOS
  if (platform.includes('mac') || ua.includes('Macintosh')) {
    detectedPlatform = 'mac';
    os = 'macOS';

    // Detect Apple Silicon vs Intel
    if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X ([\d_]+)/);
      if (match) {
        os = `macOS ${match[1].replace(/_/g, '.')}`;
      }
    }

    arch = platform.includes('intel') ? 'Intel' : 'Apple Silicon';
  }
  // Detect Windows
  else if (platform.includes('win') || ua.includes('Windows')) {
    detectedPlatform = 'windows';

    if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else os = 'Windows';

    arch = ua.includes('Win64') || ua.includes('x64') ? 'x64' : 'x86';
  }
  // Detect Linux
  else if (platform.includes('linux') || ua.includes('Linux')) {
    detectedPlatform = 'linux';
    os = 'Linux';
    arch = ua.includes('x86_64') ? 'x64' : 'x86';
  }

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  return {
    platform: detectedPlatform,
    os,
    arch,
    isMac: detectedPlatform === 'mac',
    isWindows: detectedPlatform === 'windows',
    isLinux: detectedPlatform === 'linux',
    browser,
    userAgent: ua,
  };
}

/**
 * Detect GPU capabilities using WebGL
 */
export function detectGPU(): GPUInfo | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return null;
    }

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return null;
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    const isNvidia = /nvidia/i.test(vendor) || /nvidia/i.test(renderer);
    const isAMD = /amd|radeon/i.test(vendor) || /amd|radeon/i.test(renderer);
    const isIntel = /intel/i.test(vendor) || /intel/i.test(renderer);
    const isAppleSilicon = /apple/i.test(vendor) && /m[1-3]/i.test(renderer);

    return {
      vendor,
      renderer,
      isNvidia,
      isAMD,
      isIntel,
      isAppleSilicon,
    };
  } catch (err) {
    console.error('Failed to detect GPU:', err);
    return null;
  }
}

/**
 * Check if system can use MLX (Apple Silicon only)
 */
export async function checkMLXCapability(systemInfo: SystemInfo, gpuInfo: GPUInfo | null): Promise<MLXInfo> {
  // MLX only works on Apple Silicon Macs
  if (!systemInfo.isMac) {
    return {
      available: false,
      reason: 'MLX é exclusivo para Mac com Apple Silicon',
    };
  }

  // Check if it's Apple Silicon
  if (!gpuInfo?.isAppleSilicon && !systemInfo.arch.includes('Apple')) {
    return {
      available: false,
      reason: 'MLX requer Mac com chip M1/M2/M3/M4. Este Mac parece ser Intel.',
    };
  }

  // Try to detect chip from renderer
  let chip = 'Unknown';
  if (gpuInfo?.renderer) {
    if (/M1/i.test(gpuInfo.renderer)) chip = 'M1';
    else if (/M2/i.test(gpuInfo.renderer)) chip = 'M2';
    else if (/M3/i.test(gpuInfo.renderer)) chip = 'M3';
    else if (/M4/i.test(gpuInfo.renderer)) chip = 'M4';
  }

  return {
    available: true,
    chip,
    reason: 'Mac com Apple Silicon detetado. MLX Whisper pode ser usado.',
  };
}

/**
 * Check if system can use CUDA (NVIDIA GPU on Windows/Linux)
 */
export async function checkCUDACapability(systemInfo: SystemInfo, gpuInfo: GPUInfo | null): Promise<CUDAInfo> {
  // CUDA requires NVIDIA GPU
  if (!gpuInfo?.isNvidia) {
    if (systemInfo.isMac) {
      return {
        available: false,
        reason: 'CUDA não está disponível em Mac. Use MLX em vez disso.',
      };
    }

    if (!gpuInfo) {
      return {
        available: false,
        reason: 'GPU não detetada. CUDA requer NVIDIA GPU.',
      };
    }

    return {
      available: false,
      reason: `GPU ${gpuInfo.vendor} detetada. CUDA requer NVIDIA GPU.`,
    };
  }

  // NVIDIA GPU detected
  return {
    available: true,
    reason: 'NVIDIA GPU detetada. Whisper com CUDA pode ser usado.',
  };
}

/**
 * Get complete Whisper capability assessment
 */
export async function checkWhisperCapability(): Promise<WhisperCapability> {
  const systemInfo = detectSystem();
  const gpuInfo = detectGPU();

  const mlxInfo = await checkMLXCapability(systemInfo, gpuInfo);
  const cudaInfo = await checkCUDACapability(systemInfo, gpuInfo);

  const warnings: string[] = [];

  // Determine recommended backend
  let recommendedBackend: WhisperCapability['recommendedBackend'] = 'none';

  if (mlxInfo.available) {
    recommendedBackend = 'mlx';
  } else if (cudaInfo.available) {
    recommendedBackend = 'cuda';
  } else {
    recommendedBackend = 'cpu';
    warnings.push('Nenhuma aceleração GPU disponível. Whisper será muito lento em CPU.');
  }

  // Add warnings
  if (systemInfo.isMac && !mlxInfo.available) {
    warnings.push('Mac com Intel detetado. MLX não está disponível. Performance será limitada.');
  }

  if (systemInfo.isWindows && !cudaInfo.available && gpuInfo?.isAMD) {
    warnings.push('GPU AMD detetada. ROCm pode ser uma opção (experimental).');
  }

  if (!gpuInfo) {
    warnings.push('Não foi possível detetar GPU. Browser pode estar a bloquear WebGL.');
  }

  return {
    canUseMLX: mlxInfo.available,
    canUseCUDA: cudaInfo.available,
    recommendedBackend,
    hasGPU: !!gpuInfo,
    gpuInfo: gpuInfo || undefined,
    mlxInfo,
    cudaInfo,
    warnings,
  };
}

/**
 * Format system info for display
 */
export function formatSystemInfo(info: SystemInfo): string {
  return `${info.os} (${info.arch}) - ${info.browser}`;
}

/**
 * Format GPU info for display
 */
export function formatGPUInfo(gpu: GPUInfo): string {
  return `${gpu.vendor} - ${gpu.renderer}`;
}

/**
 * Get recommendation text based on capability
 */
export function getRecommendationText(capability: WhisperCapability): string {
  if (capability.canUseMLX) {
    return `✅ Sistema ideal para MLX Whisper!\n${capability.mlxInfo?.chip ? `Chip: ${capability.mlxInfo.chip}` : ''}\n\nMLX é otimizado para Apple Silicon e será muito rápido.`;
  }

  if (capability.canUseCUDA) {
    return `✅ Sistema compatível com CUDA Whisper!\nGPU: ${capability.gpuInfo?.renderer || 'NVIDIA'}\n\nWhisper com CUDA será muito mais rápido que CPU.`;
  }

  if (capability.recommendedBackend === 'cpu') {
    return `⚠️ Sistema sem aceleração GPU.\n\nWhisper será processado em CPU (muito lento).\nRecomendado: Use serviço de cloud ou máquina com GPU.`;
  }

  return 'Sistema analisado. Veja detalhes abaixo.';
}
