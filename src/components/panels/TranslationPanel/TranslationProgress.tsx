import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Zap, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface TranslationProgressData {
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

interface TranslationProgressProps {
  progress: TranslationProgressData | null;
  sourceLang: string;
  targetLang: string;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export const TranslationProgress = memo(({ progress, sourceLang, targetLang }: TranslationProgressProps) => {
  return (
    <AnimatePresence>
      {progress && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 border-primary/20">
            <div className="space-y-4">
              {/* Header with percentage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary animate-pulse" />
                  <h3 className="font-semibold text-foreground">
                    {progress.status === 'complete' ? 'Tradução Concluída' : 'A Traduzir...'}
                  </h3>
                </div>
                <div className="text-3xl font-bold font-mono text-primary">
                  {progress.percentage || 0}%
                </div>
              </div>

              {/* Progress bar */}
              <Progress value={progress.percentage || 0} className="h-3" />

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {progress.total_entries && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {progress.current_entry || 0}/{progress.total_entries}
                    </p>
                  </div>
                )}

                {progress.speed !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Velocidade</p>
                    </div>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {progress.speed.toFixed(1)}/s
                    </p>
                  </div>
                )}

                {progress.eta_seconds !== undefined && progress.eta_seconds > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Tempo Restante</p>
                    </div>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {formatTime(progress.eta_seconds)}
                    </p>
                  </div>
                )}
              </div>

              {/* Status message */}
              {progress.message && (
                <p className="text-sm text-muted-foreground italic">
                  {progress.message}
                </p>
              )}

              {/* Recent translations stream */}
              {progress.recent_translations && progress.recent_translations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-border" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Últimas Traduções
                    </p>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {progress.recent_translations.map((trans, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-lg border border-border bg-card/50 p-3 space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-12 h-6 rounded bg-secondary/30 flex items-center justify-center">
                            <span className="text-xs font-mono text-muted-foreground uppercase">
                              {sourceLang}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 flex-1 leading-relaxed">
                            {trans.original}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-12 h-6 rounded bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-mono text-primary uppercase">
                              {targetLang}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium flex-1 leading-relaxed">
                            {trans.translated}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

TranslationProgress.displayName = 'TranslationProgress';
