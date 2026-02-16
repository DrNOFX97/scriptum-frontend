/**
 * Dual Video Player
 *
 * Plays video and audio from separate sources with synchronized playback.
 * This allows playing MKV videos with AC3 audio in the browser by:
 * 1. Loading the original MKV video (no audio or muted)
 * 2. Loading a separate AAC audio file
 * 3. Syncing playback, seeking, and playback rate
 *
 * Much faster than converting the entire video - only audio needs conversion.
 */

import { useRef, useEffect, useState } from 'react';

interface DualVideoPlayerProps {
  videoSrc: string;
  audioSrc?: string;
  subtitleSrc?: string;
  className?: string;
}

export const DualVideoPlayer = ({
  videoSrc,
  audioSrc,
  subtitleSrc,
  className = ''
}: DualVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!audioSrc || !videoRef.current || !audioRef.current) {
      setIsSynced(false);
      return;
    }

    const video = videoRef.current;
    const audio = audioRef.current;

    console.log('🎬 Setting up dual player sync');

    // Mute video to prevent double audio
    video.muted = true;

    // Sync play/pause
    const syncPlay = () => {
      console.log('▶️ Video play - syncing audio');
      audio.play().catch(err => {
        console.error('❌ Failed to play audio:', err);
      });
    };

    const syncPause = () => {
      console.log('⏸️ Video pause - syncing audio');
      audio.pause();
    };

    // Sync seeking
    const syncSeek = () => {
      console.log('⏩ Video seeked to', video.currentTime, '- syncing audio');
      audio.currentTime = video.currentTime;
    };

    // Sync playback rate
    const syncRate = () => {
      console.log('⚡ Video rate changed to', video.playbackRate, '- syncing audio');
      audio.playbackRate = video.playbackRate;
    };

    // Sync volume
    const syncVolume = () => {
      console.log('🔊 Video volume changed to', video.volume, '- syncing audio');
      audio.volume = video.volume;
    };

    // Attach listeners
    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPause);
    video.addEventListener('seeked', syncSeek);
    video.addEventListener('ratechange', syncRate);
    video.addEventListener('volumechange', syncVolume);

    // Drift correction (check every 100ms)
    const driftInterval = setInterval(() => {
      if (!video.paused) {
        const diff = Math.abs(video.currentTime - audio.currentTime);

        if (diff > 0.1) { // More than 100ms drift
          console.log('⚠️ Drift detected:', diff.toFixed(3), 's - correcting');
          audio.currentTime = video.currentTime;
        }
      }
    }, 100);

    setIsSynced(true);
    console.log('✅ Dual player sync enabled');

    // Cleanup
    return () => {
      video.removeEventListener('play', syncPlay);
      video.removeEventListener('pause', syncPause);
      video.removeEventListener('seeked', syncSeek);
      video.removeEventListener('ratechange', syncRate);
      video.removeEventListener('volumechange', syncVolume);
      clearInterval(driftInterval);
      console.log('🛑 Dual player sync disabled');
    };
  }, [audioSrc]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full"
        crossOrigin="anonymous"
      >
        {subtitleSrc && (
          <track
            kind="subtitles"
            src={subtitleSrc}
            default
          />
        )}
      </video>

      {audioSrc && (
        <>
          <audio
            ref={audioRef}
            src={audioSrc}
            className="hidden"
          />

          {isSynced && (
            <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1.5">
              <span>🎵</span>
              <span>Áudio Sincronizado</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
