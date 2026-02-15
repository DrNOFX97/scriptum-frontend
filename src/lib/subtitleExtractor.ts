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
 * Parse ffmpeg output to detect subtitle tracks
 */
function parseSubtitleStreams(logs: string[]): Array<{ index: number; language: string; title?: string }> {
  const subtitleStreams: Array<{ index: number; language: string; title?: string; codec?: string }> = [];
  let subtitleIndex = 0;
  let currentStream: { index: number; language: string; title?: string; codec?: string } | null = null;

  for (const log of logs) {
    // Look for subtitle stream lines like:
    // Stream #0:2(por): Subtitle: subrip
    // Stream #0:3(eng): Subtitle: ass (default)
    // Stream #0:4(pt-BR): Subtitle: srt (Brazilian Portuguese)
    // Stream #0:5(en-US): Subtitle: srt (English - US)

    // Match both 2-letter (pt, en) and 5-letter variants (pt-BR, en-US)
    const streamMatch = log.match(/Stream #0:(\d+)(?:\(([a-z]{2,3}(?:-[A-Z]{2})?)\))?: Subtitle: (\w+)(.*)/i);

    if (streamMatch) {
      // If we had a previous stream, save it
      if (currentStream) {
        console.log('📝 Saving subtitle stream:', currentStream);
        subtitleStreams.push(currentStream);
      }

      let language = streamMatch[2] || 'unk';
      const codec = streamMatch[3];
      const rest = streamMatch[4] || '';

      console.log('🎯 Found subtitle stream:', { language, codec, rest });

      // Normalize language code
      if (language !== 'unk') {
        // Convert to lowercase, but keep the country code uppercase
        // pt-br → pt-BR, en-us → en-US
        const parts = language.toLowerCase().split('-');
        if (parts.length === 2) {
          language = `${parts[0]}-${parts[1].toUpperCase()}`;
        } else {
          language = parts[0];
        }
      }

      // Look for title in metadata (anything in parentheses after codec)
      const titleMatch = rest.match(/\(([^)]+)\)/);
      const title = titleMatch ? titleMatch[1] : undefined;

      currentStream = {
        index: subtitleIndex++,
        language,
        title,
        codec
      };
    }
    // Look for metadata title on the next lines
    // Format: "      title           : Brazilian"
    else if (currentStream && /^\s+title\s+:/i.test(log)) {
      const metadataTitle = log.split(':')[1]?.trim();
      console.log('🏷️ Found metadata title for current stream:', metadataTitle);
      if (metadataTitle && metadataTitle !== 'N/A') {
        currentStream.title = metadataTitle;
        console.log('✅ Updated stream title to:', metadataTitle);
      }
    }
  }

  // Don't forget the last stream
  if (currentStream) {
    console.log('📝 Saving last subtitle stream:', currentStream);
    subtitleStreams.push(currentStream);
  }

  console.log('🎬 Final parsed subtitle streams:', subtitleStreams);
  return subtitleStreams;
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

    // Capture logs to parse subtitle stream info
    const logs: string[] = [];
    const ffmpegInstance = await loadFFmpeg((p) => onProgress?.(10 + p * 0.2, 'A carregar ffmpeg...'));

    ffmpegInstance.on('log', ({ message }) => {
      logs.push(message);
    });

    onProgress?.(30, 'A analisar ficheiro MKV...');
    await ffmpegInstance.writeFile('input.mkv', await fetchFile(file));

    // Probe file to detect subtitle streams
    try {
      await ffmpegInstance.exec(['-i', 'input.mkv']);
    } catch {
      // ffprobe exits with error code, but that's ok - we just want the logs
    }

    // Parse subtitle streams from logs
    const subtitleStreams = parseSubtitleStreams(logs);

    if (subtitleStreams.length === 0) {
      throw new Error('Nenhuma legenda encontrada no ficheiro MKV');
    }

    onProgress?.(40, `${subtitleStreams.length} legenda(s) encontrada(s). A extrair...`);

    // Extract each subtitle track
    const extractedTracks: SubtitleTrack[] = [];

    for (let i = 0; i < subtitleStreams.length; i++) {
      try {
        const stream = subtitleStreams[i];
        const progressPercent = 40 + Math.floor((i / subtitleStreams.length) * 50);

        onProgress?.(progressPercent, `A extrair ${stream.language.toUpperCase()} (${i + 1}/${subtitleStreams.length})...`);

        // Extract this subtitle stream
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

        // Add to results with language info
        extractedTracks.push({
          index: i,
          language: stream.language,
          title: stream.title,
          codec: 'srt',
          content
        });

      } catch (error) {
        console.warn(`Failed to extract subtitle ${i}:`, error);
      }
    }

    // Clean up input file
    await ffmpegInstance.deleteFile('input.mkv');

    onProgress?.(100, 'Extração concluída!');

    if (extractedTracks.length === 0) {
      throw new Error('Falha ao extrair legendas');
    }

    return extractedTracks;

  } catch (error) {
    console.error('Failed to extract subtitles:', error);
    throw error instanceof Error ? error : new Error('Falha ao extrair legendas');
  }
}
