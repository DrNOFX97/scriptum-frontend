import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, PictureInPicture2, Subtitles,
  Upload, Link, Loader2, MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Hls from "hls.js";

/* ── helpers ── */
const fmtTime = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const fmtSize = (b: number) => {
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
};

const getExt = (name: string) => (name || "").split(".").pop()?.toLowerCase() ?? "";

const srtToVtt = (srt: string) => {
  let vtt = "WEBVTT\n\n";
  vtt += srt.replace(/\r\n/g, "\n").replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return vtt;
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

interface FileInfo {
  name: string;
  size: string;
  type: string;
  res: string;
  dur: string;
}

/* ════════════════════════════════ COMPONENT ════════════════════════════════ */
const VideoPlayer = () => {
  const vidRef = useRef<HTMLVideoElement>(null);
  const vidBoxRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileInRef = useRef<HTMLInputElement>(null);
  const subInRef = useRef<HTMLInputElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const ctrlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<any>(null);
  const blobRef = useRef<string | null>(null);
  const ffmpegRef = useRef<any>(null);
  const ffmpegLoadedRef = useRef(false);
  const seekingRef = useRef(false);

  /* ui state */
  const [hasVideo, setHasVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [ctrlsVisible, setCtrlsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Carregando…");
  const [isConverting, setIsConverting] = useState(false);
  const [convPct, setConvPct] = useState(0);
  const [convMsg, setConvMsg] = useState("Convertendo…");
  const [subActive, setSubActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [timeTip, setTimeTip] = useState({ pct: 0, time: "0:00" });
  const [hlsLevels, setHlsLevels] = useState<Array<{index: number, height: number, bitrate: number}>>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);
  const [usingCorsProxy, setUsingCorsProxy] = useState(false);

  /* ── cleanup ── */
  const cleanup = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (dashRef.current) { dashRef.current.reset(); dashRef.current = null; }
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    const vid = vidRef.current;
    if (!vid) return;
    vid.querySelectorAll("track").forEach(t => t.remove());
    vid.removeAttribute("src");
    vid.load();
    setError(null);
    setHasVideo(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setFileInfo(null);
  }, []);

  /* ── ffmpeg conversion ── */
  const convertWithFFmpeg = useCallback(async (file: File): Promise<boolean> => {
    const vid = vidRef.current;
    if (!vid) return false;
    try {
      setIsConverting(true);
      setIsLoading(false);
      setConvPct(5);
      setConvMsg("Carregando conversor…");

      if (!ffmpegLoadedRef.current) {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");
        const ff = new FFmpeg();
        const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        ff.on("progress", ({ progress }: { progress: number }) => {
          const p = Math.round(Math.min(Math.max(progress * 100, 0), 100));
          setConvPct(p);
          setConvMsg(`Convertendo… ${p}%`);
        });
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
        ffmpegLoadedRef.current = true;
      }

      const ff = ffmpegRef.current;
      const { fetchFile } = await import("@ffmpeg/util");
      setConvMsg("Lendo ficheiro…"); setConvPct(10);

      const ext = getExt(file.name);
      const inputName = `input.${ext}`;
      const outputName = "output.mp4";

      await ff.writeFile(inputName, await fetchFile(file));
      setConvMsg("Convertendo…"); setConvPct(15);

      await ff.exec([
        "-i", inputName,
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", "-y", outputName
      ]);

      const output = await ff.readFile(outputName);
      const blob = new Blob([output.buffer], { type: "video/mp4" });

      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      blobRef.current = URL.createObjectURL(blob);
      vid.src = blobRef.current;
      vid.load();

      setIsConverting(false);
      setConvPct(100);

      await new Promise<void>((res, rej) => {
        vid.addEventListener("loadedmetadata", () => {
          setHasVideo(true);
          setDuration(vid.duration);
          setFileInfo(f => f ? { ...f, res: vid.videoWidth ? `${vid.videoWidth}×${vid.videoHeight}` : "Áudio", dur: fmtTime(vid.duration) } : f);
          res();
        }, { once: true });
        vid.addEventListener("error", () => rej(), { once: true });
      });

      try { await ff.deleteFile(inputName); await ff.deleteFile(outputName); } catch (_) {}
      return true;
    } catch (e) {
      console.error("FFmpeg failed:", e);
      setIsConverting(false);
      return false;
    }
  }, []);

  /* ── load source ── */
  const loadSource = useCallback(async (src: string | null, fileName: string, fileObj?: File) => {
    cleanup();
    setIsLoading(true);
    setLoadMsg("Carregando…");

    const ext = getExt(fileName || src || "");

    setFileInfo(fileObj
      ? { name: fileObj.name, size: fmtSize(fileObj.size), type: fileObj.type || ext.toUpperCase(), res: "…", dur: "…" }
      : { name: fileName || src?.split("/").pop()?.split("?")[0] || "Stream", size: "-", type: ext.toUpperCase() || "-", res: "-", dur: "-" }
    );

    const vid = vidRef.current;
    if (!vid) return;

    // HLS - detect by extension, path pattern, or explicit .m3u8
    const isHls = ext === "m3u8" || src?.includes(".m3u8") || src?.includes("/hls/");
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsRef.current = hls;

        // Handle mixed content: try HTTPS upgrade for HTTP streams on HTTPS pages
        let hlsUrl = src || "";
        let originalUrl = src || "";
        const isPageHttps = window.location.protocol === 'https:';
        const isStreamHttp = hlsUrl.startsWith('http://');

        if (isPageHttps && isStreamHttp) {
          // Try upgrading to HTTPS
          const httpsUrl = hlsUrl.replace('http://', 'https://');
          console.log(`⚠️ Mixed content detectado. Tentando HTTPS: ${httpsUrl}`);
          hlsUrl = httpsUrl;
          originalUrl = src || "";
        }

        // Use CORS proxy if enabled
        if (usingCorsProxy) {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(hlsUrl)}`;
          console.log(`🔄 Usando CORS proxy: ${proxyUrl}`);
          hlsUrl = proxyUrl;
        }

        console.log(`📺 Carregando stream HLS: ${hlsUrl}`);

        hls.loadSource(hlsUrl);
        hls.attachMedia(vid);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("✅ HLS manifest carregado com sucesso", data);
          console.log(`📊 Níveis disponíveis: ${hls.levels.length}`);

          // Extract and store available levels/qualities
          const levels = hls.levels.map((level, index) => ({
            index,
            height: level.height || 0,
            bitrate: level.bitrate || 0,
            name: level.name || `${level.height}p` || `Level ${index}`
          }));

          console.log("📺 Variantes/Canais:", levels);
          setHlsLevels(levels);
          setIsLoading(false);
          setHasVideo(true);
        });

        let corsRetryAttempted = false;

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error(`❌ Erro HLS (${data.type}): ${data.details}`, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Check if this is a CORS error and we haven't tried proxy yet
                const isCorsError = data.details === 'manifestLoadError' &&
                                   data.response?.code === 0 &&
                                   !usingCorsProxy &&
                                   !corsRetryAttempted;

                if (isCorsError) {
                  console.log("🔄 Erro CORS detectado. Tentando com proxy CORS...");
                  corsRetryAttempted = true;
                  setUsingCorsProxy(true);
                  hls.destroy();
                  // Trigger reload with CORS proxy
                  cleanup();
                  loadSource(originalUrl, (originalUrl || "").split("/").pop()?.split("?")[0] || "stream");
                  return;
                }

                // Check if this is a mixed content issue
                if (originalUrl.startsWith('http://') && window.location.protocol === 'https:') {
                  setIsLoading(false);
                  setError(
                    `⚠️ Mixed Content Error\n\n` +
                    `O browser bloqueia streams HTTP em páginas HTTPS.\n\n` +
                    `Tentámos HTTPS mas falhou.\n\n` +
                    `✅ Use player IPTV nativo: VLC, IPTV Smarters, Kodi\n\n` +
                    `URL: ${originalUrl}`
                  );
                  hls.destroy();
                } else if (!isCorsError) {
                  console.log("🔄 Erro de rede, tentando reconectar...");
                  setTimeout(() => hls.startLoad(), 2000);
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("🔄 Erro de media, tentando recuperar...");
                hls.recoverMediaError();
                break;
              default:
                setIsLoading(false);
                setError(`Erro HLS: ${data.details}. Verifique se o stream está disponível.`);
                hls.destroy();
                break;
            }
          }
        });

        return;
      } else if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = src || "";
      }
    }

    // DASH
    if (ext === "mpd" || src?.includes(".mpd")) {
      try {
        // @ts-expect-error — dynamic CDN import, no type definitions available
        const dashjs = await import("https://cdn.dashjs.org/latest/dash.all.min.js" as string);
        const player = (window as any).dashjs?.MediaPlayer?.().create?.();
        if (player) {
          dashRef.current = player;
          player.initialize(vid, src, false);
          player.on("streamInitialized", () => { setIsLoading(false); setHasVideo(true); });
          return;
        }
      } catch (_) {}
    }

    // Native / blob
    if (fileObj) {
      blobRef.current = URL.createObjectURL(fileObj);
      vid.src = blobRef.current;
    } else {
      vid.src = src || "";
    }
    vid.load();

    const onMeta = () => {
      setIsLoading(false);
      setHasVideo(true);
      setDuration(vid.duration);
      setFileInfo(f => f ? {
        ...f,
        res: vid.videoWidth ? `${vid.videoWidth}×${vid.videoHeight}` : "Áudio",
        dur: fmtTime(vid.duration)
      } : f);
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("error", onErr);
    };

    const onErr = async () => {
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("error", onErr);
      if (fileObj) {
        setLoadMsg("Formato não suportado. A converter…");
        const ok = await convertWithFFmpeg(fileObj);
        if (!ok) {
          setIsLoading(false);
          setError(`Formato "${ext.toUpperCase()}" não suportado. Tente MP4 H.264 ou WebM.`);
        }
      } else {
        setIsLoading(false);
        setError("Não foi possível carregar o vídeo. Verifique a URL e o formato.");
      }
    };

    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("error", onErr);
  }, [cleanup, convertWithFFmpeg]);

  /* ── play / pause ── */
  const togglePlay = useCallback(() => {
    const vid = vidRef.current;
    if (!vid || !hasVideo) return;
    if (vid.paused || vid.ended) vid.play().catch(() => {});
    else vid.pause();
  }, [hasVideo]);

  /* ── fullscreen ── */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  /* ── controls visibility ── */
  const showCtrls = useCallback(() => {
    setCtrlsVisible(true);
    if (ctrlTimerRef.current) clearTimeout(ctrlTimerRef.current);
    const vid = vidRef.current;
    if (vid && !vid.paused) {
      ctrlTimerRef.current = setTimeout(() => setCtrlsVisible(false), 3000);
    }
  }, []);

  /* ── video event listeners ── */
  useEffect(() => {
    const vid = vidRef.current;
    if (!vid) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setCtrlsVisible(true); };
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(vid.currentTime);
    const onDuration = () => setDuration(vid.duration);
    const onProgress = () => {
      if (vid.buffered.length > 0 && vid.duration)
        setBuffered((vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100);
    };
    const onVolumeChange = () => { setVolume(vid.volume); setIsMuted(vid.muted); };
    const onWaiting = () => { if (vid.currentSrc) { setIsLoading(true); setLoadMsg("A carregar…"); } };
    const onCanPlay = () => setIsLoading(false);
    const onPlaying = () => setIsLoading(false);

    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    vid.addEventListener("ended", onEnded);
    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.addEventListener("durationchange", onDuration);
    vid.addEventListener("progress", onProgress);
    vid.addEventListener("volumechange", onVolumeChange);
    vid.addEventListener("waiting", onWaiting);
    vid.addEventListener("canplay", onCanPlay);
    vid.addEventListener("playing", onPlaying);

    return () => {
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
      vid.removeEventListener("ended", onEnded);
      vid.removeEventListener("timeupdate", onTimeUpdate);
      vid.removeEventListener("durationchange", onDuration);
      vid.removeEventListener("progress", onProgress);
      vid.removeEventListener("volumechange", onVolumeChange);
      vid.removeEventListener("waiting", onWaiting);
      vid.removeEventListener("canplay", onCanPlay);
      vid.removeEventListener("playing", onPlaying);
    };
  }, []);

  /* ── fullscreen change ── */
  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const vid = vidRef.current;
      if (!vid) return;
      const k = e.key.toLowerCase();
      switch (k) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "arrowleft": e.preventDefault(); vid.currentTime = Math.max(0, vid.currentTime - 10); showCtrls(); break;
        case "arrowright": e.preventDefault(); vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10); showCtrls(); break;
        case "j": vid.currentTime = Math.max(0, vid.currentTime - 30); showCtrls(); break;
        case "l": vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 30); showCtrls(); break;
        case "arrowup": e.preventDefault(); vid.volume = Math.min(1, vid.volume + 0.05); vid.muted = false; break;
        case "arrowdown": e.preventDefault(); vid.volume = Math.max(0, vid.volume - 0.05); break;
        case "m": vid.muted = !vid.muted; break;
        case "f": toggleFullscreen(); break;
        case "p": if (document.pictureInPictureEnabled) {
          document.pictureInPictureElement ? document.exitPictureInPicture() : vid.requestPictureInPicture?.();
        } break;
        case "home": e.preventDefault(); vid.currentTime = 0; break;
        case "end": e.preventDefault(); if (vid.duration) vid.currentTime = vid.duration; break;
        case "<": case ",": {
          const ns = Math.max(0.25, vid.playbackRate - 0.25);
          vid.playbackRate = ns; setSpeed(ns); break;
        }
        case ">": case ".": {
          const ns = Math.min(4, vid.playbackRate + 0.25);
          vid.playbackRate = ns; setSpeed(ns); break;
        }
      }
      if (k >= "0" && k <= "9" && vid.duration) {
        vid.currentTime = vid.duration * (parseInt(k) / 10);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleFullscreen, showCtrls]);

  /* ── seek bar ── */
  const seek = useCallback((e: React.MouseEvent | MouseEvent) => {
    const bar = progRef.current;
    const vid = vidRef.current;
    if (!bar || !vid || !vid.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = pct * vid.duration;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (seekingRef.current) seek(e);
      if (vidRef.current?.duration && progRef.current) {
        const rect = progRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setTimeTip({ pct: pct * 100, time: fmtTime(pct * (vidRef.current?.duration || 0)) });
      }
    };
    const onUp = () => { seekingRef.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [seek]);

  /* ── subtitle loading ── */
  const loadSubtitle = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      let text = ev.target?.result as string;
      const ext = getExt(file.name);
      if (ext === "srt") text = srtToVtt(text);

      const vid = vidRef.current;
      if (!vid) return;
      vid.querySelectorAll("track").forEach(t => t.remove());

      const blob = new Blob([text], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = file.name;
      track.srclang = "pt";
      track.src = url;
      track.default = true;
      vid.appendChild(track);

      setTimeout(() => {
        if (vid.textTracks[0]) vid.textTracks[0].mode = "showing";
        setSubActive(true);
      }, 100);
    };
    reader.readAsText(file);
  }, []);

  const toggleSubs = useCallback(() => {
    const vid = vidRef.current;
    if (!vid) return;
    if (vid.textTracks.length === 0) { subInRef.current?.click(); return; }
    const next = !subActive;
    for (let i = 0; i < vid.textTracks.length; i++) {
      vid.textTracks[i].mode = next ? "showing" : "hidden";
    }
    setSubActive(next);
  }, [subActive]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MonitorPlay className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Leitor de Vídeo</h2>
      </div>

      {/* Player wrap */}
      <div ref={wrapRef} className="rounded-xl overflow-hidden border border-border bg-black shadow-2xl">
        {/* Video box */}
        <div
          ref={vidBoxRef}
          className="relative w-full bg-black"
          style={{ aspectRatio: "16/9" }}
          onMouseMove={showCtrls}
          onMouseLeave={() => { if (isPlaying) setCtrlsVisible(false); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) loadSource(null, file.name, file);
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest(".ctrl-zone")) return;
            togglePlay();
          }}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest(".ctrl-zone")) return;
            toggleFullscreen();
          }}
        >
          <video
            ref={vidRef}
            className="w-full h-full block"
            preload="metadata"
            crossOrigin="anonymous"
          />

          {/* Drop zone */}
          {!hasVideo && !isLoading && !isConverting && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 transition-all ${isDragging ? "bg-primary/10 border-2 border-dashed border-primary" : "border-2 border-dashed border-border/40"}`}>
              <div className="text-5xl mb-3">🎞️</div>
              <p className="text-muted-foreground text-sm">Arraste um vídeo aqui</p>
              <p className="text-xs text-muted-foreground/60 mt-1">ou use os botões abaixo</p>
              <p className="text-xs text-muted-foreground/40 mt-3 max-w-xs text-center">
                MP4 · MKV · AVI · MOV · WebM · HLS (.m3u8) · DASH (.mpd) · e mais
              </p>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">{loadMsg}</p>
            </div>
          )}

          {/* Converting overlay */}
          {isConverting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/88 z-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-white mb-3">{convMsg}</p>
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${convPct}%` }} />
              </div>
            </div>
          )}

          {/* Big play button */}
          {hasVideo && !isPlaying && !isLoading && (
            <button
              className="ctrl-zone absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/80 backdrop-blur flex items-center justify-center hover:bg-primary transition-all hover:scale-110 z-10"
              onClick={togglePlay}
            >
              <Play className="h-7 w-7 text-white ml-1" />
            </button>
          )}

          {/* Controls bar */}
          <div
            className={`ctrl-zone absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${ctrlsVisible || !isPlaying ? "opacity-100" : "opacity-0"}`}
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9))", paddingTop: 32 }}
          >
            {/* Progress bar */}
            <div
              ref={progRef}
              className="group mx-3 mb-2 relative cursor-pointer"
              style={{ height: 5 }}
              onMouseDown={(e) => { seekingRef.current = true; seek(e); }}
              onMouseEnter={() => {}}
            >
              {/* Track */}
              <div className="absolute inset-0 rounded-full bg-white/15" />
              {/* Buffer */}
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${buffered}%` }} />
              {/* Fill */}
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Time tooltip */}
              <div
                className="absolute bottom-full mb-1.5 bg-card border border-border text-xs text-foreground px-2 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1/2 transition-opacity"
                style={{ left: `${timeTip.pct}%` }}
              >
                {timeTip.time}
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-1 px-2 pb-2">
              {/* Left controls */}
              <button className="ctrl-zone p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button className="ctrl-zone p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                onClick={() => { const v = vidRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}>
                <SkipBack className="h-4 w-4" />
              </button>
              <button className="ctrl-zone p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                onClick={() => { const v = vidRef.current; if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); }}>
                <SkipForward className="h-4 w-4" />
              </button>

              {/* Volume */}
              <div className="ctrl-zone group/vol flex items-center gap-1">
                <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                  onClick={() => { const v = vidRef.current; if (v) { v.muted = !v.muted; } }}>
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-300">
                  <input type="range" min={0} max={1} step={0.02} value={isMuted ? 0 : volume}
                    className="w-16 accent-primary cursor-pointer"
                    onChange={(e) => {
                      const v = vidRef.current;
                      if (!v) return;
                      v.volume = parseFloat(e.target.value);
                      v.muted = v.volume === 0;
                    }} />
                </div>
              </div>

              {/* Time */}
              <span className="text-xs text-white/60 font-mono tabular-nums ml-1">
                {fmtTime(currentTime)} / {fmtTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Right controls */}
              {/* Subtitles */}
              <button
                className={`ctrl-zone p-1.5 hover:bg-white/10 rounded transition-all ${subActive ? "text-primary" : "text-white/80 hover:text-white"}`}
                onClick={toggleSubs}
                title="Legendas (S)"
              >
                <Subtitles className="h-4 w-4" />
              </button>

              {/* Speed */}
              <div className="ctrl-zone relative">
                <button
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all text-xs font-bold w-8 text-center"
                  onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(s => !s); }}
                >
                  {speed === 1 ? "1x" : `${speed}x`}
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg py-1 min-w-[90px] shadow-xl z-30">
                    {SPEEDS.map(s => (
                      <button
                        key={s}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${speed === s ? "text-primary font-bold" : "text-muted-foreground"}`}
                        onClick={() => {
                          const v = vidRef.current;
                          if (v) v.playbackRate = s;
                          setSpeed(s);
                          setShowSpeedMenu(false);
                        }}
                      >
                        {s === 1 ? "Normal" : `${s}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP */}
              {document.pictureInPictureEnabled && (
                <button className="ctrl-zone p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                  onClick={() => {
                    const v = vidRef.current;
                    if (!v) return;
                    document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture?.();
                  }}>
                  <PictureInPicture2 className="h-4 w-4" />
                </button>
              )}

              {/* Fullscreen */}
              <button className="ctrl-zone p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                onClick={toggleFullscreen}>
                {isFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-card border-t border-border p-3 space-y-2">
          {/* URL input */}
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Cole a URL do vídeo (MP4, WebM, HLS, DASH…)"
              className="flex-1 text-sm h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && urlInput.trim()) {
                  const u = urlInput.trim();
                  loadSource(u, u.split("/").pop()?.split("?")[0] || "stream");
                }
              }}
            />
            <Button size="sm" className="h-9 gap-1.5" onClick={() => {
              if (!urlInput.trim()) return;
              const u = urlInput.trim();
              loadSource(u, u.split("/").pop()?.split("?")[0] || "stream");
            }}>
              <Link className="h-3.5 w-3.5" />
              Carregar
            </Button>
          </div>

          {/* File buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-9 gap-1.5"
              onClick={() => fileInRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Abrir Ficheiro
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5"
              onClick={() => { hasVideo ? toggleSubs() : subInRef.current?.click(); }}>
              <Subtitles className="h-3.5 w-3.5" />
              Carregar Legenda
            </Button>
            {hasVideo && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5 ml-auto text-muted-foreground"
                onClick={cleanup}>
                Fechar
              </Button>
            )}
          </div>

          <input ref={fileInRef} type="file"
            accept="video/*,audio/*,.mkv,.avi,.flv,.wmv,.mov,.webm,.mp4,.m4v,.ogv,.ogg,.3gp,.ts,.mts,.m2ts,.vob,.mpg,.mpeg,.divx,.rmvb,.rm,.asf,.f4v,.m3u8"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadSource(null, f.name, f);
              e.target.value = "";
            }} />
          <input ref={subInRef} type="file" accept=".srt,.vtt,.ass,.ssa,.sub" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadSubtitle(f);
              e.target.value = "";
            }} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* File info */}
      {fileInfo && (
        <Card className="p-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Informação</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {([
              ["Ficheiro", fileInfo.name],
              ["Tamanho", fileInfo.size],
              ["Tipo", fileInfo.type],
              ["Resolução", fileInfo.res],
              ["Duração", fileInfo.dur],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-mono text-xs truncate max-w-[180px]" title={value}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Keyboard shortcuts */}
      <Card className="p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Atalhos de Teclado</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
          {([
            ["Espaço / K", "Play / Pause"],
            ["← / →", "−10s / +10s"],
            ["J / L", "−30s / +30s"],
            ["↑ / ↓", "Volume"],
            ["M", "Mudo"],
            ["F", "Ecrã Cheio"],
            ["P", "Picture-in-Picture"],
            ["< / >", "Velocidade"],
            ["0–9", "Saltar para %"],
          ] as [string, string][]).map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2">
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground/70">{key}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default VideoPlayer;
