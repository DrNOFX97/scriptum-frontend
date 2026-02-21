/**
 * Subtitle Quality Check Component
 * Shows validation results with inline editor
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Edit, Check, X } from 'lucide-react';

interface Problem {
  index: number;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  timecode: string;
  text: string;
  suggestion: string;
}

interface ValidationResults {
  total_entries: number;
  problems: Problem[];
  stats: {
    long_durations: number;
    long_lines: number;
    long_pauses: number;
    high_cps: number;
    empty: number;
  };
  has_problems: boolean;
}

interface SubtitleQualityCheckProps {
  validation: ValidationResults;
  onFixProblem: (index: number, newText: string) => void;
  onDownloadCorrected: () => void;
}

export const SubtitleQualityCheck = ({
  validation,
  onFixProblem,
  onDownloadCorrected
}: SubtitleQualityCheckProps) => {

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>('');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 border-red-300 dark:bg-red-900/20';
      case 'warning': return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20';
      default: return 'bg-blue-100 border-blue-300 dark:bg-blue-900/20';
    }
  };

  const startEdit = (problem: Problem) => {
    setEditingIndex(problem.index);
    setEditedText(problem.text);
  };

  const saveEdit = (index: number) => {
    onFixProblem(index, editedText);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedText('');
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Verificação de Qualidade</h3>
          <p className="text-sm text-muted-foreground">
            {validation.total_entries} legendas analisadas
          </p>
        </div>

        {!validation.has_problems ? (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sem problemas
          </Badge>
        ) : (
          <Badge variant="destructive">
            {validation.problems.length} problema(s)
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {validation.stats.long_durations > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-2xl font-bold text-red-600">{validation.stats.long_durations}</div>
            <div className="text-xs text-muted-foreground">Tempos longos</div>
          </div>
        )}

        {validation.stats.long_lines > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="text-2xl font-bold text-yellow-600">{validation.stats.long_lines}</div>
            <div className="text-xs text-muted-foreground">Linhas longas</div>
          </div>
        )}

        {validation.stats.long_pauses > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
            <div className="text-2xl font-bold text-orange-600">{validation.stats.long_pauses}</div>
            <div className="text-xs text-muted-foreground">Pausas longas</div>
          </div>
        )}

        {validation.stats.high_cps > 0 && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="text-2xl font-bold text-purple-600">{validation.stats.high_cps}</div>
            <div className="text-xs text-muted-foreground">CPS alto</div>
          </div>
        )}

        {validation.stats.empty > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded">
            <div className="text-2xl font-bold text-gray-600">{validation.stats.empty}</div>
            <div className="text-xs text-muted-foreground">Vazias</div>
          </div>
        )}
      </div>

      {/* Problems List */}
      {validation.has_problems && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Problemas Encontrados:</h4>

          {validation.problems.slice(0, 20).map((problem) => (
            <div
              key={`${problem.index}-${problem.type}`}
              className={`p-4 border rounded-lg ${getSeverityColor(problem.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(problem.severity)}

                <div className="flex-1 space-y-2">
                  {/* Problem header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{problem.index}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {problem.timecode}
                      </span>
                    </div>

                    {editingIndex !== problem.index && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(problem)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>

                  {/* Problem description */}
                  <div>
                    <p className="text-sm font-medium">{problem.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {problem.suggestion}
                    </p>
                  </div>

                  {/* Text editor */}
                  {editingIndex === problem.index ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="font-mono text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(problem.index)}>
                          <Check className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-x-auto">
                      {problem.text}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}

          {validation.problems.length > 20 && (
            <p className="text-sm text-muted-foreground text-center">
              Mostrando 20 de {validation.problems.length} problemas. Corrija os mais críticos primeiro.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {validation.has_problems && (
        <Button onClick={onDownloadCorrected} className="w-full">
          Descarregar Legendas Corrigidas
        </Button>
      )}
    </Card>
  );
};
