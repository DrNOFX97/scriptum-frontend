import { useEffect } from "react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Languages, Upload, FileText, Download, CheckCircle2, AlertCircle, Search, Film, Sparkles, Play, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import { useNavigation } from "@/contexts/NavigationContext";
import useFileUpload from "@/hooks/useFileUpload";
import { SubtitleQualityCheck } from "@/components/SubtitleQualityCheck";

import { TAB, API_BASE } from "@/lib/constants";
import api from "@/lib/api";
import { downloadBlob, downloadUrl } from "@/lib/utils";
import { TranslationProgress } from "./TranslationProgress";

interface TranslateResponse {
  success: boolean;
  translated_file?: string;
  stats?: {
    total_entries: number;
    translated: number;
    time_taken: number;
  };
  error?: string;
}

interface TranslationProgress {
  status: string;
  total_entries?: number;
  current_entry?: number;
  percentage?: number;
  speed?: number;
  eta_seconds?: number;
  recent_translations?: Array<{ original: string; translated: string }>;
  message?: string;
  total_time?: number;
}

interface ValidationResults {
  total_entries: number;
  problems: Array<{
    index: number;
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    timecode: string;
    text: string;
    suggestion: string;
  }>;
  stats: {
    long_durations: number;
    long_lines: number;
    long_pauses: number;
    high_cps: number;
    empty: number;
    short_durations?: number;
    too_many_lines?: number;
  };
  has_problems: boolean;
}

const TranslationPanel = () => {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("pt-PT");  // Foco em pt-PT
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("casual");
  const [translatedData, setTranslatedData] = useState<any>(null);
  const [subtitleSource, setSubtitleSource] = useState<'upload' | 'extracted' | 'searched'>('upload');
  const [selectedExtractedIndex, setSelectedExtractedIndex] = useState<number>(0);

  // Progress tracking
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Language detection
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);

  // Quality validation
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [correctedSubtitles, setCorrectedSubtitles] = useState<Map<number, string>>(new Map());
  const [originalSubtitleContent, setOriginalSubtitleContent] = useState<string>('');

  const { toast } = useToast();
  const { progress, isUploading, error, uploadFile } = useFileUpload();
  const {
    extractedSubtitles,
    selectedSubtitle,
    videoFile,
    movieInfo,
    setMovieInfo,
    setSubtitleFile,
    setSelectedSubtitle
  } = useFileContext();
  const { navigateToTab } = useNavigation();

  // Auto-fill context from TMDB movie info
  useEffect(() => {
    if (movieInfo && !context) {
      // Build context from movie info
      const movieContext = [];

      if (movieInfo.title) {
        movieContext.push(movieInfo.title);
      }

      if (movieInfo.overview) {
        // Limit overview to first 150 characters
        const overview = movieInfo.overview.length > 150
          ? movieInfo.overview.substring(0, 150) + '...'
          : movieInfo.overview;
        movieContext.push(overview);
      }

      if (movieInfo.genres && movieInfo.genres.length > 0) {
        const genres = movieInfo.genres.map((g: any) => g.name).join(', ');
        movieContext.push(genres);
      }

      if (movieContext.length > 0) {
        setContext(movieContext.join(' • '));
      }
    }
  }, [movieInfo]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const validateTranslation = async (jobId: string) => {
    try {
      const blob = await api.downloadTranslation(jobId);
      const content = await blob.text();
      setOriginalSubtitleContent(content);

      const validationResponse = await api.validateSubtitles(blob);

      if (validationResponse.success && (validationResponse.data as any)?.validation) {
        const validation = (validationResponse.data as any).validation;
        setValidationResults(validation);

        if (validation.has_problems) {
          toast({
            title: "Problemas detetados",
            description: `${validation.problems.length} problema(s) na tradução. Reveja antes de usar.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Qualidade verificada",
            description: "Nenhum problema detetado!",
          });
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      // Don't show error toast - validation is optional
    }
  };

  const startProgressPolling = (jobId: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 500ms
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.getTranslationStatus(jobId);
        const data = response.data as any;

        if (response.success && data?.progress) {
          setTranslationProgress(data.progress);

          // Stop polling if completed or error
          if (data.status === 'completed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast({
              title: "Tradução concluída!",
              description: `${data.progress.total_entries || 0} legendas traduzidas`,
            });

            // Prepare download
            setTranslatedData({
              success: true,
              job_id: jobId,
              output_filename: data.output_filename,
              stats: {
                total_entries: data.progress.total_entries || 0,
                translated: data.progress.total_entries || 0,
                time_taken: data.progress.total_time || 0,
              }
            });

            // Validate translation quality
            validateTranslation(jobId);
          } else if (data.status === 'error') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            toast({
              variant: "destructive",
              title: "Erro na tradução",
              description: data.error || "Falha ao traduzir legendas",
            });

            setTranslationProgress(null);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 500);
  };

  const stopProgressPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setTranslationProgress(null);
  };

  const recognizeMovieFromFilename = async (filename: string) => {
    try {
      console.log('🎬 Tentando reconhecer filme do nome do ficheiro:', filename);

      const response = await api.recognizeMovie(filename);
      const data = response.data as any;
      console.log('📦 Resposta TMDB:', data);

      if (response.success && data?.movie) {
        console.log('✅ Filme reconhecido:', data.movie.title);
        setMovieInfo(data.movie);

        toast({
          title: "🎬 Filme reconhecido",
          description: `${data.movie.title} (${data.movie.release_date?.substring(0, 4) || ''})`,
        });

        return data.movie;
      } else {
        console.log('❌ Filme não reconhecido automaticamente');
        return null;
      }
    } catch (err) {
      console.error('❌ Erro ao reconhecer filme:', err);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Try to recognize movie from filename before translating
      await recognizeMovieFromFilename(file.name);

      // Proceed with translation
      await translateFile(file);
    }
  };

  const handleTranslateFromSource = async () => {
    try {
      let subtitleContent: string | null = null;
      let filename = 'subtitle.srt';

      // Get subtitle content based on source
      if (subtitleSource === 'extracted' && extractedSubtitles.length > 0) {
        const selected = extractedSubtitles[selectedExtractedIndex];
        subtitleContent = selected.content;
        filename = selected.filename || `extracted_${selected.language}.srt`;

        // Set source language based on extracted subtitle
        if (selected.language && !sourceLang) {
          const langMap: Record<string, string> = {
            'Portuguese': 'pt',
            'Portuguese (PT)': 'pt-PT',
            'Portuguese (BR)': 'pt-BR',
            'English': 'en',
            'Spanish': 'es',
            'French': 'fr',
            'German': 'de'
          };
          const detectedLang = langMap[selected.language] || 'en';
          setSourceLang(detectedLang);
        }
      } else if (subtitleSource === 'searched' && selectedSubtitle) {
        subtitleContent = selectedSubtitle.content;
        filename = `${selectedSubtitle.data.name}.srt`;

        // Try to detect source language from subtitle metadata
        if (selectedSubtitle.data && 'language' in selectedSubtitle.data) {
          const lang = selectedSubtitle.data.language as string;
          if (lang.includes('English')) setSourceLang('en');
          else if (lang.includes('Portuguese (PT)')) setSourceLang('pt-PT');
          else if (lang.includes('Portuguese (BR)')) setSourceLang('pt-BR');
          else if (lang.includes('Spanish')) setSourceLang('es');
          else if (lang.includes('French')) setSourceLang('fr');
        }
      }

      if (!subtitleContent) {
        toast({
          variant: "destructive",
          title: "Nenhuma legenda selecionada",
          description: "Selecione uma legenda para traduzir",
        });
        return;
      }

      // Convert content to File object
      const blob = new Blob([subtitleContent], { type: 'text/plain' });
      const file = new File([blob], filename, { type: 'text/plain' });

      await translateFile(file);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao preparar legenda para tradução",
      });
    }
  };

  const translateFile = async (file: File) => {
    try {
      // Reset progress
      setTranslationProgress({ status: 'starting', percentage: 0, message: 'Iniciando tradução...' });
      setTranslatedData(null);

      toast({
        title: "Iniciando tradução...",
        description: `Enviando ${file.name}`,
      });

      const result = await uploadFile<{ success: boolean; job_id?: string; error?: string }>(
        `${API_BASE}/translate`,
        file,
        'subtitle',
        {
          source_lang: sourceLang,
          target_lang: targetLang,
          context: context || '',
          tone: tone,
        }
      );

      if (result && result.success && result.job_id) {
        setJobId(result.job_id);
        startProgressPolling(result.job_id);

        toast({
          title: "Tradução iniciada",
          description: "Acompanhe o progresso abaixo",
        });
      } else {
        throw new Error(result?.error || 'Falha ao iniciar tradução');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na tradução",
        description: err instanceof Error ? err.message : "Falha ao traduzir legendas",
      });
      setTranslationProgress(null);
    }
  };

  const downloadTranslated = () => {
    if (translatedData?.job_id) {
      downloadUrl(
        `${API_BASE}/translate-download/${translatedData.job_id}`,
        translatedData.output_filename || 'translated.srt'
      );
    }
  };

  const loadAsActiveSubtitle = async () => {
    if (!translatedData?.job_id) return;

    try {
      const blob = await api.downloadTranslation(translatedData.job_id);
      const text = await blob.text();
      const filename = translatedData.output_filename || 'translated.srt';
      const file = new File([blob], filename, { type: 'text/plain' });

      // Set as selected subtitle in context (available for all panels)
      setSelectedSubtitle({
        type: 'file',
        data: file,
        content: text,
      });

      // Also set as subtitle file
      setSubtitleFile(file);

      toast({
        title: "✅ Legenda ativa definida",
        description: `${filename} está agora disponível em todos os painéis`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao carregar legenda",
      });
    }
  };

  const loadIntoSync = async () => {
    // First load as active subtitle
    await loadAsActiveSubtitle();

    // Then navigate to sync
    setTimeout(() => {
      navigateToTab(TAB.SYNC);
    }, 500);
  };

  const handleFixProblem = (index: number, newText: string) => {
    const updated = new Map(correctedSubtitles);
    updated.set(index, newText);
    setCorrectedSubtitles(updated);

    toast({
      title: "Correção aplicada",
      description: `Legenda #${index} corrigida`,
    });
  };

  const downloadCorrectedSubtitles = () => {
    try {
      // Apply corrections to original content
      let correctedContent = originalSubtitleContent;

      // Parse SRT and apply corrections
      const entries = correctedContent.split(/\n\n+/);
      const correctedEntries = entries.map(entry => {
        const lines = entry.trim().split('\n');
        if (lines.length < 3) return entry;

        try {
          const index = parseInt(lines[0]);
          if (correctedSubtitles.has(index)) {
            // Replace text with corrected version
            const timecode = lines[1];
            const newText = correctedSubtitles.get(index);
            return `${index}\n${timecode}\n${newText}`;
          }
        } catch (e) {
          // Skip invalid entries
        }

        return entry;
      });

      const finalContent = correctedEntries.join('\n\n');

      const blob = new Blob([finalContent], { type: 'text/plain' });
      const filename = translatedData?.output_filename?.replace('.srt', '_corrigido.srt') || 'corrected.srt';
      downloadBlob(blob, filename);

      toast({
        title: "Download concluído",
        description: `${correctedSubtitles.size} correção(ões) aplicada(s)`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao aplicar correções",
      });
    }
  };

  const detectLanguage = async () => {
    try {
      setIsDetectingLanguage(true);

      let subtitleContent: string | null = null;
      let file: File | null = null;

      // Get subtitle content based on source
      if (subtitleSource === 'extracted' && extractedSubtitles.length > 0) {
        const selected = extractedSubtitles[selectedExtractedIndex];
        subtitleContent = selected.content;
        const blob = new Blob([subtitleContent], { type: 'text/plain' });
        file = new File([blob], 'subtitle.srt', { type: 'text/plain' });
      } else if (subtitleSource === 'searched' && selectedSubtitle) {
        subtitleContent = selectedSubtitle.content;
        const blob = new Blob([subtitleContent], { type: 'text/plain' });
        file = new File([blob], 'subtitle.srt', { type: 'text/plain' });
      }

      if (!file) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Selecione uma legenda primeiro",
        });
        return;
      }

      const response = await api.detectLanguage(file);
      const data = response.data as any;

      if (response.success && data?.language) {
        setSourceLang(data.language);
        toast({
          title: "Idioma detectado",
          description: `Idioma de origem: ${data.language.toUpperCase()}`,
        });
      } else {
        throw new Error(response.error || 'Falha na deteção de idioma');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na deteção",
        description: err instanceof Error ? err.message : "Falha ao detetar idioma",
      });
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const rules = [
    "Máximo de 2 linhas por legenda",
    "1 linha quando o texto cabe numa linha",
    "Diálogos com dois locutores sempre em 2 linhas",
    'Reticências sempre como "..."',
    'Remove "\\n" e "/n" literais',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Tradução de Legendas</h2>
        <p className="text-sm text-muted-foreground">
          Traduza ficheiros SRT em batches com Gemini. Regras de formatação aplicadas automaticamente.
        </p>
      </div>

      {/* Subtitle Source Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Fonte da Legenda
            </label>
            <Tabs value={subtitleSource} onValueChange={(v) => setSubtitleSource(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Carregar
                </TabsTrigger>
                <TabsTrigger value="extracted" disabled={!extractedSubtitles || extractedSubtitles.length === 0}>
                  <Film className="h-4 w-4 mr-2" />
                  MKV ({extractedSubtitles?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="searched" disabled={!selectedSubtitle}>
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <Input
                  type="file"
                  accept=".srt,.vtt,.ass,.ssa"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Carregue um ficheiro SRT, VTT, ASS ou SSA
                </p>
              </TabsContent>

              <TabsContent value="extracted" className="mt-4">
                {extractedSubtitles && extractedSubtitles.length > 0 ? (
                  <div className="space-y-2">
                    <Select
                      value={selectedExtractedIndex.toString()}
                      onValueChange={(v) => setSelectedExtractedIndex(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {extractedSubtitles.map((sub, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{sub.language || `Faixa ${idx + 1}`}</span>
                              {sub.title && <span className="text-muted-foreground">• {sub.title}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {videoFile && (
                      <p className="text-xs text-muted-foreground">
                        Extraída de: {videoFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma legenda extraída. Carregue um ficheiro MKV e extraia as legendas primeiro.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="searched" className="mt-4">
                {selectedSubtitle ? (
                  <Card className="p-4 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {(selectedSubtitle.data as any).name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {(selectedSubtitle.data as any).language}
                          </Badge>
                          {(selectedSubtitle.data as any).source && (
                            <Badge variant="outline" className="text-xs">
                              {(selectedSubtitle.data as any).source === 'legendasdivx' ? '🇵🇹 LegendasDivx' : '🌍 OpenSubtitles'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma legenda selecionada. Pesquise e selecione uma legenda primeiro.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Contexto {movieInfo && '(Auto-preenchido do TMDB)'}
            </label>
            <Input
              placeholder="Ex: Dune Part Two - Ficção científica"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={isUploading}
            />
            {movieInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                ✨ Descrição preenchida automaticamente do filme reconhecido
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Idioma de Origem
              </label>
              <div className="flex gap-2">
                <Select value={sourceLang} onValueChange={setSourceLang} disabled={isUploading}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Inglês</SelectItem>
                    <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="es">Espanhol</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="fr">Francês</SelectItem>
                    <SelectItem value="de">Alemão</SelectItem>
                  </SelectContent>
                </Select>
                {subtitleSource !== 'upload' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={detectLanguage}
                    disabled={isDetectingLanguage || isUploading}
                    className="shrink-0"
                    title="Auto-detectar idioma"
                  >
                    {isDetectingLanguage ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {subtitleSource !== 'upload' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Clique no ícone ✨ para detetar automaticamente
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Idioma de Destino
              </label>
              <Select value={targetLang} onValueChange={setTargetLang} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-PT">🇵🇹 Português (Portugal)</SelectItem>
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="fr">Francês</SelectItem>
                  <SelectItem value="de">Alemão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tom
            </label>
            <Select value={tone} onValueChange={setTone} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Translate button for non-upload sources */}
          {subtitleSource !== 'upload' && (
            <Button
              onClick={handleTranslateFromSource}
              disabled={isUploading}
              className="w-full"
            >
              <Languages className="h-4 w-4 mr-2" />
              {isUploading ? 'A traduzir...' : 'Traduzir Legenda'}
            </Button>
          )}
        </div>
      </Card>

      {/* Upload Progress */}
      {isUploading && !translationProgress && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">A enviar...</span>
              <span className="font-mono text-foreground">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              A carregar ficheiro para o servidor
            </p>
          </div>
        </Card>
      )}

      {/* Translation Progress */}
      <TranslationProgress
        progress={translationProgress}
        sourceLang={sourceLang}
        targetLang={targetLang}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rules Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Regras Aplicadas Automaticamente
        </h3>
        <ul className="space-y-2">
          {rules.map((rule, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>

      {/* Quality Check Results */}
      {validationResults && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SubtitleQualityCheck
            validation={validationResults}
            onFixProblem={handleFixProblem}
            onDownloadCorrected={downloadCorrectedSubtitles}
          />
        </motion.div>
      )}

      {/* Results */}
      {translatedData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 border-2 border-green-500/20 bg-green-500/5">
            {/* Success Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Tradução Concluída!</h3>
                <p className="text-sm text-muted-foreground">
                  A sua legenda foi traduzida com sucesso
                </p>
              </div>
            </div>

            {/* Stats */}
            {translatedData.stats && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Total de Legendas</p>
                  <p className="text-2xl font-bold text-foreground">{translatedData.stats.total_entries}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Traduzidas</p>
                  <p className="text-2xl font-bold text-green-500">{translatedData.stats.translated}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">Tempo</p>
                  <p className="text-2xl font-bold text-foreground">{translatedData.stats.time_taken.toFixed(1)}s</p>
                </div>
              </div>
            )}

            {/* File info */}
            <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{translatedData.output_filename || 'translated.srt'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{sourceLang.toUpperCase()}</Badge>
                <span>→</span>
                <Badge variant="default">{targetLang.toUpperCase()}</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={downloadTranslated} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Descarregar Ficheiro Traduzido
              </Button>

              <Button
                onClick={loadAsActiveSubtitle}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                Usar como Legenda Ativa
              </Button>

              {videoFile && (
                <Button
                  onClick={loadIntoSync}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Testar com Vídeo (Sync)
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground pt-2">
                {videoFile
                  ? "💡 Descarregue, use como legenda ativa, ou teste com o vídeo carregado"
                  : "💡 Descarregue ou use como legenda ativa para outros painéis"
                }
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TranslationPanel;
