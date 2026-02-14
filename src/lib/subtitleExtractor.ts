/**
 * Extract subtitles from MKV files using ffmpeg.wasm
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export interface SubtitleTrack {
  index: number;
  language: string;
  title?: string;
  codec: string;
  content?: string;
}

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
 * Probe MKV file to find subtitle tracks
 */
export async function probeSubtitles(
  file: File,
  onProgress?: (progress: number) => void
): Promise<SubtitleTrack[]> {
  try {
    const ffmpegInstance = await loadFFmpeg(onProgress);

    // Write input file to ffmpeg's virtual filesystem
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    // Probe file to get stream info
    await ffmpegInstance.exec(['-i', 'input.mkv', '-hide_banner']);

    // Parse ffmpeg output to find subtitle streams
    // Note: ffmpeg logs are captured in the 'log' event handler above
    // For now, we'll return a mock list and extract all subtitles
    const tracks: SubtitleTrack[] = [
      { index: 0, language: 'por', codec: 'srt', title: 'Portuguese' },
      { index: 1, language: 'eng', codec: 'srt', title: 'English' },
    ];

    return tracks;
  } catch (error) {
    console.error('Failed to probe subtitles:', error);
    throw new Error('Failed to analyze subtitle tracks');
  }
}

/**
 * Extract subtitle track from MKV
 */
export async function extractSubtitle(
  file: File,
  trackIndex: number = 0,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const ffmpegInstance = await loadFFmpeg(onProgress);

    // Write input file
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    // Extract subtitle track (map to first subtitle stream found)
    await ffmpegInstance.exec([
      '-i', 'input.mkv',
      '-map', `0:s:${trackIndex}`, // Select subtitle stream by index
      '-c:s', 'srt', // Convert to SRT format
      'output.srt'
    ]);

    // Read extracted subtitle
    const data = await ffmpegInstance.readFile('output.srt');
    const subtitleContent = new TextDecoder().decode(data);

    // Clean up
    await ffmpegInstance.deleteFile('input.mkv');
    await ffmpegInstance.deleteFile('output.srt');

    return subtitleContent;
  } catch (error) {
    console.error('Failed to extract subtitle:', error);
    throw new Error('Failed to extract subtitle track. Make sure the file contains subtitles.');
  }
}

/**
 * Extract all subtitle tracks from MKV
 */
export async function extractAllSubtitles(
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<SubtitleTrack[]> {
  try {
    onProgress?.(10, 'A inicializar ffmpeg...');
    const ffmpegInstance = await loadFFmpeg((p) => onProgress?.(10 + p * 0.2, 'A carregar ffmpeg...'));

    onProgress?.(30, 'A ler ficheiro MKV...');
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    // Try to extract up to 10 subtitle tracks (most MKVs have 1-3)
    const extractedTracks: SubtitleTrack[] = [];
    
    for (let i = 0; i < 10; i++) {
      try {
        onProgress?.(30 + (i * 7), `A extrair legenda ${i + 1}...`);

        // Try to extract this subtitle stream
        await ffmpegInstance.exec([
          '-i', 'input.mkv',
          '-map', `0:s:${i}`,
          '-c:s', 'srt',
          `output_${i}.srt`
        ]);

        // Read the extracted subtitle
        const data = await ffmpegInstance.readFile(`output_${i}.srt`);
        const content = new TextDecoder().decode(data);

        // Clean up this output file
        await ffmpegInstance.deleteFile(`output_${i}.srt`);

        // Add to results
        extractedTracks.push({
          index: i,
          language: 'unk', // We'll try to detect this later
          codec: 'srt',
          content
        });

      } catch (error) {
        // No more subtitle tracks
        break;
      }
    }

    // Clean up input file
    await ffmpegInstance.deleteFile('input.mkv');

    onProgress?.(100, 'Extração concluída!');

    if (extractedTracks.length === 0) {
      throw new Error('Nenhuma legenda encontrada no ficheiro MKV');
    }

    return extractedTracks;

  } catch (error) {
    console.error('Failed to extract subtitles:', error);
    throw error instanceof Error ? error : new Error('Falha ao extrair legendas');
  }
}
