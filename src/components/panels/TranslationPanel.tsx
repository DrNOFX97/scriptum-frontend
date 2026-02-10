import { useEffect } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Languages, Upload, FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFileContext } from "@/contexts/FileContext";
import useFileUpload from "@/hooks/useFileUpload";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

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

const TranslationPanel = () => {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("pt");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("casual");
  const [translatedData, setTranslatedData] = useState<any>(null);
  const { toast } = useToast();
  const { progress, isUploading, error, uploadFile } = useFileUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await translateFile(file);
    }
  };

  const translateFile = async (file: File) => {
    try {
      toast({
        title: "Traduzindo...",
        description: `Enviando ${file.name} para tradução`,
      });

      const result = await uploadFile<TranslateResponse>(
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

      if (result && result.success) {
        setTranslatedData(result);
        toast({
          title: "Tradução concluída!",
          description: result.stats 
            ? `${result.stats.translated} de ${result.stats.total_entries} legendas traduzidas em ${result.stats.time_taken.toFixed(1)}s`
            : "Ficheiro traduzido com sucesso",
        });
      } else {
        throw new Error(result?.error || 'Tradução falhou');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na tradução",
        description: err instanceof Error ? err.message : "Falha ao traduzir legendas",
      });
    }
  };

  const downloadTranslated = () => {
    if (translatedData?.translated_file) {
      const link = document.createElement('a');
      link.href = `${API_BASE}/download/${translatedData.translated_file}`;
      link.download = translatedData.translated_file;
      link.click();
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

      {/* Upload & Config */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Ficheiro de Legendas
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".srt,.vtt,.ass,.ssa"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Contexto (opcional)
            </label>
            <Input
              placeholder="Ex: Dune Part Two - Ficção científica"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Idioma de Origem
              </label>
              <Select value={sourceLang} onValueChange={setSourceLang} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portuguese (PT)</SelectItem>
                  <SelectItem value="pt-BR">Portuguese (BR)</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="pt">Portuguese (PT)</SelectItem>
                  <SelectItem value="pt-BR">Portuguese (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
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
        </div>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">A traduzir...</span>
              <span className="font-mono text-foreground">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Isto pode levar alguns minutos dependendo do tamanho do ficheiro
            </p>
          </div>
        </Card>
      )}

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

      {/* Results */}
      {translatedData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-foreground">Tradução Concluída</h3>
            </div>
            {translatedData.stats && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total de Legendas</p>
                  <p className="text-2xl font-bold text-foreground">{translatedData.stats.total_entries}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Traduzidas</p>
                  <p className="text-2xl font-bold text-green-500">{translatedData.stats.translated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                  <p className="text-2xl font-bold text-foreground">{translatedData.stats.time_taken.toFixed(1)}s</p>
                </div>
              </div>
            )}
            <Button onClick={downloadTranslated} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descarregar Ficheiro Traduzido
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TranslationPanel;
