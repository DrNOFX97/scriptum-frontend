import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Download, Star, Globe, FileText, Film, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { API_BASE } from '@/lib/constants';
import api from '@/lib/api';
import { downloadSubtitle, downloadFromApi } from '@/lib/file-utils';
import { ApiFormCard } from '@/components/shared';
import { useApiCall } from '@/hooks/useApiCall';

interface Subtitle {
  id: string;
  name: string;
  language: string;
  downloads: number;
  rating: number;
  uploader: string;
  format: string;
  source?: string; // 'opensubtitles' or 'legendasdivx'
}

interface SearchResponse {
  success: boolean;
  results?: Subtitle[];
  subtitles?: Subtitle[];
  count?: number;
  total?: number;
  message?: string;
  error?: string;
}

// Ordem de fallback para idiomas - línguas latinas primeiro para melhor tradução
const LANGUAGE_FALLBACK: Record<string, string[]> = {
  'pt-PT': ['pt-BR', 'es', 'it', 'fr', 'en'], // PT-PT: prioriza PT-BR, depois espanhol, italiano, francês
  'pt-BR': ['pt-PT', 'es', 'it', 'fr', 'en'],
  'es': ['pt-PT', 'pt-BR', 'it', 'fr', 'en'],
  'it': ['es', 'pt-PT', 'pt-BR', 'fr', 'en'],
  'fr': ['es', 'it', 'pt-PT', 'pt-BR', 'en'],
  'en': ['es', 'pt-PT', 'pt-BR', 'fr', 'it'],
  'de': ['en', 'fr', 'es'],
};

const LANGUAGE_NAMES: Record<string, string> = {
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
  'en': 'Inglês',
  'es': 'Espanhol',
  'it': 'Italiano',
  'fr': 'Francês',
  'de': 'Alemão',
};

const SubtitleSearch = () => {
  const { toast } = useToast();
  const { navigateToTab } = useNavigation();
  const {
    movieInfo,
    videoFile,
    searchedSubtitles,
    searchQuery: contextSearchQuery,
    searchLanguage: contextSearchLanguage,
    selectedSubtitle,
    setSearchedSubtitles,
    setSearchQuery: setContextSearchQuery,
    setSearchLanguage: setContextSearchLanguage,
    setSelectedSubtitle,
  } = useFileContext();

  const [query, setQuery] = useState(contextSearchQuery);
  const [language, setLanguage] = useState(contextSearchLanguage || 'pt-PT');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [results, setResults] = useState<Subtitle[]>(searchedSubtitles);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);
  const [searchedLanguage, setSearchedLanguage] = useState<string>("");

  // Sync results with context when they change
  useEffect(() => {
    setResults(searchedSubtitles);
  }, [searchedSubtitles]);

  // Detetar temporada/episódio a partir do nome do ficheiro
  useEffect(() => {
    if (!videoFile) {
      setSeason('');
      setEpisode('');
      return;
    }
    const tvMatch = videoFile.name.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
    if (tvMatch) {
      setSeason(tvMatch[1].padStart(2, '0'));
      setEpisode(tvMatch[2].padStart(2, '0'));
    } else {
      setSeason('');
      setEpisode('');
    }
  }, [videoFile]);

  // Auto-fill query when movie info is available
  useEffect(() => {
    if (movieInfo && !query) {
      const titleToUse = movieInfo.original_title || movieInfo.title;
      const isTv = (movieInfo as any).media_type === 'tv';
      // Para séries não incluir o ano (o episódio é mais específico)
      const searchQuery = (!isTv && movieInfo.year) ? `${titleToUse} ${movieInfo.year}` : titleToUse;

      setQuery(searchQuery);
      setAutoFilledFrom('tmdb');

      const displayTitle = movieInfo.original_title && movieInfo.original_title !== movieInfo.title
        ? `${movieInfo.original_title} (${movieInfo.title})`
        : movieInfo.title;

      toast({
        title: "Filme detectado!",
        description: `Pesquisa: ${displayTitle}`,
      });
    } else if (videoFile && !query && !movieInfo) {
      // Se não houver info TMDB mas houver arquivo, usar nome do arquivo
      const filename = videoFile.name.replace(/\.[^/.]+$/, ''); // Remove extensão
      setQuery(filename);
      setAutoFilledFrom('filename');
    }
  }, [movieInfo, videoFile, query, toast]);

  // API call hook for searching subtitles
  const { execute: executeSearch, isLoading: isSearching } = useApiCall(
    (query: string, language: string) => api.searchSubtitles(query, language),
    {
      showSuccessToast: false, // We'll handle success toast manually
      showErrorToast: false, // We'll handle error toast manually
      onSuccess: (data) => {
        console.log('🔍 Resposta completa da API:', JSON.stringify(data, null, 2));
        const foundSubtitles = data.data?.subtitles || data.subtitles || data.results || [];

        if (foundSubtitles.length > 0) {
          console.log(`✅ Encontradas ${foundSubtitles.length} legendas`);
          setResults(foundSubtitles);
          setSearchedSubtitles(foundSubtitles);
          setContextSearchQuery(query.trim());
          setContextSearchLanguage(language);
          setSearchedLanguage(language);

          // Check if results are from fallback language
          const resultLang = data.language || language;
          if (resultLang !== language) {
            const originalLang = LANGUAGE_NAMES[language] || language.toUpperCase();
            const foundLang = LANGUAGE_NAMES[resultLang] || resultLang.toUpperCase();
            toast({
              title: `✅ Legendas em ${foundLang}`,
              description: `Nenhuma em ${originalLang}, mas encontradas ${foundSubtitles.length} em ${foundLang}${resultLang === 'es' || resultLang === 'it' ? ' (ideal para tradução!)' : ''}`,
              duration: 7000,
            });
          } else {
            toast({
              title: "✅ Pesquisa concluída",
              description: `${foundSubtitles.length} legendas encontradas`,
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Nenhuma legenda encontrada",
            description: "Tente outro termo de pesquisa",
            duration: 5000,
          });
          setResults([]);
        }
      },
      onError: (err) => {
        console.error('❌ Erro:', err);
        toast({
          variant: "destructive",
          title: "Nenhuma legenda encontrada",
          description: err.message || "Falha ao pesquisar",
          duration: 5000,
        });
        setResults([]);
      }
    }
  );

  const searchSubtitles = async () => {
    if (!query.trim()) {
      toast({
        variant: "destructive",
        title: "Pesquisa vazia",
        description: "Introduza um título para pesquisar",
      });
      return;
    }

    setResults([]);
    let searchQuery = query.trim();

    // Anexar episódio se preenchido e não incluído já na query
    if (season && episode && !/[Ss]\d+[Ee]\d+/.test(searchQuery)) {
      searchQuery = `${searchQuery} S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
    } else if (season && !episode && !/[Ss]\d+/.test(searchQuery)) {
      searchQuery = `${searchQuery} S${season.padStart(2, '0')}`;
    }

    console.log('🔍 Pesquisando:', searchQuery, 'Idioma:', language);

    await executeSearch(searchQuery, language);
  };

  // API call hook for downloading subtitles
  const { execute: executeDownload, isLoading: isDownloadingApi } = useApiCall(
    (subtitleId: string, source: string) =>
      fetch(`${API_BASE}/download-subtitle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: subtitleId,
          source: source || 'opensubtitles'
        }),
      }).then(res => res.json()),
    {
      showSuccessToast: false,
      showErrorToast: false,
    }
  );

  const downloadSubtitleFile = async (subtitle: Subtitle) => {
    setIsDownloading(subtitle.id);
    try {
      const data = await executeDownload(subtitle.id, subtitle.source || 'opensubtitles');

      if (data && data.success && data.file_path) {
        downloadFromApi(data.file_path);

        toast({
          title: "Download iniciado",
          description: subtitle.name,
        });
      } else {
        throw new Error(data?.error || 'Download falhou');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: err instanceof Error ? err.message : "Falha ao descarregar legenda",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const testSubtitle = async (subtitle: Subtitle) => {
    setIsTesting(subtitle.id);
    try {
      // Download subtitle content
      const data = await executeDownload(subtitle.id, subtitle.source || 'opensubtitles');

      if (data && data.success && data.file_path) {
        // Fetch the subtitle content
        const contentResponse = await fetch(`${API_BASE}/download/${data.file_path}`);
        const content = await contentResponse.text();

        // Mark as selected globally
        setSelectedSubtitle({
          type: 'searched',
          data: subtitle,
          content: content,
        });

        toast({
          title: "✅ Legenda selecionada",
          description: `${subtitle.name} - Carregando no player...`,
        });

        // Navigate to video player
        setTimeout(() => {
          navigateToTab('analyze');
        }, 500);
      } else {
        throw new Error(data?.error || 'Falha ao carregar legenda');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao testar",
        description: err instanceof Error ? err.message : "Falha ao carregar legenda",
      });
    } finally {
      setIsTesting(null);
    }
  };

  return (
    <ApiFormCard
      title="Pesquisa de Legendas"
      description="Pesquisar em OpenSubtitles e LegendasDivx (Português)."
    >

      {/* Movie Detected Alert */}
      {movieInfo && (
        <Alert className="border-primary/50 bg-primary/5">
          <Film className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  <strong>Filme carregado:</strong> {movieInfo.title} ({movieInfo.year})
                </span>
                {movieInfo.rating && (
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {movieInfo.rating}/10
                  </Badge>
                )}
              </div>
              {autoFilledFrom === 'tmdb' && (
                <Badge variant="outline" className="text-xs">
                  Auto-preenchido
                </Badge>
              )}
            </div>
            {movieInfo.original_title && movieInfo.original_title !== movieInfo.title && (
              <div className="text-xs text-muted-foreground mt-1">
                💡 Pesquisando com título original: <strong className="text-primary">{movieInfo.original_title}</strong> (melhores resultados)
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {videoFile && !movieInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Vídeo carregado:</strong> {videoFile.name}
            <span className="text-xs text-muted-foreground ml-2">
              (Pesquisa baseada no nome do ficheiro)
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Título do Filme ou Série
            </label>
            <Input
              placeholder="Ex: Dune, Breaking Bad"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSubtitles()}
              disabled={isSearching}
            />
          </div>

          {/* Season / Episode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Temporada <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="01"
                value={season}
                onChange={(e) => setSeason(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onKeyDown={(e) => e.key === 'Enter' && searchSubtitles()}
                disabled={isSearching}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Episódio <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="01"
                value={episode}
                onChange={(e) => setEpisode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onKeyDown={(e) => e.key === 'Enter' && searchSubtitles()}
                disabled={isSearching}
                className="font-mono"
              />
            </div>
          </div>

          {/* Preview da query final */}
          {(season || episode) && (
            <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-md">
              Pesquisa: {query.trim()}{season && episode ? ` S${season.padStart(2,'0')}E${episode.padStart(2,'0')}` : season ? ` S${season.padStart(2,'0')}` : ''}
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Idioma
            </label>
            <Select value={language} onValueChange={setLanguage} disabled={isSearching}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={searchSubtitles} disabled={isSearching} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'A pesquisar...' : 'Pesquisar'}
            </Button>
            {(movieInfo || videoFile) && query && (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSeason("");
                  setEpisode("");
                  setAutoFilledFrom(null);
                  setResults([]);
                }}
                disabled={isSearching}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </h3>
            {searchedLanguage && searchedLanguage !== language && (
              <Badge variant="secondary" className="text-xs">
                Idioma: {searchedLanguage.toUpperCase()}
              </Badge>
            )}
          </div>
          {results.map((subtitle) => {
            const isSelected = selectedSubtitle?.type === 'searched' &&
                              (selectedSubtitle.data as any).id === subtitle.id;

            return (
              <motion.div
                key={subtitle.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`p-4 transition-colors ${
                  isSelected
                    ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">{subtitle.name}</h4>
                        {subtitle.source === 'legendasdivx' ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                            🇵🇹 LegendasDivx
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            🌍 OpenSubtitles
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge variant="default" className="text-xs bg-primary">
                            ✓ Selecionada
                          </Badge>
                        )}
                      </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {subtitle.language}
                      </span>
                      {subtitle.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {subtitle.rating.toFixed(1)}
                        </span>
                      )}
                      <span>{subtitle.downloads.toLocaleString()} downloads</span>
                      {subtitle.uploader && (
                        <span>por {subtitle.uploader}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSubtitle(subtitle)}
                      disabled={isTesting === subtitle.id || isDownloading === subtitle.id}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isTesting === subtitle.id ? 'A selecionar...' : 'Selecionar'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => downloadSubtitleFile(subtitle)}
                      disabled={isDownloading === subtitle.id || isTesting === subtitle.id}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading === subtitle.id ? 'A descarregar...' : 'Download'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && query && (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma legenda encontrada. Tente outro termo de pesquisa.
          </p>
        </Card>
      )}

      {/* Info */}
      <Card className="p-6 bg-primary/5">
        <h3 className="font-semibold text-foreground mb-2">Dicas de Pesquisa</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {(movieInfo || videoFile) && (
            <li className="text-primary font-medium">
              ✓ Campo de pesquisa preenchido automaticamente com o filme carregado
            </li>
          )}
          <li>• Use o título original do filme para melhores resultados</li>
          <li>• Para séries, inclua a temporada e episódio (ex: S01E01)</li>
          <li>• Selecione o idioma correto antes de pesquisar</li>
          <li>• Legendas com mais downloads geralmente têm melhor qualidade</li>
        </ul>
      </Card>
    </ApiFormCard>
  );
};

export default SubtitleSearch;
