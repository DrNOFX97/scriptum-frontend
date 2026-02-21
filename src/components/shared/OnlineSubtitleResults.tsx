import { motion } from 'framer-motion';
import { Globe, FileText, Star, Loader2, Download, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OnlineSubtitle } from '@/types/subtitle';

interface Props {
  results: OnlineSubtitle[];
  isSearching: boolean;
  downloadingId: string | null;
  selectingId: string | null;
  selectedSubtitle: { type: string; data: unknown } | null;
  onDownload: (s: OnlineSubtitle) => void;
  onSelect: (s: OnlineSubtitle) => void;
}

export function OnlineSubtitleResults({
  results,
  isSearching,
  downloadingId,
  selectingId,
  selectedSubtitle,
  onDownload,
  onSelect,
}: Props) {
  if (!isSearching && results.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Legendas online</h3>
        {isSearching
          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : <Badge variant="secondary">{results.length}</Badge>
        }
      </div>

      {isSearching ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          A pesquisar legendas online...
        </p>
      ) : (
        <div className="space-y-2">
          {results.map((subtitle) => {
            const isSelected =
              selectedSubtitle?.type === 'searched' &&
              (selectedSubtitle.data as { id: string }).id === subtitle.id;
            const busy = downloadingId === subtitle.id || selectingId === subtitle.id;

            return (
              <motion.div
                key={subtitle.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`flex items-start justify-between gap-4 p-4 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/20'
                    : 'bg-muted/50 hover:bg-muted border-border/50'
                }`}>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">{subtitle.name}</p>
                      {subtitle.source === 'legendasdivx' ? (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 shrink-0">
                          🇵🇹 LegendasDivx
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          🌍 OpenSubtitles
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge variant="default" className="text-xs bg-primary shrink-0">
                          ✓ Selecionada
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />{subtitle.language}
                      </span>
                      {subtitle.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {subtitle.rating.toFixed(1)}
                        </span>
                      )}
                      <span>{subtitle.downloads.toLocaleString()} downloads</span>
                      {subtitle.uploader && <span>por {subtitle.uploader}</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelect(subtitle)}
                      disabled={busy}
                    >
                      {selectingId === subtitle.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Check className="h-4 w-4 mr-1" />Selecionar</>}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDownload(subtitle)}
                      disabled={busy}
                    >
                      {downloadingId === subtitle.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Download className="h-4 w-4 mr-1" />Download</>}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
