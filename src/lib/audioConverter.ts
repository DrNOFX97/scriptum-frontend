/**
 * Convert MKV audio codecs for browser compatibility using ffmpeg.wasm
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export interface AudioStreamInfo {
  index: number;
  codec: string;
  channels: number;
  sampleRate: string;
  isCompatible: boolean;
}

/**
 * Browser-compatible audio codecs
 */
const COMPATIBLE_CODECS = ['aac', 'mp3', 'opus', 'vorbis'];

/**
 * Initialize ffmpeg.wasm
 */
async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Set up logging
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  // Set up progress tracking
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  // Load ffmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  isLoaded = true;
  return ffmpeg;
}

/**
 * Detect audio codec from MKV file
 */
export async function detectAudioCodec(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<AudioStreamInfo | null> {
  try {
    onProgress?.(10, 'A inicializar ffmpeg...');

    const logs: string[] = [];
    const ffmpegInstance = await loadFFmpeg((p) => onProgress?.(10 + p * 0.3, 'A carregar ffmpeg...'));

    ffmpegInstance.on('log', ({ message }) => {
      logs.push(message);
    });

    onProgress?.(40, 'A analisar streams de áudio...');
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    // Probe file
    try {
      await ffmpegInstance.exec(['-i', 'input.mkv']);
    } catch {
      // ffmpeg exits with error, but logs are captured
    }

    // Clean up
    await ffmpegInstance.deleteFile('input.mkv');

    // Parse audio stream from logs
    const audioInfo = parseAudioStream(logs);

    onProgress?.(100, 'Análise concluída!');

    return audioInfo;

  } catch (error) {
    console.error('Failed to detect audio codec:', error);
    throw error instanceof Error ? error : new Error('Falha ao analisar áudio');
  }
}

/**
 * Parse ffmpeg logs to find audio stream info
 */
function parseAudioStream(logs: string[]): AudioStreamInfo | null {
  for (const log of logs) {
    // Match audio stream lines like:
    // Stream #0:1(eng): Audio: ac3, 48000 Hz, stereo, fltp, 192 kb/s
    // Stream #0:1: Audio: aac (LC), 44100 Hz, stereo, fltp, 128 kb/s
    const audioMatch = log.match(/Stream #0:(\d+).*?Audio: (\w+).*?(\d+) Hz.*?(mono|stereo|5\.1|7\.1)/i);

    if (audioMatch) {
      const codec = audioMatch[2].toLowerCase();
      const sampleRate = audioMatch[3];
      const channelLayout = audioMatch[4];

      // Determine channel count
      let channels = 2;
      if (channelLayout === 'mono') channels = 1;
      else if (channelLayout === '5.1') channels = 6;
      else if (channelLayout === '7.1') channels = 8;

      return {
        index: parseInt(audioMatch[1]),
        codec,
        channels,
        sampleRate,
        isCompatible: COMPATIBLE_CODECS.includes(codec)
      };
    }
  }

  return null;
}

/**
 * Convert MKV audio from AC3/incompatible codec to AAC
 */
export async function convertAudioToAAC(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<File> {
  try {
    onProgress?.(5, 'A inicializar conversão...');

    const ffmpegInstance = await loadFFmpeg((p) => onProgress?.(5 + p * 0.1, 'A carregar ffmpeg...'));

    // Track conversion progress
    let conversionStarted = false;
    ffmpegInstance.on('log', ({ message }) => {
      if (message.includes('time=')) {
        conversionStarted = true;
      }
    });

    onProgress?.(15, 'A carregar ficheiro...');
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    onProgress?.(20, 'A converter áudio AC3 → AAC...');

    // Convert: copy video, convert audio to AAC, copy subtitles
    await ffmpegInstance.exec([
      '-i', 'input.mkv',
      '-c:v', 'copy',        // Copy video as-is (no re-encoding)
      '-c:a', 'aac',         // Convert audio to AAC
      '-b:a', '192k',        // Audio bitrate 192 kbps
      '-c:s', 'copy',        // Copy subtitles as-is
      '-map', '0',           // Map all streams from input
      'output.mkv'
    ]);

    onProgress?.(90, 'A finalizar...');

    // Read converted file
    const data = await ffmpegInstance.readFile('output.mkv');
    const blob = new Blob([data], { type: 'video/x-matroska' });

    // Create new filename
    const originalName = file.name.replace(/\.mkv$/i, '');
    const newFile = new File([blob], `${originalName}.web.mkv`, { type: 'video/x-matroska' });

    // Clean up
    await ffmpegInstance.deleteFile('input.mkv');
    await ffmpegInstance.deleteFile('output.mkv');

    onProgress?.(100, 'Conversão concluída!');

    return newFile;

  } catch (error) {
    console.error('Failed to convert audio:', error);
    throw error instanceof Error ? error : new Error('Falha ao converter áudio');
  }
}

/**
 * Check if audio conversion is needed and convert if necessary
 */
export async function ensureCompatibleAudio(
  file: File,
  onProgress?: (progress: number, message: string) => void,
  checkOnly: boolean = false
): Promise<{ file: File; converted: boolean; audioInfo: AudioStreamInfo | null }> {
  try {
    // Detect audio codec
    const audioInfo = await detectAudioCodec(file, (p, msg) =>
      onProgress?.(p * 0.3, msg)
    );

    if (!audioInfo) {
      // No audio stream found - return original file
      return { file, converted: false, audioInfo: null };
    }

    if (audioInfo.isCompatible) {
      // Audio is already compatible - return original file
      onProgress?.(100, `Áudio ${audioInfo.codec.toUpperCase()} é compatível!`);
      return { file, converted: false, audioInfo };
    }

    // If check only mode, don't convert
    if (checkOnly) {
      onProgress?.(100, `Áudio ${audioInfo.codec.toUpperCase()} não é compatível`);
      return { file, converted: false, audioInfo };
    }

    // Audio needs conversion
    onProgress?.(30, `Áudio ${audioInfo.codec.toUpperCase()} não é compatível. A converter...`);

    const convertedFile = await convertAudioToAAC(file, (p, msg) =>
      onProgress?.(30 + p * 0.7, msg)
    );

    return { file: convertedFile, converted: true, audioInfo };

  } catch (error) {
    console.error('Failed to ensure compatible audio:', error);
    throw error;
  }
}
