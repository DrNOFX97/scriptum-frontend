import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import type { VideoInfo, Movie } from '@/lib/types';

export type { VideoInfo, Movie };

export interface Subtitle {
  index: number;
  language: string;
  title?: string;
  codec: string;
  filename: string;
  content?: string;
}

export interface SearchedSubtitle {
  id: string;
  name: string;
  language: string;
  downloads: number;
  rating: number;
  uploader: string;
  format: string;
  source?: string;
}

export interface SelectedSubtitle {
  type: 'extracted' | 'searched' | 'file';
  data: Subtitle | SearchedSubtitle | File;
  content?: string; // SRT content when loaded
}

interface FileContextType {
  videoFile: File | null;
  subtitleFile: File | null;
  videoInfo: VideoInfo | null;
  movieInfo: Movie | null;
  videoUrl: string | null;
  canRemux: boolean;
  canConvert: boolean;
  extractedSubtitles: Subtitle[];
  searchedSubtitles: SearchedSubtitle[];
  searchQuery: string;
  searchLanguage: string;
  selectedSubtitle: SelectedSubtitle | null;
  setVideoFile: (file: File | null) => void;
  setSubtitleFile: (file: File | null) => void;
  setVideoInfo: (info: VideoInfo | null) => void;
  setMovieInfo: (info: Movie | null) => void;
  setVideoUrl: (url: string | null) => void;
  setCanRemux: (can: boolean) => void;
  setCanConvert: (can: boolean) => void;
  setExtractedSubtitles: (subtitles: Subtitle[]) => void;
  setSearchedSubtitles: (subtitles: SearchedSubtitle[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchLanguage: (language: string) => void;
  setSelectedSubtitle: (subtitle: SelectedSubtitle | null) => void;
  clearAll: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider = ({ children }: { children: ReactNode }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [movieInfo, setMovieInfo] = useState<Movie | null>(null);
  const [videoUrl, setVideoUrlState] = useState<string | null>(null);
  const [canRemux, setCanRemux] = useState<boolean>(false);
  const [canConvert, setCanConvert] = useState<boolean>(false);
  const [extractedSubtitles, setExtractedSubtitles] = useState<Subtitle[]>([]);
  const [searchedSubtitles, setSearchedSubtitles] = useState<SearchedSubtitle[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLanguage, setSearchLanguage] = useState<string>('pt-PT');
  const [selectedSubtitle, setSelectedSubtitle] = useState<SelectedSubtitle | null>(null);

  const setVideoUrl = (url: string | null) => {
    // Limpar URL anterior se for diferente
    if (videoUrl && videoUrl !== url) {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch (e) {
        console.error('Erro ao revogar URL:', e);
      }
    }
    setVideoUrlState(url);
  };

  const clearAll = () => {
    if (videoUrl) {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch (e) {
        console.error('Erro ao revogar URL:', e);
      }
    }
    setVideoFile(null);
    setSubtitleFile(null);
    setVideoInfo(null);
    setMovieInfo(null);
    setVideoUrlState(null);
    setCanRemux(false);
    setCanConvert(false);
    setExtractedSubtitles([]);
    setSearchedSubtitles([]);
    setSearchQuery('');
    setSearchLanguage('pt');
    setSelectedSubtitle(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentVideoUrl = videoUrl;
      if (currentVideoUrl) {
        try {
          URL.revokeObjectURL(currentVideoUrl);
        } catch (e) {
          console.error('Erro ao revogar URL no cleanup:', e);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<FileContextType>(() => ({
    videoFile,
    subtitleFile,
    videoInfo,
    movieInfo,
    videoUrl,
    canRemux,
    canConvert,
    extractedSubtitles,
    searchedSubtitles,
    searchQuery,
    searchLanguage,
    selectedSubtitle,
    setVideoFile,
    setSubtitleFile,
    setVideoInfo,
    setMovieInfo,
    setVideoUrl,
    setCanRemux,
    setCanConvert,
    setExtractedSubtitles,
    setSearchedSubtitles,
    setSearchQuery,
    setSearchLanguage,
    setSelectedSubtitle,
    clearAll,
  }), [
    videoFile, subtitleFile, videoInfo, movieInfo, videoUrl,
    canRemux, canConvert, extractedSubtitles, searchedSubtitles,
    searchQuery, searchLanguage, selectedSubtitle,
  ]);

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within FileProvider');
  }
  return context;
};
