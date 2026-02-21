import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/constants';
import type { OnlineSubtitle } from '@/types/subtitle';

export type { OnlineSubtitle };

export function useOnlineSubtitleSearch(
  setSelectedSubtitle: (s: { type: string; data: unknown; content: string } | null) => void
) {
  const { toast } = useToast();
  const [results, setResults] = useState<OnlineSubtitle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const search = async (query: string, language = 'pt-PT') => {
    setIsSearching(true);
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/search-subtitles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language }),
      });
      const data = await res.json();
      const found: OnlineSubtitle[] = data.subtitles || data.results || [];
      setResults(found);
      if (found.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhuma legenda encontrada', description: query });
      } else {
        toast({ title: `${found.length} legendas encontradas`, description: query });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro na pesquisa',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const download = async (subtitle: OnlineSubtitle) => {
    setDownloadingId(subtitle.id);
    try {
      // Step 1: Request subtitle download from API
      const res = await fetch(`${API_BASE}/download-subtitle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: subtitle.id, source: subtitle.source || 'opensubtitles' }),
      });
      const data = await res.json();
      if (!data.success || !data.file_path) throw new Error(data.error || 'Download falhou');

      // Step 2: Fetch the actual file content
      const fileRes = await fetch(`${API_BASE}/download/${data.file_path}`);
      if (!fileRes.ok) throw new Error('Erro ao descarregar ficheiro');

      const fileContent = await fileRes.text();

      // Step 3: Create blob and download (forces download instead of opening)
      const blob = new Blob([fileContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subtitle.name}.srt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Download concluído', description: subtitle.name });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro no download',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const select = async (subtitle: OnlineSubtitle) => {
    setSelectingId(subtitle.id);
    try {
      const res = await fetch(`${API_BASE}/download-subtitle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: subtitle.id, source: subtitle.source || 'opensubtitles' }),
      });
      const data = await res.json();
      if (!data.success || !data.file_path) throw new Error(data.error || 'Falha ao carregar legenda');
      const contentRes = await fetch(`${API_BASE}/download/${data.file_path}`);
      const content = await contentRes.text();
      setSelectedSubtitle({ type: 'searched', data: subtitle, content });
      toast({ title: '✅ Legenda selecionada', description: subtitle.name });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao selecionar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setSelectingId(null);
    }
  };

  return { results, isSearching, downloadingId, selectingId, search, download, select, setResults };
}
