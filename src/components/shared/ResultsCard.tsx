/**
 * Reusable results display component.
 * Provides consistent styling for API operation results.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ANIMATION_DURATION_NORMAL } from '@/lib/constants';

interface ResultsCardProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  children?: React.ReactNode;
  onDownload?: () => void;
  downloadLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Card component for displaying operation results with consistent styling.
 *
 * @example
 * ```tsx
 * <ResultsCard
 *   variant="success"
 *   title="Análise Concluída"
 *   message="Vídeo processado com sucesso"
 *   onDownload={handleDownload}
 *   downloadLabel="Baixar Resultado"
 * >
 *   <div>Custom content...</div>
 * </ResultsCard>
 * ```
 */
export function ResultsCard({
  variant = 'info',
  title,
  message,
  children,
  onDownload,
  downloadLabel = 'Baixar',
  onDismiss,
  className = '',
}: ResultsCardProps) {
  const variantStyles = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      borderColor: 'border-green-500/20',
      bgColor: 'bg-green-500/5',
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-500/20',
      bgColor: 'bg-red-500/5',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/20',
      bgColor: 'bg-yellow-500/5',
    },
    info: {
      icon: AlertCircle,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-500/5',
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: ANIMATION_DURATION_NORMAL }}
      className={className}
    >
      <Card className={`${style.borderColor} ${style.bgColor} border-2`}>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Icon className={`h-6 w-6 ${style.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {message && (
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              )}
            </div>
          </div>

          {/* Content */}
          {children && <div className="pl-9">{children}</div>}

          {/* Actions */}
          {(onDownload || onDismiss) && (
            <div className="flex gap-2 pl-9">
              {onDownload && (
                <Button
                  onClick={onDownload}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {downloadLabel}
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  size="sm"
                >
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Simple data display component for results.
 */
interface ResultDataProps {
  label: string;
  value: string | number | React.ReactNode;
  className?: string;
}

export function ResultData({ label, value, className = '' }: ResultDataProps) {
  return (
    <div className={`flex justify-between items-center py-1 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
